#!/usr/bin/env python3
"""
Generate Synthetic Student Health Data
=======================================
Creates a train.csv file that matches the Kaggle Playground S6E7 schema
so we can train a working model. Replace with real Kaggle data when available.

Run:
    python ml_training/generate_synthetic_data.py
"""

import pandas as pd
import numpy as np
import os

np.random.seed(42)

NUM_SAMPLES = 5000

# Generate realistic synthetic data
data = {
    'id': range(NUM_SAMPLES),
    'age': np.random.randint(10, 22, NUM_SAMPLES),
    'sleep_hours': np.clip(np.random.normal(7.5, 1.5, NUM_SAMPLES), 3, 12).round(1),
    'study_hours': np.clip(np.random.normal(5, 2.5, NUM_SAMPLES), 0, 16).round(1),
    'extracurricular_hours': np.clip(np.random.normal(3, 1.5, NUM_SAMPLES), 0, 10).round(1),
    'screen_time_hours': np.clip(np.random.normal(4, 2, NUM_SAMPLES), 0, 14).round(1),
    'physical_activity_hours': np.clip(np.random.normal(1.5, 1, NUM_SAMPLES), 0, 6).round(1),
    'social_hours': np.clip(np.random.normal(3, 1.5, NUM_SAMPLES), 0, 10).round(1),
    'stress_level': np.clip(np.random.normal(5, 2, NUM_SAMPLES), 1, 10).round(0).astype(int),
    'diet_quality': np.random.choice(['Poor', 'Average', 'Good', 'Excellent'], NUM_SAMPLES, p=[0.15, 0.35, 0.35, 0.15]),
    'hydration_level': np.random.choice(['Low', 'Average', 'High'], NUM_SAMPLES, p=[0.2, 0.5, 0.3]),
    'sleep_quality': np.random.choice(['Poor', 'Average', 'Good'], NUM_SAMPLES, p=[0.2, 0.5, 0.3]),
    'substance_use': np.clip(np.random.normal(2, 1.5, NUM_SAMPLES), 1, 10).round(0).astype(int),
    'exercise_frequency': np.random.choice(['Never', 'Rarely', 'Weekly', 'Daily'], NUM_SAMPLES, p=[0.15, 0.25, 0.35, 0.25]),
    'social_support': np.random.choice(['Low', 'Moderate', 'High'], NUM_SAMPLES, p=[0.15, 0.5, 0.35]),
}

df = pd.DataFrame(data)

# Generate health_condition based on realistic rules
conditions = []
for i in range(NUM_SAMPLES):
    score = 0
    
    # Sleep: optimal 7-9 hours
    if 7 <= df.loc[i, 'sleep_hours'] <= 9:
        score += 2
    elif df.loc[i, 'sleep_hours'] < 5 or df.loc[i, 'sleep_hours'] > 11:
        score -= 2
    
    # Physical activity: more is better
    if df.loc[i, 'physical_activity_hours'] >= 2:
        score += 2
    elif df.loc[i, 'physical_activity_hours'] < 0.5:
        score -= 1
    
    # Screen time: less is better
    if df.loc[i, 'screen_time_hours'] > 8:
        score -= 2
    elif df.loc[i, 'screen_time_hours'] < 2:
        score += 1
    
    # Diet quality
    if df.loc[i, 'diet_quality'] == 'Excellent':
        score += 2
    elif df.loc[i, 'diet_quality'] == 'Poor':
        score -= 2
    
    # Stress level (inverted)
    if df.loc[i, 'stress_level'] <= 3:
        score += 2
    elif df.loc[i, 'stress_level'] >= 8:
        score -= 2
    
    # Sleep quality
    if df.loc[i, 'sleep_quality'] == 'Good':
        score += 1
    elif df.loc[i, 'sleep_quality'] == 'Poor':
        score -= 1
    
    # Exercise frequency
    if df.loc[i, 'exercise_frequency'] == 'Daily':
        score += 2
    elif df.loc[i, 'exercise_frequency'] == 'Never':
        score -= 1
    
    # Substance use (inverted)
    if df.loc[i, 'substance_use'] >= 6:
        score -= 3
    elif df.loc[i, 'substance_use'] <= 2:
        score += 1
    
    # Hydration
    if df.loc[i, 'hydration_level'] == 'High':
        score += 1
    elif df.loc[i, 'hydration_level'] == 'Low':
        score -= 1
    
    # Social support
    if df.loc[i, 'social_support'] == 'High':
        score += 1
    elif df.loc[i, 'social_support'] == 'Low':
        score -= 1
    
    # Determine health condition based on score
    if score >= 5:
        conditions.append('Fit')
    elif score >= 0:
        conditions.append('Unhealthy')
    else:
        conditions.append('At-Risk')

df['health_condition'] = conditions

# Save to CSV
df.to_csv('train.csv', index=False)
print("[OK] Synthetic data saved to train.csv")
print(f"   Shape: {df.shape}")
print(f"   Columns: {list(df.columns)}")
print(f"\n   Target distribution:")
print(f"   {df['health_condition'].value_counts().to_string()}")
print(f"\n   Sample data:")
print(f"   {df.head(3).to_string()}")

# Also create a small test set
test_df = df.sample(n=100, random_state=99)
test_df = test_df.drop('health_condition', axis=1)
test_df.to_csv('test.csv', index=False)
print(f"\n[OK] Test data saved to test.csv ({test_df.shape[0]} samples)")
