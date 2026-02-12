import os
from google import genai

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

PROMPT = """
You are a nutrition+activity parser for a health app.

Input: A user's free-text description of what they ate and what exercise they did today.

Output: STRICT JSON, no explanation, exactly this shape:
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
      "type": "walk_easy|walk|walk_brisk|run_easy|run|gym|cycle|yoga|hiit|strength|other",
      "minutes": number,
      "intensity": "low|moderate|high",
      "kcal_burned": number
    }
  ]
}

For meals: if unsure about calories/macros, give a reasonable conservative estimate
based on common values in South Asian/Sri Lankan foods.
CRITICAL INSTRUCTION FOR SUGAR:
- You MUST estimate `sugar_g` for any item that is naturally sweet (fruit) or has added sugar (sweets, soda, tea with sugar, biscuits, cake).
- Do NOT return 0 for these items. Use standard nutritional data to guess (e.g. apple = 10g sugar, milk tea = 5-10g sugar).
- Only return 0 if the item is savory or water.

For activities: estimate kcal_burned using standard MET-based calculations assuming ~70 kg body weight.
"""

def parse_day(text: str):
    resp = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[PROMPT, f"User: {text}"]
    )
    raw = resp.text
    # parse JSON safely (add validation & try/except)
    import json
    data = json.loads(raw)
    return data
