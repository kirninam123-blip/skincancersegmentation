import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import {
  LayoutDashboard, Scan, Users, History, User, Settings, Bell, Lock, LogOut, ChevronLeft, ChevronRight, Menu, X
} from "lucide-react";
import Dashboard from "@/pages/Dashboard";
import Analyze from "@/pages/Analyze";
import Doctors from "@/pages/Doctors";
import HistoryPage from "@/pages/HistoryPage";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Scan, label: "Analyze", path: "/analyze" },
  { icon: Users, label: "Doctors", path: "/doctors" },
  { icon: History, label: "History", path: "/history" },
];

const BOTTOM_NAV = [
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Settings, label: "Settings", path: "/profile?tab=settings" },
  { icon: Bell, label: "Notifications", path: "/profile?tab=notifications", badge: 5 },
  { icon: Lock, label: "Change Password", path: "/profile?tab=password" },
];

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const [location] = useLocation();

  return (
    <aside className={`flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 h-screen sticky top-0 ${collapsed ? "w-16" : "w-60"} shrink-0`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl gradient-purple flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">DA</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-white font-bold text-sm leading-tight">DermaAI</div>
            <div className="text-muted-foreground text-xs leading-tight">Skin Cancer Detection</div>
          </div>
        )}
        <button onClick={onToggle} className="ml-auto text-muted-foreground hover:text-white transition-colors">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Doctor profile */}
      {!collapsed && (
        <div className="px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">MA</span>
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-semibold truncate">Dr. Muhammad Ali</div>
              <div className="text-muted-foreground text-xs">Dermatologist</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                <span className="text-green-400 text-xs">Online</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const active = location === path || (path !== "/" && location.startsWith(path));
          return (
            <Link key={path} href={path}>
              <div data-testid={`nav-${label.toLowerCase()}`} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${active ? "bg-primary text-white" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"}`}>
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="px-2 py-3 border-t border-sidebar-border space-y-1">
        {BOTTOM_NAV.map(({ icon: Icon, label, path, badge }) => (
          <Link key={path} href={path}>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-muted-foreground hover:bg-sidebar-accent hover:text-white transition-all">
              <div className="relative">
                <Icon size={16} className="shrink-0" />
                {badge && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px]">{badge}</span>}
              </div>
              {!collapsed && <span className="text-sm">{label}</span>}
            </div>
          </Link>
        ))}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-red-400 hover:bg-red-900/20 transition-all">
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span className="text-sm">Logout</span>}
        </div>

        {/* Emergency Alert */}
        {!collapsed && (
          <div className="mt-2 p-2 bg-red-900/30 border border-red-700/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Bell size={12} className="text-red-400 shrink-0" />
              <span className="text-red-400 text-xs font-semibold">Emergency Alert</span>
            </div>
            <p className="text-red-300 text-xs mt-1">High risk cases will be auto notified to doctors</p>
            <Link href="/history">
              <div className="mt-1.5 text-red-400 text-xs underline cursor-pointer">View Alerts</div>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}

function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}
      
      {/* Sidebar */}
      <div className={`${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:relative z-50 transition-transform duration-300`}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 p-4 border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-white">
            <Menu size={20} />
          </button>
          <span className="text-white font-bold">DermaAI</span>
        </div>

        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/analyze" component={Analyze} />
          <Route path="/doctors" component={Doctors} />
          <Route path="/history" component={HistoryPage} />
          <Route path="/profile" component={Profile} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Layout />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
