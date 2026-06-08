import { useState } from "react";
import { useListAnalyses, getListAnalysesQueryKey } from "@workspace/api-client-react";
import { Search, Eye, Download, Calendar, X, Printer, Trash2, Share2, BarChart2, FileText, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";

const COND_COLORS: Record<string, string> = {
  Melanoma: "#ef4444",
  "Basal Cell Carcinoma": "#f97316",
  "Benign Keratosis": "#22c55e",
  Nevus: "#3b82f6",
};

function RiskBadge({ level }: { level: string }) {
  const s: Record<string, string> = {
    High:   "bg-red-900/50 text-red-400 border-red-700/50",
    Medium: "bg-yellow-900/50 text-yellow-400 border-yellow-700/50",
    Low:    "bg-green-900/50 text-green-400 border-green-700/50",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${s[level] ?? s.Low}`}>{level} Risk</span>;
}

function printReport(a: any) {
  const html = buildReportHtml(a);
  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups."); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 700);
}

function downloadReport(a: any) {
  const html = buildReportHtml(a);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const el = document.createElement("a");
  el.href = url; el.download = `DermaAI-${a.reportId ?? a.patientId}.html`; el.click();
  URL.revokeObjectURL(url);
}

function shareReport(a: any) {
  const text = `DermaAI Report — ${a.patientName} | ${a.prediction} | ${a.riskLevel} Risk | Confidence: ${Number(a.confidenceScore).toFixed(1)}% | ID: ${a.reportId}`;
  if (navigator.share) {
    navigator.share({ title: "DermaAI Report", text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => alert("Report summary copied to clipboard!"));
  }
}

function buildReportHtml(a: any) {
  const isH = a.riskLevel === "High";
  const rc  = isH ? "#dc2626" : "#16a34a";
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>DermaAI Report ${a.reportId}</title>
<style>body{font-family:Arial,sans-serif;margin:32px;color:#111}h1{color:#7c3aed}h3{margin-top:20px}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f3f4f6}.risk{color:${rc};font-weight:bold}ul{padding-left:18px}li{margin-bottom:4px}.disc{background:#fffbeb;border:1px solid #fde68a;padding:10px;border-radius:6px;font-size:12px;margin-top:20px}</style></head>
<body>
<h1>🔬 DermaAI Report — ${a.reportId ?? "N/A"}</h1>
<p><strong>Generated:</strong> ${new Date().toLocaleString("en-US",{timeZone:"Asia/Karachi"})} PST</p>
<h3>Patient Information</h3>
<table><tr><th>Field</th><th>Value</th></tr>
<tr><td>Patient Name</td><td>${a.patientName}</td></tr>
<tr><td>Patient ID</td><td>${a.patientId}</td></tr>
<tr><td>Age</td><td>${a.age ?? "—"}</td></tr>
<tr><td>Gender</td><td>${a.gender ?? "—"}</td></tr>
</table>
<h3>AI Analysis Results</h3>
<table><tr><th>Field</th><th>Value</th></tr>
<tr><td>Prediction</td><td><span class="risk">${a.prediction}</span></td></tr>
<tr><td>Risk Level</td><td><span class="risk">${a.riskLevel}</span></td></tr>
<tr><td>Confidence Score</td><td>${Number(a.confidenceScore).toFixed(1)}%</td></tr>
<tr><td>ABCDE Score</td><td>${a.abcdeScore ?? "—"}</td></tr>
<tr><td>Lesion Area</td><td>${a.lesionArea ?? "—"}</td></tr>
<tr><td>Cancer Type</td><td>${a.cancerType ?? "—"}</td></tr>
<tr><td>Analysis Date</td><td>${new Date(a.createdAt).toLocaleString("en-US",{timeZone:"Asia/Karachi"})} PST</td></tr>
</table>
<h3>Clinical Recommendations</h3><p>${a.recommendations ?? "—"}</p>
${(a.explainableAiReasons ?? []).length ? `<h3>Explainable AI Findings</h3><ul>${(a.explainableAiReasons ?? []).map((r: string) => `<li>${r}</li>`).join("")}</ul>` : ""}
<div class="disc">⚠️ <strong>Disclaimer:</strong> AI analysis is a clinical support tool only. All findings must be confirmed by a qualified dermatologist before clinical decisions are made.</div>
<p style="margin-top:24px;color:#6b7280;font-size:11px">AI Dermascan — Pakistan Dermatology Initiative | © 2025 DermaAI</p>
</body></html>`;
}

type TabKey = "records" | "analytics" | "reports";

export default function HistoryPage() {
  const [search,   setSearch]   = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [tab,      setTab]      = useState<TabKey>("records");
  const [deleted,  setDeleted]  = useState<Set<number>>(new Set());

  const params = {
    search: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };
  const { data: analyses, isLoading } = useListAnalyses(params, {
    query: { queryKey: getListAnalysesQueryKey(params) },
  });

  const allRows = (analyses ?? []).filter((a: any) => !deleted.has(a.id));

  function handleDelete(id: number) {
    setDeleted(prev => new Set([...prev, id]));
    if (selected?.id === id) setSelected(null);
  }

  const condDist = (() => {
    const counts: Record<string, number> = {};
    allRows.forEach((r: any) => { counts[r.prediction] = (counts[r.prediction] ?? 0) + 1; });
    return Object.entries(counts).map(([condition, count]) => ({
      condition, count, color: COND_COLORS[condition] ?? "#6b7280",
    }));
  })();

  const diagEvolution = (() => {
    const byMonth: Record<string, Record<string, number>> = {};
    allRows.forEach((r: any) => {
      const m = new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (!byMonth[m]) byMonth[m] = { Melanoma: 0, "Basal Cell Carcinoma": 0, "Benign Keratosis": 0, Nevus: 0 };
      byMonth[m][r.prediction] = (byMonth[m][r.prediction] ?? 0) + 1;
    });
    return Object.entries(byMonth).slice(-8).map(([month, v]) => ({ month, ...v }));
  })();

  const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "records",   label: "Records",   icon: List      },
    { key: "analytics", label: "Analytics", icon: BarChart2 },
    { key: "reports",   label: "Reports",   icon: FileText  },
  ];

  return (
    <div className="p-5 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Analysis History</h1>
        <p className="text-muted-foreground text-sm">Search, review and download all past skin lesion analyses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Records", value: allRows.length,                                               color: "text-white"  },
          { label: "High Risk",     value: allRows.filter((r: any) => r.riskLevel === "High").length,   color: "text-red-400"    },
          { label: "Medium Risk",   value: allRows.filter((r: any) => r.riskLevel === "Medium").length, color: "text-yellow-400" },
          { label: "Low Risk",      value: allRows.filter((r: any) => r.riskLevel === "Low").length,    color: "text-green-400"  },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className="text-muted-foreground text-xs mb-1">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
            }`}
          >
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* ── RECORDS TAB ─────────────────────────────── */}
      {tab === "records" && (
        <>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by patient name or ID..." className="pl-9 bg-background h-9 text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-muted-foreground" />
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-background h-9 text-xs w-36" />
                <span className="text-muted-foreground text-xs">to</span>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-background h-9 text-xs w-36" />
              </div>
              {(search || dateFrom || dateTo) && (
                <Button variant="outline" size="sm" className="h-9" onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); }}>
                  <X size={13} className="mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/20">
                  <tr>
                    {["Patient ID","Patient Name","Age","Prediction","Risk","Confidence","Date","Actions"].map(h => (
                      <th key={h} className="text-left text-muted-foreground text-xs font-semibold px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-t border-border/30">
                        <td colSpan={8} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                      </tr>
                    ))
                  ) : allRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted-foreground py-12">
                        <Search size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">{search ? `No results for "${search}"` : "No analyses yet"}</p>
                      </td>
                    </tr>
                  ) : allRows.map((a: any) => (
                    <tr key={a.id} className={`border-t border-border/30 hover:bg-muted/10 transition-colors ${selected?.id === a.id ? "bg-primary/5" : ""}`}>
                      <td className="px-4 py-3 text-purple-400 text-xs font-mono whitespace-nowrap">{a.patientId}</td>
                      <td className="px-4 py-3 text-white text-xs font-medium whitespace-nowrap">{a.patientName}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{a.age ?? "—"}</td>
                      <td className="px-4 py-3 text-white text-xs whitespace-nowrap">{a.prediction}</td>
                      <td className="px-4 py-3"><RiskBadge level={a.riskLevel} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-14 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${a.confidenceScore}%` }} />
                          </div>
                          <span className="text-xs text-white">{Number(a.confidenceScore).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelected(selected?.id === a.id ? null : a)} className="text-muted-foreground hover:text-primary transition-colors" title="View details"><Eye size={14} /></button>
                          <button onClick={() => downloadReport(a)} className="text-muted-foreground hover:text-primary transition-colors" title="Download report"><Download size={14} /></button>
                          <button onClick={() => printReport(a)} className="text-muted-foreground hover:text-blue-400 transition-colors" title="Print report"><Printer size={14} /></button>
                          <button onClick={() => shareReport(a)} className="text-muted-foreground hover:text-green-400 transition-colors" title="Share report"><Share2 size={14} /></button>
                          <button onClick={() => handleDelete(a.id)} className="text-muted-foreground hover:text-red-400 transition-colors" title="Delete record"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selected && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-base">{selected.patientName}</h3>
                  <p className="text-muted-foreground text-xs font-mono">{selected.patientId}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-white text-xs border border-border rounded px-2 py-1">
                  <X size={12} className="inline mr-1" />Close
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {[
                  { label: "Prediction",   value: selected.prediction },
                  { label: "Risk Level",   value: selected.riskLevel, color: selected.riskLevel === "High" ? "text-red-400" : "text-green-400" },
                  { label: "Confidence",   value: `${Number(selected.confidenceScore).toFixed(1)}%` },
                  { label: "ABCDE Score",  value: selected.abcdeScore ?? "—" },
                  { label: "Cancer Type",  value: selected.cancerType ?? "—" },
                  { label: "Lesion Area",  value: selected.lesionArea ?? "—" },
                  { label: "Age",          value: selected.age ?? "—" },
                  { label: "Gender",       value: selected.gender ?? "—" },
                ].map(({ label, value, color }: any) => (
                  <div key={label}>
                    <div className="text-muted-foreground text-xs">{label}</div>
                    <div className={`text-sm font-semibold mt-0.5 ${color ?? "text-white"}`}>{value}</div>
                  </div>
                ))}
              </div>
              {selected.recommendations && (
                <div className="p-3 bg-muted/20 rounded-lg border border-border mb-4">
                  <div className="text-white text-xs font-semibold mb-1">Recommendations</div>
                  <p className="text-muted-foreground text-xs leading-relaxed">{selected.recommendations}</p>
                </div>
              )}
              {selected.explainableAiReasons?.length > 0 && (
                <div className="p-3 bg-muted/20 rounded-lg border border-border mb-4">
                  <div className="text-white text-xs font-semibold mb-2">Explainable AI</div>
                  <ul className="space-y-1">
                    {selected.explainableAiReasons.map((r: string) => (
                      <li key={r} className="text-muted-foreground text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={() => downloadReport(selected)} className="gradient-purple border-0 text-xs h-9 gap-1.5">
                  <Download size={13} /> Download PDF
                </Button>
                <Button onClick={() => printReport(selected)} variant="outline" className="text-xs h-9 gap-1.5">
                  <Printer size={13} /> Print
                </Button>
                <Button onClick={() => shareReport(selected)} variant="outline" className="text-xs h-9 gap-1.5">
                  <Share2 size={13} /> Share
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ANALYTICS TAB ───────────────────────────── */}
      {tab === "analytics" && (
        <div className="space-y-5">
          {allRows.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
              <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No data yet — run some analyses to see charts here.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-white font-bold text-sm mb-1">Condition Distribution</h3>
                  <p className="text-muted-foreground text-xs mb-4">Breakdown of AI detected condition types</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={condDist} cx="50%" cy="50%" innerRadius={55} outerRadius={82} dataKey="count" nameKey="condition" paddingAngle={3}>
                        {condDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e2d4a", borderRadius: "8px", fontSize: "12px" }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-white font-bold text-sm mb-1">Patient Diagnosis Evolution</h3>
                  <p className="text-muted-foreground text-xs mb-4">Condition trends over time</p>
                  {diagEvolution.length < 2 ? (
                    <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                      Need more records to display trend data
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={diagEvolution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                        <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e2d4a", borderRadius: "8px", fontSize: "11px" }} />
                        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: "10px", color: "#9ca3af" }} />
                        {Object.keys(COND_COLORS).map(c => (
                          <Line key={c} type="monotone" dataKey={c} stroke={COND_COLORS[c]} strokeWidth={2}
                            dot={{ fill: COND_COLORS[c], r: 3, strokeWidth: 0 }} name={c} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-white font-bold text-sm mb-4">Recent Analyses Summary</h3>
                <div className="space-y-2">
                  {allRows.slice(0, 6).map((a: any) => (
                    <div key={a.id} className="flex items-center gap-4 p-3 bg-muted/10 rounded-xl border border-border/30">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COND_COLORS[a.prediction] ?? "#6b7280" }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-white text-xs font-medium">{a.patientName}</span>
                        <span className="text-muted-foreground text-xs ml-2">{a.prediction}</span>
                      </div>
                      <RiskBadge level={a.riskLevel} />
                      <span className="text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── REPORTS TAB ─────────────────────────────── */}
      {tab === "reports" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-white font-bold text-sm">Generated Reports</h3>
              <p className="text-muted-foreground text-xs mt-0.5">Download, print, or share PDF medical reports</p>
            </div>
            {isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : allRows.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No reports yet</p>
                <p className="text-xs mt-1">Run an analysis to generate reports</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {allRows.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/10 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-700/30 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium">{a.patientName}</div>
                      <div className="text-muted-foreground text-xs mt-0.5">
                        <span className="font-mono">{a.reportId ?? a.patientId}</span>
                        <span className="mx-2">·</span>
                        <span>{a.prediction}</span>
                        <span className="mx-2">·</span>
                        <span>{new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                    <RiskBadge level={a.riskLevel} />
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => downloadReport(a)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors">
                        <Download size={12} /> Download
                      </button>
                      <button onClick={() => printReport(a)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 text-xs font-medium transition-colors">
                        <Printer size={12} /> Print
                      </button>
                      <button onClick={() => shareReport(a)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-900/20 hover:bg-green-900/40 text-green-400 text-xs font-medium transition-colors">
                        <Share2 size={12} /> Share
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
