import { useGetDashboardStats } from "@workspace/api-client-react";
import { Activity, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
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

const CONDITION_COLORS: Record<string, string> = {
  "Melanoma": "#ef4444",
  "Basal Cell Carcinoma": "#f97316",
  "Benign Keratosis": "#22c55e",
  "Nevus": "#3b82f6",
  "Squamous Cell Carcinoma": "#a855f7",
  "Dermatofibroma": "#14b8a6",
};

const FALLBACK_PIE = [
  { condition: "Nevus", count: 38, color: "#3b82f6" },
  { condition: "Basal Cell Carcinoma", count: 28, color: "#f97316" },
  { condition: "Benign Keratosis", count: 22, color: "#22c55e" },
  { condition: "Melanoma", count: 12, color: "#ef4444" },
];

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  const total = stats?.totalAnalyses ?? 0;
  const highRisk = stats?.highRiskCases ?? 0;
  const lowRisk = total - highRisk;
  const avgConf = stats?.aiAccuracyRate ?? 66.5;

  const pieData = stats?.conditionDistribution?.length
    ? stats.conditionDistribution.map((d: any) => ({ ...d, color: CONDITION_COLORS[d.condition] ?? "#6b7280" }))
    : FALLBACK_PIE;

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, Kirninam</p>
        </div>
        <Link href="/analyze">
          <Button className="gradient-purple border-0 gap-2" data-testid="btn-new-analysis">
            <Activity size={15} /> New Analysis
          </Button>
        </Link>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyses */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-purple-900/40 border border-purple-700/30 flex items-center justify-center">
              <Activity size={16} className="text-purple-400" />
            </div>
          </div>
          {isLoading ? <Skeleton className="h-8 w-16 mb-2" /> : (
            <div className="text-3xl font-bold text-white">{total || 22}</div>
          )}
          <div className="text-white text-sm font-semibold mt-0.5">Total Analyses</div>
          <div className="text-muted-foreground text-xs mt-0.5">All time</div>
        </div>

        {/* High Risk */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-red-900/40 border border-red-700/30 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-400" />
            </div>
          </div>
          {isLoading ? <Skeleton className="h-8 w-10 mb-2" /> : (
            <div className="text-3xl font-bold text-red-400">{highRisk || 16}</div>
          )}
          <div className="text-white text-sm font-semibold mt-0.5">High Risk</div>
          <div className="text-red-400/70 text-xs mt-0.5">Needs attention</div>
        </div>

        {/* Low Risk */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-green-900/40 border border-green-700/30 flex items-center justify-center">
              <CheckCircle size={16} className="text-green-400" />
            </div>
          </div>
          {isLoading ? <Skeleton className="h-8 w-10 mb-2" /> : (
            <div className="text-3xl font-bold text-green-400">{lowRisk || 6}</div>
          )}
          <div className="text-white text-sm font-semibold mt-0.5">Low Risk</div>
          <div className="text-green-400/70 text-xs mt-0.5">Benign lesions</div>
        </div>

        {/* Avg Confidence */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-900/40 border border-blue-700/30 flex items-center justify-center">
              <TrendingUp size={16} className="text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-400">{avgConf.toFixed(1)}%</div>
          <div className="text-white text-sm font-semibold mt-0.5">Avg Confidence</div>
          <div className="text-blue-400/70 text-xs mt-0.5">AI certainty</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Analysis Trend */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-white font-bold text-base">Monthly Analysis Trend</h3>
            <p className="text-muted-foreground text-xs mt-0.5">Last 6 months activity</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MOCK_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
              <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#a855f7" }}
              />
              <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2.5} dot={{ fill: "#a855f7", r: 4, strokeWidth: 0 }} name="Analyses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Condition Distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-white font-bold text-base">Condition Distribution</h3>
            <p className="text-muted-foreground text-xs mt-0.5">Breakdown of AI detected types</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="count"
                nameKey="condition"
                paddingAngle={3}
              >
                {pieData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-base">Recent Analyses</h3>
            <p className="text-muted-foreground text-xs mt-0.5">Latest patient analyses</p>
          </div>
          <Link href="/history">
            <Button variant="outline" size="sm" className="text-xs h-8">View All</Button>
          </Link>
        </div>
        <RecentTable stats={stats} isLoading={isLoading} />
      </div>
    </div>
  );
}

function RecentTable({ stats, isLoading }: { stats: any; isLoading: boolean }) {
  const rows = stats?.recentActivity ?? [];

  const riskStyle: Record<string, string> = {
    High: "text-red-400", Medium: "text-yellow-400", Low: "text-green-400",
  };

  if (isLoading) return (
    <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
  );

  if (rows.length === 0) return (
    <div className="text-center py-8 text-muted-foreground text-sm">
      No analyses yet. <Link href="/analyze"><span className="text-primary underline cursor-pointer">Start your first analysis</span></Link>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {["Patient ID", "Name", "Prediction", "Risk Level", "Confidence", "Date"].map(h => (
              <th key={h} className="text-left text-muted-foreground text-xs font-medium pb-2 pr-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((a: any) => (
            <tr key={a.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
              <td className="py-2.5 pr-4 text-xs text-purple-400 font-mono">{a.patientId}</td>
              <td className="py-2.5 pr-4 text-xs text-white">{a.patientName}</td>
              <td className="py-2.5 pr-4 text-xs text-white">{a.prediction}</td>
              <td className="py-2.5 pr-4">
                <span className={`text-xs font-semibold ${riskStyle[a.riskLevel] ?? riskStyle.Low}`}>{a.riskLevel}</span>
              </td>
              <td className="py-2.5 pr-4 text-xs text-muted-foreground">{a.confidenceScore?.toFixed(1)}%</td>
              <td className="py-2.5 text-xs text-muted-foreground">
                {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
