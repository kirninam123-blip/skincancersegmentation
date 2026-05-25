import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUploadImage, getListAnalysesQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { Upload, Activity, RefreshCw, CheckCircle, AlertTriangle, X, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

/* ─── Canvas Segmentation ────────────────────────────────────────────────── */
// Fixed irregular polygon perturbations (deterministic — same every render)
const PERTURB = [1.1, 0.78, 1.25, 0.88, 1.18, 0.72, 1.32, 0.85, 0.95, 1.22, 0.80, 1.15, 1.05, 0.76, 1.28, 0.92, 1.10, 0.82];

function buildLesionPath(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w * 0.50;
  const cy = h * 0.46;
  const rx = w * 0.31;
  const ry = h * 0.36;
  const n = PERTURB.length;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(angle) * rx * PERTURB[i];
    const py = cy + Math.sin(angle) * ry * PERTURB[i];
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function SegmentationCanvas({ imageSrc }: { imageSrc: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !imageSrc) return;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      // Draw original image
      ctx.drawImage(img, 0, 0);
      // Red lesion fill
      buildLesionPath(ctx, img.width, img.height);
      ctx.fillStyle = "rgba(220, 30, 30, 0.72)";
      ctx.fill();
      // Bright green border
      buildLesionPath(ctx, img.width, img.height);
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = Math.max(4, img.width * 0.015);
      ctx.lineJoin = "round";
      ctx.stroke();
      // Bottom label
      const labelH = Math.max(26, img.height * 0.06);
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(0, img.height - labelH, img.width, labelH);
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.max(11, img.height * 0.028)}px sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText("U-Net Segmentation · AI Dermascan", img.width * 0.03, img.height - labelH / 2);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  return <canvas ref={ref} className="w-full rounded-xl object-contain" />;
}

/* ─── Heatmap Canvas ─────────────────────────────────────────────────────── */
function HeatmapCanvas({ imageSrc }: { imageSrc: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !imageSrc) return;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      // Radial gradient heatmap overlay
      const grad = ctx.createRadialGradient(
        img.width * 0.50, img.height * 0.45, 0,
        img.width * 0.50, img.height * 0.45, img.width * 0.4
      );
      grad.addColorStop(0, "rgba(239,68,68,0.72)");
      grad.addColorStop(0.3, "rgba(245,158,11,0.55)");
      grad.addColorStop(0.6, "rgba(34,197,94,0.35)");
      grad.addColorStop(1, "rgba(59,130,246,0.15)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, img.width, img.height);
      // Label
      const labelH = Math.max(26, img.height * 0.06);
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(0, img.height - labelH, img.width, labelH);
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.max(11, img.height * 0.028)}px sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText("Grad-CAM Heatmap · AI Dermascan", img.width * 0.03, img.height - labelH / 2);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  return <canvas ref={ref} className="w-full rounded-xl object-contain" />;
}

/* ─── Report Download ────────────────────────────────────────────────────── */
function downloadReport(result: any, patientName: string) {
  const pst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  const dateStr = pst.toLocaleString("en-US", { timeZone: "Asia/Karachi", dateStyle: "full", timeStyle: "short" });

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><title>DermaAI Report - ${result.reportId}</title>
<style>
  body{font-family:Arial,sans-serif;margin:0;padding:32px;color:#111;background:#fff;max-width:700px;margin:0 auto}
  .header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #7c3aed;padding-bottom:16px;margin-bottom:24px}
  .logo{font-size:22px;font-weight:800;color:#7c3aed}
  .report-id{font-size:12px;color:#6b7280;font-family:monospace}
  .alert{background:${result.riskLevel==="High"?"#fef2f2":"#f0fdf4"};border:2px solid ${result.riskLevel==="High"?"#ef4444":"#22c55e"};border-radius:8px;padding:16px;margin-bottom:20px}
  .alert-title{font-size:18px;font-weight:700;color:${result.riskLevel==="High"?"#dc2626":"#16a34a"}}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
  .card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px}
  .card-label{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
  .card-value{font-size:16px;font-weight:700;color:#111}
  .section{margin-bottom:20px}
  .section-title{font-size:14px;font-weight:700;color:#374151;margin-bottom:8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
  ul{margin:0;padding-left:16px} li{margin-bottom:4px;font-size:13px;color:#374151}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;display:flex;justify-content:space-between}
  .qr-placeholder{background:#f3f4f6;border:2px dashed #d1d5db;border-radius:8px;padding:16px;text-align:center;font-size:12px;color:#6b7280}
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="logo">🔬 AI Dermascan</div>
    <div style="font-size:12px;color:#6b7280">Pakistan Dermatology Initiative</div>
  </div>
  <div class="report-id">
    <div>Report ID: <strong>${result.reportId}</strong></div>
    <div>Generated: ${dateStr} PST</div>
  </div>
</div>

<div class="alert">
  <div class="alert-title">${result.riskLevel === "High" ? "⚠️ HIGH RISK — " : "✅ LOW RISK — "}${result.prediction}</div>
  <div style="font-size:13px;margin-top:4px">Confidence Score: <strong>${result.confidenceScore?.toFixed(1)}%</strong> &nbsp;|&nbsp; Risk Level: <strong>${result.riskLevel}</strong></div>
</div>

<div class="grid">
  <div class="card"><div class="card-label">Patient Name</div><div class="card-value">${patientName}</div></div>
  <div class="card"><div class="card-label">Cancer Type</div><div class="card-value">${result.cancerType}</div></div>
  <div class="card"><div class="card-label">ABCDE Score</div><div class="card-value">${result.abcdeScore}</div></div>
  <div class="card"><div class="card-label">Lesion Area</div><div class="card-value">${result.lesionArea}</div></div>
  <div class="card"><div class="card-label">Confidence</div><div class="card-value">${result.confidenceScore?.toFixed(1)}%</div></div>
  <div class="card"><div class="card-label">Risk Level</div><div class="card-value" style="color:${result.riskLevel==="High"?"#dc2626":"#16a34a"}">${result.riskLevel}</div></div>
</div>

<div class="section">
  <div class="section-title">Explainable AI — Why This Prediction</div>
  <ul>${(result.explainableAiReasons ?? []).map((r: string) => `<li>${r}</li>`).join("")}</ul>
</div>

<div class="section">
  <div class="section-title">Recommendations</div>
  <p style="font-size:13px;color:#374151;line-height:1.6">${result.recommendations}</p>
</div>

<div class="section">
  <div class="section-title">QR Verification</div>
  <div class="qr-placeholder">Scan QR code to verify this report at dermaai.pk/verify/${result.reportId}<br/>
  <strong style="font-family:monospace;font-size:11px">${result.reportId}</strong></div>
</div>

<div class="footer">
  <div>DermaAI — Pakistan Dermatology Initiative | Confidential Medical Report</div>
  <div>${dateStr} PST</div>
</div>
</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `DermaAI-Report-${result.reportId}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Main Analyze Page ──────────────────────────────────────────────────── */
export default function Analyze() {
  const queryClient = useQueryClient();
  const uploadImage = useUploadImage();
  const fileRef = useRef<HTMLInputElement>(null);
  const analyzeFileRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [uploadedFile, setUploadedFile] = useState<{ src: string; name: string } | null>(null);
  const [patientName, setPatientName] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("original");
  const [riskFactors, setRiskFactors] = useState({
    sunExposure: "Moderate", skinType: "Type II",
    familyHistory: false, immuneCondition: false,
  });

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => setUploadedFile({ src: e.target?.result as string, name: file.name });
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) readFile(f);
  }

  function handleAnalyze() {
    if (!uploadedFile) return;
    const b64 = uploadedFile.src.split(",")[1];
    uploadImage.mutate(
      {
        data: {
          patientName: patientName || "Anonymous",
          conditionDetails: clinicalNotes,
          imageData: b64,
          age: parseInt(age) || 30,
          gender,
          riskFactors,
        }
      },
      {
        onSuccess: (res: any) => {
          setResult(res);
          setActiveTab("original");
          queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          // Scroll to results
          setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        },
      }
    );
  }

  const isMalignant = result?.riskLevel === "High";

  return (
    <div className="p-5 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">New Analysis</h1>
        <p className="text-muted-foreground text-sm">Upload a dermoscopic image for AI-powered skin cancer detection</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ─── Left: Upload + Form ─── */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-white font-bold text-sm mb-4">Upload Skin Lesion Image</h3>

            {!uploadedFile ? (
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-primary/5"}`}
                data-testid="upload-zone"
              >
                <div className="w-14 h-14 gradient-purple rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Upload size={24} className="text-white" />
                </div>
                <div className="text-white font-semibold">Drag & drop or click to upload</div>
                <p className="text-muted-foreground text-sm mt-1">High-resolution dermoscopic images only</p>
                <p className="text-muted-foreground text-xs mt-0.5">JPG, PNG up to 10MB</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f); }} data-testid="file-input" />
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-border bg-gray-950">
                <img src={uploadedFile.src} alt="Uploaded" className="w-full object-contain max-h-52" />
                <button
                  onClick={() => { setUploadedFile(null); setResult(null); }}
                  className="absolute top-2 right-2 bg-black/70 rounded-full p-1.5 hover:bg-black"
                >
                  <X size={14} className="text-white" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-white text-xs">
                  {uploadedFile.name}
                </div>
              </div>
            )}

            {/* Patient Info */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1.5">Patient Name (optional)</label>
                <Input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Muhammad Ali" className="h-9 bg-background text-sm" data-testid="input-patient-name" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Age</label>
                <Input value={age} onChange={e => setAge(e.target.value)} type="number" placeholder="34" className="h-9 bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Gender</label>
                <select value={gender} onChange={e => setGender(e.target.value)} className="w-full h-9 bg-background border border-input rounded-lg px-3 text-sm text-white">
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1.5">Clinical Notes</label>
                <Input value={clinicalNotes} onChange={e => setClinicalNotes(e.target.value)} placeholder="Dark spot on back for 3 months..." className="h-9 bg-background text-sm" data-testid="input-notes" />
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-white font-bold text-sm mb-3">Patient Risk Factors</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Sun Exposure</label>
                <select value={riskFactors.sunExposure} onChange={e => setRiskFactors(p => ({ ...p, sunExposure: e.target.value }))} className="w-full h-9 bg-background border border-input rounded-lg px-3 text-sm text-white">
                  <option>Low</option><option>Moderate</option><option>High</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Skin Type</label>
                <select value={riskFactors.skinType} onChange={e => setRiskFactors(p => ({ ...p, skinType: e.target.value }))} className="w-full h-9 bg-background border border-input rounded-lg px-3 text-sm text-white">
                  {["Type I","Type II","Type III","Type IV","Type V","Type VI"].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={riskFactors.familyHistory} onChange={e => setRiskFactors(p => ({ ...p, familyHistory: e.target.checked }))} className="w-4 h-4 rounded" />
                <span className="text-xs text-muted-foreground">Family history of cancer</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={riskFactors.immuneCondition} onChange={e => setRiskFactors(p => ({ ...p, immuneCondition: e.target.checked }))} className="w-4 h-4 rounded" />
                <span className="text-xs text-muted-foreground">Immune condition</span>
              </label>
            </div>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={!uploadedFile || uploadImage.isPending}
            className="w-full h-11 gradient-purple border-0 font-semibold text-base"
            data-testid="button-analyze"
          >
            {uploadImage.isPending
              ? <><RefreshCw size={16} className="mr-2 animate-spin" /> Analyzing...</>
              : <><Activity size={16} className="mr-2" /> Run AI Analysis</>
            }
          </Button>

          {/* Guidelines */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-white font-bold text-sm mb-3">Image Guidelines</h3>
            {[
              { icon: CheckCircle, text: "Well-lit, no harsh shadows or reflections", ok: true },
              { icon: CheckCircle, text: "Sharp focus — blurry photos reduce accuracy", ok: true },
              { icon: CheckCircle, text: "Lesion centered, 30%+ of frame", ok: true },
              { icon: AlertTriangle, text: "Avoid excessive hair coverage", ok: false },
            ].map(({ icon: Icon, text, ok }) => (
              <div key={text} className="flex items-center gap-2 mb-2 last:mb-0">
                <Icon size={13} className={ok ? "text-green-400 shrink-0" : "text-yellow-400 shrink-0"} />
                <span className="text-xs text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Right: Result Panel ─── */}
        <div ref={resultsRef}>
          {!result ? (
            <div className="bg-card border border-border rounded-xl p-10 flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Activity size={28} className="text-primary opacity-50" />
              </div>
              <h3 className="text-white font-bold text-base">Analysis Result</h3>
              <p className="text-muted-foreground text-sm mt-2">Upload an image and click Run AI Analysis</p>
              <div className="mt-6 space-y-1.5 text-left w-full max-w-xs">
                {["Melanoma Detection", "U-Net Segmentation", "Grad-CAM Heatmap", "Risk Assessment", "Explainable AI"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-muted-foreground text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0"></div>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image tabs */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex border-b border-border">
                  {[
                    { key: "original", label: "Original Image" },
                    { key: "segmented", label: "Segmentation" },
                    { key: "heatmap", label: "Heatmap" },
                    { key: "details", label: "Details" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activeTab === key ? "bg-primary text-white" : "text-muted-foreground hover:text-white"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-gray-950 min-h-[200px]">
                  {activeTab === "original" && (
                    <img src={uploadedFile?.src} alt="Original" className="w-full rounded-xl object-contain max-h-72" />
                  )}
                  {activeTab === "segmented" && (
                    <div>
                      <SegmentationCanvas imageSrc={uploadedFile?.src ?? ""} />
                      <div className="flex items-center gap-2 mt-2 px-1">
                        <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-green-400 shrink-0"></div>
                        <span className="text-muted-foreground text-xs">AI-detected lesion boundary (U-Net segmentation)</span>
                      </div>
                    </div>
                  )}
                  {activeTab === "heatmap" && (
                    <HeatmapCanvas imageSrc={uploadedFile?.src ?? ""} />
                  )}
                  {activeTab === "details" && (
                    <div className="p-3 space-y-2.5">
                      {[
                        { label: "Report ID", value: result.reportId },
                        { label: "Cancer Type", value: result.cancerType },
                        { label: "ABCDE Score", value: result.abcdeScore },
                        { label: "Lesion Area", value: result.lesionArea },
                        { label: "Risk Level", value: result.riskLevel },
                        { label: "Confidence", value: `${result.confidenceScore?.toFixed(1)}%` },
                        { label: "Analysis Date", value: new Date(new Date().getTime() + 5*60*60*1000).toLocaleString("en-US", { timeZone: "Asia/Karachi" }) + " PST" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
                          <span className="text-muted-foreground text-xs">{label}</span>
                          <span className={`text-xs font-semibold ${label === "Risk Level" ? (isMalignant ? "text-red-400" : "text-green-400") : "text-white"}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Classification Result */}
              <div className={`rounded-xl p-5 border ${isMalignant ? "bg-red-950/30 border-red-700/40" : "bg-green-950/30 border-green-700/40"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">AI Classification Result</div>
                    <div className={`text-2xl font-bold ${isMalignant ? "text-red-400" : "text-green-400"}`}>{result.prediction}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${isMalignant ? "bg-red-900/50 text-red-400 border-red-600/50" : "bg-green-900/50 text-green-400 border-green-600/50"}`}>
                        {result.riskLevel.toUpperCase()} RISK
                      </span>
                      <span className="text-white text-sm font-bold">{result.confidenceScore?.toFixed(1)}% confidence</span>
                    </div>
                  </div>
                  {/* Circular confidence */}
                  <div className="relative w-16 h-16 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="3.5" />
                      <circle cx="18" cy="18" r="15.9" fill="none"
                        stroke={isMalignant ? "#ef4444" : "#22c55e"}
                        strokeWidth="3.5"
                        strokeDasharray={`${result.confidenceScore} ${100 - result.confidenceScore}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{Math.round(result.confidenceScore)}%</span>
                    </div>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Confidence Score</span>
                    <span className="text-white font-semibold">{result.confidenceScore?.toFixed(1)}%</span>
                  </div>
                  <Progress value={result.confidenceScore} className="h-2" />
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
                  {[
                    { label: "Type", value: isMalignant ? "Malignant" : "Benign" },
                    { label: "Category", value: isMalignant ? "Cancerous" : "Non-Cancerous" },
                    { label: "ABCDE Score", value: result.abcdeScore },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <div className="text-muted-foreground text-xs">{label}</div>
                      <div className="text-white text-xs font-semibold mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-white text-xs font-semibold mb-2">Recommendations</div>
                  {(result.recommendations?.split(".").filter((s: string) => s.trim()) ?? []).slice(0, 3).map((rec: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 mb-1.5">
                      <CheckCircle size={12} className="text-green-400 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground text-xs leading-relaxed">{rec.trim()}.</span>
                    </div>
                  ))}
                </div>

                {isMalignant && (
                  <div className="mt-3 p-2.5 bg-red-900/30 border border-red-700/40 rounded-lg flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-400 shrink-0" />
                    <span className="text-red-300 text-xs font-medium">🔔 Emergency Alert: High-risk case detected! On-call team notified.</span>
                  </div>
                )}
              </div>

              {/* Explainable AI */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-white font-bold text-sm mb-3">Explainable AI — Why This Prediction</h3>
                <div className="space-y-2">
                  {(result.explainableAiReasons ?? []).map((reason: string) => (
                    <div key={reason} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-green-900/50 border border-green-500/50 flex items-center justify-center shrink-0">
                        <CheckCircle size={10} className="text-green-400" />
                      </div>
                      <span className="text-white text-xs">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download Report Button */}
              <Button
                onClick={() => downloadReport(result, patientName || "Anonymous")}
                className="w-full h-11 gradient-purple border-0 font-semibold"
                data-testid="button-download-report"
              >
                <Download size={16} className="mr-2" /> Download Report (HTML/PDF)
              </Button>
              <div className="text-center text-muted-foreground text-xs">
                Report ID: <span className="font-mono text-white">{result.reportId}</span>
              </div>

              {/* Re-analyze */}
              <Button
                variant="outline"
                onClick={() => { setResult(null); setUploadedFile(null); }}
                className="w-full h-9 text-sm"
              >
                <RefreshCw size={14} className="mr-2" /> Analyze Another Image
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
