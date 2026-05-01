# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import List
from sqlalchemy import func
import secrets
import os
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from dotenv import load_dotenv


# my classes
import models
import schemas
from database import engine, SessionLocal
import utils

load_dotenv()

#security
security = HTTPBasic()

TEACHER_ACCOUNTS = {
    "test": os.getenv("TEST_TEACHER_PASSWORD", "fall1")
}

def get_current_username(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username not in TEACHER_ACCOUNTS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    
    if not secrets.compare_digest(credentials.password, TEACHER_ACCOUNTS[credentials.username]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# 1. Instruct SQLAlchemy to create the tables in SQLite if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Polling App API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Dependency: This function opens a database session per request, then closes it
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 1. THE LIST ROUTE (For the Sidebar)
# Notice we use List[schemas.FormSummaryResponse] to keep the data light.
@app.get("/forms/", response_model=List[schemas.FormSummaryResponse])
def get_all_forms(db: Session = Depends(get_db), username: str = Depends(get_current_username)):
    """Fetches a lightweight list of all forms."""
    forms = db.query(models.Form).all()
    return forms

# 2. THE DETAIL ROUTE (For the Main Dashboard View)
# We put {form_id} in the URL so React can ask for a specific one.
@app.get("/forms/{form_id}", response_model=schemas.FormDetailResponse)
def get_form_detail(form_id: int, db: Session = Depends(get_db), username: str = Depends(get_current_username)):
    """Fetches the complete, deeply nested data for a single form."""
    
    # .first() gets the single item, or returns None if it doesn't exist
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
        
    return form

@app.post("/forms/", response_model=schemas.FormDetailResponse)
def create_form(form_data: schemas.FormCreate, db: Session = Depends(get_db), username: str = Depends(get_current_username)):
    """Creates a new form."""
    unique_code = utils.get_unique_join_code(db)

    db_form = models.Form(
        title = form_data.title,
        description = form_data.description,
        join_code = unique_code,
        is_active = form_data.is_active
    )

    db.add(db_form)
    db.flush()

    # Get pages into form
    for page_in in form_data.pages:
        db_page = models.Page(
            form_id=db_form.id,
            page_number=page_in.page_number,
            title=page_in.title
        )
        db.add(db_page)
        db.flush()

        # get questions into page
        for q_in in page_in.questions:
            db_question = models.Question(
                page_id=db_page.id,
                text=q_in.text,
                is_required=q_in.is_required,
                question_type=q_in.question_type.value,
                order=q_in.order,
                scale_min=q_in.scale_min,
                scale_max=q_in.scale_max,
                scale_min_label=q_in.scale_min_label,
                scale_max_label=q_in.scale_max_label
            )
            db.add(db_question)
            db.flush() # Gets the db_question.id

            # 5. Unpack and attach the Options (if any)
            for opt_in in q_in.options:
                db_option = models.QuestionOption(
                    question_id=db_question.id,
                    text=opt_in.text,
                    order=opt_in.order
                )
                db.add(db_option)
            
    db.commit()
    db.refresh(db_form)


    return db_form

# Add to backend/main.py

@app.put("/forms/{form_id}", response_model=schemas.FormSummaryResponse)
def update_form_status(form_id: int, form_update: schemas.FormCreate, db: Session = Depends(get_db), username: str = Depends(get_current_username)):
    """Updates top-level form metadata."""
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    # Update only metadata
    form.title = form_update.title
    form.description = form_update.description
    form.is_active = form_update.is_active
    
    db.commit()
    db.refresh(form)
    return form

@app.delete("/forms/{form_id}", status_code=204)
def delete_form(form_id: int, db: Session = Depends(get_db), username: str = Depends(get_current_username)):
    """Deletes a form. Cascading deletes will handle pages/questions/answers."""
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
        
    db.delete(form)
    db.commit()
    return None

# Respondents calls

@app.get("/join/{join_code}", response_model=schemas.FormDetailResponse)
def get_form_by_join_code(join_code: str, db: Session = Depends(get_db)):
    """Fetches a form by its join code."""
    form = db.query(models.Form).filter(models.Form.join_code == join_code).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found with this code.")
    
    if not form.is_active:
        raise HTTPException(status_code=403, detail="Form is not currently accepting responses.")
    
    return form

@app.post("/forms/{form_id}/submissions", status_code=201)
def submit_form_answers(form_id: int, submission: schemas.SubmissionCreate, db: Session = Depends(get_db)):
    """Submits answers for a specific form."""
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form or not form.is_active:
        raise HTTPException(status_code=400, detail="Invalid or incactive form.")

    db_submission = models.FormSubmission(form_id = form.id)
    db.add(db_submission)
    db.flush()

    for ans_in in submission.answers:
        db_answer=models.Answer(
            submission_id=db_submission.id,
            question_id=ans_in.question_id,
            text_value=ans_in.text_value,
            scale_value=ans_in.scale_value
        )
        db.add(db_answer)
        db.flush()

        if ans_in.selected_option_ids:
            options = db.query(models.QuestionOption).filter(
                models.QuestionOption.id.in_(ans_in.selected_option_ids)
            ).all()
            db_answer.selected_options.extend(options)
    
    db.commit()
    return {"message": "Submission successful."}

@app.get("/forms/{form_id}/analytics/questions/{question_id}", response_model=schemas.QuestionAnalyticsResponse)
def get_question_analytics(form_id: int, question_id: int, db: Session = Depends(get_db), username: str = Depends(get_current_username)):
    """Aggregates answer data for a specific question to feed the visualization UI."""
    
    # 1. Verify the question exists and belongs to the form
    question = db.query(models.Question).join(models.Page).filter(
        models.Question.id == question_id,
        models.Page.form_id == form_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    response_data = {
        "question_id": question.id,
        "question_type": question.question_type,
    }

    # 2. Handle TEXT questions (Return list of strings)
    if question.question_type == "text_open":
        # Pluck just the text_value column from Answers
        answers = db.query(models.Answer.text_value).filter(
            models.Answer.question_id == question.id,
            models.Answer.text_value.isnot(None),
            models.Answer.text_value != ""
        ).all()
        # answers is a list of tuples like [("Great class",), ("Needs more math",)]
        response_data["responses"] = [ans[0] for ans in answers]

    # 3. Handle CHOICE questions (Single and Multiple)
    elif question.question_type in ["single_choice", "multiple_choice"]:
        # Query QuestionOption, and outerjoin with answer_options_table
        # This groups by the option ID and counts the number of related answers
        distribution = db.query(
            models.QuestionOption.text.label('name'),
            func.count(models.answer_options_table.c.answer_id).label('count')
        ).outerjoin(
            models.answer_options_table,
            models.QuestionOption.id == models.answer_options_table.c.option_id
        ).filter(
            models.QuestionOption.question_id == question.id
        ).group_by(
            models.QuestionOption.id
        ).all()
        
        response_data["distribution"] = [{"name": row.name, "count": row.count} for row in distribution]

    # 4. Handle SCALE questions (Histograms from min to max)
    elif question.question_type == "scale":
        # Group answers by their scale_value
        raw_counts = db.query(
            models.Answer.scale_value,
            func.count(models.Answer.id).label('count')
        ).filter(
            models.Answer.question_id == question.id,
            models.Answer.scale_value.isnot(None)
        ).group_by(
            models.Answer.scale_value
        ).all()
        
        # Convert to dictionary for easy lookup: { 1: 5, 2: 12, ... }
        counts_dict = {row.scale_value: row.count for row in raw_counts}
        
        # Ensure we send back an entry for EVERY scale step, even if it has 0 votes.
        # This keeps the X-axis of our Recharts histogram consistent and accurate.
        distribution = []
        for val in range(question.scale_min, question.scale_max + 1):
            distribution.append({
                "name": str(val), 
                "count": counts_dict.get(val, 0)
            })
            
        response_data["distribution"] = distribution

    return response_data

@app.get("/forms/{form_id}/analytics/raw-answers", response_model=schemas.RawAnswersResponse)
def get_raw_answers(form_id: int, q: List[int] = Query(...), db: Session = Depends(get_db), username: str = Depends(get_current_username)):
    """Fetches raw answer data, maintaining strict row-alignment with null padding for skipped questions."""
    
    submissions = db.query(models.FormSubmission).filter(
        models.FormSubmission.form_id == form_id
    ).options(
        joinedload(models.FormSubmission.answers).joinedload(models.Answer.selected_options)
    ).order_by(models.FormSubmission.submitted_at).all()

    result_data = {str(qid): [] for qid in q}
    
    # 2. Iterate student by student
    for sub in submissions:
        # Create a fast lookup dictionary for this specific student's answers
        student_answers = {ans.question_id: ans for ans in sub.answers}
        
        # 3. Check every requested question against this student
        for qid in q:
            ans = student_answers.get(qid)
            
            if not ans:
                # CRITICAL: Pad gaps with None to prevent array misalignment
                result_data[str(qid)].append(None)
            elif ans.scale_value is not None:
                result_data[str(qid)].append(ans.scale_value)
            elif ans.text_value is not None and ans.text_value.strip() != "":
                result_data[str(qid)].append(ans.text_value)
            elif ans.selected_options:
                # If single choice, extract string for Plotly. If multiple, keep array.
                if len(ans.selected_options) == 1:
                    result_data[str(qid)].append(ans.selected_options[0].text)
                else:
                    result_data[str(qid)].append([opt.text for opt in ans.selected_options])
            else:
                result_data[str(qid)].append(None)

    return {"data": result_data}

@app.post("/forms/{form_id}/duplicate", response_model=schemas.FormDetailResponse)
def duplicate_form(form_id: int, db: Session = Depends(get_db), username: str = Depends(get_current_username)):
    """
    Creates a deep copy of a form (pages, questions, options).
    Submissions/responses are NOT copied.
    The new form's title gets ' (copy)' appended.
    """

    # 1. Fetch the original form, or 404 if it doesn't exist
    original_form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not original_form:
        raise HTTPException(status_code=404, detail="Form not found")

    # 2. Create the new Form — fresh join_code, title with "(copy)", inactive by default
    new_form = models.Form(
        title=f"{original_form.title} (copy)",
        description=original_form.description,
        join_code=utils.get_unique_join_code(db),
        is_active=False,  # copies start as inactive — safer default
    )
    db.add(new_form)
    db.flush()  # populates new_form.id without committing yet

    # 3. Deep-copy every page
    for original_page in original_form.pages:
        new_page = models.Page(
            form_id=new_form.id,
            page_number=original_page.page_number,
            title=original_page.title,
        )
        db.add(new_page)
        db.flush()  # populates new_page.id

        # 4. Deep-copy every question within the page
        for original_question in original_page.questions:
            new_question = models.Question(
                page_id=new_page.id,
                text=original_question.text,
                is_required=original_question.is_required,
                question_type=original_question.question_type,
                order=original_question.order,
                scale_min=original_question.scale_min,
                scale_max=original_question.scale_max,
                scale_min_label=original_question.scale_min_label,
                scale_max_label=original_question.scale_max_label,
            )
            db.add(new_question)
            db.flush()  # populates new_question.id

            # 5. Deep-copy every option within the question
            for original_option in original_question.options:
                new_option = models.QuestionOption(
                    question_id=new_question.id,
                    text=original_option.text,
                    order=original_option.order,
                )
                db.add(new_option)

    # 6. Commit everything at once — atomic operation
    db.commit()
    db.refresh(new_form)

    return new_form

@app.patch("/forms/{form_id}/text", response_model=schemas.FormDetailResponse)
def patch_form_text(form_id: int, form_data: schemas.FormCreate, db: Session = Depends(get_db), username: str = Depends(get_current_username)):
    """
    Safe edit: updates only text fields on the form, pages, questions, and options.
    Never touches IDs, structure, or answer data.
    Matches incoming questions/options to existing ones by order.
    """
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    # Update metadata
    form.title = form_data.title
    form.description = form_data.description
    form.is_active = form_data.is_active

    for page_in in form_data.pages:
        db_page = next((p for p in form.pages if p.page_number == page_in.page_number), None)
        if not db_page:
            continue
        db_page.title = page_in.title

        for q_in in page_in.questions:
            db_q = next((q for q in db_page.questions if q.order == q_in.order), None)
            if not db_q:
                continue
            db_q.text = q_in.text
            db_q.is_required = q_in.is_required
            # Note: question_type is intentionally NOT updated here

            for opt_in in q_in.options:
                db_opt = next((o for o in db_q.options if o.order == opt_in.order), None)
                if not db_opt:
                    continue
                db_opt.text = opt_in.text

    db.commit()
    db.refresh(form)
    return form

@app.delete("/forms/{form_id}/questions/{question_id}", status_code=204)
def delete_question(form_id: int, question_id: int, db: Session = Depends(get_db), username: str = Depends(get_current_username)):
    """
    Deletes a single question and all its answers (via cascade).
    Frontend is responsible for warning the user before calling this.
    """
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    db.delete(question)
    db.commit()

@app.delete("/forms/{form_id}/pages/{page_id}", status_code=204)
def delete_page(form_id: int, page_id: int, db: Session = Depends(get_db), username: str = Depends(get_current_username)):
    """
    Deletes a single page and all its questions and answers (via cascade).
    Frontend is responsible for warning the user before calling this.
    """
    page = db.query(models.Page).filter(
        models.Page.id == page_id,
        models.Page.form_id == form_id  # safety check — page must belong to this form
    ).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    db.delete(page)
    db.commit()