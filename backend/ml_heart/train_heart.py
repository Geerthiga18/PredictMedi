# ml_heart/train_heart.py
import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import OneHotEncoder, StandardScaler



BASE = Path(__file__).parent
MODELS = BASE / "models"
MODELS.mkdir(exist_ok=True)

PREPROC_PATH = MODELS / "heart_preproc.joblib"
BASE_LR_PATH = MODELS / "heart_base_lr.joblib"
CALIB_PATH   = MODELS / "heart_calibrated.joblib"
BG_PATH      = MODELS / "background.npy"
META_PATH    = MODELS / "heart_meta.json"

# Final, standardized columns we will train on (UCI-style)
FINAL_COLS = [
    "age","sex","cp","trestbps","chol","fbs","restecg","thalach",
    "exang","oldpeak","slope","ca","thal","target"
]

# Which of those are treated numeric vs categorical in our pipeline
CAT_COLS = ["sex","cp","fbs","restecg","exang","slope","thal","ca"]
NUM_COLS = ["age","trestbps","chol","thalach","oldpeak"]


def load_csv(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df = df.replace("?", np.nan)

    # Normalize column names from your Kaggle-style file
    # thalach misspelled as 'thalch'
    if "thalch" in df.columns and "thalach" not in df.columns:
        df = df.rename(columns={"thalch": "thalach"})
    # target column named 'num'
    if "num" in df.columns and "target" not in df.columns:
        df = df.rename(columns={"num": "target"})
    # drop columns we don't model
    for c in ["id", "dataset"]:
        if c in df.columns:
            df = df.drop(columns=[c])

    # Ensure required columns are present
    EXPECTED_COLS = [
        "age","sex","cp","trestbps","chol","fbs","restecg","thalach",
        "exang","oldpeak","slope","ca","thal","target"
    ]
    missing = [c for c in EXPECTED_COLS if c not in df.columns]
    if missing:
        raise ValueError(f"CSV missing columns: {missing}")

    # Cast numerics (leave categoricals as-is; OHE will handle strings/bools)
    NUM_COLS = ["age","trestbps","chol","thalach","oldpeak","ca"]
    for c in NUM_COLS:
        df[c] = pd.to_numeric(df[c], errors="coerce")

    # Convert booleans like TRUE/FALSE to string labels for OHE (optional)
    for c in ["fbs", "exang"]:
        if c in df.columns:
            df[c] = df[c].map(
                lambda x: str(x).strip().lower() if pd.notna(x) else x
            )

    # Make target binary: >0 => 1 (has disease), 0 => 0 (no disease)
    df["target"] = (pd.to_numeric(df["target"], errors="coerce") > 0).astype(int)

    return df

def build_preprocessor():
    num_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    # Handle scikit-learn versions:
    try:
        # sklearn >= 1.2
        ohe = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    except TypeError:
        # sklearn < 1.2
        ohe = OneHotEncoder(handle_unknown="ignore", sparse=False)

    cat_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("ohe", ohe),
    ])

    preproc = ColumnTransformer(
        transformers=[
            ("num", num_pipe, NUM_COLS),
            ("cat", cat_pipe, CAT_COLS),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )
    return preproc

    

def main(csv_path: str, test_size: float, random_state: int):
    csv_path = Path(csv_path)
    df = load_csv(csv_path)

    X = df.drop(columns=["target"])
    y = df["target"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )

    preproc = build_preprocessor()
    Xt_train = preproc.fit_transform(X_train)
    Xt_test  = preproc.transform(X_test)

    base_lr = LogisticRegression(
        max_iter=1000,
        class_weight="balanced",
        solver="lbfgs",
    )
    base_lr.fit(Xt_train, y_train)

      # Calibrated model (version-proof: estimator vs base_estimator)
    try:
        # sklearn >= 1.4-ish
        calib = CalibratedClassifierCV(
            estimator=base_lr,  # new name
            method="sigmoid",
            cv=5,
        )
    except TypeError:
        # sklearn <= 1.3
        calib = CalibratedClassifierCV(
           estimator=base_lr,   
            method="sigmoid",
            cv=5,
        )
    calib.fit(Xt_train, y_train)

    p_test = calib.predict_proba(Xt_test)[:, 1]
    auc = roc_auc_score(y_test, p_test)
    print(f"[heart-train] ROC AUC (test): {auc:.3f} | n_train={len(X_train)} n_test={len(X_test)}")

    n_bg = min(200, Xt_train.shape[0])
    bg_idx = np.random.RandomState(random_state).choice(Xt_train.shape[0], n_bg, replace=False)
    bg = Xt_train[bg_idx]
    np.save(BG_PATH, bg)

    joblib.dump(preproc, PREPROC_PATH)
    joblib.dump(base_lr, BASE_LR_PATH)
    joblib.dump(calib, CALIB_PATH)

    meta = {
        "features": list(X.columns),
        "numeric_features": NUM_COLS,
        "categorical_features": CAT_COLS,
        "target": "target",
        "notes": "Cleveland-style features with string→numeric mapping; LogisticRegression + Platt calibration",
        "auc_test": float(auc),
        "threshold": 0.5
    }
    META_PATH.write_text(json.dumps(meta, indent=2))
    print(f"[heart-train] saved artifacts to {MODELS.resolve()}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True, help="Path to your Cleveland-style CSV.")
    parser.add_argument("--test_size", type=float, default=0.2)
    parser.add_argument("--random_state", type=int, default=42)
    args = parser.parse_args()
    main(args.csv, args.test_size, args.random_state)
