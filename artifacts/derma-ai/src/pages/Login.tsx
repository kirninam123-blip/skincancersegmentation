import { useState } from "react";
import { Eye, EyeOff, Activity, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginProps {
  onLogin: (user: { name: string; role: string }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [portal,   setPortal]   = useState<"patient" | "dermatologist" | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try { localStorage.setItem("dermaai_user_name", username.charAt(0).toUpperCase() + username.slice(1)); } catch {}
    if (!username || !password) { setError("Please enter username and password."); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (password.length < 4) { setError("Invalid credentials. Any username + 4+ char password works."); return; }
      const role = portal === "dermatologist" ? "Dermatologist" : "Patient";
      onLogin({ name: username, role });
    }, 800);
  }

  /* ── Step 1: Portal Selection ───────────────────────────── */
  if (!portal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl gradient-purple flex items-center justify-center mx-auto mb-4">
              <Activity size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">AI Dermascan</h1>
            <p className="text-muted-foreground text-sm mt-1">Skin Cancer Detection System</p>
            <div className="mt-2 text-xs text-purple-400 font-medium">Pakistan Dermatology Initiative</div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-white font-bold text-xl">Select Your Portal</h2>
            <p className="text-muted-foreground text-sm mt-1">Choose the portal that matches your role to get started</p>
          </div>

          <div className="space-y-4">
            {/* Patient Portal */}
            <button
              onClick={() => setPortal("patient")}
              className="group w-full bg-card border border-border hover:border-blue-500/50 rounded-2xl p-6 text-left transition-all hover:bg-blue-900/10 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-900/40 border border-blue-700/40 flex items-center justify-center shrink-0 text-2xl">
                  👤
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-base">Patient / User Portal</div>
                  <p className="text-muted-foreground text-sm mt-0.5">Upload skin images, view AI analysis results, find specialists and manage your health reports.</p>
                </div>
                <ChevronRight size={18} className="text-muted-foreground group-hover:text-blue-400 transition-colors shrink-0" />
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
                {["🔬 AI Analysis", "📋 Health Reports", "👨‍⚕️ Find Doctors"].map(f => (
                  <span key={f} className="text-[11px] text-blue-300 bg-blue-900/30 border border-blue-800/40 px-2.5 py-1 rounded-lg">{f}</span>
                ))}
              </div>
            </button>

            {/* Dermatologist Portal */}
            <button
              onClick={() => setPortal("dermatologist")}
              className="group w-full bg-card border border-border hover:border-purple-500/50 rounded-2xl p-6 text-left transition-all hover:bg-purple-900/10 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-900/40 border border-purple-700/40 flex items-center justify-center shrink-0 text-2xl">
                  🩺
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-base">Dermatologist Portal</div>
                  <p className="text-muted-foreground text-sm mt-0.5">Access patient analyses, review AI predictions, manage appointments and use advanced diagnostic tools.</p>
                </div>
                <ChevronRight size={18} className="text-muted-foreground group-hover:text-purple-400 transition-colors shrink-0" />
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
                {["🏥 Patient Dashboard", "⚛ Quantum Bio Analysis", "📊 Advanced Analytics"].map(f => (
                  <span key={f} className="text-[11px] text-purple-300 bg-purple-900/30 border border-purple-800/40 px-2.5 py-1 rounded-lg">{f}</span>
                ))}
              </div>
            </button>
          </div>

          <p className="text-muted-foreground text-xs text-center mt-8">
            AI Dermascan · Pakistan Dermatology Initiative · AI-powered skin cancer detection
          </p>
        </div>
      </div>
    );
  }

  /* ── Step 2: Login Form ──────────────────────────────────── */
  const isDoc = portal === "dermatologist";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl ${isDoc ? "gradient-purple" : "bg-blue-700"}`}>
            {isDoc ? "🩺" : "👤"}
          </div>
          <h1 className="text-2xl font-bold text-white">AI Dermascan</h1>
          <div className={`mt-2.5 text-xs font-semibold px-3 py-1.5 rounded-full inline-block border ${
            isDoc
              ? "bg-purple-900/40 text-purple-300 border-purple-700/40"
              : "bg-blue-900/40 text-blue-300 border-blue-700/40"
          }`}>
            {isDoc ? "🩺 Dermatologist Portal" : "👤 Patient Portal"}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
          <h2 className="text-white font-bold text-lg mb-1">Welcome back</h2>
          <p className="text-muted-foreground text-sm mb-5">
            {isDoc ? "Sign in to your dermatologist account" : "Sign in to your patient account"}
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Username or Email</label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={isDoc ? "dr.username" : "Enter your username"}
                className="h-10 bg-background text-sm"
                data-testid="input-username"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Password</label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-10 bg-background text-sm pr-10"
                  data-testid="input-password"
                />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700/40 text-red-400 text-xs rounded-lg px-3 py-2">{error}</div>
            )}

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded" /> Remember me
              </label>
              <span className="text-primary cursor-pointer hover:underline">Forgot password?</span>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={`w-full h-10 border-0 font-semibold ${isDoc ? "gradient-purple" : "bg-blue-700 hover:bg-blue-600 text-white"}`}
              data-testid="button-login"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
            <p className="text-muted-foreground text-xs">Demo: any username + 4+ char password</p>
            <button onClick={() => { setPortal(null); setError(""); }} className="text-primary text-xs hover:underline">
              ← Change portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
