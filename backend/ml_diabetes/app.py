from fastapi import FastAPI
import joblib, json
from pathlib import Path
import numpy as np

app = FastAPI(title="Diabetes Service (Two-Stage)")

def load_model_dir(dirpath: str):
    p = Path(__file__).parent / dirpath
    model = joblib.load(p / "diabetes_clf.joblib")
    meta  = json.loads((p / "model_meta.json").read_text())
    return model, meta

model_screen, meta_screen = load_model_dir("models_screen")
model_labs,   meta_labs   = load_model_dir("models_labs")

@app.get("/health")
def health():
    return {
        "ok": True,
        "screen_features": meta_screen["features"],
        "labs_features": meta_labs["features"],
    }

@app.post("/predict_screen")
def predict_screen(payload: dict):
    feats = payload.get("features", {})
    order = meta_screen["features"]
    x = np.array([[feats.get(k, None) for k in order]], dtype=float)
    proba = float(model_screen.predict_proba(x)[0, 1])
    thr = meta_screen.get("threshold", 0.5)
    return {"probability": proba, "label": int(proba >= thr), "mode": "screen"}

@app.post("/predict_labs")
def predict_labs(payload: dict):
    feats = payload.get("features", {})
    order = meta_labs["features"]
    x = np.array([[feats.get(k, None) for k in order]], dtype=float)
    proba = float(model_labs.predict_proba(x)[0, 1])
    thr = meta_labs.get("threshold", 0.5)
    return {"probability": proba, "label": int(proba >= thr), "mode": "labs"}
