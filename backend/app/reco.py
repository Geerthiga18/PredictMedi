def mifflin_st_jeor(sex: str, age: int, height_cm: float, weight_kg: float) -> float:
    s = 5 if (sex or "").lower().startswith("m") else (-161 if (sex or "").lower().startswith("f") else -78)
    return 10*weight_kg + 6.25*height_cm - 5*age + s

def tdee(bmr: float, activity: str) -> float:
    factors = {
        "sedentary": 1.2, "light": 1.375, "moderate": 1.55,
        "active": 1.725, "very_active": 1.9
    }
    return bmr * factors.get((activity or "light").lower(), 1.375)

def macros_for_goal(kcal: float, profile: str = "balanced"):
    profiles = {
        "balanced": (0.45, 0.25, 0.30),      # carb/protein/fat
        "higher_protein": (0.40, 0.30, 0.30)
    }
    c, p, f = profiles.get(profile, profiles["balanced"])
    return {
        "kcal": round(kcal),
        "carb_g": round((kcal*c)/4),
        "protein_g": round((kcal*p)/4),
        "fat_g": round((kcal*f)/9),
    }

def _window_score(pct_diff: float, full: float, zero: float) -> float:
    """1.0 inside 'full' window, linearly down to 0.0 at 'zero'."""
    if pct_diff <= full: return 1.0
    if pct_diff >= zero: return 0.0
    return 1.0 - (pct_diff - full) / (zero - full)

def plan(user: dict, activity_level: str, goal: str = "maintain"):
    # validate profile so routes can 400 with a clear message
    age = user.get("age"); h_cm = user.get("heightCm"); w_kg = user.get("weightKg")
    missing = [k for k, v in {"age": age, "heightCm": h_cm, "weightKg": w_kg}.items() if v in (None, "", 0)]
    if missing:
        raise ValueError(f"please set {', '.join(missing)} in your profile")

    sex = user.get("sex", "other")
    bmr  = mifflin_st_jeor(sex, float(age), float(h_cm), float(w_kg))
    need = tdee(bmr, activity_level)

    # mild adjustment for goals
    bmi = float(w_kg) / ((float(h_cm)/100.0)**2)
    if goal == "lose" and bmi >= 25: need -= 250
    if goal == "gain": need += 250

    profile = "higher_protein" if goal == "lose" else "balanced"
    return {"bmr": round(bmr), "tdee": round(need), "macros": macros_for_goal(need, profile)}

def activity_level_from_minutes(mins: int) -> str:
    mins = int(mins or 0)
    if mins >= 90: return "very_active"
    if mins >= 60: return "active"
    if mins >= 30: return "moderate"
    if mins >= 15: return "light"
    return "sedentary"

def adherence_score(plan_macros: dict, totals: dict, mins: int) -> tuple[int, list[str]]:
    msgs, score = [], 0.0
    # targets
    kcal_t = plan_macros.get("kcal") or 0
    carb_t = plan_macros.get("carb_g") or 0
    prot_t = plan_macros.get("protein_g") or 0
    fat_t  = plan_macros.get("fat_g") or 0
    # actuals
    kcal = totals.get("kcal") or 0
    carb = totals.get("carb_g") or 0
    prot = totals.get("protein_g") or 0
    fat  = totals.get("fat_g")  or 0
    sugar= totals.get("sugar_g") or 0
    fiber= totals.get("fiber_g") or 0

    # weights sum to 1.0
    W_KCAL, W_MAC, W_ACT, W_SUG = 0.35, 0.35, 0.20, 0.10

    # 1) Calories: full pts inside ±10%, zero by ±20%
    if kcal_t > 0:
        pct = abs(kcal - kcal_t) / kcal_t
        kcal_score = _window_score(pct, full=0.10, zero=0.20)
    else:
        kcal_score = 0.5
    score += W_KCAL * kcal_score

    # 2) Macros: full inside ±15%, zero by ±30%
    parts = []
    for actual, target in [(carb, carb_t), (prot, prot_t), (fat, fat_t)]:
        if target > 0:
            pct = abs(actual - target) / target
            parts.append(_window_score(pct, full=0.15, zero=0.30))
    mac_score = sum(parts)/len(parts) if parts else 0.5
    score += W_MAC * mac_score

    # 3) Activity: 30 min = full
    act_score = min(1.0, (mins or 0)/30.0)
    score += W_ACT * act_score

    # 4) Sugar cap
    sug_score = 1.0 if sugar <= 50 else (0.5 if sugar <= 75 else 0.0)
    score += W_SUG * sug_score

    # messages
    msgs.append("Great job hitting 30+ active minutes! 🎉" if act_score >= 1.0
                else "Try to reach 30+ minutes of movement today — even a brisk walk helps.")
    if kcal_score >= 0.9:
        msgs.append("Calories are nicely on target. 👍")
    elif kcal > kcal_t:
        msgs.append("Slightly over calorie target — a lighter dinner or short walk can balance it.")
    else:
        msgs.append("Slightly under calories — consider a protein-rich snack.")
    if sugar > 50: msgs.append("Sugar is a bit high today. Swap sweet drinks for water/unsweetened tea.")
    if fiber < 25: msgs.append("Aim for ~25g fiber: oats, veggies, beans, or fruit can help.")

    final = round(score * 100)
    msgs.insert(0, "🔥 Fantastic day! Keep this momentum." if final >= 85
                    else ("👏 Solid work — you’re on track." if final >= 70
                          else "You’ve got this — small changes add up. 💪"))
    return final, msgs
