from enum import Enum

class QuestionType(str, Enum):
    SCALE = "scale"
    TEXT_OPEN = "text_open"
    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"