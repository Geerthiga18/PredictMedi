from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import json

BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "diabetes_clf.joblib"
META_PATH  = MODELS_DIR / "model_meta.json"

app = FastAPI(title="Diabetes ML Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://127.0.0.1:5173","*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictIn(BaseModel):
    # Keep compatibility with your frontend/back: it posts {"features": {...}}
    features: dict = Field(default_factory=dict)

@app.on_event("startup")
def _load():
    if not MODEL_PATH.exists():
        raise RuntimeError("Model file not found. Train it first (train_diabetes.py).")
    app.state.model = joblib.load(MODEL_PATH)
    app.state.meta = json.loads(META_PATH.read_text())
    print("[ml] model loaded with features:", app.state.meta["features"])

@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_PATH.name}

@app.post("/predict")
def predict(payload: PredictIn):
    features_order = app.state.meta["features"]
    f = payload.features or {}
    # Build a single-row dataframe in the exact feature order
    row = {k: f.get(k, None) for k in features_order}
    X = pd.DataFrame([row], columns=features_order)

    try:
        proba = float(app.state.model.predict_proba(X)[0, 1])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Inference error: {e}")

    return {
        "probability": proba,
        "label": int(proba >= 0.5),
        "used_features": row
    }
