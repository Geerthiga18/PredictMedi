import json, os, time
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score, classification_report
import joblib

SEED = 42
DATA_PATH = Path(__file__).parent / "data" / "pima_diabetes.csv"
MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

FEATURES = [
    "Pregnancies","Glucose","BloodPressure","SkinThickness","Insulin",
    "BMI","DiabetesPedigreeFunction","Age"
]
TARGET = "Outcome"

def load_data(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    # Make sure expected columns exist
    missing = set([*FEATURES, TARGET]) - set(df.columns)
    if missing:
        raise ValueError(f"CSV missing columns: {missing}")

    # In Pima, zeros mean missing for these cols; convert to NaN so we can impute
    zero_is_missing = ["Glucose","BloodPressure","SkinThickness","Insulin","BMI"]
    for c in zero_is_missing:
        df.loc[df[c] == 0, c] = np.nan
    return df

def main():
    df = load_data(DATA_PATH)

    X = df[FEATURES].copy()
    y = df[TARGET].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=SEED, stratify=y
    )

    # Simple baseline: impute → scale → logistic regression (balanced classes)
    pipe = Pipeline([
        ("impute", SimpleImputer(strategy="median")),
        ("scale", StandardScaler()),
        ("clf", LogisticRegression(class_weight="balanced", max_iter=1000, solver="liblinear")),
    ])

    pipe.fit(X_train, y_train)

    # Eval
    proba = pipe.predict_proba(X_test)[:, 1]
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

    # Save model + metadata
    model_path = MODELS_DIR / "diabetes_clf.joblib"
    joblib.dump(pipe, model_path)

    meta = {
        "features": FEATURES,
        "target": TARGET,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "model_path": str(model_path.name),
        "seed": SEED,
        "metrics": {k: metrics[k] for k in ("accuracy","roc_auc","f1")}
    }
    (MODELS_DIR / "model_meta.json").write_text(json.dumps(meta, indent=2))
    print(f"Saved model → {model_path}")

if __name__ == "__main__":
    main()
