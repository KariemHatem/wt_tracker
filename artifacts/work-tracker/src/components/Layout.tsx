import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  Clock, LayoutDashboard, FileText, Settings, LogOut, Users, Activity,
  BarChart3, ShieldCheck, ChevronRight, Timer, Menu, X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const userNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/sessions", label: "Sessions", icon: <Timer className="w-4 h-4" /> },
  { href: "/reports", label: "Reports", icon: <FileText className="w-4 h-4" /> },
  { href: "/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/admin/users", label: "Users", icon: <Users className="w-4 h-4" /> },
  { href: "/admin/reports", label: "Reports", icon: <FileText className="w-4 h-4" /> },
  { href: "/admin/activity", label: "Login Activity", icon: <Activity className="w-4 h-4" /> },
  { href: "/admin/analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
];

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const [location] = useLocation();
  const isActive = location === item.href || (item.href !== "/dashboard" && item.href !== "/admin" && location.startsWith(item.href));

  return (
    <Link href={item.href} onClick={onClick}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer group",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        )}
        data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <span className={cn("transition-colors", isActive ? "text-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground")}>{item.icon}</span>
        <span>{item.label}</span>
        {isActive && <ChevronRight className="w-3 h-3 ml-auto text-primary" />}
      </div>
    </Link>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
          <Clock className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-sidebar-accent-foreground">WorkTracker</div>
          <div className="text-xs text-sidebar-foreground/50">Time Management</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-sidebar-foreground/50 hover:text-sidebar-foreground lg:hidden">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* Employee section */}
        <div className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-3 mb-2">Workspace</div>
        {userNav.map(item => <NavLink key={item.href} item={item} onClick={onClose} />)}

        {/* Admin section */}
        {user?.isAdmin && (
          <>
            <div className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-3 mt-6 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" /> Admin
            </div>
            {adminNav.map(item => <NavLink key={item.href} item={item} onClick={onClose} />)}
          </>
        )}
      </div>

      {/* User footer */}
      <div className="px-3 pb-4 border-t border-sidebar-border pt-4">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-primary">
              {user?.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-sidebar-accent-foreground truncate">{user?.fullName}</div>
            <div className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-60 lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-60 flex-shrink-0">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">WorkTracker</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
