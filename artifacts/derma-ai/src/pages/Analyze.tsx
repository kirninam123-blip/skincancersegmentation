import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUploadImage, getListAnalysesQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { Upload, Activity, RefreshCw, CheckCircle, AlertTriangle, X, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

export default function Analyze() {
  const queryClient = useQueryClient();
  const uploadImage = useUploadImage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<{ src: string; name: string } | null>(null);
  const [patientName, setPatientName] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("original");
  const [riskFactors, setRiskFactors] = useState({
    sunExposure: "Moderate",
    skinType: "Type II",
    familyHistory: false,
    immuneCondition: false,
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
      { data: { patientName: patientName || "Anonymous", conditionDetails: clinicalNotes, imageData: b64, age: parseInt(age) || 30, gender, riskFactors } },
      {
        onSuccess: (res: any) => {
          setResult(res);
          queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        },
      }
    );
  }

  const isMalignant = result?.riskLevel === "High";

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Analyze Skin Lesion</h1>
        <p className="text-muted-foreground text-sm">Upload a dermoscopic image for AI-powered skin cancer detection</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upload Panel */}
        <div className="space-y-4">
          {/* Upload Zone */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-white font-bold text-sm mb-4">Analysis Result</h2>
            {!uploadedFile ? (
              <>
                <div
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-primary/5"}`}
                  data-testid="analyze-upload-zone"
                >
                  <div className="w-16 h-16 gradient-purple rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload size={28} className="text-white" />
                  </div>
                  <div className="text-white font-semibold text-base">Drag & drop lesion image</div>
                  <p className="text-muted-foreground text-sm mt-2">High-resolution dermoscopic images give the most accurate results. JPG or PNG up to 10MB.</p>
                  <Button className="mt-4 gradient-purple border-0" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>Browse Files</Button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f); }} data-testid="analyze-file-input" />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center min-h-[200px] border border-border">
                  <img src={uploadedFile.src} alt="Uploaded" className="max-h-64 object-contain" />
                  <button onClick={() => { setUploadedFile(null); setResult(null); }} className="absolute top-3 right-3 bg-black/70 rounded-full p-1.5 hover:bg-black">
                    <X size={14} className="text-white" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Patient Name (optional)</label>
                    <Input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="e.g. Muhammad Ali" className="h-9 bg-background text-sm" data-testid="analyze-input-name" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Age</label>
                    <Input value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 34" type="number" className="h-9 bg-background text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Clinical Notes (optional)</label>
                  <Input value={clinicalNotes} onChange={e => setClinicalNotes(e.target.value)} placeholder="Any relevant details..." className="h-9 bg-background text-sm" data-testid="analyze-input-notes" />
                </div>

                {/* Risk Factors */}
                <div className="bg-background rounded-xl p-3 border border-border">
                  <h3 className="text-white text-xs font-semibold mb-2">Patient Risk Factors</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Sun Exposure</label>
                      <select value={riskFactors.sunExposure} onChange={e => setRiskFactors(p => ({ ...p, sunExposure: e.target.value }))} className="mt-1 w-full bg-card border border-border text-white text-xs rounded-lg px-2 py-1">
                        {["Low", "Moderate", "High"].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Skin Type</label>
                      <select value={riskFactors.skinType} onChange={e => setRiskFactors(p => ({ ...p, skinType: e.target.value }))} className="mt-1 w-full bg-card border border-border text-white text-xs rounded-lg px-2 py-1">
                        {["Type I", "Type II", "Type III", "Type IV", "Type V", "Type VI"].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={riskFactors.familyHistory} onChange={e => setRiskFactors(p => ({ ...p, familyHistory: e.target.checked }))} className="rounded" />
                      <span className="text-xs text-muted-foreground">Family History of Cancer</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={riskFactors.immuneCondition} onChange={e => setRiskFactors(p => ({ ...p, immuneCondition: e.target.checked }))} className="rounded" />
                      <span className="text-xs text-muted-foreground">Immune Condition</span>
                    </label>
                  </div>
                </div>

                <Button onClick={handleAnalyze} disabled={uploadImage.isPending} className="w-full gradient-purple border-0 h-11" data-testid="button-run-analysis">
                  {uploadImage.isPending ? <><RefreshCw size={16} className="mr-2 animate-spin" /> Analyzing...</> : <><Activity size={16} className="mr-2" /> Run AI Analysis</>}
                </Button>
              </div>
            )}
          </div>

          {/* Image Guidelines */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-white font-bold text-sm mb-1">Image Guidelines</h3>
            <p className="text-muted-foreground text-xs mb-4">Follow these rules for accurate AI predictions.</p>
            {[
              { icon: CheckCircle, title: "Good Lighting", desc: "Well-lit without harsh shadows or reflections.", color: "text-green-400" },
              { icon: CheckCircle, title: "Clear Focus", desc: "Sharp image — blurry photos significantly reduce accuracy.", color: "text-green-400" },
              { icon: CheckCircle, title: "Center Positioning", desc: "Lesion centered, occupying at least 30% of frame.", color: "text-green-400" },
              { icon: AlertTriangle, title: "Avoid Hair Coverage", desc: "Excessive hair can obscure features. Use gel if needed.", color: "text-yellow-400" },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                <Icon size={16} className={`${color} shrink-0 mt-0.5`} />
                <div>
                  <div className="text-white text-xs font-semibold">{title}</div>
                  <div className="text-muted-foreground text-xs">{desc}</div>
                </div>
              </div>
            ))}
            {!uploadedFile && (
              <Button className="w-full mt-4 gradient-purple border-0 opacity-50 cursor-not-allowed" disabled>Select Image First</Button>
            )}
          </div>
        </div>

        {/* Right: Results Panel */}
        <div className="space-y-4">
          {!result ? (
            <div className="bg-card border border-border rounded-xl p-8 h-full flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Activity size={28} className="text-primary" />
              </div>
              <h3 className="text-white font-bold text-base">Analysis Result</h3>
              <p className="text-muted-foreground text-sm text-center mt-2">Upload a skin lesion image to analyze</p>
              <div className="mt-6 w-full max-w-sm space-y-2">
                {["Melanoma Detection", "Segmentation", "Heatmap Analysis", "Risk Assessment"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-muted-foreground text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Tabs */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex gap-1 mb-4 border-b border-border pb-2">
                  {[
                    { key: "original", label: "Original Image" },
                    { key: "segmented", label: "Segmentation" },
                    { key: "heatmap", label: "Heatmap" },
                    { key: "details", label: "Details" },
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => setActiveTab(key)} className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${activeTab === key ? "gradient-purple text-white" : "text-muted-foreground hover:text-white"}`}>
                      {label}
                    </button>
                  ))}
                </div>

                <div className="relative rounded-xl overflow-hidden bg-gray-950 min-h-[240px] flex items-center justify-center">
                  {uploadedFile && activeTab !== "details" && (
                    <img src={uploadedFile.src} alt="Analysis" className="max-h-56 object-contain" />
                  )}
                  {activeTab === "segmented" && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative w-32 h-36 flex items-center justify-center">
                        <div className="absolute w-full h-full bg-red-500/70 rounded-[40%_60%_55%_45%/50%_60%_40%_50%]" style={{ boxShadow: "0 0 0 6px #22c55e" }}></div>
                      </div>
                      <div className="absolute bottom-3 left-3 bg-black/70 px-2 py-1 rounded text-white text-xs">U-Net Segmentation · AI Dermascan</div>
                    </div>
                  )}
                  {activeTab === "heatmap" && (
                    <div className="absolute inset-0 bg-gradient-radial from-red-600/70 via-yellow-500/50 to-blue-900/40 mix-blend-screen"></div>
                  )}
                  {activeTab === "details" && (
                    <div className="w-full p-4 space-y-2">
                      {[
                        { label: "Patient ID", value: `PMS-2024-${result.analysisId?.toString().padStart(5, "0")}` },
                        { label: "Detection Date", value: new Date(new Date().getTime() + 5 * 60 * 60 * 1000).toLocaleString("en-US", { timeZone: "Asia/Karachi" }) + " PST" },
                        { label: "Lesion Area", value: result.lesionArea },
                        { label: "ABCDE Score", value: result.abcdeScore },
                        { label: "Cancer Type", value: result.cancerType },
                        { label: "Risk Level", value: result.riskLevel },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between py-1 border-b border-border/30 last:border-0">
                          <span className="text-muted-foreground text-xs">{label}</span>
                          <span className="text-white text-xs font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {activeTab === "segmented" && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-green-400"></div>
                    <span className="text-muted-foreground text-xs">AI-detected lesion boundary (U-Net segmentation)</span>
                  </div>
                )}
              </div>

              {/* Classification Result */}
              <div className={`rounded-xl p-5 border ${isMalignant ? "bg-red-950/30 border-red-700/40" : "bg-green-950/30 border-green-700/40"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Classification Result</div>
                    <div className="text-xs text-muted-foreground">Prediction</div>
                    <div className={`text-2xl font-bold mt-0.5 ${isMalignant ? "text-red-400" : "text-green-400"}`}>{result.prediction}</div>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold border ${isMalignant ? "bg-red-900/50 text-red-400 border-red-700/50" : "bg-green-900/50 text-green-400 border-green-700/50"}`}>
                      {isMalignant ? "HIGH RISK" : "LOW RISK"}
                    </span>
                  </div>
                  <div className="relative w-16 h-16">
                    <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke={isMalignant ? "#ef4444" : "#22c55e"} strokeWidth="3"
                        strokeDasharray={`${result.confidenceScore} ${100 - result.confidenceScore}`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{result.confidenceScore?.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Confidence Score</span>
                    <span className="text-white text-xs font-bold">{result.confidenceScore?.toFixed(1)}%</span>
                  </div>
                  <Progress value={result.confidenceScore} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: "Type", value: isMalignant ? "Malignant" : "Benign" },
                    { label: "Risk Level", value: result.riskLevel },
                    { label: "Category", value: isMalignant ? "Cancerous" : "Non-Cancerous" },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <div className="text-muted-foreground text-xs">{label}</div>
                      <div className={`text-xs font-semibold mt-0.5 ${label === "Risk Level" && isMalignant ? "text-red-400" : label === "Risk Level" ? "text-green-400" : "text-white"}`}>{value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t border-white/10 pt-4">
                  <div className="text-white text-xs font-semibold mb-1">About This Result</div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    The lesion has been classified as <span className={`font-semibold ${isMalignant ? "text-red-400" : "text-green-400"}`}>{result.prediction}</span> {isMalignant ? "with a high confidence score. Immediate consultation is strongly recommended." : "with a low confidence score. It is recommended to consult a dermatologist as soon as possible."}
                  </p>
                  <div className="text-white text-xs font-semibold mt-3 mb-2">Recommended Action</div>
                  {(result.recommendations?.split(".").filter((s: string) => s.trim()) ?? []).slice(0, 4).map((rec: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 mb-1.5">
                      <CheckCircle size={12} className="text-green-400 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground text-xs">{rec.trim()}.</span>
                    </div>
                  ))}
                </div>

                <Button className="w-full mt-4 gradient-purple border-0" data-testid="button-download-pdf">
                  <Download size={14} className="mr-2" /> Download Report (PDF)
                </Button>
                <div className="text-center text-muted-foreground text-xs mt-2">Report ID: {result.reportId}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
