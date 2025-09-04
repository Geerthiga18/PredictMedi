from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .routes_activity import router as activity_router
from .routes_meals import router as meals_router
import numpy as np


from .config import DIABETES_API_URL
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

app.include_router(activity_router)
app.include_router(meals_router)

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

def sigmoid(x: float) -> float:
    return 1.0 / (1.0 + np.exp(-x))

@app.get("/health")
def health():
    return {"ok": True}

# --- PROXY to ML service ---
@app.post("/ml/diabetes/predict")
async def diabetes_predict(payload: PredictPayload):
    async with httpx.AsyncClient(timeout=5.0) as client:
        r = await client.post(f"{DIABETES_API_URL}/predict", json=payload.dict())
        r.raise_for_status()
        return r.json()

@app.post("/ml/heart/predict")
def heart_predict(payload: PredictPayload):
    f = payload.features
    z = 0.0
    z += (f.get("age",50) - 45) / 10 * 0.8
    z += (f.get("trestbps",130) - 120) / 20 * 0.5
    prob = float(sigmoid(z))
    return {"probability": prob, "label": int(prob >= 0.5), "note": "DEMO – replace with trained model"}

# 4) Import routers AFTER app is defined, then include them
from .routes_auth import router as auth_router
from .routes_users import router as users_router
app.include_router(auth_router)
app.include_router(users_router)
