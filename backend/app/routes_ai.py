# backend/app/routes_ai.py

import os
import json
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from google import genai

from .deps import get_current_user
from .db import meals, activity
import asyncio
from google.api_core.exceptions import ResourceExhausted, TooManyRequests, ServiceUnavailable


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
2. For each meal item, estimate:
   - kcal (calories consumed)
   - carb_g
   - protein_g
   - fat_g
   - sugar_g (CRITICAL: estimate this for all items, especially fruits/sweets/sauces. Do not return 0 unless water/plain tea)
If you are unsure, make a sensible estimate based on common values.
Prefer typical Indian/South Asian/Sri Lankan foods when relevant.

3. Extract ACTIVITIES:
   - type: one of ["walk_easy","walk","walk_brisk","run_easy","run","gym","cycle","yoga","hiit","strength","other"]
   - minutes: integer
   - intensity: "low" | "moderate" | "high"
   - kcal_burned: estimated calories burned for this activity (use standard MET-based calculation assuming ~70 kg body weight if not specified)

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
      "intensity": "moderate",
      "kcal_burned": 120
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
    sugar = num("sugar_g")
    
    # Heuristic: If sugar is 0/missing but description implies sweet, default to 10g or 50% carbs
    if not sugar or sugar <= 0:
        name_lower = desc.lower()
        sweet_keywords = ["sugar", "sweet", "cake", "candy", "chocolate", "dessert", "soda", "coke", "pepsi", "sprite", "ice cream", "cookie", "biscuit", "fruit", "apple", "banana", "mango", "orange", "juice", "honey", "syrup", "jam", "milk tea"]
        if any(w in name_lower for w in sweet_keywords):
            sugar = 10.0
            # If carbs known, cap sugar at carbs (or maybe 80% carbs)
            c = num("carb_g")
            if c and c > 0:
                sugar = min(sugar, c * 0.9)

    return {
        "name": desc,
        "kcal": num("kcal"),
        "carb_g": num("carb_g"),
        "protein_g": num("protein_g"),
        "fat_g": num("fat_g"),
        "sugar_g": sugar,
    }

def _normalize_activity_item(a):
    t = (a.get("type") or "other").strip().lower()
    minutes = a.get("minutes") or 0
    if not isinstance(minutes, (int, float)) or minutes <= 0:
        return None
    if t not in [
        "walk_easy","walk","walk_brisk",
        "run_easy","run",
        "gym","cycle","yoga","hiit","strength","other"
    ]:
        t = "other"
    intensity = (a.get("intensity") or "").strip().lower()
    if intensity not in ["low","moderate","high"]:
        intensity = "moderate"
    # Extract AI-estimated kcal_burned if provided
    kcal_burned = a.get("kcal_burned")
    if isinstance(kcal_burned, (int, float)) and kcal_burned > 0:
        kcal_burned = float(kcal_burned)
    else:
        kcal_burned = None
    return {
        "type": t,
        "minutes": int(minutes),
        "intensity": intensity,
        "kcal_burned": kcal_burned,
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
        # Optional: small retry for temporary rate-limit / service hiccups
        last_err = None
        data = None

        for attempt in range(3):  # 3 attempts max
            try:
                # Using Google GenAI SDK (google-genai package)
                # Valid models: gemini-2.5-flash, gemini-1.5-flash, gemini-1.5-pro
                response = client.models.generate_content(
                    model="gemini-2.5-flash",  # Using stable 2.5 model
                    contents=f"{PROMPT}\n\nUser description for {dateISO}: {text}"
                )
                
                raw = response.text or ""
                data = _safe_parse_json(raw)
                last_err = None
                break
            except (TooManyRequests, ServiceUnavailable) as e:
                last_err = e
                await asyncio.sleep(2.0 * (attempt + 1))  # exponential backoff
            except ResourceExhausted as e:
                # Don't retry on quota exhausted - fail immediately with clear message
                raise HTTPException(
                    status_code=429,
                    detail="Gemini API quota exceeded. Please wait a few minutes and try again, or check your billing at https://ai.google.dev/gemini-api/docs/rate-limits"
                )
            except Exception as e:
                # Log the actual error for debugging
                print(f"Gemini API Error (attempt {attempt + 1}): {str(e)}")
                last_err = e
                if attempt == 2:  # Last attempt
                    raise

        if last_err and data is None:
            raise last_err

    except ResourceExhausted as e:
        raise HTTPException(
            status_code=429,
            detail=f"Gemini API quota exceeded. Please check your plan and billing. Visit: https://ai.google.dev/gemini-api/docs/rate-limits. Error: {str(e)}",
        )
    except TooManyRequests as e:
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests to Gemini API. Please wait a moment and try again. Error: {str(e)}",
        )
    except ServiceUnavailable as e:
        raise HTTPException(
            status_code=503,
            detail=f"Gemini service temporarily unavailable. Try again in a moment. Error: {str(e)}",
        )
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse AI response as JSON. The model may have returned invalid format. Error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"AI parsing failed: {str(e)}"
        )

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
        # Calculate total calories to increment
        added_kcal = sum((m.get("kcal") or 0) for m in meals_in)
        
        await meals.update_one(
            {"userId": user["id"], "dateISO": dateISO},
            {
                "$push": { "items": { "$each": meals_in } },
                "$inc": { "totalCalories": added_kcal },
                "$setOnInsert": { "createdAt": datetime.utcnow().isoformat() },
                "$set": { "updatedAt": datetime.utcnow().isoformat() }
            },
            upsert=True
        )

    # 2) Store/merge activities per date+type (like routes_activity upsert)
    from .routes_activity import kcal_for_activity
    weight_kg = user.get("weightKg")

    for a in acts_in:
        q = {
            "userId": user["id"],
            "dateISO": dateISO,
            "type": a["type"]
        }
        # Use AI-estimated kcal if available, otherwise calculate via MET formula
        kcal = a.get("kcal_burned")
        if kcal is None:
            kcal = kcal_for_activity(a["type"], a["minutes"], weight_kg)
        inc = {"minutes": a["minutes"], "kcal": float(kcal)}
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