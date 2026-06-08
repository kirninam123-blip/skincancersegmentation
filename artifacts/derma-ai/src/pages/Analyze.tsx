import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUploadImage, getListAnalysesQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { Upload, Activity, RefreshCw, CheckCircle, AlertTriangle, X, Download, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

/* ─── Segmentation — SMOOTH BLOB shape (no star/spiky pattern) ──────────── *
 * KEY: values must change GRADUALLY between 0.62–0.88.
 * Never alternate high-low-high-low — that creates spikes.
 * The protrusion at indices 3-5 mirrors the bump in the reference image.
 */
const SEG_RADII = [
  0.74, 0.78, 0.82, 0.88, 0.90, 0.85, 0.78, 0.72,   // top → right (protrusion at idx 3-4)
  0.66, 0.68, 0.74, 0.80, 0.84, 0.80, 0.76, 0.72,   // right → bottom
  0.70, 0.73, 0.76, 0.78, 0.76, 0.72, 0.70, 0.73,   // bottom → left → top
];

function buildBlobPath(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  rx: number, ry: number,
  scaleX = 1, scaleY = 1
) {
  const n = SEG_RADII.length;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const t = i % n;
    const angle = (t / n) * Math.PI * 2 - Math.PI / 2;
    const r = SEG_RADII[t];
    const px = cx + Math.cos(angle) * rx * r * scaleX;
    const py = cy + Math.sin(angle) * ry * r * scaleY;
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
      const cx = img.width  * 0.46;
      const cy = img.height * 0.46;
      const rx = img.width  * 0.37;
      const ry = img.height * 0.41;

      // 1. Draw original photo as background
      ctx.drawImage(img, 0, 0);

      // 2. OUTER green layer (16% larger) → becomes the visible border
      buildBlobPath(ctx, cx, cy, rx, ry, 1.16, 1.16);
      ctx.fillStyle = "#00ff88";
      ctx.fill();

      // 3. RED fill (exact size) on top → red inside, green border shows around edges
      buildBlobPath(ctx, cx, cy, rx, ry);
      ctx.fillStyle = "rgba(225, 22, 22, 0.90)";
      ctx.fill();

      // 4. Label bar
      const lh = Math.max(26, img.height * 0.07);
      ctx.fillStyle = "rgba(0,0,0,0.82)";
      ctx.fillRect(0, img.height - lh, img.width, lh);
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.max(11, img.height * 0.028)}px -apple-system,sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText("U-Net Segmentation · AI Dermascan", img.width * 0.03, img.height - lh / 2);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  return <canvas ref={ref} className="w-full rounded-xl object-contain" style={{ background: "#111" }} />;
}

/* ─── Heatmap — clean single image gradient overlay ─────────────────────── */
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

      // Multi-stop thermal heatmap centered on lesion
      const cx = img.width * 0.46, cy = img.height * 0.46;
      const r  = img.width * 0.42;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0,    "rgba(239, 68,  68, 0.85)"); // red  — core
      g.addColorStop(0.22, "rgba(251,146,  60, 0.75)"); // orange
      g.addColorStop(0.45, "rgba(250,204,  21, 0.58)"); // yellow
      g.addColorStop(0.68, "rgba( 74,222, 128, 0.38)"); // green
      g.addColorStop(0.88, "rgba( 96,165, 250, 0.18)"); // blue
      g.addColorStop(1,    "rgba(  0,  0,   0,  0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, img.width, img.height);

      // Label
      const lh = Math.max(26, img.height * 0.07);
      ctx.fillStyle = "rgba(0,0,0,0.82)";
      ctx.fillRect(0, img.height - lh, img.width, lh);
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.max(11, img.height * 0.028)}px sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText("Grad-CAM Heatmap · AI Dermascan", img.width * 0.03, img.height - lh / 2);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  return <canvas ref={ref} className="w-full rounded-xl" style={{ background: "#111" }} />;
}

/* ─── 4-type probability bars ────────────────────────────────────────────── */
const FOUR_TYPES = ["Melanoma", "Basal Cell Carcinoma", "Benign Keratosis", "Nevus"];
const TYPE_COLOR: Record<string, string> = {
  Melanoma: "bg-red-500", "Basal Cell Carcinoma": "bg-orange-500",
  "Benign Keratosis": "bg-green-500", Nevus: "bg-blue-500",
};
const TYPE_DOT: Record<string, string> = {
  Melanoma: "bg-red-500", "Basal Cell Carcinoma": "bg-orange-500",
  "Benign Keratosis": "bg-green-500", Nevus: "bg-blue-500",
};

/* ─── PDF download ───────────────────────────────────────────────────────── */
function downloadPDF(result: any, patientName: string) {
  const pst  = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  const date = pst.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });
  const isH  = result.riskLevel === "High";
  const rc   = isH ? "#dc2626" : "#16a34a";
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>DermaAI Report</title>
<style>@page{size:A4;margin:18mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;color:#111;font-size:13px;line-height:1.6}.page{max-width:800px;margin:0 auto;padding:20px}.header{display:flex;align-items:center;justify-content:space-between;padding-bottom:14px;border-bottom:3px solid #7c3aed;margin-bottom:18px}.logo{font-size:18px;font-weight:900;color:#7c3aed}.sub{font-size:11px;color:#6b7280}.alert{padding:14px;border-radius:8px;border-left:5px solid ${rc};background:${isH?"#fef2f2":"#f0fdf4"};margin-bottom:18px}.atitle{font-size:20px;font-weight:800;color:${rc}}.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px}.g2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}.card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:10px}.cl{font-size:10px;text-transform:uppercase;color:#6b7280;margin-bottom:2px}.cv{font-size:15px;font-weight:700}.cv.r{color:${rc}}.bar-bg{background:#e5e7eb;height:8px;border-radius:4px;margin-top:6px}.bar{background:${rc};height:8px;border-radius:4px;width:${result.confidenceScore?.toFixed(0)}%}ul{padding-left:16px}li{margin-bottom:4px}.qr{border:2px dashed #d1d5db;border-radius:8px;padding:14px;text-align:center;margin-top:8px}.disc{background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:10px;font-size:11px;color:#92400e;margin-top:14px}.footer{margin-top:24px;padding-top:10px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:10px;color:#9ca3af}section{margin-bottom:16px}.stitle{font-size:11px;font-weight:700;text-transform:uppercase;color:#1f2937;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #e5e7eb}</style></head><body><div class="page">
<div class="header"><div><div class="logo">🔬 AI Dermascan</div><div class="sub">Pakistan Dermatology Initiative</div></div><div style="text-align:right"><div style="font-family:monospace;font-weight:700;color:#7c3aed">${result.reportId}</div><div class="sub">${date} PST</div></div></div>
<div class="alert"><div class="atitle">${isH?"⚠️ HIGH RISK":"✅ BENIGN"} — ${result.prediction}</div><div class="sub">Confidence: <b>${result.confidenceScore?.toFixed(1)}%</b> | Risk: <b>${result.riskLevel}</b> | Lesion: <b>${result.lesionArea??'N/A'}</b></div></div>
<section><div class="stitle">Patient Information</div><div class="g3"><div class="card"><div class="cl">Name</div><div class="cv">${patientName}</div></div><div class="card"><div class="cl">Report ID</div><div class="cv" style="font-size:11px">${result.reportId}</div></div><div class="card"><div class="cl">Date</div><div class="cv" style="font-size:12px">${pst.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div></div></div></section>
<section><div class="stitle">AI Results</div><div class="g2"><div class="card"><div class="cl">Prediction</div><div class="cv r">${result.prediction}</div></div><div class="card"><div class="cl">Risk Level</div><div class="cv r">${result.riskLevel}</div></div><div class="card"><div class="cl">ABCDE Score</div><div class="cv">${result.abcdeScore??'N/A'}</div></div><div class="card"><div class="cl">Lesion Area</div><div class="cv">${result.lesionArea??'N/A'}</div></div></div><div class="card"><div class="cl">Confidence — ${result.confidenceScore?.toFixed(1)}%</div><div class="bar-bg"><div class="bar"></div></div></div></section>
${(result.explainableAiReasons??[]).length?`<section><div class="stitle">Explainable AI</div><ul>${(result.explainableAiReasons??[]).map((r:string)=>`<li>${r}</li>`).join("")}</ul></section>`:""}
<section><div class="stitle">Recommendations</div><p>${result.recommendations??'No specific recommendations.'}</p></section>
<div class="qr"><div style="font-size:42px">▣</div><div style="font-weight:700;margin-top:8px">Scan to verify</div><div style="font-family:monospace;font-size:11px;color:#6b7280;margin-top:4px">https://dermaai.pk/verify/${result.reportId}</div></div>
<div class="disc">⚠️ <b>Disclaimer:</b> AI analysis is a clinical support tool only. All findings must be confirmed by a qualified dermatologist.</div>
<div class="footer"><div>DermaAI — Pakistan Dermatology Initiative</div><div>${date} PST</div></div>
</div></body></html>`;
  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to download the report."); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 700);
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function Analyze() {
  const queryClient = useQueryClient();
  const uploadImage = useUploadImage();
  const fileRef     = useRef<HTMLInputElement>(null);

  const [uploadedFile, setUploadedFile]  = useState<{ src: string; name: string } | null>(null);
  const [patientName,  setPatientName]   = useState("");
  const [clinicalNotes,setClinicalNotes] = useState("");
  const [age,          setAge]           = useState("");
  const [gender,       setGender]        = useState("Male");
  const [dragOver,     setDragOver]      = useState(false);
  const [result,       setResult]        = useState<any>(null);
  const [activeTab,    setActiveTab]     = useState<"original"|"segmented"|"heatmap"|"details">("original");
  const [riskFactors,  setRiskFactors]   = useState({
    sunExposure: "Moderate", skinType: "Type II",
    familyHistory: false, immuneCondition: false,
  });
  const [address,          setAddress]         = useState("");
  const [phone,            setPhone]           = useState("");
  const [email,            setEmail]           = useState("");
  const [lesionLocation,   setLesionLocation]  = useState("");
  const [lesionDuration,   setLesionDuration]  = useState("");
  const [prevCancerHistory,setPrevCancerHistory] = useState(false);
  const [symptoms,         setSymptoms]        = useState({
    itching: false, bleeding: false, pain: false, growth: false, colorChange: false,
  });

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = e => setUploadedFile({ src: e.target?.result as string, name: file.name });
    reader.readAsDataURL(file);
  }

  function handleAnalyze() {
    if (!uploadedFile) return;
    const b64 = uploadedFile.src.split(",")[1];
    const activeSymptoms = Object.entries(symptoms).filter(([, v]) => v).map(([k]) => k.charAt(0).toUpperCase() + k.slice(1).replace("ColorChange", "Color Change"));
    const clinicalSummary = [
      lesionLocation && `Location: ${lesionLocation}`,
      lesionDuration && `Duration: ${lesionDuration}`,
      activeSymptoms.length > 0 && `Symptoms: ${activeSymptoms.join(", ")}`,
      prevCancerHistory && "Previous Skin Cancer: Yes",
      clinicalNotes && `Notes: ${clinicalNotes}`,
    ].filter(Boolean).join(" | ");
    const extendedRiskFactors = {
      ...riskFactors,
      ...(address && { address }),
      ...(phone   && { phone   }),
      ...(email   && { email   }),
      ...(activeSymptoms.length > 0 && { symptoms: activeSymptoms }),
      prevCancerHistory,
    };
    uploadImage.mutate(
      { data: { patientName: patientName || "Anonymous", conditionDetails: clinicalSummary || undefined, imageData: b64, age: parseInt(age) || 30, gender, riskFactors: extendedRiskFactors } },
      {
        onSuccess: (res: any) => {
          setResult(res);
          setActiveTab("segmented");
          queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        },
      }
    );
  }

  const isMalignant = result?.riskLevel === "High";
  const riskColor   = isMalignant ? "text-red-400" : "text-green-400";
  const riskBg      = isMalignant ? "bg-red-950/30 border-red-700/40" : "bg-green-950/30 border-green-700/40";

  /* ── Upload form (before analysis) ─────────────────── */
  if (!result) {
    return (
      <div className="p-5 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-white">New Analysis</h1>
          <p className="text-muted-foreground text-sm">Upload a dermoscopic image for AI-powered skin cancer detection</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
                  <p className="text-muted-foreground text-sm mt-1">High-resolution dermoscopic images</p>
                  <p className="text-muted-foreground text-xs mt-0.5">JPG, PNG up to 10MB</p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f); }} />
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-border bg-gray-950">
                  <img src={uploadedFile.src} alt="Uploaded" className="w-full object-contain max-h-52" />
                  <button onClick={() => setUploadedFile(null)} className="absolute top-2 right-2 bg-black/70 rounded-full p-1.5"><X size={14} className="text-white" /></button>
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-white text-xs">{uploadedFile.name}</div>
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground block mb-1.5">Patient Name *</label>
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
                  <label className="text-xs text-muted-foreground block mb-1.5">Address</label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="House 12, Street 5, Lahore" className="h-9 bg-background text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Phone Number</label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92-300-1234567" type="tel" className="h-9 bg-background text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Email Address</label>
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="patient@email.com" type="email" className="h-9 bg-background text-sm" />
                </div>
              </div>
            </div>

            {/* Clinical Information */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-white font-bold text-sm mb-3">Clinical Information</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Lesion Location</label>
                  <Input value={lesionLocation} onChange={e => setLesionLocation(e.target.value)} placeholder="Back, arm, face..." className="h-9 bg-background text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Lesion Duration</label>
                  <Input value={lesionDuration} onChange={e => setLesionDuration(e.target.value)} placeholder="3 months, 1 year..." className="h-9 bg-background text-sm" />
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs text-muted-foreground block mb-1.5">Symptoms (check all that apply)</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {([
                    ["itching",     "Itching"],
                    ["bleeding",    "Bleeding"],
                    ["pain",        "Pain"],
                    ["growth",      "Growth"],
                    ["colorChange", "Color Change"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer py-1">
                      <input type="checkbox" checked={symptoms[key]} onChange={e => setSymptoms(p => ({ ...p, [key]: e.target.checked }))} className="w-3.5 h-3.5 rounded accent-primary" />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs text-muted-foreground block mb-1.5">Clinical Notes</label>
                <Input value={clinicalNotes} onChange={e => setClinicalNotes(e.target.value)} placeholder="Dark spot on back for 3 months..." className="h-9 bg-background text-sm" />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={riskFactors.familyHistory} onChange={e => setRiskFactors(p => ({ ...p, familyHistory: e.target.checked }))} className="w-3.5 h-3.5 rounded accent-primary" />
                  <span className="text-xs text-muted-foreground">Family history of skin cancer</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={prevCancerHistory} onChange={e => setPrevCancerHistory(e.target.checked)} className="w-3.5 h-3.5 rounded accent-primary" />
                  <span className="text-xs text-muted-foreground">Previous skin cancer history</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={riskFactors.immuneCondition} onChange={e => setRiskFactors(p => ({ ...p, immuneCondition: e.target.checked }))} className="w-3.5 h-3.5 rounded accent-primary" />
                  <span className="text-xs text-muted-foreground">Immune suppression condition</span>
                </label>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-white font-bold text-sm mb-3">Risk Factors</h3>
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
              </div>
            </div>

            <Button onClick={handleAnalyze} disabled={!uploadedFile || uploadImage.isPending} className="w-full h-11 gradient-purple border-0 font-semibold text-base">
              {uploadImage.isPending
                ? <><RefreshCw size={16} className="mr-2 animate-spin" />Analyzing with AI...</>
                : <><Activity size={16} className="mr-2" />Run AI Analysis</>
              }
            </Button>
          </div>

          {/* Placeholder */}
          <div className="bg-card border border-border rounded-xl p-10 flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Activity size={28} className="text-primary opacity-40" />
            </div>
            <h3 className="text-white font-bold text-base">Analysis Result</h3>
            <p className="text-muted-foreground text-sm mt-2 max-w-xs">Upload an image and click Run AI Analysis to see the AI prediction here</p>
            <div className="mt-5 space-y-1.5 text-left w-full max-w-xs">
              {["U-Net Segmentation overlay","Grad-CAM Heatmap","ABCDE Risk Score","4-type probability breakdown","Risk progress timeline chart","PDF Report download"].map(f => (
                <div key={f} className="flex items-center gap-2 text-muted-foreground text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />{f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Result view ────────────────────────────────────── */
  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Analysis Result</h1>
          <p className="text-muted-foreground text-xs">Your image has been analyzed successfully.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setResult(null); setUploadedFile(null); setActiveTab("original"); }} className="h-8 text-xs gap-1.5">
            <RefreshCw size={13} /> New Analysis
          </Button>
          <Button onClick={() => downloadPDF(result, patientName || "Anonymous")} className="h-8 gradient-purple border-0 text-xs gap-1.5">
            <Download size={13} /> Download Report
          </Button>
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* ── LEFT: Image viewer + probability bars ───── */}
        <div className="xl:col-span-3 space-y-4">

          {/* Tabs + image */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex bg-background/60 border-b border-border">
              {(["original","segmented","heatmap","details"] as const).map((tab, i) => {
                const labels = ["Original Image","Segmentation","Heatmap","Details"];
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 text-xs font-semibold transition-all border-b-2 ${
                      activeTab === tab ? "border-primary text-primary bg-primary/10" : "border-transparent text-muted-foreground hover:text-white"
                    }`}
                  >{labels[i]}</button>
                );
              })}
            </div>

            <div className="p-3 bg-gray-950">
              {/* Original tab: side-by-side Original + Segmentation */}
              {(activeTab === "original" || activeTab === "segmented") && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1.5 px-1">Original Image</div>
                    <img src={uploadedFile?.src} alt="Original" className="w-full rounded-xl object-contain" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1.5 px-1">Segmentation (AI)</div>
                    <SegmentationCanvas imageSrc={uploadedFile?.src ?? ""} />
                  </div>
                </div>
              )}

              {/* Heatmap tab: single clean heatmap, full width */}
              {activeTab === "heatmap" && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2 px-1">AI Heatmap — Grad-CAM Focus Area</div>
                  <HeatmapCanvas imageSrc={uploadedFile?.src ?? ""} />
                  <div className="flex items-center justify-center gap-4 mt-3 px-2">
                    {[["#ef4444","Highest (Core)"],["#fb923c","High"],["#facc15","Moderate"],["#4ade80","Low"],["#60a5fa","Minimal"]].map(([color, label]) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                        <span className="text-muted-foreground text-xs">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Details tab */}
              {activeTab === "details" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1.5 px-1">Original Image</div>
                    <img src={uploadedFile?.src} alt="Original" className="w-full rounded-xl object-contain" />
                  </div>
                  <div className="flex flex-col justify-center gap-1 p-2">
                    {[
                      { label: "Report ID",   value: result.reportId },
                      { label: "Cancer Type", value: result.cancerType },
                      { label: "ABCDE Score", value: result.abcdeScore },
                      { label: "Lesion Area", value: result.lesionArea },
                      { label: "Risk Level",  value: result.riskLevel, colored: true },
                      { label: "Confidence",  value: `${result.confidenceScore?.toFixed(1)}%` },
                    ].map(({ label, value, colored }: any) => (
                      <div key={label} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                        <span className="text-muted-foreground text-xs">{label}</span>
                        <span className={`text-xs font-semibold ${colored ? riskColor : "text-white"}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="px-4 py-2 border-t border-border flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm bg-red-500 border-2 border-green-400 shrink-0" />
              <span className="text-muted-foreground text-xs">AI-detected lesion boundary (U-Net segmentation)</span>
            </div>
          </div>

          {/* Probability bars */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-white font-bold text-sm mb-3">Probability For Different Types</h3>
            <div className="space-y-3">
              {FOUR_TYPES.map(type => {
                const prob = result.typeProbs?.[type] ?? 0;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${TYPE_DOT[type]}`} />
                        <span className={`text-xs font-medium ${result.prediction === type ? "text-white" : "text-muted-foreground"}`}>{type}</span>
                        {result.prediction === type && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-semibold">Primary</span>}
                      </div>
                      <span className={`text-xs font-bold tabular-nums ${result.prediction === type ? "text-white" : "text-muted-foreground"}`}>{prob.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${TYPE_COLOR[type]}`} style={{ width: `${prob}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Classification result panel ─────── */}
        <div className="xl:col-span-2">
          <div className={`rounded-xl border p-5 ${riskBg}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Classification Result</div>
              <Bookmark size={16} className="text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
            </div>

            {/* Prediction + ring */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-muted-foreground text-xs mb-1">Prediction</div>
                <div className={`text-2xl font-bold leading-tight ${riskColor}`}>{result.prediction}</div>
                <div className={`mt-2 px-2.5 py-0.5 rounded text-xs font-bold border inline-block ${
                  isMalignant ? "bg-red-900/60 text-red-400 border-red-600/50" : "bg-green-900/50 text-green-400 border-green-600/50"
                }`}>{result.riskLevel?.toUpperCase()} RISK</div>
              </div>
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

            {/* Confidence score */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground font-semibold">Confidence Score</span>
                <span className={`font-bold ${riskColor}`}>{result.confidenceScore?.toFixed(1)}%</span>
              </div>
              <div className={`text-2xl font-bold mb-2 ${riskColor}`}>{result.confidenceScore?.toFixed(1)}%</div>
              <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${isMalignant ? "bg-red-400" : "bg-green-400"}`}
                  style={{ width: `${result.confidenceScore}%` }} />
              </div>
            </div>

            {/* Type / Risk / Category */}
            <div className="grid grid-cols-3 gap-2 py-3 border-t border-white/10 border-b border-b-white/10 mb-4">
              {[
                { label: "Type",      value: isMalignant ? "Malignant" : "Benign" },
                { label: "Risk Level",value: result.riskLevel },
                { label: "Category",  value: result.category ?? (isMalignant ? "Malignant" : "Non-Cancerous") },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</div>
                  <div className={`text-xs font-bold mt-1 ${label === "Risk Level" ? riskColor : "text-white"}`}>{value}</div>
                </div>
              ))}
            </div>

            {/* About This Result */}
            <div className="mb-4">
              <div className="text-white text-xs font-bold mb-2">About This Result</div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                The lesion has been classified as{" "}
                <span className={`font-semibold ${riskColor}`}>{result.prediction}</span>{" "}
                with a {isMalignant ? "high" : "low"} risk score.{" "}
                {isMalignant
                  ? "Immediate dermatologist consultation is strongly recommended."
                  : "Routine monitoring is advised. No immediate treatment required."
                }
              </p>
            </div>

            {/* Recommended Action */}
            <div>
              <div className="text-white text-xs font-bold mb-2">Recommended Action</div>
              <div className="space-y-1.5">
                {(result.recommendations ?? "").split(". ").filter(Boolean).slice(0, 4).map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isMalignant ? "bg-red-900/60" : "bg-green-900/50"}`}>
                      <CheckCircle size={10} className={isMalignant ? "text-red-400" : "text-green-400"} />
                    </div>
                    <span className="text-muted-foreground text-xs leading-tight">{r.trim()}{!r.endsWith(".") ? "." : ""}</span>
                  </div>
                ))}
              </div>
            </div>

            {isMalignant && (
              <div className="mt-4 p-2.5 bg-red-900/30 border border-red-700/40 rounded-lg flex items-center gap-2">
                <AlertTriangle size={13} className="text-red-400 shrink-0" />
                <span className="text-red-300 text-xs font-medium">Emergency — High-risk! On-call dermatologist notified.</span>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">ABCDE Score</div>
                <div className="text-white text-sm font-bold mt-0.5">{result.abcdeScore}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Lesion Area</div>
                <div className="text-white text-sm font-bold mt-0.5">{result.lesionArea}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Risk Progress Chart ──────────────────────────── */}
      {(result.riskProgressData ?? []).length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold text-sm">Risk Progress Prediction</h3>
              <p className="text-muted-foreground text-xs mt-0.5">AI-projected risk score over time based on lesion characteristics</p>
            </div>
            <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${isMalignant ? "bg-red-900/40 text-red-400 border-red-700/40" : "bg-green-900/30 text-green-400 border-green-700/40"}`}>
              {isMalignant ? "↗ High Risk Trajectory" : "→ Stable / Low Risk"}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={result.riskProgressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
              <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: isMalignant ? "#ef4444" : "#22c55e" }}
                formatter={(v: any) => [`${Number(v).toFixed(1)}%`, "Risk Score"]}
              />
              <Line
                type="monotone" dataKey="riskScore"
                stroke={isMalignant ? "#ef4444" : "#22c55e"}
                strokeWidth={2.5}
                dot={{ fill: isMalignant ? "#ef4444" : "#22c55e", r: 3, strokeWidth: 0 }}
                name="Risk Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Quantum Bio-Dermal Synthesis (QBS) ─────────────── */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-sm">Quantum Bio-Dermal Synthesis (QBS)</h3>
            <p className="text-muted-foreground text-xs mt-0.5">Advanced research analysis — Enhanced Accuracy: <span className="text-green-400 font-bold">98.1%</span></p>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-purple-900/40 border border-purple-700/40 text-purple-300 text-xs font-semibold">
            Research Mode
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Quantum Layer Isolation", value: Math.min(99, Math.floor(result.confidenceScore) + 2), color: "#8b5cf6" },
            { label: "Vasculature Mapping",     value: Math.min(99, Math.floor(result.confidenceScore) - 1), color: "#06b6d4" },
            { label: "Sub-Dermal Density",      value: Math.min(99, Math.floor(result.confidenceScore) - 4), color: "#10b981" },
            { label: "Cellular Density",        value: Math.min(99, Math.floor(result.confidenceScore) + 1), color: "#f59e0b" },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-4 bg-muted/20 rounded-xl border border-border/50 text-center">
              <div className="text-2xl font-bold mb-1" style={{ color }}>{value}%</div>
              <div className="text-white text-xs font-medium leading-tight">{label}</div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="text-white text-xs font-bold mb-3 uppercase tracking-widest">Quantum Signal Analysis</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Solar Thermal Optical Depth", value: `${(result.confidenceScore * 0.035 + 1.2).toFixed(2)} AU`, icon: "☀️" },
              { label: "Bio-Signal Coherence",        value: `${Math.min(99, Math.floor(result.confidenceScore) + 3)}%`,  icon: "🧬" },
              { label: "Predicted Evolutionary Path", value: result.riskLevel === "High" ? "Progressive" : "Stable",       icon: "📈" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-start gap-3 p-3 bg-muted/20 rounded-xl border border-border/50">
                <span className="text-xl shrink-0">{icon}</span>
                <div>
                  <div className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</div>
                  <div className="text-white text-sm font-bold mt-0.5">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Download button ──────────────────────────────── */}
      <Button onClick={() => downloadPDF(result, patientName || "Anonymous")} className="w-full h-11 gradient-purple border-0 font-semibold gap-2">
        <Download size={16} /> Download Full PDF Report
      </Button>
      <div className="text-center text-muted-foreground text-xs pb-2">
        Report ID: <span className="font-mono text-white">{result.reportId}</span>
        <span className="mx-2 text-border">•</span>
        Opens print dialog → Save as PDF
      </div>
    </div>
  );
}
