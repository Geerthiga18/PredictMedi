import argparse, json
from pathlib import Path
import pandas as pd, numpy as np, joblib
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

SEED = 42
FEATURES = [
    "HighBP","HighChol","CholCheck","BMI","Smoker","Stroke",
    "HeartDiseaseorAttack","PhysActivity","Fruits","Veggies",
    "HvyAlcoholConsump","AnyHealthcare","NoDocbcCost","GenHlth",
    "MentHlth","PhysHlth","DiffWalk","Sex","Age","Education","Income"
]
TARGET = "Diabetes_binary"

def main(csv, out_dir):
    df = pd.read_csv(csv)
    missing = set(FEATURES+[TARGET]) - set(df.columns)
    if missing:
        raise ValueError(f"CSV missing columns: {missing}")

    X = df[FEATURES].copy()
    y = df[TARGET].astype(int).values

    num_cols = ["BMI","MentHlth","PhysHlth"]
    cat_cols = [c for c in FEATURES if c not in num_cols]

    pre = ColumnTransformer([
        ("num", Pipeline([("imp", SimpleImputer(strategy="median")),
                          ("sc", StandardScaler())]), num_cols),
        ("cat", SimpleImputer(strategy="most_frequent"), cat_cols),
    ], verbose_feature_names_out=False)

    base = Pipeline([
        ("pre", pre),
        ("clf", LogisticRegression(solver="liblinear",
                                   class_weight="balanced",
                                   max_iter=1000,
                                   random_state=SEED))
    ])

    X_tr, X_tmp, y_tr, y_tmp = train_test_split(X, y, test_size=0.30, stratify=y, random_state=SEED)
    X_va, X_te, y_va, y_te = train_test_split(X_tmp, y_tmp, test_size=0.50, stratify=y_tmp, random_state=SEED)

    model = CalibratedClassifierCV(base, method="isotonic", cv=5)
    model.fit(X_tr, y_tr)

    def block(X, y, split):
        proba = model.predict_proba(X)[:,1]
        pred  = (proba >= 0.5).astype(int)
        return dict(
            split=split,
            accuracy=float(accuracy_score(y, pred)),
            precision=float(precision_score(y, pred, zero_division=0)),
            recall=float(recall_score(y, pred, zero_division=0)),
            f1=float(f1_score(y, pred)),
            roc_auc=float(roc_auc_score(y, proba)),
        )

    metrics = {"val": block(X_va, y_va, "val"), "test": block(X_te, y_te, "test")}
    print(json.dumps(metrics, indent=2))

    out = Path(out_dir); out.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, out / "diabetes_clf.joblib")
    meta = {
        "features": FEATURES,
        "target": TARGET,
        "threshold": 0.5,
        "seed": SEED,
        "dataset": "BRFSS2015 binary (Kaggle)",
        "metrics": metrics,
        "mode": "screen"
    }
    (out / "model_meta.json").write_text(json.dumps(meta, indent=2))
    print(f"[save] {out/'diabetes_clf.joblib'}\n[save] {out/'model_meta.json'}")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True)
    ap.add_argument("--out_dir", default="models_screen")
    args = ap.parse_args()
    main(args.csv, args.out_dir)
