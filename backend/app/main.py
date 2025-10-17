from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .routes_auth import router as auth_router
from .routes_users import router as users_router
from .routes_activity import router as activity_router
from .routes_meals import router as meals_router
from .routes_nutrition import router as nutrition_router
from .routes_coach import router as coach_router
import numpy as np
from .config import DIABETES_API_URL, HEART_API_URL
import httpx

# 1) Create the app first
app = FastAPI(title="PredictMedi Backend")



# 2) Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(activity_router)
app.include_router(meals_router)
app.include_router(nutrition_router)
app.include_router(coach_router)


# 3) (Optional) DB init — keep commented while you’re debugging
# from .db import init_db
# @app.on_event("startup")
# async def startup():
#     try:
#         await init_db()
#         print("[db] init OK")
#     except Exception as e:
#         print("[db] init FAILED:", e)

# --- Demo ML endpoints (fine to keep) ---

class PredictPayload(BaseModel):
    features: dict
    top_k: int | None = None 

def sigmoid(x: float) -> float:
    return 1.0 / (1.0 + np.exp(-x))

@app.get("/health")
def health():
    return {"ok": True}

# --- PROXY to ML service ---
@app.post("/ml/diabetes/screen")
async def diabetes_screen(payload: PredictPayload):
    async with httpx.AsyncClient(timeout=5.0) as client:
        r = await client.post(f"{DIABETES_API_URL}/predict_screen", json=payload.model_dump())
        r.raise_for_status()
        return r.json()

@app.post("/ml/diabetes/labs")
async def diabetes_labs(payload: PredictPayload):
    async with httpx.AsyncClient(timeout=5.0) as client:
        r = await client.post(f"{DIABETES_API_URL}/predict_labs", json=payload.model_dump())
        r.raise_for_status()
        return r.json()


@app.post("/ml/heart/predict")
async def heart_predict(payload: PredictPayload):        # <-- make it async + proxy
    async with httpx.AsyncClient(timeout=5.0) as client:
        r = await client.post(f"{HEART_API_URL}/predict", json=payload.model_dump())
        r.raise_for_status()
        return r.json()





