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
    W_KCAL, W_MAC, W_ACT, W_SUG = 0.30, 0.30, 0.30, 0.10

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

    # 3) Activity: 30 min = full (1.0). Allow bonus up to 60 min (2.0).
    # This allows "extra credit" for activity to boost the daily score.
    act_score = min(2.0, (mins or 0)/30.0)
    score += W_ACT * act_score

    # 4) Sugar cap
    sug_score = 1.0 if sugar <= 50 else (0.5 if sugar <= 75 else 0.0)
    score += W_SUG * sug_score

    final = min(100, round(score * 100))

    # --- Build rich, context-aware messages ---

    # Overall headline
    if final >= 90:
        msgs.append("🔥 Outstanding day! You're crushing your health goals.")
    elif final >= 80:
        msgs.append("🏅 Excellent balance today — your discipline is paying off.")
    elif final >= 70:
        msgs.append("👏 Solid work — you're on track for a healthy day.")
    elif final >= 50:
        msgs.append("💪 Decent effort — a few tweaks can push you into the green zone.")
    else:
        msgs.append("🌱 Every step counts — small changes today build big results over time.")

    # Activity — tiered feedback
    mins = mins or 0
    if mins >= 60:
        msgs.append(f"🏃 {mins} minutes of activity — exceptional! You're well above the recommended level.")
    elif mins >= 45:
        msgs.append(f"🏃 {mins} minutes active — great job exceeding the 30-min daily baseline.")
    elif mins >= 30:
        msgs.append("✅ You hit 30+ active minutes today — that's the sweet spot for daily health.")
    elif mins >= 15:
        msgs.append(f"🚶 {mins} minutes logged — try to reach 30 min. Even a 15-min walk after meals helps digestion and blood sugar.")
    else:
        msgs.append("⚡ Very little movement today. A short brisk walk, stretching, or even taking the stairs can make a real difference.")

    # Calories — with actual numbers
    if kcal_t > 0:
        diff = round(kcal - kcal_t)
        if kcal_score >= 0.9:
            msgs.append(f"🎯 Calories on point at {round(kcal)} kcal (target {round(kcal_t)}). Well managed!")
        elif kcal > kcal_t:
            msgs.append(f"📈 {round(kcal)} kcal consumed vs {round(kcal_t)} target (+{diff}). A lighter dinner or extra 20-min walk can offset this.")
        else:
            msgs.append(f"📉 {round(kcal)} kcal consumed vs {round(kcal_t)} target ({diff}). Consider a protein-rich snack to meet your energy needs.")

    # Protein specific
    if prot_t > 0:
        prot_pct = prot / prot_t
        if prot_pct >= 0.9:
            msgs.append(f"💪 Protein intake is solid at {round(prot)}g — great for muscle maintenance and satiety.")
        elif prot_pct < 0.6:
            msgs.append(f"🥚 Protein is low at {round(prot)}g (target {round(prot_t)}g). Add eggs, yogurt, lentils, or chicken to bridge the gap.")

    # Macro balance check
    if carb_t > 0 and fat_t > 0:
        carb_ratio = carb / carb_t if carb_t else 1.0
        fat_ratio = fat / fat_t if fat_t else 1.0
        if fat_ratio > 1.3 and carb_ratio < 0.8:
            msgs.append("⚖️ Fat is high while carbs are low — swap some fried foods for whole grains or fruit.")
        elif carb_ratio > 1.3 and fat_ratio < 0.8:
            msgs.append("⚖️ Carbs are high while fat is low — include healthy fats like nuts, avocado, or olive oil.")

    # Sugar
    if sugar > 75:
        msgs.append(f"🚨 Sugar is very high at {round(sugar)}g. Replace sugary drinks and sweets with water, fruit, or unsweetened alternatives.")
    elif sugar > 50:
        msgs.append(f"⚠️ Sugar is elevated at {round(sugar)}g (aim for <50g). Check for hidden sugars in sauces, juice, and packaged foods.")

    # Fiber
    if fiber > 0 and fiber < 15:
        msgs.append("🥦 Fiber is quite low. Add vegetables, beans, oats, or a piece of fruit at each meal.")
    elif fiber > 0 and fiber < 25:
        msgs.append(f"🌾 Fiber at {round(fiber)}g — try to reach 25g with whole grains, veggies, and legumes.")

    return final, msgs
