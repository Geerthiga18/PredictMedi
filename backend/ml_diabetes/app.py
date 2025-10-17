from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import joblib, json
from pathlib import Path
import numpy as np
import pandas as pd   # <-- add this

app = FastAPI(title="Diabetes Service (Two-Stage)")

def load_model_dir(dirpath: str):
    p = Path(__file__).parent / dirpath
    model = joblib.load(p / "diabetes_clf.joblib")
    meta  = json.loads((p / "model_meta.json").read_text())
    return model, meta

model_screen, meta_screen = load_model_dir("models_screen")
model_labs,   meta_labs   = load_model_dir("models_labs")

class FeaturesIn(BaseModel):
    features: Dict[str, Any]

@app.get("/health")
def health():
    return {
        "ok": True,
        "screen_features": meta_screen["features"],
        "labs_features": meta_labs["features"],
    }

def _coerce_float(v: Any, key: str) -> float:
    if v is None or v == "":
        raise HTTPException(400, detail=f"Missing value for '{key}'")
    try:
        return float(v)
    except (TypeError, ValueError):
        raise HTTPException(400, detail=f"Non-numeric value for '{key}': {v!r}")

def _vectorize_df(feats: Dict[str, Any], order: List[str]) -> "pd.DataFrame":
    missing = [k for k in order if k not in feats]
    if missing:
        raise HTTPException(400, detail={"missing_features": missing, "required_order": order})
    vals = [_coerce_float(feats[k], k) for k in order]
    return pd.DataFrame([vals], columns=order)

@app.post("/predict_screen")
def predict_screen(payload: FeaturesIn):
    X = _vectorize_df(payload.features, meta_screen["features"])  # <-- DataFrame
    proba = float(model_screen.predict_proba(X)[0, 1])
    thr = meta_screen.get("threshold", 0.5)
    return {"probability": proba, "label": int(proba >= thr), "mode": "screen"}

@app.post("/predict_labs")
def predict_labs(payload: FeaturesIn):
    X = _vectorize_df(payload.features, meta_labs["features"])    # <-- DataFrame
    proba = float(model_labs.predict_proba(X)[0, 1])
    thr = meta_labs.get("threshold", 0.5)
    return {"probability": proba, "label": int(proba >= thr), "mode": "labs"}
