from pydantic import BaseModel, EmailStr, Field, constr
from typing import Optional, List
from datetime import date
from typing import Literal

class RegisterIn(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr
    password: constr(min_length=8, max_length=72)
    age: Optional[int] = Field(None, ge=1, le=120)
    sex: Optional[Literal["male","female","other"]] = "other"
    heightCm: Optional[float] = Field(None, gt=0, le=300)
    weightKg: Optional[float] = Field(None, gt=0, le=500)

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
    minutes: int = Field(..., ge=0)
    steps: Optional[int] = Field(None, ge=0)
    type: Optional[str] = None  # "walk"|"run"|"gym"|...

# Accept either "calories"/"carbs_g" or the canonical names.
class MealItem(BaseModel):
    name: str
    kcal: Optional[float] = None
    protein_g: Optional[float] = None
    carb_g: Optional[float] = None
    fat_g: Optional[float] = None
    fiber_g: Optional[float] = None
    sugar_g: Optional[float] = None
    sodium_mg: Optional[float] = None
    # aliases for old/UI variations
    calories: Optional[float] = Field(None, alias="calories")
    carbs_g: Optional[float] = Field(None, alias="carbs_g")

    # normalize aliases into canonical fields
    def model_post_init(self, __context):
        if self.kcal is None and self.calories is not None:
            self.kcal = self.calories
        if self.carb_g is None and self.carbs_g is not None:
            self.carb_g = self.carbs_g

class MealIn(BaseModel):
    date: date
    items: List[MealItem]
    notes: Optional[str] = None

class UserUpdate(BaseModel):
    age: Optional[int] = Field(None, ge=1, le=120)
    sex: Optional[Literal["male","female","other"]] = None
    heightCm: Optional[float] = Field(None, gt=0, le=300)
    weightKg: Optional[float] = Field(None, gt=0, le=500)
