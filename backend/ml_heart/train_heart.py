import json, os, time
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.calibration import CalibratedClassifierCV
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score, classification_report
import joblib

SEED = 42
DATA_PATH = Path(__file__).parent / "data" / "heart.csv"
MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

FEATURES = [
    "age","sex","cp","trestbps","chol","fbs","restecg","thalach",
    "exang","oldpeak","slope","ca","thal"
]
TARGET = "target"

# Optional public mirror; ok to remove if you prefer manual placement
DATA_URLS = [
    "https://raw.githubusercontent.com/plotly/datasets/master/heart.csv",
]

def ensure_data(path: Path) -> pd.DataFrame:
    if path.exists():
        return pd.read_csv(path)
    for url in DATA_URLS:
        try:
            print(f"[train] {path} not found, trying download: {url}")
            df = pd.read_csv(url)
            df.to_csv(path, index=False)
            return df
        except Exception as e:
            print("[train] download failed:", e)
    raise FileNotFoundError(f"Place a heart.csv with columns {FEATURES+[TARGET]} at {path}")

def main():
    df = ensure_data(DATA_PATH)

    missing = set([*FEATURES, TARGET]) - set(df.columns)
    if missing:
        raise ValueError(f"CSV missing columns: {missing}")

    X = df[FEATURES].copy()
    y = df[TARGET].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=SEED, stratify=y
    )

    # Preprocess numeric-coded features
    preproc = Pipeline([
        ("impute", SimpleImputer(strategy="median")),
        ("scale", StandardScaler()),
    ])

    Xtr = preproc.fit_transform(X_train)
    Xte = preproc.transform(X_test)

    # Base linear model (balanced) for explanations
    base_lr = LogisticRegression(class_weight="balanced", max_iter=2000, solver="liblinear")
    base_lr.fit(Xtr, y_train)

    # Calibrated probabilities (isotonic)
    # We calibrate a fresh clone on the preprocessed features
    calib = CalibratedClassifierCV(
        estimator=LogisticRegression(class_weight="balanced", max_iter=2000, solver="liblinear"),
    method="isotonic",
    cv=5,
    )
    calib.fit(Xtr, y_train)

    # Evaluate calibrated model
    proba = calib.predict_proba(Xte)[:, 1]
    pred  = (proba >= 0.5).astype(int)
    metrics = {
        "accuracy": float(accuracy_score(y_test, pred)),
        "roc_auc": float(roc_auc_score(y_test, proba)),
        "f1": float(f1_score(y_test, pred)),
        "report": classification_report(y_test, pred, output_dict=True),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
    }
    print(json.dumps(metrics, indent=2))

    # Save artifacts
    joblib.dump(preproc, MODELS_DIR / "heart_preproc.joblib")
    joblib.dump(base_lr, MODELS_DIR / "heart_base_lr.joblib")
    joblib.dump(calib,   MODELS_DIR / "heart_calibrated.joblib")

    # Keep a tiny background sample for SHAP (100 rows of transformed X)
    bg = Xtr[:100].astype(np.float32)
    np.save(MODELS_DIR / "background.npy", bg)

    meta = {
        "features": FEATURES,
        "target": TARGET,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "seed": SEED,
        "calibration": "isotonic",
        "artifacts": {
            "preproc": "heart_preproc.joblib",
            "base_lr": "heart_base_lr.joblib",
            "calibrated": "heart_calibrated.joblib",
            "background": "background.npy"
        },
        "metrics": {k: metrics[k] for k in ("accuracy","roc_auc","f1")}
    }
    (MODELS_DIR / "heart_meta.json").write_text(json.dumps(meta, indent=2))
    print(f"Saved artifacts in {MODELS_DIR}")

if __name__ == "__main__":
    main()
