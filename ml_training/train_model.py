#!/usr/bin/env python3
"""
Train Student Health Prediction Model
======================================
Downloads the Kaggle competition data, trains an XGBoost classifier,
and exports the model + label encoder as .pkl files for the Node.js backend.

Run from the project root:
    python ml_training/train_model.py
"""

import os
import sys
import zipfile
import glob
import subprocess

print("=" * 60)
print("STUDENT HEALTH PREDICTION - MODEL TRAINING")
print("=" * 60)

# ═══════════════════════════════════════════════════════════════════════════
# Step 1: Kaggle Authentication & Download
# ═══════════════════════════════════════════════════════════════════════════

# Set Kaggle credentials
os.environ['KAGGLE_USERNAME'] = 'naveenekanayake'
os.environ['KAGGLE_KEY'] = 'KGAT_c7d2765bf447aa3d374b92061abc334c'

print("\n[1/5] Installing/updating packages...")
subprocess.run(
    [sys.executable, '-m', 'pip', 'install', '-q', 'pandas', 'scikit-learn', 'xgboost', 'joblib'],
    check=True
)

print("[2/5] Downloading Kaggle competition data...")
result = subprocess.run(
    ['kaggle', 'competitions', 'download', '-c', 'playground-series-s6e7'],
    capture_output=True, text=True
)
if result.returncode != 0:
    print(f"ERROR: Kaggle download failed: {result.stderr}")
    print("\nTrying alternative: downloading from local cache...")
    # Check if zip already exists
    if not os.path.exists('playground-series-s6e7.zip'):
        print("No cached file found. Please download manually from Kaggle.")
        sys.exit(1)
else:
    print(result.stdout)

print("[3/5] Extracting files...")
with zipfile.ZipFile('playground-series-s6e7.zip', 'r') as z:
    z.extractall()

print("Files extracted:")
for f in glob.glob('*.csv'):
    size = os.path.getsize(f)
    print(f"  - {f} ({size:,} bytes)")

# ═══════════════════════════════════════════════════════════════════════════
# Step 2: Train XGBoost Model
# ═══════════════════════════════════════════════════════════════════════════

print("\n[4/5] Training XGBoost model...")
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from xgboost import XGBClassifier

# Load training data
train = pd.read_csv('train.csv')
print(f"Dataset shape: {train.shape}")
print(f"Columns: {list(train.columns)}")
print(f"Target distribution:\n{train['health_condition'].value_counts()}\n")

# Separate features and target
X = train.drop(['id', 'health_condition'], axis=1)
y = train['health_condition']

# Encode categorical features for XGBoost
for col in X.select_dtypes(include=['object']).columns:
    print(f"Encoding categorical column: {col}")
    X[col] = X[col].astype('category')

# Encode target labels
le = LabelEncoder()
y_encoded = le.fit_transform(y)
print(f"Label mapping: {dict(zip(le.classes_, le.transform(le.classes_)))}")

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)
print(f"Training samples: {X_train.shape[0]}, Test samples: {X_test.shape[0]}")

# Train model
model = XGBClassifier(
    enable_categorical=True,
    tree_method='hist',
    random_state=42,
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1
)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"\nTest Accuracy: {accuracy:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=le.classes_))

# ═══════════════════════════════════════════════════════════════════════════
# Step 3: Export Model & Encoder
# ═══════════════════════════════════════════════════════════════════════════

print("[5/5] Exporting model files...")
import joblib

# Export to the backend/ml directory so the Python predict script can find them
output_dir = os.path.join('backend', 'ml')
os.makedirs(output_dir, exist_ok=True)

model_path = os.path.join(output_dir, 'student_health_xgboost.pkl')
encoder_path = os.path.join(output_dir, 'label_encoder.pkl')

joblib.dump(model, model_path)
joblib.dump(le, encoder_path)

print(f"Model saved to:  {model_path}")
print(f"Encoder saved to: {encoder_path}")

# Verify
for f in [model_path, encoder_path]:
    size = os.path.getsize(f)print(f"  - {os.path.basename(f)} ({size:,} bytes)")

# ═══════════════════════════════════════════════════════════════════════════
# Quick Test Prediction
# ═══════════════════════════════════════════════════════════════════════════

print("\n" + "=" * 60)
print("TESTING: Quick prediction on 5 samples...")
print("=" * 60)

sample = X_test[:5]
sample_preds = model.predict(sample)
sample_probs = model.predict_proba(sample)

for i, (pred, probs) in enumerate(zip(sample_preds, sample_probs)):
    predicted_class = le.inverse_transform([pred])[0]
    confidence = max(probs) * 100
    prob_details = {cls: f"{p*100:.1f}%" for cls, p in zip(le.classes_, probs)}
    print(f"  Sample {i+1}: {predicted_class} (conf: {confidence:.1f}%)")

print("\n✅ MODEL TRAINING COMPLETE!")print(f"  - Models exported to: {output_dir}")print("  - Ready for Node.js backend integration!")
