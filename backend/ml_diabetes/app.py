from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import joblib, json
from pathlib import Path
import numpy as np
import pandas as pd   

app = FastAPI(title="Diabetes Service (Two-Stage)")

from typing import Tuple, Dict

def risk_bucket(p: float, context: str) -> Dict[str, object]:
    """
    Map probability -> user-facing label + gentle guidance.
    context: "screen" or "labs" (lets us tailor the advice)
    """
    # You can tune these thresholds later
    bands = [
        (0.10, "Very low chance"),
        (0.25, "Low chance"),
        (0.50, "Moderate chance"),
        (0.75, "High chance"),
        (1.01, "Very high chance"),
    ]
    lower = 0.0
    for upper, label in bands:
        if p < upper:
            # lightweight, non-diagnostic coaching
            if context == "screen":
                tip = (
                    "This quick screen is not a diagnosis. "
                    "If you have concerns, consider lab testing. "
                    "Healthy habits (regular activity, balanced diet, enough sleep) help reduce risk."
                )
            else:  # labs
                tip = (
                    "Lab-based estimate only. Talk with a clinician if you’re worried. "
                    "They may confirm with additional tests and review your history."
                )
            return {
                "label": label,
                "range": [round(lower, 2), round(min(upper, 1.0), 2)],
                "advice": tip,
            }
        lower = upper
    # Fallback (shouldn’t hit)
    return {"label": "Unknown", "range": [0, 1], "advice": ""}

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
    X = _vectorize_df(payload.features, meta_screen["features"])
    proba = float(model_screen.predict_proba(X)[0, 1])
    thr = meta_screen.get("threshold", 0.5)
    return {
        "probability": proba,
        "label": int(proba >= thr),
        "mode": "screen",
        "risk": risk_bucket(proba, "screen"),
    }

@app.post("/predict_labs")
def predict_labs(payload: FeaturesIn):
    X = _vectorize_df(payload.features, meta_labs["features"])
    proba = float(model_labs.predict_proba(X)[0, 1])
    thr = meta_labs.get("threshold", 0.5)
    return {
        "probability": proba,
        "label": int(proba >= thr),
        "mode": "labs",
        "risk": risk_bucket(proba, "labs"),
    }
