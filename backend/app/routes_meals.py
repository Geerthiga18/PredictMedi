# backend/app/routes_meals.py
from fastapi import APIRouter, Depends
from datetime import datetime
from .deps import get_current_user
from .schemas import MealIn
from .db import meals

router = APIRouter(prefix="/meals", tags=["meals"])

@router.post("/log", status_code=201)
async def log_meal(payload: MealIn, user=Depends(get_current_user)):
    total_cal = sum(i.calories for i in payload.items)
    doc = {
        "userId": user["id"],
        "date": payload.date.isoformat(),
        "items": [i.dict() for i in payload.items],
        "totalCalories": total_cal,
        "notes": payload.notes,
        "createdAt": datetime.utcnow().isoformat()
    }
    await meals.insert_one(doc)
    return {"ok": True, "totalCalories": total_cal}

@router.get("/logs")
async def list_meals(user=Depends(get_current_user), limit: int = 30):
    cur = meals.find({"userId": user["id"]}).sort("date", -1).limit(limit)
    return {"logs": [doc async for doc in cur]}
