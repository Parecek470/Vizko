import random
import string
from sqlalchemy.orm import Session
import models

def get_unique_join_code(db: Session, length=6):
    """
    Generates a random code and ensures it does not already exist in the database.
    """
    while True:
        # generate a random code
        chars = string.digits
        new_code = ''.join(random.choice(chars) for _ in range(length))
        
        # look in the database for collisions
        existing_form = db.query(models.Form).filter(models.Form.join_code == new_code).first()
        
        # code is not used yet, can be used for new form
        if not existing_form:
            return new_code
        
        