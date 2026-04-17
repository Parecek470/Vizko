# backend/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List



# my classes
import models
import schemas
from database import engine, SessionLocal
import utils

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
def get_all_forms(db: Session = Depends(get_db)):
    """Fetches a lightweight list of all forms."""
    forms = db.query(models.Form).all()
    return forms

# 2. THE DETAIL ROUTE (For the Main Dashboard View)
# We put {form_id} in the URL so React can ask for a specific one.
@app.get("/forms/{form_id}", response_model=schemas.FormDetailResponse)
def get_form_detail(form_id: int, db: Session = Depends(get_db)):
    """Fetches the complete, deeply nested data for a single form."""
    
    # .first() gets the single item, or returns None if it doesn't exist
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
        
    return form

@app.post("/forms/", response_model=schemas.FormDetailResponse)
def create_form(form_data: schemas.FormCreate, db: Session = Depends(get_db)):
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
                question_type=q_in.question_type,
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
