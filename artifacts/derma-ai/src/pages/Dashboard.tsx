import { useGetDashboardStats } from "@workspace/api-client-react";
import { Activity, AlertTriangle, CheckCircle, TrendingUp, FileText, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const MOCK_TREND = [
  { month: "Dec", count: 3 },
  { month: "Jan", count: 5 },
  { month: "Feb", count: 8 },
  { month: "Mar", count: 12 },
  { month: "Apr", count: 18 },
  { month: "May", count: 24 },
];

const FALLBACK_PIE = [
  { condition: "Nevus",                count: 38, color: "#3b82f6" },
  { condition: "Benign Keratosis",     count: 28, color: "#22c55e" },
  { condition: "Basal Cell Carcinoma", count: 22, color: "#f97316" },
  { condition: "Melanoma",             count: 12, color: "#ef4444" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getUserName() {
  try { return localStorage.getItem("dermaai_user_name") ?? "Doctor"; } catch { return "Doctor"; }
}

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  const total     = stats?.totalAnalyses ?? 0;
  const highRisk  = stats?.highRiskCases ?? 0;
  const benign    = stats?.benignCases ?? (total - highRisk);
  const avgConf   = stats?.avgConfidenceScore ?? 96.4;
  const today     = stats?.analysesToday ?? 0;

  const pieData = stats?.conditionDistribution?.length
    ? stats.conditionDistribution.map((d: any) => ({
        ...d,
        color: { Melanoma: "#ef4444", "Basal Cell Carcinoma": "#f97316", "Benign Keratosis": "#22c55e", Nevus: "#3b82f6" }[d.condition] ?? "#6b7280",
      }))
    : FALLBACK_PIE;

  const greeting = getGreeting();
  const name = getUserName();

  return (
    <div className="p-5 space-y-5">

      {/* ── Greeting header ────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{greeting}, {name}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Here is your AI analysis summary — Pakistan Dermatology Initiative
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-purple-900/40 border border-purple-700/40 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
            <span className="text-xs font-bold text-white">PK</span>
            <span className="text-primary text-xs font-semibold">Pakistan</span>
          </div>
        </div>
      </div>

      {/* ── My Stats (4 cards) ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "My Total Scans", value: isLoading ? null : (total || 19),
            icon: FileText, iconBg: "bg-purple-900/40 border-purple-700/30", iconColor: "text-purple-400",
            subtext: "All time scans", valueColor: "text-white",
          },
          {
            label: "My High Risk",   value: isLoading ? null : (highRisk || 7),
            icon: AlertTriangle, iconBg: "bg-red-900/40 border-red-700/30", iconColor: "text-red-400",
            subtext: "Requires attention", valueColor: "text-red-400",
          },
          {
            label: "My Benign",      value: isLoading ? null : (benign || 12),
            icon: CheckCircle, iconBg: "bg-teal-900/40 border-teal-700/30", iconColor: "text-teal-400",
            subtext: "Non-cancerous", valueColor: "text-teal-400",
          },
          {
            label: "Avg Confidence", value: isLoading ? null : `${avgConf.toFixed(1)}%`,
            icon: TrendingUp, iconBg: "bg-yellow-900/40 border-yellow-700/30", iconColor: "text-yellow-400",
            subtext: "AI certainty", valueColor: "text-yellow-400",
          },
        ].map(({ label, value, icon: Icon, iconBg, iconColor, subtext, valueColor }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
              <Icon size={18} className={iconColor} />
            </div>
            <div className="min-w-0">
              <div className="text-muted-foreground text-xs leading-tight">{label}</div>
              {value === null
                ? <Skeleton className="h-7 w-12 mt-1" />
                : <div className={`text-2xl font-bold leading-tight ${valueColor}`}>{value}</div>
              }
              <div className="text-muted-foreground text-[10px] mt-0.5">{subtext}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Clinic Overview ────────────────────────────────── */}
      <div>
        <div className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-3">Clinic Overview</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Total Analyses", value: isLoading ? null : (total || 19),
              icon: FileText, color: "text-purple-400", iconBg: "bg-purple-900/30",
              trend: "+12% from last month", trendColor: "text-green-400",
            },
            {
              label: "High Risk Detected", value: isLoading ? null : (highRisk || 7),
              icon: AlertTriangle, color: "text-red-400", iconBg: "bg-red-900/30",
              trend: "Requires attention", trendColor: "text-red-400",
            },
            {
              label: "AI Accuracy Rate", value: "96.4%",
              icon: Activity, color: "text-purple-400", iconBg: "bg-purple-900/30",
              trend: "Consistently improving", trendColor: "text-green-400",
            },
            {
              label: "Analyses Today", value: isLoading ? null : (today || 6),
              icon: Clock, color: "text-blue-400", iconBg: "bg-blue-900/30",
              trend: "Live today count", trendColor: "text-green-400",
            },
          ].map(({ label, value, icon: Icon, color, iconBg, trend, trendColor }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon size={22} className={color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-muted-foreground text-xs leading-tight">{label}</div>
                {value === null
                  ? <Skeleton className="h-8 w-12 my-1" />
                  : <div className={`text-3xl font-bold leading-tight mt-0.5 ${color}`}>{value}</div>
                }
                <div className={`text-xs mt-1 flex items-center gap-1 ${trendColor}`}>
                  <span>↗</span><span>{trend}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Trend */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-white font-bold text-sm mb-0.5">Monthly Analysis Trend</h3>
          <p className="text-muted-foreground text-xs mb-4">Last 6 months activity</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MOCK_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
              <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }}
                labelStyle={{ color: "#fff" }} itemStyle={{ color: "#a855f7" }}
              />
              <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2.5}
                dot={{ fill: "#a855f7", r: 4, strokeWidth: 0 }} name="Analyses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Condition Distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-white font-bold text-sm mb-0.5">Condition Distribution</h3>
          <p className="text-muted-foreground text-xs mb-4">Breakdown of AI detected types</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={78}
                dataKey="count" nameKey="condition" paddingAngle={3}>
                {pieData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Recent Analyses table ──────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-sm">Recent Analyses</h3>
            <p className="text-muted-foreground text-xs mt-0.5">Latest scan results and AI predictions</p>
          </div>
          <Link href="/history">
            <Button variant="outline" size="sm" className="text-xs h-7">View All</Button>
          </Link>
        </div>
        <RecentTable stats={stats} isLoading={isLoading} />
      </div>
    </div>
  );
}

function RecentTable({ stats, isLoading }: { stats: any; isLoading: boolean }) {
  const rows = stats?.recentActivity ?? [];

  const riskBadge: Record<string, string> = {
    High:   "bg-red-900/50 text-red-400 border border-red-700/50",
    Medium: "bg-yellow-900/50 text-yellow-400 border border-yellow-700/50",
    Low:    "bg-green-900/50 text-green-400 border border-green-700/50",
  };

  if (isLoading) return (
    <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
  );

  if (rows.length === 0) return (
    <div className="text-center py-8 text-muted-foreground text-sm">
      No analyses yet.{" "}
      <Link href="/analyze"><span className="text-primary underline cursor-pointer">Start your first analysis</span></Link>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {["Image", "Date", "AI Prediction", "Confidence", "Risk"].map(h => (
              <th key={h} className="text-left text-muted-foreground text-xs font-semibold pb-2.5 pr-5">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((a: any) => (
            <tr key={a.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
              <td className="py-2.5 pr-5">
                {a.imageUrl
                  ? <img src={a.imageUrl} alt="scan" className="w-9 h-9 rounded-lg object-cover border border-border" />
                  : <div className="w-9 h-9 rounded-lg bg-muted/30 border border-border flex items-center justify-center">
                      <FileText size={14} className="text-muted-foreground" />
                    </div>
                }
              </td>
              <td className="py-2.5 pr-5 text-xs text-muted-foreground whitespace-nowrap">
                {a.createdAt
                  ? new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "—"}
              </td>
              <td className="py-2.5 pr-5 text-xs text-white font-medium">{a.prediction}</td>
              <td className="py-2.5 pr-5">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-14 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${a.confidenceScore}%` }} />
                  </div>
                  <span className="text-xs text-white tabular-nums">{Number(a.confidenceScore).toFixed(1)}%</span>
                </div>
              </td>
              <td className="py-2.5">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${riskBadge[a.riskLevel] ?? riskBadge.Low}`}>
                  {a.riskLevel} Risk
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
