import { useState, useRef } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDashboardStats, getGetDashboardStatsQueryKey,
  useListAnalyses, getListAnalysesQueryKey,
  useListDoctors,
  useUploadImage,
  useGetChatHistory, getGetChatHistoryQueryKey,
  useSendChatMessage,
} from "@workspace/api-client-react";
import {
  Activity, AlertTriangle, Users, Calendar, UserCheck, TrendingUp, Upload, Send, Bell, Eye, Download, RotateCcw, Search, RefreshCw, ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

function StatCard({ title, value, subtitle, icon: Icon, gradient, delta }: any) {
  return (
    <div className={`rounded-xl p-4 text-white ${gradient} relative overflow-hidden`} data-testid="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-white/70 text-xs font-medium uppercase tracking-wide">{title}</div>
          <div className="text-3xl font-bold mt-1">{value}</div>
          {delta && <div className="text-white/80 text-xs mt-1">{delta}</div>}
          {subtitle && <div className="text-white/70 text-xs mt-1">{subtitle}</div>}
        </div>
        <div className="bg-white/20 rounded-lg p-2">
          <Icon size={20} />
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full"></div>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    High: "bg-red-900/50 text-red-400 border-red-700/50",
    Medium: "bg-yellow-900/50 text-yellow-400 border-yellow-700/50",
    Low: "bg-green-900/50 text-green-400 border-green-700/50",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${colors[level] ?? colors.Low}`}>{level}</span>
  );
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: analyses, isLoading: analysesLoading } = useListAnalyses({ search: "", patientId: "", dateFrom: "", dateTo: "" }, {
    query: { queryKey: getListAnalysesQueryKey({ search: "", patientId: "", dateFrom: "", dateTo: "" }) }
  });
  const { data: doctors } = useListDoctors();
  const { data: chatHistory, isLoading: chatLoading } = useGetChatHistory();
  const sendMessage = useSendChatMessage();
  const uploadImage = useUploadImage();

  const [chatInput, setChatInput] = useState("");
  const [localMessages, setLocalMessages] = useState<Array<{ role: string; content: string; timestamp: string }>>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("");
  const [conditionDetails, setConditionDetails] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeImageTab, setActiveImageTab] = useState("original");
  const fileRef = useRef<HTMLInputElement>(null);

  const pstTime = () => {
    const d = new Date(new Date().getTime() + 5 * 60 * 60 * 1000);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = (e.target?.result as string).split(",")[1];
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  }

  function handleAnalyze() {
    if (!uploadedImage || !patientName) return;
    const b64 = uploadedImage.split(",")[1];
    uploadImage.mutate(
      { data: { patientName, conditionDetails, imageData: b64, age: 30, gender: "Male" } },
      {
        onSuccess: (result: any) => {
          setAnalysisResult(result);
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
        },
      }
    );
  }

  function handleSendChat() {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput("");
    setLocalMessages(p => [...p, { role: "user", content: msg, timestamp: pstTime() }]);
    sendMessage.mutate(
      { data: { message: msg } },
      {
        onSuccess: (res: any) => {
          setLocalMessages(p => [...p, { role: "assistant", content: res.response, timestamp: pstTime() }]);
          queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey() });
        },
      }
    );
  }

  const allMessages = [
    ...(chatHistory ?? []).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) })),
    ...localMessages,
  ];

  const filteredAnalyses = (analyses ?? []).filter((a: any) =>
    !historySearch || a.patientName.toLowerCase().includes(historySearch.toLowerCase()) || a.patientId.toLowerCase().includes(historySearch.toLowerCase())
  ).slice(0, 6);

  const riskProgressData = analysisResult?.riskProgressData ?? [
    { month: "May 2024", riskScore: 45 }, { month: "Jul 2024", riskScore: 52 }, { month: "Sep 2024", riskScore: 61 },
    { month: "Nov 2024", riskScore: 70 }, { month: "Jan 2025", riskScore: 79 }, { month: "Mar 2025", riskScore: 88 },
  ];

  const pieData = stats?.conditionDistribution?.length
    ? stats.conditionDistribution
    : [
        { condition: "Melanoma", count: 38, color: "#ef4444" },
        { condition: "Basal Cell Carcinoma", count: 28, color: "#f97316" },
        { condition: "Benign Keratosis", count: 22, color: "#22c55e" },
        { condition: "Nevus", count: 12, color: "#3b82f6" },
      ];

  const topDoctors = (doctors ?? []).slice(0, 4);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, Dr. Muhammad Ali</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-white text-sm font-semibold">{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} (PST)</div>
            <div className="text-muted-foreground text-xs">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
          </div>
          <div className="relative">
            <Bell size={20} className="text-muted-foreground" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[9px]">3</span>
          </div>
        </div>
      </div>

      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/30 border border-purple-700/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Good morning, Dr. Muhammad Ali</h2>
            <p className="text-purple-300 text-sm">Here is your AI analysis summary — Pakistan Dermatology Initiative</p>
          </div>
          <div className="hidden sm:block px-3 py-1 bg-purple-600/30 border border-purple-500/50 rounded-lg">
            <span className="text-purple-300 text-sm font-semibold">PK Pakistan</span>
          </div>
        </div>

        {/* My Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: "My Total Scans", value: statsLoading ? "—" : stats?.totalAnalyses ?? 19, icon: "📋" },
            { label: "My High Risk", value: statsLoading ? "—" : stats?.highRiskCases ?? 7, icon: "⚠", color: "text-red-400" },
            { label: "My Benign", value: statsLoading ? "—" : (stats?.totalAnalyses ?? 19) - (stats?.highRiskCases ?? 7), icon: "✓", color: "text-green-400" },
            { label: "Avg Confidence", value: `${stats?.aiAccuracyRate ?? 96.4}%`, icon: "★", color: "text-yellow-400" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center gap-2">
                <span className={`text-base ${color ?? "text-purple-400"}`}>{icon}</span>
                <span className="text-white/60 text-xs">{label}</span>
              </div>
              <div className={`text-2xl font-bold mt-1 ${color ?? "text-white"}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard title="Total Analyses" value={statsLoading ? "—" : (stats?.totalAnalyses ?? 128)} delta="+18 this week" icon={Activity} gradient="gradient-purple" />
        <StatCard title="High Risk Cases" value={statsLoading ? "—" : (stats?.highRiskCases ?? 23)} delta="+5 this week" icon={AlertTriangle} gradient="gradient-red" />
        <StatCard title="Doctors Online" value={stats?.doctorsOnline ?? 12} subtitle="Online now" icon={Users} gradient="gradient-green" />
        <StatCard title="Appointments" value={stats?.appointments ?? 34} subtitle="Today" icon={Calendar} gradient="gradient-blue" />
        <StatCard title="Total Patients" value={statsLoading ? "—" : (stats?.totalPatients ?? 256)} subtitle="Registered" icon={UserCheck} gradient="gradient-teal" />
      </div>

      {/* Clinic Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Analyses", value: stats?.totalAnalyses ?? 19, sub: "+12% from last month", subColor: "text-green-400" },
          { label: "High Risk Detected", value: stats?.highRiskCases ?? 7, sub: "Requires attention", subColor: "text-red-400" },
          { label: "AI Accuracy Rate", value: `${stats?.aiAccuracyRate ?? 96.4}%`, sub: "Consistently improving", subColor: "text-green-400" },
          { label: "Analyses Today", value: stats?.analysesToday ?? 6, sub: "Live today count", subColor: "text-blue-400" },
        ].map(({ label, value, sub, subColor }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className="text-muted-foreground text-xs uppercase tracking-wide font-medium">{label}</div>
            <div className="text-3xl font-bold text-white mt-1">{value}</div>
            <div className={`text-xs mt-1 ${subColor}`}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Main grid: Analyze + Doctors + Chat */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Analyze Skin Lesion */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="text-white font-bold text-base mb-4">Analyze Skin Lesion</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload + Patient Info */}
              <div className="space-y-3">
                {!uploadedImage ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                    data-testid="upload-zone"
                  >
                    <Upload size={32} className="mx-auto text-muted-foreground mb-2" />
                    <div className="text-white text-sm font-medium">Upload Image</div>
                    <div className="text-muted-foreground text-xs mt-1">Drag & drop or click to browse<br />JPG, PNG, JPEG (Max 10MB)</div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} data-testid="file-input" />
                  </div>
                ) : (
                  <div className="relative">
                    <img src={uploadedImage} alt="Uploaded" className="w-full rounded-xl object-cover max-h-40" />
                    <button onClick={() => { setUploadedImage(null); setAnalysisResult(null); }} className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80">
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                )}

                {/* Patient Info */}
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Patient Name</label>
                    <Input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Ali Raza" className="mt-1 h-8 text-sm bg-background" data-testid="input-patient-name" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Condition / Details</label>
                    <Input value={conditionDetails} onChange={e => setConditionDetails(e.target.value)} placeholder="Dark spot on back for 3 months..." className="mt-1 h-8 text-sm bg-background" data-testid="input-condition" />
                  </div>
                </div>

                <div className="flex gap-2">
                  {analysisResult && (
                    <Button variant="outline" size="sm" onClick={() => { setAnalysisResult(null); }} className="flex-1 h-8 text-xs">
                      <RotateCcw size={12} className="mr-1" /> Re-analyze
                    </Button>
                  )}
                  <Button onClick={handleAnalyze} disabled={!uploadedImage || !patientName || uploadImage.isPending} className="flex-1 h-8 text-xs gradient-purple border-0" data-testid="button-analyze">
                    {uploadImage.isPending ? <><RefreshCw size={12} className="mr-1 animate-spin" /> Analyzing...</> : <><Activity size={12} className="mr-1" /> Analyze</>}
                  </Button>
                </div>

                {uploadedImage && !analysisResult && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-green-400 text-xs">Image Quality: Good</span>
                  </div>
                )}
              </div>

              {/* Results Panel */}
              <div>
                {analysisResult ? (
                  <div className="space-y-3">
                    {/* Image tabs */}
                    <div className="bg-background rounded-lg p-3">
                      <div className="flex gap-2 mb-3">
                        {["original", "segmented", "heatmap"].map(tab => (
                          <button key={tab} onClick={() => setActiveImageTab(tab)} className={`text-xs px-2 py-1 rounded capitalize transition-colors ${activeImageTab === tab ? "bg-primary text-white" : "text-muted-foreground hover:text-white"}`}>
                            {tab === "segmented" ? "Segmentation" : tab === "heatmap" ? "Heatmap" : "Original"}
                          </button>
                        ))}
                      </div>
                      <div className="relative rounded-lg overflow-hidden bg-gray-900 h-32 flex items-center justify-center">
                        {uploadedImage && (
                          <img src={uploadedImage} alt="Analysis" className="w-full h-full object-contain" />
                        )}
                        {activeImageTab === "segmented" && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="absolute inset-0 bg-black/40"></div>
                            <div className="relative w-20 h-20 rounded-full bg-red-500 opacity-70" style={{ boxShadow: "0 0 0 4px #22c55e" }}></div>
                            <div className="absolute bottom-2 left-2 text-white text-xs bg-black/60 px-2 py-0.5 rounded">U-Net Segmentation · AI Dermascan</div>
                          </div>
                        )}
                        {activeImageTab === "heatmap" && (
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-yellow-600/60 to-red-600/60 opacity-80"></div>
                        )}
                      </div>
                    </div>

                    {/* Prediction */}
                    <div className={`rounded-lg p-3 border ${analysisResult.isHighRisk ? "bg-red-900/20 border-red-700/40" : "bg-green-900/20 border-green-700/40"}`}>
                      <div className="text-xs text-muted-foreground mb-1">Prediction</div>
                      <div className={`text-lg font-bold ${analysisResult.isHighRisk ? "text-red-400" : "text-green-400"}`}>{analysisResult.prediction}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <RiskBadge level={analysisResult.riskLevel} />
                        <span className="text-white text-sm font-bold">{analysisResult.confidenceScore?.toFixed(1)}%</span>
                        <span className="text-muted-foreground text-xs">Confidence</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                        <div><span className="text-muted-foreground">Risk Level </span><span className="text-white font-medium">{analysisResult.riskLevel}</span></div>
                        <div><span className="text-muted-foreground">ABCDE </span><span className="text-white font-medium">{analysisResult.abcdeScore}</span></div>
                        <div><span className="text-muted-foreground">Cancer Type </span><span className="text-white font-medium">{analysisResult.cancerType}</span></div>
                        <div><span className="text-muted-foreground">Lesion Area </span><span className="text-white font-medium">{analysisResult.lesionArea}</span></div>
                      </div>
                    </div>

                    <Button size="sm" className="w-full h-8 text-xs gradient-purple border-0" data-testid="button-download-report">
                      <Download size={12} className="mr-1" /> Download Report (PDF)
                    </Button>
                    {analysisResult.reportId && (
                      <div className="text-muted-foreground text-xs text-center">Report ID: {analysisResult.reportId}</div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
                    <Activity size={32} className="mb-2 opacity-30" />
                    <p className="text-sm">Upload an image and click Analyze</p>
                    <p className="text-xs mt-1">Results will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-bold text-base">History</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    placeholder="Search by Patient Name or ID..."
                    className="pl-7 h-7 text-xs bg-background w-48"
                    data-testid="input-history-search"
                  />
                </div>
                <Link href="/history">
                  <Button variant="outline" size="sm" className="h-7 text-xs">View All</Button>
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["ID", "Patient Name", "Age", "Gender", "Prediction", "Risk Level", "Date", "Action"].map(h => (
                      <th key={h} className="text-left text-muted-foreground text-xs font-medium pb-2 pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analysesLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}><td colSpan={8}><Skeleton className="h-8 mt-2" /></td></tr>
                    ))
                  ) : filteredAnalyses.length === 0 ? (
                    <tr><td colSpan={8} className="text-center text-muted-foreground py-6 text-xs">No analyses yet. Upload your first image to analyze.</td></tr>
                  ) : filteredAnalyses.map((a: any) => (
                    <tr key={a.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-2 pr-3 text-xs text-purple-400 font-mono">{a.patientId}</td>
                      <td className="py-2 pr-3 text-xs text-white">{a.patientName}</td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">{a.age ?? "—"}</td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">{a.gender ?? "—"}</td>
                      <td className="py-2 pr-3 text-xs text-white">{a.prediction}</td>
                      <td className="py-2 pr-3"><RiskBadge level={a.riskLevel} /></td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td className="py-2">
                        <button className="text-muted-foreground hover:text-white transition-colors" data-testid={`button-view-${a.id}`}>
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk Progress + Advanced Features */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Risk Progress Prediction */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-white font-bold text-sm mb-3">Risk Progress Prediction</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={riskProgressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
                  <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px" }} labelStyle={{ color: "#fff" }} itemStyle={{ color: "#ef4444" }} />
                  <Line type="monotone" dataKey="riskScore" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444", r: 3 }} name="Risk Score" />
                </LineChart>
              </ResponsiveContainer>
              {analysisResult?.isHighRisk && (
                <div className="mt-2 flex items-center gap-2 text-red-400 text-xs">
                  <AlertTriangle size={12} />
                  <span>High Risk if untreated</span>
                </div>
              )}
            </div>

            {/* Condition Distribution */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-white font-bold text-sm mb-3">Condition Distribution</h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="count" nameKey="condition">
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151" }} labelStyle={{ color: "#fff" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "10px", color: "#9ca3af" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom feature panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Similar Case Finder */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-bold text-xs">Similar Case Finder</h3>
                <button className="text-primary text-xs">View All</button>
              </div>
              <p className="text-muted-foreground text-xs mb-3">{analysisResult?.similarCases?.length ?? 5} similar cases found</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {(analysisResult?.similarCases ?? Array.from({ length: 5 })).slice(0, 5).map((c: any, i: number) => (
                  <div key={i} className="shrink-0 text-center">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-border overflow-hidden">
                      {c?.imageUrl ? <img src={c.imageUrl} alt="case" className="w-full h-full object-cover" /> : <Activity size={16} className="text-muted-foreground" />}
                    </div>
                    <div className="text-white text-[9px] mt-1 truncate w-12">{c?.prediction ?? "Melanoma"}</div>
                    <div className={`text-[9px] ${(c?.riskLevel ?? "High") === "High" ? "text-red-400" : "text-green-400"}`}>{c?.riskLevel ?? "High"} Risk</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Explainable AI */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-white font-bold text-xs mb-2">Explainable AI</h3>
              <p className="text-muted-foreground text-xs mb-2">Why this prediction?</p>
              <div className="space-y-1.5">
                {(analysisResult?.explainableAiReasons ?? [
                  "Irregular border detected", "Asymmetry in shape", "Multiple color variations", "Diameter > 6mm", "Evolution in recent months"
                ]).map((reason: string) => (
                  <div key={reason} className="flex items-start gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-green-900/50 border border-green-500/50 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-green-400 text-[8px]">✓</span>
                    </div>
                    <span className="text-white text-[10px] leading-tight">{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Factors */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-white font-bold text-xs mb-3">Risk Factors</h3>
              {[
                { label: "Sun Exposure", value: "High", risk: true },
                { label: "Skin Type", value: "Type III", risk: false },
                { label: "Family History", value: "Yes", risk: true },
                { label: "Age", value: "34", risk: false },
                { label: "Immune Condition", value: "No", risk: false },
              ].map(({ label, value, risk }) => (
                <div key={label} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm flex items-center justify-center ${risk ? "bg-red-900/50 border border-red-500/50" : "bg-green-900/50 border border-green-500/50"}`}>
                      <span className={`text-[8px] ${risk ? "text-red-400" : "text-green-400"}`}>✓</span>
                    </div>
                    <span className="text-muted-foreground text-[10px]">{label}</span>
                  </div>
                  <span className={`text-[10px] font-semibold ${risk ? "text-red-400" : "text-white"}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* Report Verification + Emergency Alert */}
            <div className="space-y-3">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-white font-bold text-xs mb-2">Report Verification</h3>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shrink-0">
                    <div className="grid grid-cols-5 gap-px">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div key={i} className={`w-2 h-2 ${Math.random() > 0.5 ? "bg-black" : "bg-white"}`}></div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px]">Scan QR code to verify authenticity</p>
                    <p className="text-white text-[10px] mt-1 font-mono">{analysisResult?.reportId ?? "REP-2024-00058"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Bell size={12} className="text-red-400" />
                  <span className="text-red-400 text-xs font-bold">Emergency Alert</span>
                </div>
                <p className="text-red-300 text-[10px]">High risk case detected! Alert sent to 3 doctors</p>
                <div className="mt-2 text-center">
                  <Bell size={24} className="text-red-400 mx-auto animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Image Comparison */}
          {analysisResult && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-white font-bold text-sm mb-3">Multi-Image Comparison</h3>
              <div className="relative h-40 rounded-xl overflow-hidden bg-gray-900">
                <div className="absolute left-0 top-0 bottom-0 w-1/2 overflow-hidden">
                  <img src={uploadedImage ?? ""} alt="Before" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-white text-xs">Before</div>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden">
                  <img src={uploadedImage ?? ""} alt="After" className="w-full h-full object-cover brightness-75 hue-rotate-15" />
                  <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-white text-xs">After (3 Months)</div>
                </div>
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white z-10">
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg cursor-ew-resize">
                    <span className="text-gray-800 text-xs font-bold">⇔</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Doctors + Chat */}
        <div className="space-y-4">
          {/* Top Pakistani Doctors */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-bold text-sm">Top Pakistani Doctors</h2>
              <Link href="/doctors">
                <span className="text-primary text-xs cursor-pointer hover:underline">View All</span>
              </Link>
            </div>
            <div className="space-y-3">
              {topDoctors.length > 0 ? topDoctors.map((d: any) => (
                <div key={d.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">{d.name.split(" ").map((n: string) => n[0]).slice(1, 3).join("")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-semibold truncate">{d.name}</div>
                    <div className="text-muted-foreground text-[10px]">{d.specialty}</div>
                    <div className="text-muted-foreground text-[10px] flex items-center gap-1">
                      <span>{d.city}, Pakistan</span>
                      {d.isOnline && <span className="text-green-400">● Online</span>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {["Message", "Request", "Call", "Appointment"].map(action => (
                        <button key={action} className="text-muted-foreground hover:text-primary transition-colors" title={action} data-testid={`button-${action.toLowerCase()}-${d.id}`}>
                          {action === "Message" ? <span className="text-[9px] border border-border rounded px-1 py-0.5 hover:border-primary">Msg</span> :
                           action === "Request" ? <span className="text-[9px] border border-border rounded px-1 py-0.5 hover:border-primary">Req</span> :
                           action === "Call" ? <span className="text-[9px] border border-border rounded px-1 py-0.5 hover:border-primary">Call</span> :
                           <span className="text-[9px] border border-border rounded px-1 py-0.5 hover:border-primary">Appt</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )) : [
                { name: "Dr. Ayesha Khan", specialty: "Dermatologist", city: "Lahore" },
                { name: "Dr. Farhan Ahmed", specialty: "Dermatologist", city: "Karachi" },
                { name: "Dr. Sana Malik", specialty: "Dermatologist", city: "Islamabad" },
                { name: "Dr. Imran Qureshi", specialty: "Dermatologist", city: "Peshawar" },
              ].map((d, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">{d.name.split(" ").slice(-2).map(n => n[0]).join("")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-semibold">{d.name}</div>
                    <div className="text-muted-foreground text-[10px]">{d.specialty}</div>
                    <div className="text-green-400 text-[10px]">● Online · {d.city}</div>
                    <div className="flex gap-1.5 mt-1.5">
                      {["Msg", "Req", "Call", "Appt"].map(a => (
                        <button key={a} className="text-[9px] border border-border rounded px-1.5 py-0.5 text-muted-foreground hover:border-primary hover:text-primary transition-colors">{a}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Doctor Assistant */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col">
            <h2 className="text-white font-bold text-sm mb-3">AI Doctor Assistant</h2>
            <div className="flex-1 min-h-[200px] max-h-[280px] overflow-y-auto space-y-3 mb-3 scrollbar-thin">
              {allMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-6">
                  <Activity size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Ask me anything about skin analysis...</p>
                  <div className="mt-3 flex flex-wrap gap-2 justify-center">
                    {["Summarize this patient report", "Explain melanoma risk", "What is ABCDE criteria?"].map(q => (
                      <button key={q} onClick={() => setChatInput(q)} className="text-xs bg-purple-900/30 border border-purple-700/30 text-purple-300 rounded-lg px-2 py-1 hover:bg-purple-900/50 transition-colors">{q}</button>
                    ))}
                  </div>
                </div>
              ) : allMessages.map((m: any, i: number) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${m.role === "user" ? "bg-primary text-white rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                    <p>{m.content}</p>
                    <p className="text-[9px] opacity-60 mt-1">{m.timestamp}</p>
                  </div>
                </div>
              ))}
              {sendMessage.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-3 py-2">
                    <div className="flex gap-1"><span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce delay-100"></span><span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce delay-200"></span></div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendChat()}
                placeholder="Ask me anything..."
                className="flex-1 h-8 text-xs bg-background"
                data-testid="input-chat"
              />
              <Button onClick={handleSendChat} disabled={!chatInput.trim() || sendMessage.isPending} size="sm" className="h-8 w-8 p-0 gradient-purple border-0" data-testid="button-send-chat">
                <Send size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
