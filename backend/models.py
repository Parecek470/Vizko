import enum
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy import Table, DateTime
from datetime import datetime
from database import Base
from constants import QuestionType

class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=False)
    
    # We will generate this in FastAPI, so the user doesn't have to
    join_code = Column(String, unique=True, index=True) 

    # cascade="all, delete-orphan" means if a teacher deletes a Form, 
    # it automatically deletes all Pages and Questions inside it.
    pages = relationship("Page", back_populates="form", cascade="all, delete-orphan")
    submissions = relationship("FormSubmission", back_populates="form", cascade="all, delete-orphan")

    @property
    def response_count(self) -> int:
        return len(self.submissions)

class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id", ondelete="CASCADE"))
    page_number = Column(Integer, nullable=False) # To keep pages in order
    title = Column(String, nullable=True) # Optional page title

    form = relationship("Form", back_populates="pages")
    questions = relationship("Question", back_populates="page", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(Integer, ForeignKey("pages.id", ondelete="CASCADE"))
    text = Column(String, nullable=False)
    is_required = Column(Boolean, default=True)
    question_type = Column(Enum(QuestionType), nullable=False)
    order = Column(Integer, nullable=False) # To keep questions in order on the page

    # --- Type-Specific Columns ---
    # These will be NULL unless the question_type is "scale"
    scale_min = Column(Integer, nullable=True)
    scale_max = Column(Integer, nullable=True)
    scale_min_label = Column(String, nullable=True) # e.g., "Totally Disagree"
    scale_max_label = Column(String, nullable=True) # e.g., "Totally Agree"

    page = relationship("Page", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")

class QuestionOption(Base):
    __tablename__ = "question_options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"))
    text = Column(String, nullable=False)
    order = Column(Integer, nullable=False) # To keep options in order (A, B, C)

    question = relationship("Question", back_populates="options")



#==============================
#       Form Submission
#==============================
# 1. The Container: Groups a single student's answers together
class FormSubmission(Base):
    __tablename__ = "form_submissions"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id", ondelete="CASCADE"))
    
    # Crucial for your time-based analytics!
    submitted_at = Column(DateTime, default=datetime.utcnow)

    form = relationship("Form", back_populates="submissions")
    answers = relationship("Answer", back_populates="submission", cascade="all, delete-orphan")


# 2. Association Table: Handles Multiple Choice questions cleanly
# This allows one answer to be linked to many options, and pure SQL JOINs for your charts
answer_options_table = Table(
    "answer_options",
    Base.metadata,
    Column("answer_id", Integer, ForeignKey("answers.id", ondelete="CASCADE"), primary_key=True),
    Column("option_id", Integer, ForeignKey("question_options.id", ondelete="CASCADE"), primary_key=True)
)


# 3. The Data Payload: The actual answer given to a specific question
class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("form_submissions.id", ondelete="CASCADE"))
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"))

    # --- Typed Data Columns ---
    # Only ONE of these will be populated depending on the question_type
    text_value = Column(String, nullable=True)     # For TEXT_OPEN
    scale_value = Column(Integer, nullable=True)   # For SCALE (Allows fast SQL Math)

    submission = relationship("FormSubmission", back_populates="answers")
    question = relationship("Question")
    
    # For SINGLE_CHOICE and MULTIPLE_CHOICE
    selected_options = relationship("QuestionOption", secondary=answer_options_table)