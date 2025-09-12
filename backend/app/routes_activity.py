# backend/app/routes_activity.py
from fastapi import APIRouter, Depends, Query
from datetime import datetime
from .deps import get_current_user
from .schemas import ActivityIn
from .db import activity

router = APIRouter(prefix="/activity", tags=["activity"])

@router.post("/log", status_code=201)
async def log_activity(payload: ActivityIn, user=Depends(get_current_user)):
    doc = {
        "userId": user["id"],
        "dateISO": payload.date.isoformat(),
        "minutes": payload.minutes,
        "steps": payload.steps,
        "type": payload.type,
        "createdAt": datetime.utcnow().isoformat()
    }
    await activity.insert_one(doc)
    return {"ok": True}

@router.get("/logs")
async def list_activity(user=Depends(get_current_user), limit: int = 30):
    cur = activity.find({"userId": user["id"]}).sort("dateISO", -1).limit(limit)
    return {"logs": [doc async for doc in cur]}
