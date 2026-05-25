import { useState } from "react";
import { useListAnalyses, getListAnalysesQueryKey } from "@workspace/api-client-react";
import { FileText, Download, Search, Eye, X, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/* ─── Generate printable PDF-ready HTML ─────────────────────────────────── */
function buildReportHTML(a: any): string {
  const pst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  const dateStr = pst.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" });
  const isHigh = a.riskLevel === "High";
  const reasons = (a.explainableAiReasons ?? []).map((r: string) => `<li>${r}</li>`).join("");
  const riskColor = isHigh ? "#dc2626" : "#16a34a";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>DermaAI Medical Report — ${a.reportId}</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Arial', sans-serif; color: #111; background: #fff; font-size: 13px; line-height: 1.6; }

  .page { max-width: 800px; margin: 0 auto; padding: 24px; }

  /* Header */
  .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; border-bottom: 3px solid #7c3aed; margin-bottom: 20px; }
  .logo-block { display: flex; align-items: center; gap: 10px; }
  .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg,#7c3aed,#a855f7); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 18px; }
  .logo-text strong { display: block; font-size: 18px; color: #7c3aed; }
  .logo-text small { font-size: 11px; color: #6b7280; }
  .report-meta { text-align: right; }
  .report-meta .report-id { font-family: monospace; font-size: 14px; font-weight: 700; color: #7c3aed; }
  .report-meta .date { font-size: 11px; color: #6b7280; margin-top: 2px; }

  /* Alert banner */
  .alert-banner { padding: 14px 18px; border-radius: 10px; margin-bottom: 20px; border-left: 5px solid ${riskColor}; background: ${isHigh ? "#fef2f2" : "#f0fdf4"}; }
  .alert-title { font-size: 20px; font-weight: 800; color: ${riskColor}; }
  .alert-sub { font-size: 13px; color: #374151; margin-top: 4px; }

  /* Section */
  .section { margin-bottom: 20px; }
  .section-title { font-size: 13px; font-weight: 700; color: #1f2937; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }

  /* Grid */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .info-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
  .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: .5px; color: #6b7280; margin-bottom: 3px; }
  .info-value { font-size: 15px; font-weight: 700; color: #111; }
  .info-value.risk { color: ${riskColor}; }

  /* Reasons list */
  ul { padding-left: 18px; }
  li { margin-bottom: 5px; color: #374151; }

  /* Confidence bar */
  .conf-bar-bg { background: #e5e7eb; height: 10px; border-radius: 5px; margin-top: 8px; }
  .conf-bar { background: ${riskColor}; height: 10px; border-radius: 5px; width: ${a.confidenceScore?.toFixed(0)}%; }

  /* QR block */
  .qr-block { border: 2px dashed #d1d5db; border-radius: 10px; padding: 16px; text-align: center; margin-top: 10px; }
  .qr-code { font-family: monospace; font-size: 12px; color: #6b7280; margin-top: 4px; word-break: break-all; }

  /* Footer */
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }

  /* Disclaimer */
  .disclaimer { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; margin-top: 12px; font-size: 11px; color: #92400e; }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="logo-block">
      <div class="logo-icon">🔬</div>
      <div class="logo-text">
        <strong>AI Dermascan</strong>
        <small>Pakistan Dermatology Initiative<br/>Skin Cancer Detection System</small>
      </div>
    </div>
    <div class="report-meta">
      <div class="report-id">${a.reportId}</div>
      <div class="date">Generated: ${dateStr} PST</div>
      <div class="date">Patient ID: ${a.patientId}</div>
    </div>
  </div>

  <!-- Alert Banner -->
  <div class="alert-banner">
    <div class="alert-title">${isHigh ? "⚠️ HIGH RISK DETECTED" : "✅ LOW RISK — BENIGN"} — ${a.prediction}</div>
    <div class="alert-sub">Confidence: <strong>${a.confidenceScore?.toFixed(1)}%</strong> &nbsp;|&nbsp; Risk Level: <strong>${a.riskLevel}</strong> &nbsp;|&nbsp; Lesion Area: <strong>${a.lesionArea ?? "N/A"}</strong></div>
  </div>

  <!-- Patient Information -->
  <div class="section">
    <div class="section-title">Patient Information</div>
    <div class="grid-3">
      <div class="info-card"><div class="info-label">Full Name</div><div class="info-value">${a.patientName}</div></div>
      <div class="info-card"><div class="info-label">Patient ID</div><div class="info-value" style="font-family:monospace;font-size:12px">${a.patientId}</div></div>
      <div class="info-card"><div class="info-label">Analysis Date</div><div class="info-value" style="font-size:12px">${new Date(a.createdAt).toLocaleDateString("en-PK", { year:"numeric", month:"long", day:"numeric" })}</div></div>
      <div class="info-card"><div class="info-label">Age</div><div class="info-value">${a.age ?? "N/A"}</div></div>
      <div class="info-card"><div class="info-label">Gender</div><div class="info-value">${a.gender ?? "N/A"}</div></div>
      <div class="info-card"><div class="info-label">Cancer Type</div><div class="info-value">${a.cancerType ?? a.prediction}</div></div>
    </div>
  </div>

  <!-- AI Analysis Results -->
  <div class="section">
    <div class="section-title">AI Analysis Results</div>
    <div class="grid-2">
      <div class="info-card">
        <div class="info-label">Prediction</div>
        <div class="info-value risk">${a.prediction}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Risk Level</div>
        <div class="info-value risk">${a.riskLevel}</div>
      </div>
      <div class="info-card">
        <div class="info-label">ABCDE Score</div>
        <div class="info-value">${a.abcdeScore ?? "N/A"}</div>
      </div>
      <div class="info-card">
        <div class="info-label">Lesion Area</div>
        <div class="info-value">${a.lesionArea ?? "N/A"}</div>
      </div>
    </div>
    <div class="info-card" style="margin-top:10px">
      <div class="info-label">Confidence Score — ${a.confidenceScore?.toFixed(1)}%</div>
      <div class="conf-bar-bg"><div class="conf-bar"></div></div>
    </div>
  </div>

  <!-- Explainable AI -->
  ${(a.explainableAiReasons ?? []).length ? `
  <div class="section">
    <div class="section-title">Explainable AI — Why This Prediction</div>
    <ul>${reasons}</ul>
  </div>` : ""}

  <!-- Recommendations -->
  <div class="section">
    <div class="section-title">Clinical Recommendations</div>
    <p style="color:#374151;line-height:1.8">${a.recommendations ?? "No specific recommendations recorded."}</p>
  </div>

  <!-- QR Verification -->
  <div class="section">
    <div class="section-title">QR Code Verification</div>
    <div class="qr-block">
      <div style="font-size:40px">▣</div>
      <div style="font-size:13px;font-weight:700;margin-top:8px">Scan to verify this report</div>
      <div class="qr-code">https://dermaai.pk/verify/${a.reportId}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:4px">Report ID: <strong>${a.reportId}</strong></div>
    </div>
  </div>

  <!-- Disclaimer -->
  <div class="disclaimer">
    ⚠️ <strong>Disclaimer:</strong> This AI analysis is a clinical support tool only and does not replace professional medical diagnosis. All findings must be confirmed by a qualified dermatologist. DermaAI is not liable for clinical decisions based solely on this report.
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>DermaAI — Pakistan Dermatology Initiative &nbsp;|&nbsp; Confidential Medical Report</div>
    <div>Generated ${dateStr} PST</div>
  </div>

</div>
</body>
</html>`;
}

function downloadPDF(a: any) {
  const html = buildReportHTML(a);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  // Give browser a moment to render, then trigger print (Save as PDF)
  setTimeout(() => {
    win.focus();
    win.print();
  }, 600);
}

function RiskBadge({ level }: { level: string }) {
  const s: Record<string, string> = {
    High:   "bg-red-900/50 text-red-400 border-red-700/50",
    Medium: "bg-yellow-900/50 text-yellow-400 border-yellow-700/50",
    Low:    "bg-green-900/50 text-green-400 border-green-700/50",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${s[level] ?? s.Low}`}>{level} Risk</span>;
}

export default function ReportsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const params = { search: search || undefined };
  const { data: analyses, isLoading } = useListAnalyses(params, {
    query: { queryKey: getListAnalysesQueryKey(params) }
  });
  const rows = analyses ?? [];

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-muted-foreground text-sm">Download medical PDF reports for each analysis</p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
          <FileText size={15} className="text-primary" />
          <span className="text-white text-sm font-semibold">{rows.length}</span>
          <span className="text-muted-foreground text-xs">Reports</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Reports", value: rows.length,                                                color: "text-white",      bg: "bg-card" },
          { label: "High Risk",     value: rows.filter((r: any) => r.riskLevel === "High").length,    color: "text-red-400",    bg: "bg-card" },
          { label: "Benign Cases",  value: rows.filter((r: any) => r.riskLevel !== "High").length,    color: "text-green-400",  bg: "bg-card" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} border border-border rounded-xl p-4`}>
            <div className="text-muted-foreground text-xs mb-1">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient name or ID..."
            className="pl-9 bg-background h-9 text-sm"
          />
        </div>
      </div>

      {/* Reports table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/20">
              <tr>
                {["Report ID","Patient Name","Patient ID","Prediction","Risk","Confidence","Date","Actions"].map(h => (
                  <th key={h} className="text-left text-muted-foreground text-xs font-semibold px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-border/30">
                    <td colSpan={8} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted-foreground py-12">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No reports yet — run your first analysis on the Analyze page</p>
                  </td>
                </tr>
              ) : rows.map((a: any) => (
                <tr key={a.id} className={`border-t border-border/30 hover:bg-muted/10 transition-colors ${selected?.id === a.id ? "bg-primary/5" : ""}`}>
                  <td className="px-4 py-3 text-purple-400 text-xs font-mono whitespace-nowrap">{a.reportId}</td>
                  <td className="px-4 py-3 text-white text-xs font-medium whitespace-nowrap">{a.patientName}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{a.patientId}</td>
                  <td className="px-4 py-3 text-white text-xs">{a.prediction}</td>
                  <td className="px-4 py-3"><RiskBadge level={a.riskLevel} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${a.confidenceScore}%` }} />
                      </div>
                      <span className="text-xs text-white">{a.confidenceScore?.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelected(selected?.id === a.id ? null : a)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title="Preview"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => downloadPDF(a)}
                        className="text-muted-foreground hover:text-green-400 transition-colors"
                        title="Download PDF"
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report preview panel */}
      {selected && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-white font-bold text-base">Report Preview</h3>
              <p className="text-muted-foreground text-xs font-mono mt-0.5">{selected.reportId}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => downloadPDF(selected)} className="gradient-purple border-0 h-8 text-xs gap-1.5">
                <Printer size={13} /> Print / Save PDF
              </Button>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-white">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {[
              { label: "Patient",    value: selected.patientName },
              { label: "Prediction", value: selected.prediction },
              { label: "Risk Level", value: selected.riskLevel,         color: selected.riskLevel === "High" ? "text-red-400" : "text-green-400" },
              { label: "Confidence", value: `${selected.confidenceScore?.toFixed(1)}%` },
              { label: "ABCDE",      value: selected.abcdeScore ?? "—" },
              { label: "Lesion Area",value: selected.lesionArea ?? "—" },
              { label: "Cancer Type",value: selected.cancerType ?? "—" },
              { label: "Date",       value: new Date(selected.createdAt).toLocaleDateString() },
            ].map(({ label, value, color }: any) => (
              <div key={label}>
                <div className="text-muted-foreground text-xs">{label}</div>
                <div className={`text-sm font-semibold mt-0.5 ${color ?? "text-white"}`}>{value}</div>
              </div>
            ))}
          </div>

          {selected.recommendations && (
            <div className="p-3 bg-muted/20 rounded-lg border border-border mb-3">
              <div className="text-white text-xs font-semibold mb-1">Recommendations</div>
              <p className="text-muted-foreground text-xs leading-relaxed">{selected.recommendations}</p>
            </div>
          )}

          {selected.explainableAiReasons?.length > 0 && (
            <div className="p-3 bg-muted/20 rounded-lg border border-border">
              <div className="text-white text-xs font-semibold mb-2">Explainable AI Findings</div>
              <ul className="space-y-1">
                {selected.explainableAiReasons.map((r: string) => (
                  <li key={r} className="text-muted-foreground text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button onClick={() => downloadPDF(selected)} className="w-full gradient-purple border-0 h-10 mt-4 font-semibold gap-2">
            <Download size={15} /> Download Full PDF Report
          </Button>
        </div>
      )}
    </div>
  );
}
