#!/usr/bin/env python3
"""
Kaggle Competition Pipeline — Playground Series S6E7
======================================================
Authenticates with Kaggle, downloads competition data,
trains an XGBoost classifier, and generates a submission.csv
file ready for public/private leaderboard upload.

Usage:
    # One-shot execution:
    python kaggle_pipeline.py

    # Or step-by-step in a Python shell / notebook:
    from kaggle_pipeline import download_data, train_model, create_submission
    download_data()
    model, le, feature_cols = train_model()
    create_submission(model, le, feature_cols)

The final submission.csv is saved to the current directory.
Model files (student_health_xgboost.pkl, label_encoder.pkl) are
saved to backend/ml/ for the web application.
"""

import os
import sys
import json
import zipfile
import glob
import subprocess
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

# ── Configuration ────────────────────────────────────────────────────────
COMPETITION = "playground-series-s6e7"
KAGGLE_USERNAME = "naveenekanayake"
# Set your KAGGLE_KEY as environment variable or in kaggle.json
BACKEND_ML_DIR = Path("backend/ml")
BACKEND_ML_DIR.mkdir(parents=True, exist_ok=True)


# ═══════════════════════════════════════════════════════════════════════════
# Step 1 — Authenticate & Download
# ═══════════════════════════════════════════════════════════════════════════
def setup_kaggle_credentials():
    """Ensure Kaggle API credentials are available."""
    # Option A: environment variables
    if not os.environ.get("KAGGLE_USERNAME"):
        os.environ["KAGGLE_USERNAME"] = KAGGLE_USERNAME
    # Option B: kaggle.json
    kaggle_dir = Path.home() / ".kaggle"
    kaggle_json = kaggle_dir / "kaggle.json"
    if not kaggle_json.exists():
        key = os.environ.get("KAGGLE_KEY")
        if not key:
            print(
                "[WARN] No KAGGLE_KEY found. Set it via:\n"
                "  export KAGGLE_KEY='your_key_here'\n"
                "  or place it in ~/.kaggle/kaggle.json"
            )
            return False
        kaggle_dir.mkdir(parents=True, exist_ok=True)
        kaggle_json.write_text(json.dumps({"username": KAGGLE_USERNAME, "key": key}))
        kaggle_json.chmod(0o600)
    return True


def download_data():
    """Download and extract the competition dataset."""
    print("=" * 60)
    print("KAGGLE PIPELINE — Step 1: Download Data")
    print("=" * 60)

    if not setup_kaggle_credentials():
        print("[FAIL] Kaggle credentials not configured.")
        return False

    # Download
    print(f"\nDownloading competition: {COMPETITION}")
    result = subprocess.run(
        ["kaggle", "competitions", "download", "-c", COMPETITION],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"[ERROR] Download failed: {result.stderr.strip()}")
        return False
    print(result.stdout)

    # Extract
    zip_path = f"{COMPETITION}.zip"
    if not os.path.exists(zip_path):
        # Fallback: the download may have used a simpler name
        zip_candidates = glob.glob("*.zip")
        if zip_candidates:
            zip_path = zip_candidates[0]
        else:
            print("[ERROR] No zip file found after download.")
            return False

    print(f"Extracting {zip_path}...")
    with zipfile.ZipFile(zip_path, "r") as z:
        z.extractall()

    print("Files extracted:")
    for f in sorted(glob.glob("*.csv")):
        size = os.path.getsize(f)
        print(f"  {f:30s} {size:>8,} bytes")
    return True


# ═══════════════════════════════════════════════════════════════════════════
# Step 2 — Train Model
# ═══════════════════════════════════════════════════════════════════════════
def train_model(data_path="train.csv"):
    """
    Train an XGBoost classifier on the competition data.

    Returns:
        (model, label_encoder, feature_columns)
    """
    import pandas as pd
    import numpy as np
    from sklearn.preprocessing import LabelEncoder
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report, accuracy_score
    from xgboost import XGBClassifier
    import joblib

    print("\n" + "=" * 60)
    print("KAGGLE PIPELINE — Step 2: Train XGBoost Model")
    print("=" * 60)

    # Load data
    train = pd.read_csv(data_path)
    print(f"\nDataset shape: {train.shape}")
    print(f"Columns: {list(train.columns)}")
    print(f"Target distribution:\n{train['health_condition'].value_counts()}\n")

    # Separate features / target
    X = train.drop(["id", "health_condition"], axis=1)
    y = train["health_condition"]
    feature_cols = list(X.columns)

    # Encode categoricals for XGBoost
    for col in X.select_dtypes(include=["object"]).columns:
        print(f"Encoding categorical: {col}")
        X[col] = X[col].astype("category")

    # Encode target
    le = LabelEncoder()
    y_enc = le.fit_transform(y)
    print(f"Label mapping: {dict(zip(le.classes_, le.transform(le.classes_)))}\n")

    # Split for validation
    X_train, X_val, y_train, y_val = train_test_split(
        X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
    )

    # Train
    model = XGBClassifier(
        enable_categorical=True,
        tree_method="hist",
        random_state=42,
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
    )
    model.fit(X_train, y_train)

    # Validate
    y_pred = model.predict(X_val)
    acc = accuracy_score(y_val, y_pred)
    print(f"Validation Accuracy: {acc:.4f}\n")
    print(classification_report(y_val, y_pred, target_names=le.classes_))

    # Save to backend/ml/
    model_path = BACKEND_ML_DIR / "student_health_xgboost.pkl"
    encoder_path = BACKEND_ML_DIR / "label_encoder.pkl"
    joblib.dump(model, model_path)
    joblib.dump(le, encoder_path)
    print(f"\n[OK] Model saved:  {model_path}  ({model_path.stat().st_size:,} bytes)")
    print(f"[OK] Encoder saved: {encoder_path}  ({encoder_path.stat().st_size:,} bytes)")

    return model, le, feature_cols


# ═══════════════════════════════════════════════════════════════════════════
# Step 3 — Generate Submission
# ═══════════════════════════════════════════════════════════════════════════
def create_submission(model, le, feature_cols, test_path="test.csv",
                       sample_sub_path="sample_submission.csv",
                       output_path="submission.csv"):
    """
    Generate a competition-ready submission.csv file.

    - Loads test.csv
    - Runs the trained model to predict health_condition
    - Writes output in the exact format expected by Kaggle
    """
    import pandas as pd
    import numpy as np

    print("\n" + "=" * 60)
    print("KAGGLE PIPELINE — Step 3: Generate Submission")
    print("=" * 60)

    # Load test data
    test = pd.read_csv(test_path)
    print(f"Test samples: {test.shape[0]}")
    test_ids = test["id"]

    # Prepare features (same preprocessing as training)
    X_test = test[feature_cols]
    for col in X_test.select_dtypes(include=["object"]).columns:
        X_test[col] = X_test[col].astype("category")

    # Predict
    preds_encoded = model.predict(X_test)
    preds = le.inverse_transform(preds_encoded)

    # Build submission dataframe
    submission = pd.DataFrame({"id": test_ids, "health_condition": preds})

    # Save
    submission.to_csv(output_path, index=False)
    print(f"\n[OK] Submission saved: {output_path}")
    print(f"     Rows: {len(submission)}")
    print(f"     Columns: {list(submission.columns)}")
    print(f"\n     Prediction distribution:")
    print(f"     {submission['health_condition'].value_counts().to_string()}")

    # Verify against sample submission format if available
    if os.path.exists(sample_sub_path):
        sample = pd.read_csv(sample_sub_path)
        assert list(sample.columns) == list(submission.columns), \
            f"Column mismatch! Expected {list(sample.columns)}, got {list(submission.columns)}"
        assert len(sample) == len(submission), \
            f"Row count mismatch! Expected {len(sample)}, got {len(submission)}"
        print(f"\n[OK] Submission format verified against {sample_sub_path}")

    return submission


# ═══════════════════════════════════════════════════════════════════════════
# Main Entry Point
# ═══════════════════════════════════════════════════════════════════════════
def run_pipeline():
    """Run the complete Kaggle pipeline end-to-end."""
    success = download_data()
    if not success:
        # If download fails (e.g., API auth), fall back to synthetic data
        print("\n[INFO] Download failed. Generating synthetic data for testing...")
        subprocess.run([sys.executable, "ml_training/generate_synthetic_data.py"], check=True)

    model, le, feature_cols = train_model()
    create_submission(model, le, feature_cols)

    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE!")
    print("=" * 60)
    print("\nFiles produced:")
    for f in ["student_health_xgboost.pkl", "label_encoder.pkl", "submission.csv"]:
        p = BACKEND_ML_DIR / f if f.endswith(".pkl") else Path(f)
        if p.exists():
            print(f"  {p}  ({p.stat().st_size:,} bytes)")
    print("\nUpload submission.csv to the Kaggle competition leaderboard!")


if __name__ == "__main__":
    run_pipeline()
