import { useState } from "react";
import { Eye, EyeOff, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginProps {
  onLogin: (user: { name: string; role: string }) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try { localStorage.setItem("dermaai_user_name", username.charAt(0).toUpperCase() + username.slice(1)); } catch {}
    if (!username || !password) {
      setError("Please enter username and password.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (password.length < 4) {
        setError("Invalid credentials. Try any username with password 4+ chars.");
        return;
      }
      onLogin({ name: username, role: "Premium User" });
    }, 800);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-purple flex items-center justify-center mx-auto mb-4">
            <Activity size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AI Dermascan</h1>
          <p className="text-muted-foreground text-sm mt-1">Skin Cancer Detection System</p>
          <div className="mt-2 text-xs text-purple-400 font-medium">Pakistan Dermatology Initiative</div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
          <h2 className="text-white font-bold text-lg mb-1">Welcome back</h2>
          <p className="text-muted-foreground text-sm mb-6">Sign in to your medical account</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Username or Email</label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
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

            <Button type="submit" disabled={loading} className="w-full h-10 gradient-purple border-0 font-semibold" data-testid="button-login">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-muted-foreground text-xs text-center">Demo: any username + password (4+ chars)</p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: "🔬", label: "AI Detection" },
            { icon: "👨‍⚕️", label: "Expert Doctors" },
            { icon: "📋", label: "Reports" },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-3">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
