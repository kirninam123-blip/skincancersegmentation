# DermaAI — Python Standalone Project
### Skin Cancer Detection System | Pakistan Dermatology Initiative

A complete, production-ready AI-powered skin cancer detection dashboard built with Python (Flask) and vanilla JavaScript. No React, no Node.js — just Python and plain HTML/CSS/JS.

---

## 📋 Table of Contents

1. [Features](#features)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Project Structure](#project-structure)
5. [API Documentation](#api-documentation)
6. [VS Code Setup](#vs-code-setup)
7. [Database Configuration](#database-configuration)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔬 AI Skin Analysis | Upload dermoscopic images → instant AI prediction |
| 📊 Dashboard | Real-time stats, charts, patient activity |
| 👨‍⚕️ Pakistani Doctors | 9 top dermatologists, city filtering, contact actions |
| 📜 Analysis History | Searchable table, date range filtering, confidence scores |
| 💬 AI Chat Assistant | Medical chatbot for analysis explanations |
| 📈 Risk Progress Charts | Timeline risk prediction (11-month projection) |
| 🔍 Explainable AI | ABCDE criteria breakdown for each prediction |
| ⚠️ Emergency Alerts | Auto-notification for high-risk cases |
| 📄 PDF Reports | QR-code verified patient reports |
| 🕐 PST Timestamps | All times in Pakistan Standard Time (UTC+5) |
| 🌙 Dark Theme | Professional navy/purple medical UI |

---

## 🔧 Prerequisites

- **Python 3.9+** (3.11 recommended)
- **pip** (comes with Python)
- **SQLite** (built into Python — no setup needed)
- *Optional:* PostgreSQL 14+ for production

---

## 🚀 Quick Start

### Step 1: Install Python
Download Python 3.11 from [python.org](https://www.python.org/downloads/).
During installation, check **"Add Python to PATH"**.

Verify: `python --version` should show `Python 3.11.x`

### Step 2: Set up the project

```bash
# Navigate to the project folder
cd dermaai-python

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Configure environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env if needed (defaults work for local SQLite)
```

### Step 4: Run the server

```bash
# From the project root
python backend/app.py
```

You should see:
```
[DermaAI] Database initialized.
[DermaAI] Seeded 9 Pakistani doctors.
[DermaAI] Starting server on http://0.0.0.0:5000
```

### Step 5: Open the app

Visit **http://localhost:5000** in your browser.

---

## 📁 Project Structure

```
dermaai-python/
├── backend/
│   └── app.py              # Flask server — all API routes + DB models
├── frontend/
│   ├── index.html          # Single-page application
│   └── static/
│       ├── css/
│       │   └── styles.css  # Dark theme stylesheet
│       └── js/
│           └── app.js      # Frontend logic, charts, API calls
├── docs/
│   └── README.md           # This file
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
└── .env                    # Your local config (created by you)
```

---

## 📡 API Documentation

### Base URL
`http://localhost:5000`

### Endpoints

#### Health Check
```
GET /api/healthz
→ { "status": "ok", "time": "2025-01-15T14:30:00+05:00" }
```

#### Dashboard Stats
```
GET /api/dashboard/stats
→ {
    "totalAnalyses": 42,
    "highRiskCases": 8,
    "doctorsOnline": 12,
    "aiAccuracyRate": 96.4,
    "conditionDistribution": [...],
    "recentActivity": [...]
  }
```

#### Upload & Analyze Image
```
POST /api/analyses/upload
Content-Type: application/json
Body: {
  "patientName": "Muhammad Ali",
  "conditionDetails": "Dark spot on back",
  "imageData": "<base64 string>",
  "age": 34,
  "gender": "Male",
  "riskFactors": {
    "sunExposure": "High",
    "skinType": "Type II",
    "familyHistory": false,
    "immuneCondition": false
  }
}
→ {
    "analysisId": 1,
    "prediction": "Melanoma",
    "riskLevel": "High",
    "confidenceScore": 91.4,
    "cancerType": "Melanoma",
    "abcdeScore": "7.2 / 10",
    "lesionArea": "1.84 cm²",
    "isHighRisk": true,
    "reportId": "REP-2025-58472",
    "recommendations": "...",
    "riskProgressData": [...],
    "explainableAiReasons": [...]
  }
```

#### List Analyses
```
GET /api/analyses?search=Ali&dateFrom=2025-01-01&dateTo=2025-12-31
```

#### Get Single Analysis
```
GET /api/analyses/:id
```

#### Get Report Info
```
GET /api/analyses/:id/report
→ { "reportId": "REP-2025-XXXXX", "qrCodeData": "...", "generatedAt": "..." }
```

#### List Doctors
```
GET /api/doctors?city=Lahore
```

#### Send Chat Message
```
POST /api/chat/message
Body: { "message": "Summarize this patient's report" }
→ { "id": 5, "response": "Based on the AI analysis...", "timestamp": "..." }
```

#### Get Chat History
```
GET /api/chat/history
```

---

## 💻 VS Code Setup

### Recommended Extensions

Install these from VS Code Extensions panel (Ctrl+Shift+X):

1. **Python** — `ms-python.python`
2. **Pylance** — `ms-python.vscode-pylance`
3. **Python Debugger** — `ms-python.debugpy`
4. **REST Client** — `humao.rest-client` (for testing API)
5. **SQLite Viewer** — `qwtel.sqlite-viewer`
6. **Prettier** — `esbenp.prettier-vscode`

### VS Code Settings (.vscode/settings.json)

Create a `.vscode/settings.json` file in the project root:

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/venv/Scripts/python",
  "python.analysis.typeCheckingMode": "basic",
  "editor.formatOnSave": true,
  "[python]": { "editor.defaultFormatter": "ms-python.python" },
  "files.exclude": { "**/__pycache__": true, "**/*.pyc": true }
}
```

### VS Code Launch Configuration (.vscode/launch.json)

Create `.vscode/launch.json` for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "DermaAI Flask Server",
      "type": "python",
      "request": "launch",
      "module": "flask",
      "env": {
        "FLASK_APP": "backend/app.py",
        "FLASK_DEBUG": "1",
        "PORT": "5000"
      },
      "args": ["run", "--host=0.0.0.0", "--port=5000"],
      "jinja": true,
      "justMyCode": true
    }
  ]
}
```

### Running with VS Code Debugger

1. Open the project folder in VS Code
2. Press **F5** (or Run → Start Debugging)
3. Select "DermaAI Flask Server"
4. Set breakpoints by clicking next to line numbers in `app.py`

---

## 🗄️ Database Configuration

### SQLite (Default — No Setup Required)

The app uses SQLite by default. The database file `dermaai.db` is created automatically in the `backend/` folder when you first run the server.

### PostgreSQL (Production)

1. Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
2. Create a database:
   ```sql
   CREATE DATABASE dermaai;
   CREATE USER dermaai_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE dermaai TO dermaai_user;
   ```
3. Update `.env`:
   ```
   DATABASE_URL=postgresql://dermaai_user:your_password@localhost:5432/dermaai
   ```
4. Restart the server — tables are created automatically.

---

## 🚢 Deployment

### Local Network (Share with team)

```bash
# Server is already bound to 0.0.0.0
# Find your IP address:
# Windows: ipconfig | findstr "IPv4"
# macOS/Linux: ifconfig | grep "inet "

# Others on your network can access via:
# http://YOUR_IP:5000
```

### Production (Gunicorn + Nginx)

```bash
# Install Gunicorn (already in requirements.txt)
gunicorn -w 4 -b 0.0.0.0:5000 "backend.app:app"
```

### Render / Railway / Fly.io

Set these environment variables on the platform:
- `DATABASE_URL` — PostgreSQL connection string
- `SECRET_KEY` — Random secret key
- `PORT` — Usually auto-assigned

Build command: `pip install -r requirements.txt`
Start command: `gunicorn -w 4 -b 0.0.0.0:$PORT "backend.app:app"`

---

## 🔬 Adding a Real ML Model

The current analysis engine simulates results. To integrate a real CNN model:

```python
# backend/app.py — replace simulate_analysis() with:
import torch
from torchvision import transforms, models

# Load pretrained model (e.g., EfficientNet fine-tuned on HAM10000 dataset)
model = torch.load("models/dermaai_model.pth", map_location="cpu")
model.eval()

def analyze_with_model(image_b64: str) -> dict:
    import io, base64
    from PIL import Image

    image_bytes = base64.b64decode(image_b64)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    tensor = transform(image).unsqueeze(0)
    with torch.no_grad():
        output = torch.softmax(model(tensor), dim=1)
    idx = output.argmax().item()
    return {
        "condition": SKIN_CONDITIONS[idx],
        "confidence_score": round(output[0][idx].item() * 100, 1),
        # ... rest of fields
    }
```

### Recommended Datasets

| Dataset | Classes | Images | Link |
|---|---|---|---|
| HAM10000 | 7 | 10,000+ | [Kaggle](https://www.kaggle.com/datasets/kmader/skin-lesion-analysis-toward-melanoma-detection) |
| ISIC 2020 | 2 | 33,000+ | [ISIC](https://www.isic-archive.com/) |
| Dermnet | 23 | 19,500+ | [Kaggle](https://www.kaggle.com/datasets/shubhamgoel27/dermnet) |

---

## ❓ Troubleshooting

| Problem | Solution |
|---|---|
| `ModuleNotFoundError: No module named 'flask'` | Run `pip install -r requirements.txt` inside activated venv |
| `Address already in use` | Change PORT in `.env` or kill process on port 5000 |
| `Database locked` | Restart server; SQLite locks on concurrent writes |
| `CORS error in browser` | Flask-CORS is installed; check browser console for specific origin |
| `Image analysis fails` | Ensure base64 string is valid; max ~10MB |
| `Doctors table empty` | Delete `dermaai.db` and restart — seed runs automatically |
| Charts not rendering | Ensure CDN internet access; Chart.js loaded from cdn.jsdelivr.net |

---

## 📞 Support

- **Project**: DermaAI — Pakistan Dermatology Initiative
- **Email**: support@dermaai.pk
- **License**: MIT

---

*Built with ❤️ for Pakistan's medical community*
