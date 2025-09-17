from fastapi import APIRouter, HTTPException, Query
from .config import FDC_API_KEY, FDC_BASE
import httpx, time

router = APIRouter(prefix="/nutrition", tags=["nutrition"])

# --- simple TTL cache in memory ---
_food_cache: dict[int, tuple[float, dict]] = {}
_CACHE_TTL = 60 * 60 * 24   # 24h
_CACHE_MAX = 500

def _cache_get(fid: int):
    rec = _food_cache.get(fid)
    if not rec: return None
    ts, val = rec
    if time.time() - ts > _CACHE_TTL:
        _food_cache.pop(fid, None)
        return None
    return val

def _cache_put(fid: int, val: dict):
    if len(_food_cache) >= _CACHE_MAX:
        # drop an arbitrary (oldest-ish) item
        _food_cache.pop(next(iter(_food_cache)))
    _food_cache[fid] = (time.time(), val)

def _want(n):
    n = (n or "").lower()
    return n in {
        "energy", "energy (atwater general factors)",
        "protein", "total lipid (fat)", "carbohydrate, by difference",
        "fiber, total dietary", "sugars, total including nlea", "sodium, na"
    }

def pick_macros(food_json: dict):
    out = {"kcal": None, "protein_g": None, "carb_g": None, "fat_g": None,
           "fiber_g": None, "sugar_g": None, "sodium_mg": None}
    for n in (food_json.get("foodNutrients") or []):
        name = (n.get("nutrient", {}) or {}).get("name")
        if not name or not _want(name): 
            continue
        unit = (n["nutrient"].get("unitName") or "").lower()
        val  = n.get("amount")
        if val is None: 
            continue
        nm = name.lower()
        if "energy" in nm:
            out["kcal"] = float(val)
        elif nm == "protein":
            out["protein_g"] = float(val)
        elif "carbohydrate" in nm:
            out["carb_g"] = float(val)
        elif "total lipid" in nm:
            out["fat_g"] = float(val)
        elif "fiber" in nm:
            out["fiber_g"] = float(val)
        elif "sugars" in nm:
            out["sugar_g"] = float(val)
        elif "sodium" in nm:
            out["sodium_mg"] = float(val if unit == "mg" else val)
    return out

@router.get("/search")
async def search_foods(q: str = Query(..., min_length=2), pageSize: int = 15):
    if not FDC_API_KEY:
        raise HTTPException(500, "FDC_API_KEY not configured")
    params = {
        "api_key": FDC_API_KEY,
        "query": q,
        "pageSize": max(1, min(pageSize, 50)),
        "dataType": ["Survey (FNDDS)", "SR Legacy", "Foundation"],
    }
    async with httpx.AsyncClient(timeout=8) as client:
        r = await client.get(f"{FDC_BASE}/foods/search", params=params)
        r.raise_for_status()
        data = r.json()
        items = []
        for f in data.get("foods", []):
            items.append({
                "fdcId": f.get("fdcId"),
                "description": f.get("description"),
                "brandOwner": f.get("brandOwner"),
                "dataType": f.get("dataType"),
                "servingSize": f.get("servingSize"),
                "servingSizeUnit": f.get("servingSizeUnit"),
            })
        return {"total": data.get("totalHits", 0), "items": items}

@router.get("/food/{fdcId}")
async def food_detail(fdcId: int):
    if not FDC_API_KEY:
        raise HTTPException(500, "FDC_API_KEY not configured")

    cached = _cache_get(fdcId)
    if cached:
        return cached

    async with httpx.AsyncClient(timeout=8) as client:
        r = await client.get(f"{FDC_BASE}/food/{fdcId}", params={"api_key": FDC_API_KEY})
        r.raise_for_status()
        food = r.json()
        macros = pick_macros(food)
        grams = food.get("servingSize") or 100
        unit  = food.get("servingSizeUnit") or "g"
        out = {
            "fdcId": food.get("fdcId"),
            "description": food.get("description"),
            "serving": {"amount": grams, "unit": unit},
            "macros_per_serving": macros,
        }
        _cache_put(fdcId, out)
        return out
