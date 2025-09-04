from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List   
from datetime import date

class RegisterIn(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr
    password: str = Field(min_length=6)
    age: Optional[int] = None
    sex: Optional[str] = None   # "male"|"female"|"other"
    heightCm: Optional[float] = None
    weightKg: Optional[float] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr
    age: Optional[int] = None
    sex: Optional[str] = None
    heightCm: Optional[float] = None
    weightKg: Optional[float] = None

class TokenOut(BaseModel):
    token: str
    user: UserPublic

class ActivityIn(BaseModel):
    date: date
    minutes: int
    steps: Optional[int] = None
    type: Optional[str] = None  # "walk"|"run"|"gym"|...

class MealItem(BaseModel):
    name: str
    calories: float
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None

class MealIn(BaseModel):
    date: date
    items: List[MealItem]
    notes: Optional[str] = None