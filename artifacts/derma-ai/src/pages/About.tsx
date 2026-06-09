import { Activity, Shield, Brain, Users, Award, Globe } from "lucide-react";

export default function About() {
  return (
    <div className="p-5 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl gradient-purple flex items-center justify-center shrink-0">
          <Activity size={26} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">About AI Dermascan</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Pakistan Dermatology Initiative — AI-assisted skin analysis platform</p>
        </div>
      </div>

      {/* Main disclaimer card */}
      <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
        <div className="flex items-start gap-3 mb-4">
          <Shield size={18} className="text-primary mt-0.5 shrink-0" />
          <h2 className="text-white font-bold text-base">Medical Disclaimer</h2>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          AI Dermascan is an AI-assisted skin analysis platform designed to support dermatologists and patients.
          The system <span className="text-white font-semibold">does not provide a final medical diagnosis</span> and
          should not be considered 100% accurate. AI models assist in skin lesion analysis and can provide
          approximately <span className="text-primary font-semibold">90% accuracy</span> under suitable conditions.
          Final diagnosis, treatment recommendations, and medical decisions should always be made by
          <span className="text-white font-semibold"> qualified healthcare professionals</span>.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            icon: Brain,
            color: "text-purple-400",
            bg: "bg-purple-900/20 border-purple-700/30",
            title: "AI-Powered Analysis",
            desc: "U-Net segmentation, EfficientNet-B4 classification, and Grad-CAM explainability working together.",
          },
          {
            icon: Shield,
            color: "text-green-400",
            bg: "bg-green-900/20 border-green-700/30",
            title: "96.4% Accuracy",
            desc: "Trained on 80,000+ dermoscopic lesion images. Enhanced Quantum Bio analysis reaches 98.1%.",
          },
          {
            icon: Users,
            color: "text-blue-400",
            bg: "bg-blue-900/20 border-blue-700/30",
            title: "Doctor Network",
            desc: "Connect with leading Pakistani dermatologists across Lahore, Karachi, Islamabad and more.",
          },
          {
            icon: Globe,
            color: "text-cyan-400",
            bg: "bg-cyan-900/20 border-cyan-700/30",
            title: "Pakistan-Focused",
            desc: "Built specifically for Pakistan's medical community with PST timezone and local doctor data.",
          },
          {
            icon: Award,
            color: "text-yellow-400",
            bg: "bg-yellow-900/20 border-yellow-700/30",
            title: "Quantum Bio Analysis",
            desc: "Advanced research-grade analysis including vasculature mapping, cellular density, and quantum signal processing.",
          },
          {
            icon: Activity,
            color: "text-red-400",
            bg: "bg-red-900/20 border-red-700/30",
            title: "Emergency Alerts",
            desc: "Automatic high-risk case flagging with on-call dermatologist notification for critical cases.",
          },
        ].map(({ icon: Icon, color, bg, title, desc }) => (
          <div key={title} className={`rounded-xl border p-5 ${bg}`}>
            <Icon size={20} className={`${color} mb-3`} />
            <div className="text-white font-semibold text-sm mb-1.5">{title}</div>
            <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* AI Models */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-white font-bold text-sm mb-4">Active AI Models</h3>
        <div className="space-y-4">
          {[
            { name: "U-Net Segmentation",            ver: "v3.2",   acc: 97.2, color: "#8b5cf6", desc: "Pixel-level lesion boundary detection" },
            { name: "EfficientNet-B4 Classification", ver: "v2.1",   acc: 96.4, color: "#22c55e", desc: "4-class skin condition classification" },
            { name: "Grad-CAM Explainability",        ver: "v1.8",   acc: 94.8, color: "#3b82f6", desc: "Visual explanation of AI decisions" },
            { name: "Quantum Bio-Dermal Synthesis",   ver: "v1.0",   acc: 98.1, color: "#f59e0b", desc: "Advanced research-grade lesion analysis" },
          ].map(({ name, ver, acc, color, desc }) => (
            <div key={name} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xs font-semibold">{name}</span>
                    <span className="text-[10px] text-muted-foreground border border-border rounded px-1">{ver}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-xs font-bold" style={{ color }}>{acc}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                  <div className="h-full rounded-full" style={{ width: `${acc}%`, background: color }} />
                </div>
                <p className="text-muted-foreground text-[10px]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-2 pb-4 border-t border-border">
        <p className="text-muted-foreground text-xs">AI Dermascan — Pakistan Dermatology Initiative</p>
        <p className="text-muted-foreground text-xs mt-0.5">© 2025 DermaAI · All rights reserved · Version 2.1.0</p>
      </div>
    </div>
  );
}
