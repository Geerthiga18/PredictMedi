# backend/app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

from .routes_auth import router as auth_router
from .routes_users import router as users_router
from .routes_activity import router as activity_router
from .routes_meals import router as meals_router
from .routes_nutrition import router as nutrition_router
from .routes_coach import router as coach_router
from .routes_ai import router as ai_router

from .config import DIABETES_API_URL, HEART_API_URL

app = FastAPI(title="PredictMedi Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core app routes
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(activity_router)
app.include_router(meals_router)
app.include_router(nutrition_router)
app.include_router(coach_router)
app.include_router(ai_router)


class ProxyFeatures(BaseModel):
    features: dict
    top_k: int | None = None


@app.get("/health")
async def health():
    return {"ok": True}


# ---------- Diabetes proxies ----------

@app.post("/ml/diabetes/screen")
async def ml_diabetes_screen(payload: ProxyFeatures):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.post(
                f"{DIABETES_API_URL}/predict_screen",
                json={"features": payload.features},
            )
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as e:
        # Pass through model-service error body to help debugging
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"diabetes screen upstream error: {e.response.text}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"diabetes screen model not available on server: {e}",
        )


@app.post("/ml/diabetes/labs")
async def ml_diabetes_labs(payload: ProxyFeatures):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.post(
                f"{DIABETES_API_URL}/predict_labs",
                json={"features": payload.features},
            )
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"diabetes labs upstream error: {e.response.text}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"diabetes labs model not available on server: {e}",
        )


# ---------- Heart proxy ----------

@app.post("/ml/heart/predict")
async def ml_heart_predict(payload: ProxyFeatures):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.post(
                f"{HEART_API_URL}/predict",
                json={"features": payload.features, "top_k": payload.top_k or 5},
            )
        r.raise_for_status()
        return r.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"heart model upstream error: {e.response.text}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"heart model not available on server: {e}",
        )
