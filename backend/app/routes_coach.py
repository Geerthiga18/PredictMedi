from fastapi import APIRouter, Depends, Query, HTTPException
from .deps import get_current_user
from .db import meals, activity
from .reco import plan, activity_level_from_minutes, adherence_score

router = APIRouter(prefix="/coach", tags=["coach"])

@router.get("/plan")
async def coach_plan(
    activity: str = "light",
    goal: str = "maintain",
    user = Depends(get_current_user)
):
    try:
        return plan(user, activity, goal)
    except Exception as e:
        # Return a helpful client-visible message (not a 500)
        raise HTTPException(status_code=400, detail=f"Profile incomplete: {e}")

@router.get("/tips")
async def coach_tips(activity_minutes: int = 30, sugar_g_today: float = 0.0, user=Depends(get_current_user)):
    tips = []
    if activity_minutes < 30: tips.append("Try to reach 30+ minutes of movement today. A short brisk walk counts!")
    if sugar_g_today > 50: tips.append("Today’s sugar is high. Swap sweet drinks for water/unsweetened tea.")
    if not tips: tips.append("Great job keeping a healthy routine! 🎉 Keep it up.")
    return {"tips": tips}

@router.get("/motivate")
async def coach_motivate(dateISO: str = Query(default=None), goal: str = "maintain", user=Depends(get_current_user)):
    from datetime import date
    dateISO = dateISO or date.today().isoformat()

    # Sum activity minutes
    mins = 0
    async for a in activity.find({"userId": user["id"], "dateISO": dateISO}):
        v = a.get("minutes") or a.get("durationMin") or 0
        if isinstance(v, (int,float)): mins += v

    # Build plan for the user's inferred activity level
    act_level = activity_level_from_minutes(mins)
    p = plan(user, act_level, goal)

    # Sum today's nutrition
    totals = {"kcal":0,"carb_g":0,"protein_g":0,"fat_g":0,"fiber_g":0,"sugar_g":0,"sodium_mg":0}
    async for m in meals.find({"userId": user["id"], "dateISO": dateISO}):
        for it in (m.get("items") or []):
            for k in totals.keys():
                v = it.get(k)
                if isinstance(v, (int,float)): totals[k] += v

    score, messages = adherence_score(p["macros"], totals, mins)
    return {
        "dateISO": dateISO,
        "activity_level": act_level,
        "minutes": mins,
        "plan": p,
        "nutrition_totals": totals,
        "score": score,
        "messages": messages
    }