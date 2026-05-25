# DermaAI Python API Reference

## Complete endpoint reference with request/response examples.

### Base URL: `http://localhost:5000`

---

## GET /api/healthz
Health check.
```json
{ "status": "ok", "time": "2025-01-15T14:30:00+05:00" }
```

## GET /api/dashboard/stats
Full dashboard statistics.
```json
{
  "totalAnalyses": 42, "highRiskCases": 8,
  "doctorsOnline": 12, "appointments": 34,
  "totalPatients": 170, "aiAccuracyRate": 96.4,
  "analysesToday": 6,
  "conditionDistribution": [
    { "condition": "Melanoma", "count": 12, "color": "#ef4444" }
  ],
  "recentActivity": [ ...analysis objects ]
}
```

## POST /api/analyses/upload
Analyze a skin lesion image.

**Request:**
```json
{
  "patientName": "Muhammad Ali",
  "conditionDetails": "Dark spot on arm",
  "imageData": "base64string...",
  "age": 34, "gender": "Male",
  "riskFactors": {
    "sunExposure": "High", "skinType": "Type II",
    "familyHistory": true, "immuneCondition": false
  }
}
```

**Response:**
```json
{
  "analysisId": 7, "prediction": "Melanoma",
  "riskLevel": "High", "confidenceScore": 91.4,
  "cancerType": "Melanoma", "abcdeScore": "7.2 / 10",
  "lesionArea": "1.84 cm²", "isHighRisk": true,
  "reportId": "REP-2025-58472",
  "recommendations": "Consult a dermatologist immediately...",
  "riskProgressData": [
    { "month": "May 2024", "riskScore": 50 },
    ...
  ],
  "explainableAiReasons": [
    "Irregular border detected", "Asymmetry in shape"
  ],
  "similarCases": [ ...analysis objects ]
}
```

## GET /api/analyses
List all analyses with optional filtering.

**Query params:**
- `search` — filter by patient name or ID
- `dateFrom` — ISO date string
- `dateTo` — ISO date string

## GET /api/analyses/:id
Get single analysis by ID.

## GET /api/analyses/:id/report
Get report metadata and QR verification data.
```json
{
  "reportId": "REP-2025-58472",
  "downloadUrl": "/api/analyses/7/report/pdf",
  "qrCodeData": "https://dermaai.pk/verify/a1b2c3d4",
  "generatedAt": "2025-01-15T14:30:00+05:00"
}
```

## GET /api/doctors
List Pakistani doctors.

**Query params:**
- `city` — filter by city (Lahore, Karachi, Islamabad, Rawalpindi, Peshawar)

## POST /api/chat/message
Send a message to the AI assistant.

**Request:** `{ "message": "Summarize this patient", "analysisId": 7 }`

**Response:**
```json
{
  "id": 12,
  "response": "Based on the AI analysis...",
  "timestamp": "2025-01-15T14:30:00+05:00"
}
```

## GET /api/chat/history
Get last 50 chat messages.
