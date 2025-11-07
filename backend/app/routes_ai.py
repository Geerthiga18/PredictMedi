# backend/app/routes_ai.py

import os
import json
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from google import genai

from .deps import get_current_user
from .db import meals, activity

router = APIRouter(prefix="/ai", tags=["ai"])

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    # Fail fast and clearly at startup if key missing
    raise RuntimeError("GEMINI_API_KEY not set in environment")

client = genai.Client(api_key=API_KEY)

PROMPT = """
You are a nutrition and physical activity parser for a health tracking app.

The user will describe in free text what they ATE and what ACTIVITIES they did TODAY.

Your job:
1. Extract MEALS: break into reasonable items.
2. For each item, estimate:
   - kcal
   - carb_g
   - protein_g
   - fat_g
   - sugar_g
If you are unsure, make a sensible estimate based on common values.
Prefer typical Indian/South Asian/Sri Lankan foods when relevant.

3. Extract ACTIVITIES:
   - type: one of ["walk_easy","walk","walk_brisk","run_easy","run","gym","cycle","other"]
   - minutes: integer
   - intensity: "low" | "moderate" | "high"

Output:
Return STRICT JSON ONLY. No explanation, no markdown.

Format:
{
  "meals": [
    {
      "description": "string",
      "kcal": number,
      "carb_g": number,
      "protein_g": number,
      "fat_g": number,
      "sugar_g": number
    }
  ],
  "activities": [
    {
      "type": "walk_brisk",
      "minutes": 30,
      "intensity": "moderate"
    }
  ]
}
"""

def _safe_parse_json(raw: str):
    """
    Try to parse a JSON object from the model output.
    Assumes the model followed instructions and returned JSON.
    """
    raw = raw.strip()
    # If it accidentally wrapped in ```json ``` or ``` blocks, strip them
    if raw.startswith("```"):
        raw = raw.strip("`")
        # remove possible "json" prefix
        if raw.lower().startswith("json"):
            raw = raw[4:].strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # last resort: find first { ... } block
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(raw[start:end+1])
        raise

def _normalize_meal_item(m):
    desc = (m.get("description") or "").strip()
    if not desc:
        return None
    def num(key):
        v = m.get(key)
        return float(v) if isinstance(v, (int, float)) else None
    return {
        "name": desc,
        "kcal": num("kcal"),
        "carb_g": num("carb_g"),
        "protein_g": num("protein_g"),
        "fat_g": num("fat_g"),
        "sugar_g": num("sugar_g"),
    }

def _normalize_activity_item(a):
    t = (a.get("type") or "other").strip().lower()
    minutes = a.get("minutes") or 0
    if not isinstance(minutes, (int, float)) or minutes <= 0:
        return None
    if t not in [
        "walk_easy","walk","walk_brisk",
        "run_easy","run",
        "gym","cycle","other"
    ]:
        t = "other"
    intensity = (a.get("intensity") or "").strip().lower()
    if intensity not in ["low","moderate","high"]:
        intensity = "moderate"
    return {
        "type": t,
        "minutes": int(minutes),
        "intensity": intensity,
    }

@router.post("/ingest")
async def ai_ingest(
    payload: dict,
    user = Depends(get_current_user)
):
    """
    Take free-text description of today's food + activity,
    parse via Gemini, store into meals & activity collections,
    and return the parsed structure.
    """
    text = (payload.get("text") or "").strip()
    dateISO = (payload.get("dateISO") or "").strip() or date.today().isoformat()

    if not text:
        raise HTTPException(status_code=400, detail="No text provided")

    try:
        resp = client.models.generate_content(
            model="gemini-2.0-flash",  # or your chosen model
            contents=[PROMPT, f"User description for {dateISO}: {text}"]
        )
        raw = resp.text or ""
        data = _safe_parse_json(raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI parsing failed: {e}")

    meals_in = []
    for m in data.get("meals", []):
        norm = _normalize_meal_item(m)
        if norm:
            meals_in.append(norm)

    acts_in = []
    for a in data.get("activities", []):
        norm = _normalize_activity_item(a)
        if norm:
            acts_in.append(norm)

    # If nothing parsed, stop
    if not meals_in and not acts_in:
        raise HTTPException(status_code=400, detail="Could not extract meals or activities from text")

    # 1) Store meals as ONE log entry for that date (append-style)
    if meals_in:
        doc = {
            "userId": user["id"],
            "dateISO": dateISO,
            "items": meals_in,
            "createdAt": datetime.utcnow().isoformat()
        }
        await meals.insert_one(doc)

    # 2) Store/merge activities per date+type (like routes_activity upsert)
    for a in acts_in:
        q = {
            "userId": user["id"],
            "dateISO": dateISO,
            "type": a["type"]
        }
        inc = {"minutes": a["minutes"]}
        await activity.update_one(
            q,
            {
                "$inc": inc,
                "$setOnInsert": {"createdAt": datetime.utcnow().isoformat()}
            },
            upsert=True
        )

    return {
        "ok": True,
        "dateISO": dateISO,
        "meals_added": len(meals_in),
        "activities_added": len(acts_in),
        "parsed": {
            "meals": meals_in,
            "activities": acts_in
        }
    }
