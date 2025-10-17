import argparse, json
from pathlib import Path
import numpy as np, pandas as pd, joblib
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

SEED = 42
FEATURES = [
    "Pregnancies","Glucose","BloodPressure","SkinThickness","Insulin",
    "BMI","DiabetesPedigreeFunction","Age"
]
TARGET = "Outcome"
ZERO_AS_MISSING = ["Glucose","BloodPressure","SkinThickness","Insulin","BMI"]

def load_pima(p):
    df = pd.read_csv(p)
    for c in FEATURES+[TARGET]:
        if c not in df.columns: raise ValueError(f"Missing column: {c}")
    df[ZERO_AS_MISSING] = df[ZERO_AS_MISSING].replace(0, np.nan)
    for c in FEATURES+[TARGET]:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    return df.dropna(subset=[TARGET])

def block(y_true, proba, thr=0.5, split="val"):
    y_pred = (proba >= thr).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0,1]).ravel()
    return dict(split=split,
                accuracy=float(accuracy_score(y_true, y_pred)),
                precision=float(precision_score(y_true, y_pred, zero_division=0)),
                recall=float(recall_score(y_true, y_pred, zero_division=0)),
                f1=float(f1_score(y_true, y_pred)),
                roc_auc=float(roc_auc_score(y_true, proba)),
                tn=int(tn), fp=int(fp), fn=int(fn), tp=int(tp))

def main(csv, out_dir):
    out = Path(out_dir); out.mkdir(parents=True, exist_ok=True)
    df = load_pima(Path(csv))
    X, y = df[FEATURES].copy(), df[TARGET].astype(int).values

    X_tr, X_tmp, y_tr, y_tmp = train_test_split(X, y, test_size=0.30, stratify=y, random_state=SEED)
    X_va, X_te, y_va, y_te = train_test_split(X_tmp, y_tmp, test_size=0.50, stratify=y_tmp, random_state=SEED)

    pre = ColumnTransformer([
        ("num", Pipeline([("imp", SimpleImputer(strategy="median")),
                          ("sc", StandardScaler())]), FEATURES)
    ], remainder="drop", verbose_feature_names_out=False)

    base = Pipeline([
        ("pre", pre),
        ("clf", LogisticRegression(solver="liblinear",
                                   class_weight="balanced",
                                   max_iter=500,
                                   random_state=SEED))
    ])

    model = CalibratedClassifierCV(base, method="isotonic", cv=5)
    model.fit(X_tr, y_tr)

    val_proba  = model.predict_proba(X_va)[:,1]
    test_proba = model.predict_proba(X_te)[:,1]
    metrics = {"val": block(y_va, val_proba, split="val"),
               "test": block(y_te, test_proba, split="test")}
    print(json.dumps(metrics, indent=2))

    joblib.dump(model, out / "diabetes_clf.joblib")
    meta = {
        "features": FEATURES,
        "target": TARGET,
        "zero_as_missing": ZERO_AS_MISSING,
        "threshold": 0.5,
        "seed": SEED,
        "dataset": "Pima Indians (UCI/Kaggle)",
        "metrics": metrics,
        "mode": "labs"
    }
    (out / "model_meta.json").write_text(json.dumps(meta, indent=2))
    print(f"[save] {out/'diabetes_clf.joblib'}\n[save] {out/'model_meta.json'}")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default="data/pima_diabetes.csv")
    ap.add_argument("--out_dir", default="models_labs")
    args = ap.parse_args()
    main(args.csv, args.out_dir)
