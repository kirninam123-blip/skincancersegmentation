import { Switch, Route, Router as WouterRouter, Link, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import { Activity, Bell, LogOut } from "lucide-react";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Analyze from "@/pages/Analyze";
import Doctors from "@/pages/Doctors";
import HistoryPage from "@/pages/HistoryPage";
import Profile from "@/pages/Profile";
import About from "@/pages/About";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

const PATIENT_NAV = [
  { label: "Dashboard",    path: "/dashboard" },
  { label: "New Analysis", path: "/analyze"   },
  { label: "My Reports",   path: "/reports"   },
  { label: "Doctors",      path: "/doctors"   },
  { label: "Settings",     path: "/settings"  },
  { label: "About",        path: "/about"     },
];

const DOCTOR_NAV = [
  { label: "Dashboard",    path: "/dashboard" },
  { label: "New Analysis", path: "/analyze"   },
  { label: "Reports",      path: "/reports"   },
  { label: "Doctors",      path: "/doctors"   },
  { label: "Settings",     path: "/settings"  },
  { label: "About",        path: "/about"     },
];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function AppLayout({ user, onLogout }: { user: { name: string; role: string }; onLogout: () => void }) {
  const [location] = useLocation();
  const isDoctor = user.role === "Dermatologist";
  const navItems = isDoctor ? DOCTOR_NAV : PATIENT_NAV;

  function isActive(path: string) {
    if (path === "/dashboard") return location === "/" || location.startsWith("/dashboard");
    return location.startsWith(path.split("?")[0]);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* ── Header with full-width navigation ──────────────── */}
      <header className="flex items-center border-b border-border bg-card px-5 shrink-0 z-30 gap-4" style={{ height: "54px" }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg gradient-purple flex items-center justify-center shrink-0">
            <Activity size={15} className="text-white" />
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="text-white font-bold text-sm">AI Dermascan</div>
            <div className="text-muted-foreground text-[10px]">Skin Cancer Detection</div>
          </div>
        </div>

        {/* Role badge */}
        <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border shrink-0 ${
          isDoctor
            ? "bg-purple-900/30 text-purple-300 border-purple-700/40"
            : "bg-blue-900/30 text-blue-300 border-blue-700/40"
        }`}>
          {isDoctor ? "🩺" : "👤"} {user.role}
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto">
          {navItems.map(({ label, path }) => (
            <Link key={path} href={path}>
              <div className={`px-3 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-colors whitespace-nowrap ${
                isActive(path)
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-white hover:bg-muted/30"
              }`}>{label}</div>
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative cursor-pointer">
            <Bell size={17} className="text-muted-foreground hover:text-white transition-colors" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center">3</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full gradient-purple flex items-center justify-center cursor-pointer shrink-0">
              <span className="text-white text-[10px] font-bold">{getInitials(user.name)}</span>
            </div>
            <div className="hidden lg:block">
              <div className="text-white text-xs font-semibold leading-tight">{user.name}</div>
              <div className="text-muted-foreground text-[10px]">{user.role}</div>
            </div>
          </div>
          <button onClick={onLogout} className="text-red-400 hover:text-red-300 transition-colors p-1">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* ── Full-width Main Content ─────────────────────────── */}
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <Switch>
          <Route path="/">
            <Redirect to="/dashboard" />
          </Route>
          <Route path="/dashboard"  component={Dashboard} />
          <Route path="/analyze"    component={Analyze} />
          <Route path="/reports"    component={HistoryPage} />
          <Route path="/history"    component={HistoryPage} />
          <Route path="/doctors"    component={Doctors} />
          <Route path="/settings">
            <Profile userRole={user.role} />
          </Route>
          <Route path="/profile">
            <Profile userRole={user.role} />
          </Route>
          <Route path="/about"      component={About} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          {user
            ? <AppLayout user={user} onLogout={() => setUser(null)} />
            : <Login onLogin={setUser} />
          }
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
