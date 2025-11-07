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
      "type": "walking|running|gym|cycling|other",
      "minutes": number,
      "intensity": "low|moderate|high"
    }
  ]
}

If you are unsure about calories, give a reasonable conservative estimate
based on common values in South Asian/Sri Lankan foods, but DO NOT say 'null' unless impossible.
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
