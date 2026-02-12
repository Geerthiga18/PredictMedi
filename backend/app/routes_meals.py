# backend/app/routes_meals.py
from fastapi import APIRouter, Depends, Query
from datetime import datetime
from .deps import get_current_user
from .schemas import MealIn
from .db import meals

router = APIRouter(prefix="/meals", tags=["meals"])

@router.get("/log")
async def get_meal_log(
    date: str = Query(..., description="YYYY-MM-DD"),
    user=Depends(get_current_user),
):
    doc = await meals.find_one({"userId": user["id"], "dateISO": date}, sort=[("_id", -1)])
    if not doc:
        # Return the shape your UI expects
        return {"items": []}

    # Map DB fields -> UI fields (UI uses "desc", not "name")
    items = []
    for it in (doc.get("items") or []):
        items.append({
            "desc": it.get("name") or "",
            "grams": it.get("grams"),
            "kcal": it.get("kcal"),
            "protein_g": it.get("protein_g"),
            "carb_g": it.get("carb_g"),
            "fat_g": it.get("fat_g"),
            "fiber_g": it.get("fiber_g"),
            "sugar_g": it.get("sugar_g"),
            "sodium_mg": it.get("sodium_mg"),
            "fdcId": it.get("fdcId"),
        })
    return {"items": items}


@router.post("/log", status_code=201)
async def log_meal(payload: MealIn, user=Depends(get_current_user)):
    total_cal = sum((i.kcal or 0) for i in payload.items)
    doc = {
        "userId": user["id"],
        "dateISO": payload.date.isoformat(),
        "items": [i.model_dump() for i in payload.items],
        "totalCalories": total_cal,
        "notes": payload.notes,
        "createdAt": datetime.utcnow().isoformat()
    }
    await meals.update_one(
        {"userId": user["id"], "dateISO": payload.date.isoformat()},
        {"$set": {
            "items": [i.model_dump() for i in payload.items],
            "totalCalories": total_cal,
            "notes": payload.notes,
            "updatedAt": datetime.utcnow().isoformat()
        }},
        upsert=True
    )
    return {"ok": True, "totalCalories": total_cal}



@router.get("/logs")
async def list_meals(user=Depends(get_current_user), limit: int = 30):
    cur = meals.find({"userId": user["id"]}).sort("dateISO", -1).limit(limit)
    return {"logs": [doc async for doc in cur]}



@router.get("/summary")
async def meals_summary(
    dateISO: str | None = Query(default=None),
    user=Depends(get_current_user)
):
    from datetime import date
    dateISO = dateISO or date.today().isoformat()

    totals = {
        "kcal": 0, "carb_g": 0, "protein_g": 0, "fat_g": 0,
        "fiber_g": 0, "sugar_g": 0, "sodium_mg": 0
    }
    count = 0
    doc = await meals.find_one({"userId": user["id"], "dateISO": dateISO}, sort=[("_id", -1)])
    if doc:
        count = 1
        for it in (doc.get("items") or []):
            for k in totals.keys():
                v = it.get(k)
                if isinstance(v, (int, float)):
                    totals[k] += v

    return {"dateISO": dateISO, "count": count, "totals": totals}

@router.get("/day")
async def get_meals_for_day(
    dateISO: str = Query(..., min_length=8),
    user=Depends(get_current_user)
):
    doc = await meals.find_one({"userId": user["id"], "dateISO": dateISO}, sort=[("_id", -1)])
    items = []
    totals = {"kcal":0,"carb_g":0,"protein_g":0,"fat_g":0,"fiber_g":0,"sugar_g":0,"sodium_mg":0}
    
    if doc:
        for it in (doc.get("items") or []):
            items.append(it)
            for k in totals:
                v = it.get(k)
                if isinstance(v,(int,float)): totals[k] += v
    
    return {"dateISO": dateISO, "count": 1 if doc else 0, "items": items, "totals": totals}
