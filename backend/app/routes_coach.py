from fastapi import APIRouter, Depends, Query, HTTPException
from .deps import get_current_user
from .db import meals, activity
from .reco import activity_level_from_minutes, plan, adherence_score
from datetime import date as _date, timedelta
from collections import defaultdict

# Dynamic goal logic
def get_activity_goal(user: dict) -> int:
    # 1. Start with requested base of 45 mins
    goal = 45
    
    # 2. Adjust for age (older adults might need slightly less intensity but duration is good, 
    #    so let's keep it simple: reduce to 30 if age > 65)
    age = user.get("age")
    if age and age > 65:
        goal = 30
        
    # 3. Adjust for goal
    user_goal = (user.get("goal") or "maintain").lower()
    if user_goal == "lose":
        goal += 15  # 60 mins for weight loss
        
    return goal

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
    target = get_activity_goal(user)
    tips = []
    if activity_minutes < target: tips.append(f"Try to reach {target}+ minutes of movement today. A short brisk walk counts!")
    if sugar_g_today > 50: tips.append("Today’s sugar is high. Swap sweet drinks for water/unsweetened tea.")
    if not tips: tips.append("Great job keeping a healthy routine! 🎉 Keep it up.")
    return {"tips": tips}

@router.get("/motivate")
async def coach_motivate(dateISO: str = Query(default=None), goal: str = "maintain", user=Depends(get_current_user)):
    from datetime import date
    dateISO = dateISO or date.today().isoformat()

    # Sum activity minutes
    # Sum activity minutes and calories
    # We now store kcal in the activity document. If missing, we could calc on fly, 
    # but let's assume `routes_activity` handles the writing.
    # We'll re-import the calc function just in case we need a fallback for old data?
    # Actually simpler to just trust what we have or do a rough fallback.
    mins = 0
    burned_kcal = 0.0
    
    # helper for fallback calc if needed
    from .routes_activity import kcal_for_activity
    weight = user.get("weightKg")
    
    async for a in activity.find({"userId": user["id"], "dateISO": dateISO}):
        v = a.get("minutes") or a.get("durationMin") or 0
        if isinstance(v, (int,float)): 
            mins += v
            # Get stored kcal or calc
            k = a.get("kcal")
            if k is None:
                t = (a.get("type") or "walk").lower()
                k = kcal_for_activity(t, int(v), weight)
            burned_kcal += float(k)

    # Build plan
    act_level = activity_level_from_minutes(mins)
    p = plan(user, act_level, goal)
    
    # Update activity target in plan if needed? 
    # The 'plan' function likely returns macros. We can inject our dynamic target here if the frontend needs it.
    # But `CoachCard` computes percentage. We should return the dynamic target explicitly.
    activity_target = get_activity_goal(user)

    # Sum today's nutrition
    totals = {"kcal":0,"carb_g":0,"protein_g":0,"fat_g":0,"fiber_g":0,"sugar_g":0,"sodium_mg":0}
    async for m in meals.find({"userId": user["id"], "dateISO": dateISO}):
        for it in (m.get("items") or []):
            for k in totals.keys():
                v = it.get(k)
                if isinstance(v, (int,float)): totals[k] += v

    score, messages = adherence_score(p["macros"], totals, mins)
    
    # We'll calculate net calories = Intake - Burned
    # But for "Net", usually it means Intake - Burned. 
    # The user request: "from the calorie we take we will burn some calories so we can finalize our calorie intake"
    # This usually means Net = Intake - Exercise.
    # We'll pass `burned_kcal` and `net_kcal` to frontend.
    
    return {
        "dateISO": dateISO,
        "activity_level": act_level,
        "minutes": mins,
        "activity_target": activity_target, # NEW
        "burned_kcal": round(burned_kcal),  # NEW
        "plan": p,
        "nutrition_totals": totals,
        "score": score,
        "messages": messages
    }


def appreciation_badge(score: int) -> str:
    if score >= 90: return "🏅 Gold Day"
    if score >= 80: return "🥈 Silver Day"
    if score >= 70: return "🥉 Bronze Day"
    return "✨ Keep Going"

@router.get("/workouts")
async def coach_workouts(minutes: int = Query(30, ge=10, le=120), level: str = "light"):
    # Quick, template suggestions
    ideas = []
    if minutes <= 20:
        ideas = [
            "5-min warm-up walk + 10-min brisk walk + 5-min stretch",
            "Bodyweight circuit (2x): squats 12, push-ups 8, lunges 10/side, plank 30s"
        ]
    elif minutes <= 40:
        ideas = [
            "10-min walk + 20-min jog intervals (2min jog/1min walk) + 10-min stretch",
            "Full-body (3x): squats 12, rows 12, glute bridges 12, shoulder taps 20"
        ]
    else:
        ideas = [
            "40-min steady cardio (walk/jog/cycle) + 10-min mobility",
            "Upper/lower split (3x12) + 10-min easy walk"
        ]
    return {"level": level, "minutes": minutes, "suggestions": ideas}



@router.get("/weekly")
async def coach_weekly(
    endISO: str | None = Query(default=None),
    goal: str = "maintain",
    user=Depends(get_current_user),
):
    # 7-day window [startISO, endISO]
    end_d = _date.fromisoformat(endISO) if endISO else _date.today()
    start_d = end_d - timedelta(days=6)
    startISO = start_d.isoformat()
    endISO = end_d.isoformat()

    # fetch all meals + activity once
    meal_docs = [m async for m in meals.find({
        "userId": user["id"],
        "dateISO": {"$gte": startISO, "$lte": endISO},
    })]
    act_docs = [a async for a in activity.find({
        "userId": user["id"],
        "dateISO": {"$gte": startISO, "$lte": endISO},
    })]

    meals_by_day = defaultdict(list)
    for m in meal_docs:
        d = m.get("dateISO")
        for it in (m.get("items") or []):
            meals_by_day[d].append(it)

    acts_by_day = defaultdict(list)
    for a in act_docs:
        d = a.get("dateISO")
        acts_by_day[d].append(a)

    day_rows = []
    total_kcal = 0.0
    total_minutes = 0
    days_with_data = 0

    for i in range(7):
        d = (start_d + timedelta(days=i)).isoformat()

        # sum meals
        totals = {"kcal":0,"carb_g":0,"protein_g":0,"fat_g":0,"fiber_g":0,"sugar_g":0,"sodium_mg":0}
        for it in meals_by_day.get(d, []):
            for k in totals:
                v = it.get(k)
                if isinstance(v, (int,float)):
                    totals[k] += v

        # sum activity minutes
        # sum activity minutes & calories
        mins = 0
        burned = 0.0
        from .routes_activity import kcal_for_activity
        w = user.get("weightKg")
        
        for a in acts_by_day.get(d, []):
            v = a.get("minutes") or a.get("durationMin") or 0
            if isinstance(v, (int,float)):
                mins += v
                k = a.get("kcal")
                if k is None:
                    t = (a.get("type") or "walk").lower()
                    k = kcal_for_activity(t, int(v), w)
                burned += float(k)

        if totals["kcal"] > 0 or mins > 0:
            days_with_data += 1
            act_level = activity_level_from_minutes(mins)
            p = plan(user, act_level, goal)
            score, _ = adherence_score(p["macros"], totals, mins)

            total_kcal += totals["kcal"]
            total_minutes += mins

            day_rows.append({
                "dateISO": d,
                "score": score,
                "minutes": mins,
                "kcal": round(totals["kcal"], 1),
            })

    if days_with_data == 0:
        return {
            "startISO": startISO,
            "endISO": endISO,
            "days_logged": 0,
            "avg_kcal": 0,
            "target_kcal": None,
            "avg_minutes": 0,
            "target_minutes": 30,
            "good_days": 0,
            "bad_days": 0,
            "days": [],
            "messages": [
                "No meals or activity logged in the last 7 days. Start logging to get your weekly review."
            ],
        }

    avg_kcal = round(total_kcal / days_with_data)
    avg_minutes = round(total_minutes / days_with_data)
    base_plan = plan(user, "light", goal)
    target_kcal = base_plan["macros"]["kcal"]
    target_minutes = get_activity_goal(user) # Use dynamic goal

    good_days = sum(1 for d in day_rows if d["score"] >= 70)
    bad_days = days_with_data - good_days

    messages = []

    # calories trend
    if abs(avg_kcal - target_kcal) / target_kcal <= 0.05:
      messages.append("Your average calories this week are nicely aligned with your target.")
    elif avg_kcal > target_kcal:
      messages.append("On average you ate above your target. Consider lighter options or more movement on some days.")
    else:
      messages.append("On average you ate below your target. Make sure you are fueling enough, especially with protein.")

    # activity trend
    if avg_minutes >= target_minutes:
      messages.append("You are consistently active. Good job maintaining regular movement.")
    else:
      messages.append("Weekly activity is low. Try to reach at least 30 minutes on most days.")

    messages.append(f"{good_days} out of {days_with_data} logged days met your overall balance goal.")

    return {
        "startISO": startISO,
        "endISO": endISO,
        "days_logged": days_with_data,
        "avg_kcal": avg_kcal,
        "target_kcal": target_kcal,
        "avg_minutes": avg_minutes,
        "target_minutes": target_minutes,
        "good_days": good_days,
        "bad_days": bad_days,
        "days": day_rows,
        "messages": messages,
    }
