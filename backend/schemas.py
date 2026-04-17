from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from enum import Enum
from datetime import datetime
from constants import QuestionType



# ==========================================
# CREATE SCHEMAS (Incoming data from React)
# ==========================================

class OptionCreate(BaseModel):
    text: str
    order: int

class QuestionCreate(BaseModel):
    text: str
    is_required: bool = True
    question_type: QuestionType
    order: int
    # Optional fields (only used if type is 'scale')
    scale_min: Optional[int] = None
    scale_max: Optional[int] = None
    scale_min_label: Optional[str] = None
    scale_max_label: Optional[str] = None
    # A question can have a list of options (or an empty list)
    options: List[OptionCreate] = []

class PageCreate(BaseModel):
    page_number: int
    title: Optional[str] = None
    questions: List[QuestionCreate] = []

class FormCreate(BaseModel):
    title: str
    description: Optional[str] = None
    is_active: bool = False
    # The React app will send the whole nested structure at once
    pages: List[PageCreate] = []


# ==========================================
# RESPONSE SCHEMAS (Outgoing data to React)
# ==========================================
# model_config = ConfigDict(from_attributes=True) is the modern Pydantic V2 
# way to tell FastAPI to translate SQLite objects into JSON dictionaries.

class OptionResponse(BaseModel):
    id: int
    text: str
    order: int
    model_config = ConfigDict(from_attributes=True)

class QuestionResponse(BaseModel):
    id: int
    text: str
    is_required: bool
    question_type: QuestionType
    order: int
    scale_min: Optional[int]
    scale_max: Optional[int]
    scale_min_label: Optional[str]
    scale_max_label: Optional[str]
    options: List[OptionResponse]
    model_config = ConfigDict(from_attributes=True)

class PageResponse(BaseModel):
    id: int
    page_number: int
    title: Optional[str]
    questions: List[QuestionResponse]
    model_config = ConfigDict(from_attributes=True)

class FormSummaryResponse(BaseModel):
    id: int
    title: str
    is_active: bool
    response_count: int
    model_config = ConfigDict(from_attributes=True)

class FormDetailResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    is_active: bool
    join_code: str
    pages: List[PageResponse]
    model_config = ConfigDict(from_attributes=True)

class AnswerCreate(BaseModel):
    question_id: int
    
    # The React frontend will send ONE of these three, depending on the question type
    text_value: Optional[str] = None
    scale_value: Optional[int] = None
    
    # For choice questions, React sends an array of Option IDs
    # (If it's a single choice, it just sends an array with 1 ID)
    selected_option_ids: List[int] = []

class SubmissionCreate(BaseModel):
    # We don't need the form_id here, we will put that in the FastAPI URL!
    answers: List[AnswerCreate]


# ==========================================
# ANALYTICS SCHEMAS (Outgoing to Teacher Dashboard)
# ==========================================
# We will expand on these later when we build the Recharts dashboard, 
# but here is the basic structure to return a submission.

class AnswerResponse(BaseModel):
    id: int
    question_id: int
    text_value: Optional[str]
    scale_value: Optional[int]
    # Reuses the OptionResponse from earlier to return the actual text of what they picked!
    selected_options: List[OptionResponse] 

    model_config = ConfigDict(from_attributes=True)

class SubmissionResponse(BaseModel):
    id: int
    submitted_at: datetime
    answers: List[AnswerResponse]

    model_config = ConfigDict(from_attributes=True)