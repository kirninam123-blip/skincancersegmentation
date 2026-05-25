import { useState } from "react";
import { useListAnalyses, getListAnalysesQueryKey } from "@workspace/api-client-react";
import { Search, Eye, Download, Filter, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

function RiskBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    High: "bg-red-900/50 text-red-400 border-red-700/50",
    Medium: "bg-yellow-900/50 text-yellow-400 border-yellow-700/50",
    Low: "bg-green-900/50 text-green-400 border-green-700/50",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${styles[level] ?? styles.Low}`}>{level} Risk</span>;
}

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const params = { search: search || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined };
  const { data: analyses, isLoading } = useListAnalyses(params, {
    query: { queryKey: getListAnalysesQueryKey(params) }
  });

  const rows = analyses ?? [];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Analysis History</h1>
        <p className="text-muted-foreground text-sm">Search and review all past skin lesion analyses</p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Patient Name or ID..."
              className="pl-9 bg-background h-9 text-sm"
              data-testid="history-search"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-muted-foreground" />
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-background h-9 text-xs w-36" placeholder="From" />
            <span className="text-muted-foreground text-xs">to</span>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-background h-9 text-xs w-36" placeholder="To" />
          </div>
          <Button variant="outline" size="sm" className="h-9" onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); }}>
            Clear
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Records", value: rows.length, color: "text-white" },
          { label: "High Risk", value: rows.filter((r: any) => r.riskLevel === "High").length, color: "text-red-400" },
          { label: "Medium Risk", value: rows.filter((r: any) => r.riskLevel === "Medium").length, color: "text-yellow-400" },
          { label: "Low Risk", value: rows.filter((r: any) => r.riskLevel === "Low").length, color: "text-green-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3">
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                {["ID", "Patient Name", "Age", "Gender", "Prediction", "Risk Level", "Confidence", "Date", "Action"].map(h => (
                  <th key={h} className="text-left text-muted-foreground text-xs font-semibold px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-border/30">
                    <td colSpan={9} className="px-4 py-3">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-muted-foreground py-12">
                    <Search size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{search ? `No results for "${search}"` : "No analyses recorded yet"}</p>
                    <p className="text-xs mt-1">Upload your first image from the Analyze page</p>
                  </td>
                </tr>
              ) : rows.map((a: any) => (
                <tr key={a.id} className="border-t border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-purple-400 text-xs font-mono whitespace-nowrap">{a.patientId}</td>
                  <td className="px-4 py-3 text-white text-xs font-medium whitespace-nowrap">{a.patientName}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{a.age ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{a.gender ?? "—"}</td>
                  <td className="px-4 py-3 text-white text-xs whitespace-nowrap">{a.prediction}</td>
                  <td className="px-4 py-3"><RiskBadge level={a.riskLevel} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted h-1.5 rounded-full max-w-[60px]">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${a.confidenceScore}%` }}></div>
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
                        data-testid={`button-view-${a.id}`}
                        title="View details"
                      >
                        <Eye size={15} />
                      </button>
                      <button className="text-muted-foreground hover:text-primary transition-colors" title="Download report" data-testid={`button-report-${a.id}`}>
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

      {/* Detail panel */}
      {selected && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-white font-bold">{selected.patientName}</h3>
              <p className="text-muted-foreground text-xs">{selected.patientId}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-white text-sm">Close</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Prediction", value: selected.prediction },
              { label: "Risk Level", value: selected.riskLevel },
              { label: "Confidence", value: `${selected.confidenceScore?.toFixed(1)}%` },
              { label: "ABCDE Score", value: selected.abcdeScore ?? "—" },
              { label: "Cancer Type", value: selected.cancerType ?? "—" },
              { label: "Lesion Area", value: selected.lesionArea ?? "—" },
              { label: "Age", value: selected.age ?? "—" },
              { label: "Gender", value: selected.gender ?? "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-muted-foreground text-xs">{label}</div>
                <div className="text-white text-sm font-semibold mt-0.5">{value}</div>
              </div>
            ))}
          </div>
          {selected.recommendations && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <div className="text-white text-xs font-semibold mb-1">Recommendations</div>
              <p className="text-muted-foreground text-xs leading-relaxed">{selected.recommendations}</p>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <Button className="gradient-purple border-0 text-xs h-8">
              <Download size={12} className="mr-1.5" /> Download PDF Report
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
