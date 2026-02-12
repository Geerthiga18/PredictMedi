from fastapi import APIRouter, Depends, Query, HTTPException
from .deps import get_current_user
from .db import meals, activity
from .reco import activity_level_from_minutes, plan, adherence_score
from datetime import date as _date, timedelta
from collections import defaultdict

# Dynamic goal logic
def get_activity_goal(user: dict) -> int:
    # 1. Start with a higher active base
    goal = 60
    
    # 2. Adjust for age
    age = user.get("age")
    if age and age > 65:
        goal = 30
        
    # 3. Adjust for goal
    user_goal = (user.get("goal") or "maintain").lower()
    if user_goal == "lose":
        goal += 30  # 90 mins for weight loss
        
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
    badge = appreciation_badge(score)
    net_kcal = round((totals.get("kcal") or 0) - burned_kcal)
    
    return {
        "dateISO": dateISO,
        "activity_level": act_level,
        "minutes": mins,
        "activity_target": activity_target,
        "burned_kcal": round(burned_kcal),
        "net_kcal": net_kcal,
        "badge": badge,
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

    # deduplicate meals: keep only the latest doc per day
    docs_by_date = {}
    for m in meal_docs:
        d = m.get("dateISO")
        existing = docs_by_date.get(d)
        if not existing:
            docs_by_date[d] = m
        else:
            # Assume higher _id is newer (or check createdAt)
            if m.get("_id") > existing.get("_id"):
                docs_by_date[d] = m

    meals_by_day = defaultdict(list)
    for d, m in docs_by_date.items():
        for it in (m.get("items") or []):
            meals_by_day[d].append(it)

    acts_by_day = defaultdict(list)
    for a in act_docs:
        d = a.get("dateISO")
        acts_by_day[d].append(a)

    from .routes_activity import kcal_for_activity
    w = user.get("weightKg")

    day_rows = []
    total_kcal = 0.0
    total_minutes = 0
    total_burned_kcal = 0.0
    total_carb = 0.0
    total_protein = 0.0
    total_fat = 0.0
    total_sugar = 0.0
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

        # sum activity minutes & calories
        mins = 0
        burned = 0.0
        
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
            total_burned_kcal += burned
            total_carb += totals["carb_g"]
            total_protein += totals["protein_g"]
            total_fat += totals["fat_g"]
            total_sugar += totals["sugar_g"]

            day_rows.append({
                "dateISO": d,
                "score": score,
                "badge": appreciation_badge(score),
                "minutes": round(mins),
                "kcal": round(totals["kcal"], 1),
                "burned_kcal": round(burned, 1),
                "net_kcal": round(totals["kcal"] - burned, 1),
                "carb_g": round(totals["carb_g"], 1),
                "protein_g": round(totals["protein_g"], 1),
                "fat_g": round(totals["fat_g"], 1),
                "sugar_g": round(totals["sugar_g"], 1),
            })

    if days_with_data == 0:
        return {
            "startISO": startISO,
            "endISO": endISO,
            "days_logged": 0,
            "weekly_score": 0,
            "weekly_badge": "✨ Keep Going",
            "avg_kcal": 0,
            "target_kcal": None,
            "avg_minutes": 0,
            "target_minutes": 30,
            "avg_macros": {"carb_g": 0, "protein_g": 0, "fat_g": 0},
            "target_macros": {"carb_g": 0, "protein_g": 0, "fat_g": 0},
            "good_days": 0,
            "bad_days": 0,
            "streak": 0,
            "trend": "stable",
            "best_day": None,
            "worst_day": None,
            "days": [],
            "messages": [
                "📭 No meals or activity logged in the last 7 days. Start logging to get your weekly review."
            ],
        }

    avg_kcal = round(total_kcal / days_with_data)
    avg_minutes = round(total_minutes / days_with_data)
    avg_burned_kcal = round(total_burned_kcal / days_with_data)
    avg_carb = round(total_carb / days_with_data, 1)
    avg_protein = round(total_protein / days_with_data, 1)
    avg_fat = round(total_fat / days_with_data, 1)
    avg_sugar = round(total_sugar / days_with_data, 1)

    base_plan = plan(user, "light", goal)
    target_kcal = base_plan["macros"]["kcal"]
    target_macros = {
        "carb_g": base_plan["macros"].get("carb_g", 0),
        "protein_g": base_plan["macros"].get("protein_g", 0),
        "fat_g": base_plan["macros"].get("fat_g", 0),
    }
    target_minutes = get_activity_goal(user)

    good_days = sum(1 for d in day_rows if d["score"] >= 70)
    bad_days = days_with_data - good_days

    # Weekly score = average of daily scores
    weekly_score = round(sum(d["score"] for d in day_rows) / len(day_rows)) if day_rows else 0
    weekly_badge = appreciation_badge(weekly_score)

    # Best / worst day
    best_day = max(day_rows, key=lambda d: d["score"]) if day_rows else None
    worst_day = min(day_rows, key=lambda d: d["score"]) if day_rows else None

    # Streak: consecutive days with score >= 70 ending on last logged day
    streak = 0
    for d in reversed(day_rows):
        if d["score"] >= 70:
            streak += 1
        else:
            break

    # Trend: compare first half vs second half avg scores
    if len(day_rows) >= 4:
        mid = len(day_rows) // 2
        first_half_avg = sum(d["score"] for d in day_rows[:mid]) / mid
        second_half_avg = sum(d["score"] for d in day_rows[mid:]) / (len(day_rows) - mid)
        diff = second_half_avg - first_half_avg
        if diff > 8:
            trend = "improving"
        elif diff < -8:
            trend = "declining"
        else:
            trend = "stable"
    else:
        trend = "stable"

    # --- Build rich weekly messages ---
    messages = []

    # Weekly headline
    if weekly_score >= 85:
        messages.append(f"🏆 Exceptional week! Your weekly score of {weekly_score} shows outstanding consistency.")
    elif weekly_score >= 70:
        messages.append(f"💪 Strong week overall with a {weekly_score} weekly score. You're building great habits.")
    elif weekly_score >= 50:
        messages.append(f"📊 Your weekly score is {weekly_score}. Some good days and some that need attention — consistency is key.")
    else:
        messages.append(f"🌱 Room to grow this week (score {weekly_score}). Focus on logging regularly and hitting small daily targets.")

    # Streak
    if streak >= 5:
        messages.append(f"🔥 Incredible {streak}-day streak of balanced days! Don't break the chain!")
    elif streak >= 3:
        messages.append(f"⚡ Nice {streak}-day streak! Keep pushing to maintain it through the week.")

    # Trend
    if trend == "improving":
        messages.append("📈 Your scores are trending upward — the improvements in the second half of the week show real progress.")
    elif trend == "declining":
        messages.append("📉 Scores dipped toward the end of the week. Try to maintain momentum on weekends.")

    # Calories
    if target_kcal and target_kcal > 0:
        kcal_diff_pct = abs(avg_kcal - target_kcal) / target_kcal
        if kcal_diff_pct <= 0.05:
            messages.append(f"🎯 Average intake of {avg_kcal} kcal is perfectly aligned with your {target_kcal} kcal target.")
        elif avg_kcal > target_kcal:
            messages.append(f"📈 Average intake is {avg_kcal} kcal vs {target_kcal} target (+{avg_kcal - target_kcal}). Trim portions or add movement on heavier days.")
        else:
            messages.append(f"📉 Average intake is {avg_kcal} kcal vs {target_kcal} target ({avg_kcal - target_kcal}). Ensure you're fueling enough, especially protein.")

    # Activity
    if avg_minutes >= target_minutes:
        messages.append(f"🏃 Averaging {avg_minutes} min/day of activity (target {target_minutes}) — excellent consistency.")
    elif avg_minutes >= target_minutes * 0.7:
        messages.append(f"🚶 Activity at {avg_minutes} min/day is close to your {target_minutes}-min target. A few extra walks will close the gap.")
    else:
        messages.append(f"⚠️ Activity is low at {avg_minutes} min/day vs {target_minutes}-min target. Try scheduling movement into your routine.")

    # Protein
    if target_macros["protein_g"] > 0:
        prot_ratio = avg_protein / target_macros["protein_g"]
        if prot_ratio >= 0.9:
            messages.append(f"💪 Protein averaging {avg_protein}g/day — excellent for recovery and lean mass.")
        elif prot_ratio < 0.6:
            messages.append(f"🥚 Protein is low at {avg_protein}g avg (target {target_macros['protein_g']}g). Prioritize eggs, dairy, legumes, or lean meat.")

    # Sugar
    if avg_sugar > 60:
        messages.append(f"🚨 Sugar averaged {avg_sugar}g/day this week. Cutting sweet drinks and processed snacks would help significantly.")
    elif avg_sugar > 50:
        messages.append(f"⚠️ Sugar averaged {avg_sugar}g/day — slightly above the 50g guideline. Watch hidden sugars in sauces and packaged foods.")

    # Good/bad days summary
    messages.append(f"📅 {good_days} of {days_with_data} logged days met your balance goal (score ≥ 70).")

    return {
        "startISO": startISO,
        "endISO": endISO,
        "days_logged": days_with_data,
        "weekly_score": weekly_score,
        "weekly_badge": weekly_badge,
        "avg_kcal": avg_kcal,
        "avg_burned_kcal": avg_burned_kcal,
        "target_kcal": target_kcal,
        "avg_minutes": avg_minutes,
        "target_minutes": target_minutes,
        "avg_macros": {"carb_g": avg_carb, "protein_g": avg_protein, "fat_g": avg_fat, "sugar_g": avg_sugar},
        "target_macros": target_macros,
        "good_days": good_days,
        "bad_days": bad_days,
        "streak": streak,
        "trend": trend,
        "best_day": best_day,
        "worst_day": worst_day,
        "days": day_rows,
        "messages": messages,
    }

