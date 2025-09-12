from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pathlib import Path
import json
import numpy as np
import pandas as pd
import joblib
import shap

BASE = Path(__file__).parent
MOD  = BASE / "models"
PREPROC_PATH = MOD / "heart_preproc.joblib"
BASE_LR_PATH = MOD / "heart_base_lr.joblib"
CALIB_PATH   = MOD / "heart_calibrated.joblib"
BG_PATH      = MOD / "background.npy"
META_PATH    = MOD / "heart_meta.json"

app = FastAPI(title="Heart Disease ML Service", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://127.0.0.1:5173","*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictIn(BaseModel):
    features: dict = Field(default_factory=dict)
    top_k: int = 5

def _load_artifacts():
    if not (PREPROC_PATH.exists() and BASE_LR_PATH.exists() and CALIB_PATH.exists() and BG_PATH.exists() and META_PATH.exists()):
        raise RuntimeError("Heart model artifacts missing. Train first: python ml_heart/train_heart.py")
    preproc = joblib.load(PREPROC_PATH)
    base_lr = joblib.load(BASE_LR_PATH)
    calib   = joblib.load(CALIB_PATH)
    bg      = np.load(BG_PATH)
    meta    = json.loads(META_PATH.read_text())
    # SHAP explainer for the linear base model in transformed space
    explainer = shap.LinearExplainer(base_lr, bg, feature_perturbation="interventional")
    return preproc, base_lr, calib, explainer, meta

@app.on_event("startup")
def _startup():
    preproc, base_lr, calib, explainer, meta = _load_artifacts()
    app.state.preproc = preproc
    app.state.base_lr = base_lr
    app.state.calib = calib
    app.state.explainer = explainer
    app.state.meta = meta
    print("[heart-ml] loaded. features:", meta["features"])

@app.get("/health")
def health():
    return {"ok": True, "modelLoaded": app.state is not None}

@app.post("/predict")
def predict(payload: PredictIn):
    feats = app.state.meta["features"]
    row = {k: payload.features.get(k, None) for k in feats}
    X = pd.DataFrame([row], columns=feats)

    # transform -> predict (calibrated probability)
    Xt = app.state.preproc.transform(X)
    prob = float(app.state.calib.predict_proba(Xt)[0, 1])
    label = int(prob >= 0.5)

    # SHAP on linear base model in transformed space
    shap_vals = app.state.explainer.shap_values(Xt)  # shape: (1, n_features)
    shap_vals = shap_vals[0].tolist()
    # expected_value is in log-odds for LinearExplainer
    base = float(app.state.explainer.expected_value)

    # Top-k factors by absolute contribution
    pairs = list(zip(feats, shap_vals, Xt[0].tolist()))
    pairs.sort(key=lambda t: abs(t[1]), reverse=True)
    topk = [
        {"feature": f, "contribution": float(c), "zvalue": float(z)}
        for f, c, z in pairs[: max(1, payload.top_k)]
    ]

    return {
        "probability": prob,
        "label": label,
        "top_factors": topk,
        "expected_log_odds": base,
        "used_features": row
    }
