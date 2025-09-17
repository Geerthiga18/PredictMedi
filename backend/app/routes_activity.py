# backend/app/routes_activity.py
from fastapi import APIRouter, Depends, Query
from datetime import datetime
from .deps import get_current_user
from .schemas import ActivityIn
from .db import activity
from bson import ObjectId


METS = {
    # walking
    "walk_easy": 2.5,          # ~2.0–2.5 mph
    "walk": 3.3,               # ~2.5–3.0 mph
    "walk_brisk": 3.8,         # ~3.5 mph
    # running
    "run_easy": 8.0,           # ~5 mph (12 min/mi)
    "run": 9.8,                # ~6 mph
    # cycling
    "cycle_easy": 4.0,         # leisure
    "cycle_moderate": 6.8,     # 10–12 mph
    "cycle_vigorous": 8.0,     # 12–14 mph
    # other
    "strength": 3.5,           # general weights
    "yoga": 2.5,
    "hiit": 8.0,
}

def kcal_for_activity(act_type: str, minutes: int, weight_kg: float | None) -> float:
    if not weight_kg or weight_kg <= 0:
        weight_kg = 70.0  # sensible default if user profile missing
    met = METS.get((act_type or "").lower(), 3.3)  # default to a “walk”
    hours = max(0.0, (minutes or 0)) / 60.0
    return float(met * weight_kg * hours)

router = APIRouter(prefix="/activity", tags=["activity"])

@router.post("/log", status_code=201)
async def log_activity(payload: ActivityIn, user=Depends(get_current_user)):
    doc = {
        "userId": user["id"],
        "dateISO": payload.date.isoformat(),
        "minutes": payload.minutes,
        "steps": payload.steps,
        "type": (payload.type or "walk").lower(),
        "createdAt": datetime.utcnow().isoformat()
    }
    await activity.insert_one(doc)
    return {"ok": True}

def _dump(d: dict) -> dict:
    d = dict(d)
    d["id"] = str(d.pop("_id", ""))   # make ObjectId JSON-safe
    # optional: keep a friendly field name
    d.setdefault("date", d.get("dateISO"))
    return d

@router.get("/logs")
async def list_activity(user=Depends(get_current_user), limit: int = 30):
    cur = activity.find({"userId": user["id"]}).sort("dateISO", -1).limit(limit)
    return {"logs": [_dump(doc) async for doc in cur]}

@router.get("/summary")
async def activity_summary(
    dateISO: str | None = Query(default=None),
    user=Depends(get_current_user)
):
    from datetime import date
    dateISO = dateISO or date.today().isoformat()

    # pull all entries for the day
    entries = [doc async for doc in activity.find({"userId": user["id"], "dateISO": dateISO})]

    total_minutes = 0
    total_steps = 0
    total_kcal = 0.0
    by_type: dict[str, dict] = {}

    weight_kg = user.get("weightKg")  # may be None

    for a in entries:
        m = int(a.get("minutes") or 0)
        s = int(a.get("steps") or 0)
        t = (a.get("type") or "walk").lower()

        total_minutes += m
        total_steps += s

        kcal = kcal_for_activity(t, m, weight_kg)
        total_kcal += kcal

        b = by_type.setdefault(t, {"minutes": 0, "steps": 0, "kcal": 0.0})
        b["minutes"] += m
        b["steps"] += s
        b["kcal"] += kcal

    return {
        "dateISO": dateISO,
        "count": len(entries),
        "minutes": total_minutes,
        "steps": total_steps,
        "calories_kcal": round(total_kcal, 1),
        "by_type": {k: {"minutes": v["minutes"], "steps": v["steps"], "kcal": round(v["kcal"],1)} for k,v in by_type.items()},
    }

@router.post("/log/upsert", status_code=200)
async def upsert_activity(payload: ActivityIn, user=Depends(get_current_user)):
    q = {
        "userId": user["id"],
        "dateISO": payload.date.isoformat(),
        "type": (payload.type or "walk").lower(),
    }
    inc = {"minutes": int(payload.minutes)}
    if payload.steps is not None:
        inc["steps"] = int(payload.steps)

    await activity.update_one(
        q,
        {"$inc": inc, "$setOnInsert": {"createdAt": datetime.utcnow().isoformat()}},
        upsert=True,
    )
    return {"ok": True, "merged": True}
