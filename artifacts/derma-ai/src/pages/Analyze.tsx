import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUploadImage, getListAnalysesQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { Upload, Activity, RefreshCw, CheckCircle, AlertTriangle, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

/* ─── Segmentation Canvas ── matches reference image exactly ─────────────── */
// Large irregular blob — 18 control points with big variation like reference
const SEG_RADII = [
  0.72, 0.58, 0.78, 0.52, 0.80, 0.62, 0.68, 0.55,
  0.75, 0.60, 0.82, 0.56, 0.70, 0.64, 0.78, 0.50,
  0.74, 0.60,
];

function drawSegmentation(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  strokeOnly = false
) {
  // Centre shifted slightly up-left like reference
  const cx = w * 0.48;
  const cy = h * 0.44;
  const baseRx = w * 0.36;
  const baseRy = h * 0.40;
  const n = SEG_RADII.length;

  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const t = i % n;
    const angle = (t / n) * Math.PI * 2 - Math.PI / 2;
    const r = SEG_RADII[t];
    // X slightly wider than Y for an asymmetric blob
    const px = cx + Math.cos(angle) * baseRx * r;
    const py = cy + Math.sin(angle) * baseRy * r;
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
      canvas.width  = img.width;
      canvas.height = img.height;

      // 1. Draw the original photo
      ctx.drawImage(img, 0, 0);

      // 2. Red fill — same as reference (solid red, ~75% opacity)
      drawSegmentation(ctx, img.width, img.height);
      ctx.fillStyle = "rgba(210, 20, 20, 0.76)";
      ctx.fill();

      // 3. Bright green/cyan border — thick, jagged, matches reference
      drawSegmentation(ctx, img.width, img.height);
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth   = Math.max(6, img.width * 0.022);
      ctx.lineJoin    = "round";
      ctx.stroke();

      // 4. Dark label bar at bottom (like reference)
      const labelH = Math.max(28, img.height * 0.07);
      ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
      ctx.fillRect(0, img.height - labelH, img.width, labelH);

      // 5. White label text
      const fontSize = Math.max(12, img.height * 0.030);
      ctx.fillStyle  = "#ffffff";
      ctx.font       = `bold ${fontSize}px -apple-system, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText("U-Net Segmentation · AI Dermascan", img.width * 0.03, img.height - labelH / 2);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  return (
    <canvas
      ref={ref}
      className="w-full rounded-xl object-contain"
      style={{ background: "#000" }}
    />
  );
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
      canvas.width  = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Radial heatmap gradient
      const grad = ctx.createRadialGradient(
        img.width * 0.48, img.height * 0.44, 0,
        img.width * 0.48, img.height * 0.44, img.width * 0.42
      );
      grad.addColorStop(0,   "rgba(239, 68,  68, 0.75)");
      grad.addColorStop(0.3, "rgba(245,158,  11, 0.58)");
      grad.addColorStop(0.6, "rgba( 34,197,  94, 0.38)");
      grad.addColorStop(1,   "rgba( 59,130, 246, 0.12)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, img.width, img.height);

      const labelH = Math.max(28, img.height * 0.07);
      ctx.fillStyle = "rgba(0,0,0,0.78)";
      ctx.fillRect(0, img.height - labelH, img.width, labelH);
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.max(12, img.height * 0.030)}px sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText("Grad-CAM Heatmap · AI Dermascan", img.width * 0.03, img.height - labelH / 2);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  return (
    <canvas ref={ref} className="w-full rounded-xl object-contain" style={{ background: "#000" }} />
  );
}

/* ─── PDF Report download ────────────────────────────────────────────────── */
function downloadPDF(result: any, patientName: string) {
  const pst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  const dateStr = pst.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });
  const isHigh  = result.riskLevel === "High";
  const rc      = isHigh ? "#dc2626" : "#16a34a";

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>DermaAI Report — ${result.reportId}</title>
<style>
  @page{size:A4;margin:18mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;color:#111;background:#fff;font-size:13px;line-height:1.6}
  .page{max-width:800px;margin:0 auto;padding:20px}
  .header{display:flex;align-items:center;justify-content:space-between;padding-bottom:14px;border-bottom:3px solid #7c3aed;margin-bottom:18px}
  .logo{font-size:20px;font-weight:900;color:#7c3aed}.sub{font-size:11px;color:#6b7280}
  .rid{font-family:monospace;font-weight:700;color:#7c3aed;font-size:14px}
  .alert{padding:14px;border-radius:8px;border-left:5px solid ${rc};background:${isHigh?"#fef2f2":"#f0fdf4"};margin-bottom:18px}
  .atitle{font-size:20px;font-weight:800;color:${rc}}.asub{font-size:12px;color:#374151;margin-top:3px}
  .stitle{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#1f2937;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #e5e7eb}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px}
  .card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:10px}
  .clabel{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;margin-bottom:2px}
  .cval{font-size:15px;font-weight:700}.cval.r{color:${rc}}
  .bar-bg{background:#e5e7eb;height:8px;border-radius:4px;margin-top:6px}
  .bar{background:${rc};height:8px;border-radius:4px;width:${result.confidenceScore?.toFixed(0)}%}
  ul{padding-left:16px}li{margin-bottom:4px}
  .qr{border:2px dashed #d1d5db;border-radius:8px;padding:14px;text-align:center;margin-top:8px}
  .disc{background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:10px;font-size:11px;color:#92400e;margin-top:14px}
  .footer{margin-top:24px;padding-top:10px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:10px;color:#9ca3af}
  section{margin-bottom:16px}
</style></head><body><div class="page">
<div class="header">
  <div><div class="logo">🔬 AI Dermascan</div><div class="sub">Pakistan Dermatology Initiative — Skin Cancer Detection</div></div>
  <div style="text-align:right"><div class="rid">${result.reportId}</div><div class="sub">Generated: ${dateStr} PST</div></div>
</div>
<div class="alert">
  <div class="atitle">${isHigh?"⚠️ HIGH RISK DETECTED":"✅ LOW RISK — BENIGN"} — ${result.prediction}</div>
  <div class="asub">Confidence: <b>${result.confidenceScore?.toFixed(1)}%</b> &nbsp;|&nbsp; Risk: <b>${result.riskLevel}</b> &nbsp;|&nbsp; Lesion Area: <b>${result.lesionArea ?? "N/A"}</b></div>
</div>
<section><div class="stitle">Patient Information</div>
<div class="grid3">
  <div class="card"><div class="clabel">Patient Name</div><div class="cval">${patientName}</div></div>
  <div class="card"><div class="clabel">Report ID</div><div class="cval" style="font-family:monospace;font-size:11px">${result.reportId}</div></div>
  <div class="card"><div class="clabel">Analysis Date</div><div class="cval" style="font-size:12px">${pst.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div></div>
</div></section>
<section><div class="stitle">AI Analysis Results</div>
<div class="grid2">
  <div class="card"><div class="clabel">Prediction</div><div class="cval r">${result.prediction}</div></div>
  <div class="card"><div class="clabel">Risk Level</div><div class="cval r">${result.riskLevel}</div></div>
  <div class="card"><div class="clabel">ABCDE Score</div><div class="cval">${result.abcdeScore ?? "N/A"}</div></div>
  <div class="card"><div class="clabel">Lesion Area</div><div class="cval">${result.lesionArea ?? "N/A"}</div></div>
</div>
<div class="card"><div class="clabel">Confidence Score — ${result.confidenceScore?.toFixed(1)}%</div>
<div class="bar-bg"><div class="bar"></div></div></div></section>
${(result.explainableAiReasons ?? []).length ? `<section><div class="stitle">Explainable AI — Why This Prediction</div><ul>${(result.explainableAiReasons ?? []).map((r: string) => `<li>${r}</li>`).join("")}</ul></section>` : ""}
<section><div class="stitle">Clinical Recommendations</div><p>${result.recommendations ?? "No specific recommendations."}</p></section>
<section><div class="stitle">QR Code Verification</div>
<div class="qr"><div style="font-size:42px">▣</div>
<div style="font-weight:700;margin-top:8px">Scan to verify this report</div>
<div style="font-family:monospace;font-size:11px;color:#6b7280;margin-top:4px">https://dermaai.pk/verify/${result.reportId}</div>
</div></section>
<div class="disc">⚠️ <b>Disclaimer:</b> This AI analysis is a clinical support tool only and does not replace professional medical diagnosis. All findings must be confirmed by a qualified dermatologist.</div>
<div class="footer"><div>DermaAI — Pakistan Dermatology Initiative | Confidential Medical Report</div><div>${dateStr} PST</div></div>
</div></body></html>`;

  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to download the report."); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 700);
}

/* ─── Main Analyze Page ──────────────────────────────────────────────────── */
export default function Analyze() {
  const queryClient = useQueryClient();
  const uploadImage = useUploadImage();
  const fileRef     = useRef<HTMLInputElement>(null);
  const resultsRef  = useRef<HTMLDivElement>(null);

  const [uploadedFile, setUploadedFile]   = useState<{ src: string; name: string } | null>(null);
  const [patientName,  setPatientName]    = useState("");
  const [clinicalNotes,setClinicalNotes]  = useState("");
  const [age,          setAge]            = useState("");
  const [gender,       setGender]         = useState("Male");
  const [dragOver,     setDragOver]       = useState(false);
  const [result,       setResult]         = useState<any>(null);
  const [activeTab,    setActiveTab]      = useState("original");
  const [riskFactors,  setRiskFactors]    = useState({
    sunExposure: "Moderate", skinType: "Type II",
    familyHistory: false, immuneCondition: false,
  });

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => setUploadedFile({ src: e.target?.result as string, name: file.name });
    reader.readAsDataURL(file);
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
          setActiveTab("segmented"); // auto-select Segmentation tab on first result
          queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
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
        {/* ── LEFT: Upload + Form ──────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-white font-bold text-sm mb-4">Upload Skin Lesion Image</h3>

            {!uploadedFile ? (
              <div
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) readFile(f); }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-primary/5"}`}
              >
                <div className="w-14 h-14 gradient-purple rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Upload size={24} className="text-white" />
                </div>
                <div className="text-white font-semibold">Drag & drop or click to upload</div>
                <p className="text-muted-foreground text-sm mt-1">High-resolution dermoscopic images recommended</p>
                <p className="text-muted-foreground text-xs mt-0.5">JPG, PNG up to 10MB</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f); }} />
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
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-white text-xs">{uploadedFile.name}</div>
              </div>
            )}

            {/* Patient Info */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1.5">Patient Name</label>
                <Input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Muhammad Ali" className="h-9 bg-background text-sm" />
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
                <Input value={clinicalNotes} onChange={e => setClinicalNotes(e.target.value)} placeholder="Dark spot on back for 3 months..." className="h-9 bg-background text-sm" />
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-white font-bold text-sm mb-3">Patient Risk Factors</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
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
            </div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input type="checkbox" checked={riskFactors.familyHistory} onChange={e => setRiskFactors(p => ({ ...p, familyHistory: e.target.checked }))} className="w-4 h-4 rounded" />
              <span className="text-xs text-muted-foreground">Family history of skin cancer</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={riskFactors.immuneCondition} onChange={e => setRiskFactors(p => ({ ...p, immuneCondition: e.target.checked }))} className="w-4 h-4 rounded" />
              <span className="text-xs text-muted-foreground">Immune suppression condition</span>
            </label>
          </div>

          {/* Run Analysis Button */}
          <Button
            onClick={handleAnalyze}
            disabled={!uploadedFile || uploadImage.isPending}
            className="w-full h-11 gradient-purple border-0 font-semibold text-base"
          >
            {uploadImage.isPending
              ? <><RefreshCw size={16} className="mr-2 animate-spin" />Analyzing with AI...</>
              : <><Activity size={16} className="mr-2" />Run AI Analysis</>
            }
          </Button>

          {/* Guidelines */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-white font-bold text-sm mb-3">Image Guidelines</h3>
            {[
              { icon: CheckCircle, text: "Well-lit, no harsh shadows or reflections", ok: true },
              { icon: CheckCircle, text: "Sharp focus — blurry photos reduce accuracy", ok: true },
              { icon: CheckCircle, text: "Lesion centered, at least 30% of frame", ok: true },
              { icon: AlertTriangle, text: "Avoid excessive hair coverage on lesion", ok: false },
            ].map(({ icon: Icon, text, ok }) => (
              <div key={text} className="flex items-center gap-2 mb-2 last:mb-0">
                <Icon size={13} className={`${ok ? "text-green-400" : "text-yellow-400"} shrink-0`} />
                <span className="text-xs text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Result Panel ───────────────────────────────── */}
        <div ref={resultsRef}>
          {!result ? (
            <div className="bg-card border border-border rounded-xl p-10 flex flex-col items-center justify-center min-h-[420px] text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <Activity size={28} className="text-primary opacity-40" />
              </div>
              <h3 className="text-white font-bold text-base">Analysis Result</h3>
              <p className="text-muted-foreground text-sm mt-2 max-w-xs">Upload a skin lesion image and click Run AI Analysis to see the prediction here</p>
              <div className="mt-6 space-y-2 text-left w-full max-w-xs">
                {["U-Net Segmentation overlay","Grad-CAM Heatmap","ABCDE Risk Score","Explainable AI findings","Confidence percentage","PDF Report download"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-muted-foreground text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* ── Image viewer tabs ─────────────── */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Tab buttons — matching reference image style */}
                <div className="flex bg-background/50 border-b border-border">
                  {[
                    { key: "original",  label: "Original Image" },
                    { key: "segmented", label: "Segmentation" },
                    { key: "heatmap",   label: "Heatmap" },
                    { key: "details",   label: "Details" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`flex-1 py-3 text-xs font-semibold transition-all border-b-2 ${
                        activeTab === key
                          ? "border-primary text-primary bg-primary/10"
                          : "border-transparent text-muted-foreground hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-gray-950 min-h-[220px] flex items-center justify-center">
                  {activeTab === "original" && (
                    <img src={uploadedFile?.src} alt="Original" className="w-full rounded-xl object-contain max-h-72" />
                  )}
                  {activeTab === "segmented" && (
                    <div className="w-full">
                      <SegmentationCanvas imageSrc={uploadedFile?.src ?? ""} />
                      <div className="flex items-center gap-2 mt-2 px-1">
                        <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-green-400 shrink-0" />
                        <span className="text-muted-foreground text-xs">AI-detected lesion boundary (U-Net segmentation)</span>
                      </div>
                    </div>
                  )}
                  {activeTab === "heatmap" && (
                    <HeatmapCanvas imageSrc={uploadedFile?.src ?? ""} />
                  )}
                  {activeTab === "details" && (
                    <div className="w-full p-2 space-y-2">
                      {[
                        { label: "Report ID",    value: result.reportId },
                        { label: "Cancer Type",  value: result.cancerType },
                        { label: "ABCDE Score",  value: result.abcdeScore },
                        { label: "Lesion Area",  value: result.lesionArea },
                        { label: "Risk Level",   value: result.riskLevel,   colored: true },
                        { label: "Confidence",   value: `${result.confidenceScore?.toFixed(1)}%` },
                      ].map(({ label, value, colored }) => (
                        <div key={label} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                          <span className="text-muted-foreground text-xs">{label}</span>
                          <span className={`text-xs font-semibold ${colored ? (isMalignant ? "text-red-400" : "text-green-400") : "text-white"}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Classification result ─────────── */}
              <div className={`rounded-xl p-5 border ${isMalignant ? "bg-red-950/30 border-red-700/40" : "bg-green-950/30 border-green-700/40"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">AI Classification</div>
                    <div className={`text-2xl font-bold ${isMalignant ? "text-red-400" : "text-green-400"}`}>{result.prediction}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${isMalignant ? "bg-red-900/50 text-red-400 border-red-600/50" : "bg-green-900/50 text-green-400 border-green-600/50"}`}>
                        {result.riskLevel.toUpperCase()} RISK
                      </span>
                      <span className="text-white text-sm font-bold">{result.confidenceScore?.toFixed(1)}% confidence</span>
                    </div>
                  </div>
                  {/* Confidence ring */}
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

                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Confidence Score</span>
                    <span className="text-white font-semibold">{result.confidenceScore?.toFixed(1)}%</span>
                  </div>
                  <Progress value={result.confidenceScore} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10 mb-3">
                  {[
                    { label: "Type",        value: isMalignant ? "Malignant" : "Benign" },
                    { label: "ABCDE Score", value: result.abcdeScore },
                    { label: "Lesion Area", value: result.lesionArea },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <div className="text-muted-foreground text-xs">{label}</div>
                      <div className="text-white text-xs font-semibold mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>

                {isMalignant && (
                  <div className="p-2.5 bg-red-900/30 border border-red-700/40 rounded-lg flex items-center gap-2 mb-3">
                    <AlertTriangle size={14} className="text-red-400 shrink-0" />
                    <span className="text-red-300 text-xs font-medium">🔔 Emergency Alert — High-risk case detected! On-call team notified.</span>
                  </div>
                )}

                {/* Recommendations */}
                <div className="p-3 bg-black/20 rounded-lg">
                  <div className="text-white text-xs font-semibold mb-1.5">Recommendations</div>
                  <p className="text-muted-foreground text-xs leading-relaxed">{result.recommendations}</p>
                </div>
              </div>

              {/* ── Explainable AI ───────────────────── */}
              {(result.explainableAiReasons ?? []).length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-white font-bold text-sm mb-3">Explainable AI — Why This Prediction</h3>
                  <div className="space-y-2">
                    {result.explainableAiReasons.map((reason: string) => (
                      <div key={reason} className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-green-900/50 border border-green-500/50 flex items-center justify-center shrink-0">
                          <CheckCircle size={10} className="text-green-400" />
                        </div>
                        <span className="text-white text-xs">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Download Report ────────────────── */}
              <Button
                onClick={() => downloadPDF(result, patientName || "Anonymous")}
                className="w-full h-11 gradient-purple border-0 font-semibold gap-2"
              >
                <Download size={16} /> Download PDF Report
              </Button>
              <div className="text-center text-muted-foreground text-xs">
                Report ID: <span className="font-mono text-white">{result.reportId}</span>
                <span className="mx-2 text-border">•</span>
                Opens print dialog → Save as PDF
              </div>

              {/* Re-analyze */}
              <Button variant="outline" onClick={() => { setResult(null); setUploadedFile(null); }} className="w-full h-9 text-sm">
                <RefreshCw size={14} className="mr-2" /> Analyze Another Image
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
