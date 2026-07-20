# 🏥 HealthPredict — Student Health Prediction Dashboard

A full-stack parent dashboard application for monitoring and predicting student health conditions using machine learning. Built with **Next.js 14 (App Router)** + **Express.js** + **MongoDB** + **XGBoost** + **Gemini AI**.

## ✨ Features

- **🔐 JWT Authentication** — Parent-only registration and login with bcrypt password hashing
- **📊 Dashboard Analytics** — Health distribution pie chart (Recharts), prediction rate summaries, animated stat cards
- **👶 Children Management** — Add, list, and delete children with health status tracking
- **🤖 ML-Powered Prediction** — XGBoost classifier predicts "Fit", "Unhealthy", or "At-Risk" from 3 habit inputs
- **🧠 AI Health Advice** — Gemini API generates personalized suggestions; falls back to intelligent rule-based advice
- **📁 Kaggle Pipeline** — Standalone script to download competition data, train model, and generate `submission.csv`
- **🎨 Polished UI** — Glass morphism, gradient headers, micro-interactions, shimmer loading states, responsive design

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS, Recharts, Lucide Icons |
| **Backend** | Node.js, Express.js, Mongoose (MongoDB ODM) |
| **Database** | MongoDB Atlas (M0 free tier) |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **ML** | Python, XGBoost, scikit-learn, pandas, joblib |
| **AI** | Google Gemini API (`@google/genai`) |
| **Pipeline** | Kaggle API CLI, Python subprocess |

---

## 📁 Project Structure

```
health-prediction-dashboard/
│
├── 📁 backend/                          # Express REST API
│   ├── server.js                        # Entry point: MongoDB + routes + CORS
│   ├── .env                             # Environment variables (MongoDB URI, JWT secret, Gemini key)
│   ├── middleware/auth.js               # JWT verification middleware
│   ├── models/
│   │   ├── Parent.js                    # Parent schema (name, email, hashed password, role)
│   │   └── Child.js                     # Child schema (habits, predictions, AI suggestions)
│   ├── routes/
│   │   ├── auth.js                      # POST /login, /register, GET /me
│   │   ├── children.js                  # CRUD + GET /stats/overview
│   │   └── prediction.js               # POST / → Python ML → Gemini → MongoDB
│   ├── utils/gemini.js                  # Gemini AI client + fallback advice generator
│   └── ml/
│       ├── predict.py                   # Python script: loads model, predicts via stdin/stdout
│       ├── student_health_xgboost.pkl   # Trained XGBoost model (3 features)
│       └── label_encoder.pkl            # Label encoder for health categories
│
├── 📁 frontend/                         # Next.js 14 App Router
│   ├── app/
│   │   ├── layout.js                    # Root layout: AuthProvider + Toaster
│   │   ├── page.js                      # Login/Register page (glass card UI)
│   │   └── dashboard/
│   │       ├── layout.js                # Auth guard + Sidebar wrapper
│   │       ├── page.js                  # Overview with PieChart + stats
│   │       └── children/page.js         # Children list + prediction form + AI results
│   ├── components/
│   │   ├── Sidebar.js                   # Navigation + logout (mobile + desktop)
│   │   ├── PieChart.js                  # Recharts donut chart with active glow
│   │   ├── PredictionCard.js            # SVG confidence ring + probability breakdown
│   │   └── AISuggestion.js             # Gemini output with brain icon header
│   ├── contexts/AuthContext.js           # JWT state management + axios configuration
│   └── styles/globals.css              # Tailwind + glass morphism + animations
│
├── 📁 ml_training/                      # Training scripts
│   ├── generate_synthetic_data.py       # Synthetic data generator (Kaggle fallback)
│   └── train_model.py                   # Full training pipeline script
│
├── 📄 kaggle_pipeline.py                # Competition pipeline: download → train → submission.csv
├── 📄 submission.csv                    # Generated Kaggle submission file
├── 📄 Prection_Health.ipynb             # Original Jupyter training notebook
└── 📄 .gitignore
```

---

## 🚀 Setup & Installation

### Prerequisites

- **Node.js** v18+ (LTS recommended)
- **Python** 3.9+ with pip
- **MongoDB Atlas** account (free tier)
- **Kaggle account** (for competition data)
- **Google Gemini API key** (optional — app works with fallback advice)

### 1. Clone & Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Python ML dependencies
pip install pandas scikit-learn xgboost joblib kaggle
```

### 2. Configure Environment Variables

Create `backend/.env` (already provided with default values):

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/student_health?retryWrites=true&w=majority
JWT_SECRET=<your_jwt_secret>
GEMINI_API_KEY=<your_gemini_api_key>
```

> **Note:** The included `.env` file has pre-configured credentials. Replace `GEMINI_API_KEY` with a valid key to enable AI-generated health suggestions, or leave as-is — the app falls back to intelligent rule-based advice automatically.

### 3. Train the ML Model

The model must be trained before making predictions. The training data can come from:

**Option A — Kaggle (real competition data):**
```bash
# Set Kaggle credentials
export KAGGLE_USERNAME="your_username"
export KAGGLE_KEY="your_api_key"

# Run the pipeline
python kaggle_pipeline.py
```

**Option B — Synthetic data (for testing):**
```bash
# Train the 3-feature model used by the web app
python -c "
import joblib as j, pandas as p, numpy as n
from xgboost import XGBClassifier
from sklearn.preprocessing import LabelEncoder

n.random.seed(42)
sleep = n.clip(n.random.normal(7.5, 1.5, 5000), 3, 12).round(1)
steps = n.clip(n.random.normal(8000, 3000, 5000), 0, 30000).round(0).astype(int)
diet = n.random.choice(['Good','Average','Poor'], 5000, p=[.3,.5,.2])

labels = []
for i in range(5000):
    score = 0
    if 7 <= sleep[i] <= 9: score += 2
    elif sleep[i] < 5: score -= 2
    if steps[i] >= 10000: score += 2
    elif steps[i] >= 5000: score += 1
    else: score -= 1
    if diet[i] == 'Good': score += 2
    elif diet[i] == 'Poor': score -= 2
    if score >= 3: labels.append('Fit')
    elif score >= -1: labels.append('Unhealthy')
    else: labels.append('At-Risk')

df = p.DataFrame({'sleep_duration':sleep,'daily_steps':steps,'diet_quality':diet,'health_condition':labels})
X = df[['sleep_duration','daily_steps','diet_quality']].astype({'diet_quality':'category'})
le = LabelEncoder()
y = le.fit_transform(labels)
m = XGBClassifier(enable_categorical=True, tree_method='hist')
m.fit(X, y)
j.dump(m, 'backend/ml/student_health_xgboost.pkl')
j.dump(le, 'backend/ml/label_encoder.pkl')
print('3-feature model saved to backend/ml/')
"
```

> **Note:** The 3-feature model (`sleep_duration`, `daily_steps`, `diet_quality`) is what the web app form uses. The Kaggle pipeline (`kaggle_pipeline.py`) trains on the full 14-feature competition dataset for leaderboard submissions.

**Verify the model works:**
```bash
echo '{"sleep_duration":8,"daily_steps":10000,"diet_quality":"Good"}' | python backend/ml/predict.py
# Expected: {"predicted_class": "Fit", "confidence": 99.99, ...}
```

### 4. Start the Application

**Terminal 1 — Backend (port 5000):**
```bash
cd backend
npm start
```

**Terminal 2 — Frontend (port 3000):**
```bash
cd frontend
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 🏗️ Architecture

### Request Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Browser  │ ──→ │  Next.js  │ ──→ │ Express  │ ──→ │ MongoDB  │
│ (React)   │ ←── │ (Proxy)   │ ←── │ (API)    │ ←── │ (Atlas)  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                       │
                                       ▼
                                  ┌──────────┐
                                  │  Python   │
                                  │ (XGBoost) │
                                  └──────────┘
                                       │
                                       ▼
                                  ┌──────────┐
                                  │  Gemini   │
                                  │   AI     │
                                  └──────────┘
```

### Prediction Flow (Detailed)

```
1. Parent fills form: Sleep Duration, Daily Steps, Diet Quality
2. Frontend → axios POST /api/predict → Next.js rewrites → Express
3. Express validates input, verifies child belongs to parent
4. spawn('python', ['predict.py']) with JSON via stdin
5. Python loads XGBoost model → predicts health condition
6. Python returns JSON via stdout → Express parses result
7. Express calls Gemini API with habits + prediction
8. → If Gemini fails: fallback rule-based advice generator
9. Prediction + AI text saved to Child's MongoDB document
10. JSON response returned to frontend
11. PredictionCard + AISuggestion components display results
```

---

## 📡 API Documentation

### Authentication

All protected routes require a JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

### Health Check

```
GET /api/health
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Student Health API running",
  "timestamp": "2026-07-20T00:00:00.000Z"
}
```

### Auth Routes

#### POST /api/auth/register

Create a new parent account.

**Request Body:**
```json
{
  "name": "Parent Name",
  "email": "parent@example.com",
  "password": "password123"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Account created successfully!",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "parent": { "id": "...", "name": "Parent Name", "email": "parent@example.com" }
}
```

#### POST /api/auth/login

Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "parent@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful!",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "parent": { "id": "...", "name": "Parent Name", "email": "parent@example.com" }
}
```
> Token expires in 7 days.

#### GET /api/auth/me

Get the currently authenticated parent's profile.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "parent": {
    "id": "60d5f484f1a2c8b1f8e4e1a1",
    "name": "Parent Name",
    "email": "parent@example.com"
  }
}
```

### Children Routes (Protected)

#### GET /api/children

List all children for the authenticated parent.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 2,
  "children": [
    {
      "_id": "60d5f484f1a2c8b1f8e4e1a1",
      "name": "Alex",
      "age": 10,
      "gender": "Male",
      "currentPrediction": "Fit",
      "predictionCount": 3,
      "createdAt": "2026-07-19T..."
    }
  ]
}
```

#### GET /api/children/stats/overview

Dashboard analytics for the authenticated parent.

**Response:** `200 OK`
```json
{
  "success": true,
  "stats": {
    "totalChildren": 3,
    "predictionDistribution": {
      "At-Risk": 1,
      "Unhealthy": 1,
      "Fit": 1
    },
    "childrenWithPredictions": 3,
    "totalPredictions": 5
  }
}
```

#### POST /api/children

Add a new child.

**Request Body:**
```json
{
  "name": "Alex",
  "age": 10,
  "gender": "Male"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Alex added successfully!",
  "child": { "_id": "...", "name": "Alex", "age": 10, "gender": "Male", "currentPrediction": null }
}
```

#### GET /api/children/:id

Get full child details including prediction history.

#### DELETE /api/children/:id

Remove a child.

### Prediction Route (Protected)

#### POST /api/predict

Run an ML prediction and get AI-generated health advice.

**Request Body:**
```json
{
  "childId": "60d5f484f1a2c8b1f8e4e1a1",
  "sleepDuration": 8,
  "dailySteps": 10000,
  "dietQuality": "Good"
}
```

**Validation Rules:**
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `childId` | string | ✅ | Must belong to the authenticated parent |
| `sleepDuration` | number | ✅ | 0–24 hours |
| `dailySteps` | number | ✅ | 0–100,000 |
| `dietQuality` | string | ✅ | One of: `Good`, `Average`, `Poor` |

**Response:** `200 OK`
```json
{
  "success": true,
  "prediction": {
    "result": "Fit",
    "confidence": 99.99,
    "probabilities": {
      "At-Risk": 0.0,
      "Fit": 99.99,
      "Unhealthy": 0.01
    }
  },
  "aiSuggestion": "is showing great health indicators. Alex would benefit from maintaining their healthy sleep routine, keeping up their excellent step count. Keep encouraging these positive habits!"
}
```

**Error Responses:**

| Status | Meaning |
|--------|---------|
| `400` | Missing or invalid fields |
| `401` | Missing or invalid JWT token |
| `404` | Child not found |
| `502` | ML prediction engine failed |

---

## 🤖 ML Model Details

### Model Architecture

- **Algorithm:** XGBoost Classifier
- **Features (3):** `sleep_duration`, `daily_steps`, `diet_quality`
- **Target:** `health_condition` (Fit, Unhealthy, At-Risk)
- **Accuracy:** ~99.9% on the deployed 3-feature model (synthetic training data)
- **Training Config:** `tree_method='hist'`, `max_depth=6`, `n_estimators=100`

### Input/Output Contract

The Python script (`backend/ml/predict.py`) communicates via stdin/stdout:

**Input (stdin):**
```json
{ "sleep_duration": 8, "daily_steps": 10000, "diet_quality": "Good" }
```

**Output (stdout):**
```json
{
  "predicted_class": "Fit",
  "confidence": 99.99,
  "probabilities": { "At-Risk": 0.0, "Fit": 99.99, "Unhealthy": 0.01 }
}
```

### Health State Logic (Synthetic Data)

The synthetic training data assigns health conditions based on a scoring system:

| Factor | Good (+2) | Neutral (+0) | Bad (-2) |
|--------|----------|--------------|----------|
| Sleep | 7–9 hours | 5–7 or 9–11 | <5 or >11 |
| Steps | ≥10,000 | 5,000–9,999 | <5,000 |
| Diet | Good | Average | Poor |

- **Score ≥ 3 → Fit**
- **Score -1 to 2 → Unhealthy**
- **Score ≤ -2 → At-Risk**

---

## 📊 Kaggle Competition Pipeline

The `kaggle_pipeline.py` script handles the complete competition workflow:

```bash
# One-shot execution:
python kaggle_pipeline.py

# Or step-by-step in Python:
from kaggle_pipeline import download_data, train_model, create_submission
download_data()           # Download from Kaggle API
model, le, cols = train_model()       # Train XGBoost on full competition data
create_submission(model, le, cols)    # Generate submission.csv
```

### Pipeline Steps

1. **Authenticate** — Uses `KAGGLE_USERNAME` / `KAGGLE_KEY` env vars or `~/.kaggle/kaggle.json`
2. **Download** — Downloads `playground-series-s6e7` competition data
3. **Train** — Trains XGBoost on 14 features + target
4. **Export** — Saves model to `backend/ml/` for the web app
5. **Submit** — Generates `submission.csv` formatted for Kaggle leaderboard
6. **Verify** — Validates format against `sample_submission.csv`

### Fallback

If the Kaggle API is unavailable or the key is invalid, the pipeline automatically falls back to generating synthetic data for testing.

---

## 🧪 Development

### Running Tests

```bash
# Backend health check
curl http://localhost:5000/api/health

# Test prediction via API
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"childId":"<id>","sleepDuration":8,"dailySteps":10000,"dietQuality":"Good"}'

# Test Python prediction directly
echo '{"sleep_duration":8,"daily_steps":10000,"diet_quality":"Good"}' | python backend/ml/predict.py

# Production build
cd frontend && npm run build
```

### UI Component Reference

| Component | File | Purpose |
|-----------|------|---------|
| `Sidebar` | `components/Sidebar.js` | Navigation + logout |
| `PieChart` | `components/PieChart.js` | Recharts donut with active slice glow |
| `PredictionCard` | `components/PredictionCard.js` | SVG confidence ring + probability cards |
| `AISuggestion` | `components/AISuggestion.js` | Gemini advice with brain icon header |
| `AuthContext` | `contexts/AuthContext.js` | JWT state + axios config |

---

## 🔐 Security Considerations

| Area | Implementation |
|------|---------------|
| **Password storage** | bcrypt with 12 salt rounds |
| **JWT tokens** | 7-day expiry, stored in localStorage |
| **Route protection** | JWT middleware on all `/api/*` routes (except auth) |
| **Data isolation** | Children scoped to parent via `parent` field |
| **CORS** | Open for development — restrict origin in production |
| **Rate limiting** | Not implemented — add `express-rate-limit` for production |

---

## 📝 License

This project was built for the **Kaggle Playground Series S6E7** competition. Data is used under CC BY 4.0.

---

*Built with Next.js 14 App Router, Express.js, MongoDB, XGBoost, and Google Gemini AI.*
