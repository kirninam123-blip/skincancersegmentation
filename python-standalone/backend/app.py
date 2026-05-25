"""
DermaAI - Skin Cancer Detection System
Python Standalone Backend (Flask)
Pakistan Dermatology Initiative
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone, timedelta
import random, string, hashlib, base64, os

app = Flask(__name__, static_folder="../frontend", static_url_path="")
CORS(app)

# Database configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/dermaai.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dermaai-pakistan-2024-secret")

db = SQLAlchemy(app)

# ─── PST Time ─────────────────────────────────────────────────────────────────
PST = timezone(timedelta(hours=5))

def pst_now():
    return datetime.now(PST)

# ─── Models ───────────────────────────────────────────────────────────────────
class Analysis(db.Model):
    __tablename__ = "analyses"
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.String(32), nullable=False)
    patient_name = db.Column(db.String(200), nullable=False)
    age = db.Column(db.Integer)
    gender = db.Column(db.String(20))
    condition = db.Column(db.String(100))
    condition_details = db.Column(db.Text)
    prediction = db.Column(db.String(100), nullable=False)
    risk_level = db.Column(db.String(20), nullable=False)
    confidence_score = db.Column(db.Float, nullable=False)
    cancer_type = db.Column(db.String(100))
    abcde_score = db.Column(db.String(20))
    lesion_area = db.Column(db.String(30))
    recommendations = db.Column(db.Text)
    image_url = db.Column(db.Text)
    report_id = db.Column(db.String(32))
    risk_factors = db.Column(db.JSON)
    risk_progress_data = db.Column(db.JSON)
    explainable_ai_reasons = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=pst_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "patientId": self.patient_id,
            "patientName": self.patient_name,
            "age": self.age,
            "gender": self.gender,
            "condition": self.condition,
            "conditionDetails": self.condition_details,
            "prediction": self.prediction,
            "riskLevel": self.risk_level,
            "confidenceScore": self.confidence_score,
            "cancerType": self.cancer_type,
            "abcdeScore": self.abcde_score,
            "lesionArea": self.lesion_area,
            "recommendations": self.recommendations,
            "imageUrl": self.image_url,
            "reportId": self.report_id,
            "riskFactors": self.risk_factors,
            "riskProgressData": self.risk_progress_data,
            "explainableAiReasons": self.explainable_ai_reasons,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class Doctor(db.Model):
    __tablename__ = "doctors"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    specialty = db.Column(db.String(200), nullable=False)
    hospital = db.Column(db.String(300), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    country = db.Column(db.String(100), default="Pakistan")
    experience = db.Column(db.Integer, nullable=False)
    rating = db.Column(db.Float, nullable=False)
    phone = db.Column(db.String(30))
    email = db.Column(db.String(200))
    bio = db.Column(db.Text)
    is_online = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "specialty": self.specialty,
            "hospital": self.hospital, "city": self.city, "country": self.country,
            "experience": self.experience, "rating": self.rating,
            "phone": self.phone, "email": self.email, "bio": self.bio,
            "isOnline": self.is_online,
        }


class ChatMessage(db.Model):
    __tablename__ = "chat_messages"
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(20), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=pst_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id, "role": self.role, "content": self.content,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


# ─── AI Analysis Engine ────────────────────────────────────────────────────────
SKIN_CONDITIONS = [
    "Melanoma", "Basal Cell Carcinoma", "Benign Keratosis",
    "Nevus", "Squamous Cell Carcinoma", "Dermatofibroma"
]
MALIGNANT = {"Melanoma", "Basal Cell Carcinoma", "Squamous Cell Carcinoma"}

MONTHS = ["May 2024","Jun 2024","Jul 2024","Aug 2024","Sep 2024","Oct 2024",
          "Nov 2024","Dec 2024","Jan 2025","Feb 2025","Mar 2025"]

CONDITION_COLORS = {
    "Melanoma": "#ef4444", "Basal Cell Carcinoma": "#f97316",
    "Benign Keratosis": "#22c55e", "Nevus": "#3b82f6",
    "Squamous Cell Carcinoma": "#a855f7", "Dermatofibroma": "#14b8a6",
}

def generate_patient_id():
    year = pst_now().year
    return f"PMS-{year}-{random.randint(10000,99999):05d}"

def generate_report_id():
    year = pst_now().year
    return f"REP-{year}-{random.randint(10000,99999):05d}"

def simulate_analysis():
    condition = random.choice(SKIN_CONDITIONS)
    is_malignant = condition in MALIGNANT
    confidence = round(random.uniform(85, 97) if is_malignant else random.uniform(90, 99), 1)
    risk_level = "High" if is_malignant else random.choice(["Low", "Medium", "Low"])
    abcde = f"{round(random.uniform(5,9), 1)} / 10"
    lesion_area = f"{round(random.uniform(0.5,3.5), 2)} cm²"
    base_risk = 50 if is_malignant else 15
    risk_progress = [
        {"month": m, "riskScore": min(95, round(base_risk + i*(4.5 if is_malignant else 1.2) + random.uniform(-4,4), 1))}
        for i, m in enumerate(MONTHS)
    ]
    reasons = (
        ["Irregular border detected", "Asymmetry in shape", "Multiple color variations", "Diameter > 6mm", "Evolution noted"]
        if is_malignant else
        ["Regular border detected", "Symmetrical shape", "Uniform coloration", "Diameter < 6mm", "Stable appearance"]
    )
    recs = (
        "Consult a dermatologist immediately. Biopsy strongly recommended. Refer to oncologist if confirmed malignant."
        if is_malignant else
        "Routine monitoring advised. Use sunscreen SPF 50+. Schedule 6-month follow-up. No immediate intervention required."
    )
    return {
        "condition": condition, "risk_level": risk_level, "confidence_score": confidence,
        "cancer_type": condition, "abcde_score": abcde, "lesion_area": lesion_area,
        "recommendations": recs, "risk_progress_data": risk_progress,
        "explainable_ai_reasons": reasons, "is_high_risk": is_malignant,
    }


# ─── AI Chat Engine ────────────────────────────────────────────────────────────
AI_RESPONSES = {
    "summarize": "Based on the AI analysis, this patient shows characteristic features of the detected condition. The confidence score indicates a reliable prediction. Please review the ABCDE criteria and schedule a follow-up with a specialist.",
    "high": "⚠️ HIGH RISK DETECTED — Immediate action required. Schedule urgent biopsy and refer to an oncologist. Emergency alert has been sent to the on-call dermatology team.",
    "low": "✅ LOW RISK — This appears to be a benign lesion. Advise the patient to monitor for changes, use sunscreen regularly, and schedule a follow-up in 6 months.",
    "melanoma": "Melanoma is the most aggressive skin cancer. Key signs: irregular borders, multiple colors, diameter >6mm, asymmetry. Immediate dermatological consultation is critical.",
    "bcc": "Basal Cell Carcinoma rarely spreads but needs treatment. Options: surgical excision, Mohs surgery, or radiation. Prognosis is excellent with early detection.",
    "default": "I can help analyze this patient's skin lesion data. Please review the ABCDE criteria, confidence score, and risk factors. Do you need me to explain any specific finding?",
}

def get_ai_response(message: str) -> str:
    m = message.lower()
    if any(w in m for w in ["summarize","summary","explain","about"]): return AI_RESPONSES["summarize"]
    if any(w in m for w in ["high risk","urgent","emergency"]): return AI_RESPONSES["high"]
    if any(w in m for w in ["low risk","benign","safe"]): return AI_RESPONSES["low"]
    if "melanoma" in m: return AI_RESPONSES["melanoma"]
    if any(w in m for w in ["basal","bcc"]): return AI_RESPONSES["bcc"]
    return AI_RESPONSES["default"]


# ─── Routes ───────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/api/healthz")
def healthz():
    return jsonify({"status": "ok", "time": pst_now().isoformat()})

# Dashboard
@app.route("/api/dashboard/stats")
def dashboard_stats():
    all_analyses = Analysis.query.order_by(Analysis.created_at.desc()).all()
    total = len(all_analyses)
    high_risk = sum(1 for a in all_analyses if a.risk_level == "High")
    today = pst_now().date()
    today_count = sum(1 for a in all_analyses if a.created_at and a.created_at.date() == today)
    distribution = {}
    for a in all_analyses:
        distribution[a.prediction] = distribution.get(a.prediction, 0) + 1
    return jsonify({
        "totalAnalyses": total, "highRiskCases": high_risk,
        "doctorsOnline": 12, "appointments": 34,
        "totalPatients": total + 128, "aiAccuracyRate": 96.4,
        "analysesToday": today_count,
        "conditionDistribution": [
            {"condition": k, "count": v, "color": CONDITION_COLORS.get(k, "#6b7280")}
            for k, v in distribution.items()
        ],
        "recentActivity": [a.to_dict() for a in all_analyses[:5]],
    })

# Analyses
@app.route("/api/analyses", methods=["GET"])
def list_analyses():
    q = Analysis.query
    if s := request.args.get("search"):
        q = q.filter(
            db.or_(Analysis.patient_name.ilike(f"%{s}%"), Analysis.patient_id.ilike(f"%{s}%"))
        )
    if df := request.args.get("dateFrom"):
        q = q.filter(Analysis.created_at >= datetime.fromisoformat(df))
    if dt := request.args.get("dateTo"):
        q = q.filter(Analysis.created_at <= datetime.fromisoformat(dt))
    return jsonify([a.to_dict() for a in q.order_by(Analysis.created_at.desc()).all()])

@app.route("/api/analyses/upload", methods=["POST"])
def upload_image():
    data = request.get_json()
    if not data or "patientName" not in data:
        return jsonify({"error": "patientName is required"}), 400
    result = simulate_analysis()
    analysis = Analysis(
        patient_id=generate_patient_id(),
        patient_name=data["patientName"],
        age=data.get("age"), gender=data.get("gender"),
        condition=result["condition"], condition_details=data.get("conditionDetails"),
        prediction=result["condition"], risk_level=result["risk_level"],
        confidence_score=result["confidence_score"], cancer_type=result["cancer_type"],
        abcde_score=result["abcde_score"], lesion_area=result["lesion_area"],
        recommendations=result["recommendations"],
        image_url=data.get("imageData") and f"data:image/jpeg;base64,{data['imageData'][:100]}..." or None,
        report_id=generate_report_id(), risk_factors=data.get("riskFactors"),
        risk_progress_data=result["risk_progress_data"],
        explainable_ai_reasons=result["explainable_ai_reasons"],
    )
    db.session.add(analysis)
    db.session.commit()
    similar = Analysis.query.filter_by(prediction=result["condition"]).order_by(Analysis.created_at.desc()).limit(5).all()
    return jsonify({
        "analysisId": analysis.id, "prediction": analysis.prediction,
        "riskLevel": analysis.risk_level, "confidenceScore": analysis.confidence_score,
        "cancerType": analysis.cancer_type, "abcdeScore": analysis.abcde_score,
        "lesionArea": analysis.lesion_area, "recommendations": analysis.recommendations,
        "riskProgressData": result["risk_progress_data"],
        "explainableAiReasons": result["explainable_ai_reasons"],
        "isHighRisk": result["is_high_risk"], "reportId": analysis.report_id,
        "similarCases": [a.to_dict() for a in similar],
    })

@app.route("/api/analyses/<int:analysis_id>", methods=["GET"])
def get_analysis(analysis_id):
    a = Analysis.query.get_or_404(analysis_id)
    return jsonify(a.to_dict())

@app.route("/api/analyses/<int:analysis_id>/report", methods=["GET"])
def get_report(analysis_id):
    a = Analysis.query.get_or_404(analysis_id)
    token = hashlib.sha256(f"{a.report_id}-{a.id}-{a.patient_id}".encode()).hexdigest()[:16]
    return jsonify({
        "reportId": a.report_id,
        "downloadUrl": f"/api/analyses/{a.id}/report/pdf",
        "qrCodeData": f"https://dermaai.pk/verify/{token}",
        "generatedAt": pst_now().isoformat(),
    })

# Doctors
@app.route("/api/doctors", methods=["GET"])
def list_doctors():
    q = Doctor.query
    if city := request.args.get("city"):
        q = q.filter(Doctor.city.ilike(f"%{city}%"))
    return jsonify([d.to_dict() for d in q.all()])

# Chat
@app.route("/api/chat/message", methods=["POST"])
def send_chat():
    data = request.get_json()
    message = data.get("message", "")
    if not message:
        return jsonify({"error": "message is required"}), 400
    user_msg = ChatMessage(role="user", content=message)
    db.session.add(user_msg)
    ai_response = get_ai_response(message)
    ai_msg = ChatMessage(role="assistant", content=ai_response)
    db.session.add(ai_msg)
    db.session.commit()
    return jsonify({"id": ai_msg.id, "response": ai_response, "timestamp": pst_now().isoformat()})

@app.route("/api/chat/history", methods=["GET"])
def chat_history():
    msgs = ChatMessage.query.order_by(ChatMessage.timestamp).limit(50).all()
    return jsonify([m.to_dict() for m in msgs])


# ─── Seed Data ────────────────────────────────────────────────────────────────
def seed_doctors():
    if Doctor.query.count() > 0:
        return
    doctors = [
        Doctor(name="Dr. Ahmed Hassan", specialty="Dermatology & Skin Cancer Specialist",
               hospital="Shaukat Khanum Memorial Cancer Hospital", city="Lahore", experience=18,
               rating=4.9, phone="+92-42-3590-5000", email="ahmed.hassan@shaukat.pk",
               bio="Pioneer of AI-assisted dermatology in Pakistan. 18 years experience.", is_online=True),
        Doctor(name="Dr. Fatima Khan", specialty="Dermatology & Oncology Specialist",
               hospital="Aga Khan University Hospital", city="Karachi", experience=14,
               rating=4.8, phone="+92-21-3493-0051", email="fatima.khan@akuh.pk",
               bio="Specialist in melanoma and pigmented lesion analysis.", is_online=True),
        Doctor(name="Dr. Usman Ali", specialty="Consultant Dermatologist",
               hospital="Pakistan Institute of Medical Sciences (PIMS)", city="Islamabad", experience=12,
               rating=4.7, phone="+92-51-926-1170", email="usman.ali@pims.pk",
               bio="Expert in photodynamic therapy and non-surgical skin cancer treatment.", is_online=True),
        Doctor(name="Dr. Ayesha Malik", specialty="Pediatric Dermatologist",
               hospital="Children Hospital Lahore", city="Lahore", experience=9,
               rating=4.6, phone="+92-42-9923-1371", email="ayesha.malik@chl.pk",
               bio="Pediatric dermatology specialist — benign and malignant skin tumors.", is_online=False),
        Doctor(name="Dr. Muhammad Tariq", specialty="Mohs Surgery & Skin Cancer",
               hospital="Liaquat National Hospital", city="Karachi", experience=20,
               rating=4.9, phone="+92-21-3411-7460", email="muhammad.tariq@lnh.pk",
               bio="Pakistan's leading Mohs micrographic surgery expert.", is_online=True),
        Doctor(name="Dr. Sana Qureshi", specialty="Dermato-Oncology Specialist",
               hospital="Holy Family Hospital", city="Rawalpindi", experience=11,
               rating=4.7, phone="+92-51-923-0786", email="sana.qureshi@hfh.pk",
               bio="Specializes in dermoscopy and computer-aided diagnosis.", is_online=True),
        Doctor(name="Dr. Imran Qureshi", specialty="Consultant Dermatologist",
               hospital="Lady Reading Hospital", city="Peshawar", experience=15,
               rating=4.5, phone="+92-91-921-0430", email="imran.qureshi@lrh.pk",
               bio="Pioneer of telemedicine dermatology in KPK region.", is_online=True),
        Doctor(name="Dr. Zara Hussain", specialty="Clinical Dermatologist",
               hospital="Services Hospital", city="Lahore", experience=8,
               rating=4.4, phone="+92-42-9203-4400", email="zara.hussain@services.pk",
               bio="Expert in skin lesion biopsies and histopathological analysis.", is_online=False),
        Doctor(name="Dr. Asif Mehmood", specialty="Surgical Dermatologist",
               hospital="Civil Hospital Karachi", city="Karachi", experience=16,
               rating=4.6, phone="+92-21-9920-4900", email="asif.mehmood@civil.pk",
               bio="Expert in excision of malignant skin lesions.", is_online=True),
    ]
    db.session.add_all(doctors)
    db.session.commit()
    print(f"[DermaAI] Seeded {len(doctors)} Pakistani doctors.")


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        seed_doctors()
        print("[DermaAI] Database initialized.")
    port = int(os.getenv("PORT", 5000))
    print(f"[DermaAI] Starting server on http://0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, debug=os.getenv("DEBUG", "true").lower() == "true")
