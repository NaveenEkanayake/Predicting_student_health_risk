#!/usr/bin/env python3
"""
ML Prediction Script — Student Health Dashboard
================================================
Reads JSON from stdin with 3 fields:
    { "sleep_duration": 8, "daily_steps": 8000, "diet_quality": "Good" }
Returns JSON prediction to stdout.

Model files expected alongside this script:
    - student_health_xgboost.pkl
    - label_encoder.pkl
"""

import sys, json, os, warnings, traceback
warnings.filterwarnings("ignore")

MODEL_DIR = os.environ.get("MODEL_DIR", os.path.dirname(os.path.abspath(__file__)))


def load_resources():
    import joblib
    model_path = os.path.join(MODEL_DIR, "student_health_xgboost.pkl")
    encoder_path = os.path.join(MODEL_DIR, "label_encoder.pkl")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found: {model_path}")
    if not os.path.exists(encoder_path):
        raise FileNotFoundError(f"Encoder not found: {encoder_path}")

    return joblib.load(model_path), joblib.load(encoder_path)


def predict_one(raw: dict) -> dict:
    """
    Convert raw dict → DataFrame row → prediction.
    """
    import pandas as pd

    row = {
        "sleep_duration": float(raw.get("sleep_duration", 7)),
        "daily_steps": float(raw.get("daily_steps", 6000)),
        "diet_quality": str(raw.get("diet_quality", "Average")),
    }

    df = pd.DataFrame([row])
    df["diet_quality"] = df["diet_quality"].astype("category")

    model, le = load_resources()

    encoded = model.predict(df)[0]
    probs = model.predict_proba(df)[0]

    predicted_class = le.inverse_transform([encoded])[0]
    confidence = float(max(probs) * 100)

    prob_dict = {}
    for i, cls in enumerate(le.classes_):
        prob_dict[cls] = round(float(probs[i] * 100), 2)

    return {
        "predicted_class": predicted_class,
        "confidence": round(confidence, 2),
        "probabilities": prob_dict,
    }


def main():
    try:
        raw = sys.stdin.read()
        if not raw:
            print(json.dumps({"error": "No input received"}), file=sys.stderr)
            sys.exit(1)

        data = json.loads(raw)
        result = predict_one(data)
        print(json.dumps(result))

    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON: {e}"}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e), "traceback": traceback.format_exc()}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
