import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BrainCircuit,
  Calculator,
  CalendarDays,
  ClipboardList,
  Clock,
  FileText,
  History,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Package,
  Receipt,
  Scale,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useISTClock } from "../hooks/useISTClock";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export type PageId =
  | "dashboard"
  | "analyst"
  | "year-analyst"
  | "business-history"
  | "pl"
  | "balance-sheet"
  | "cash-flow"
  | "gst"
  | "history"
  | "item-catalog"
  | "bill-generator";

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Command Center",
    icon: <LayoutDashboard size={16} />,
    color: "text-cfo-indigo",
  },
  {
    id: "analyst",
    label: "AI Data Analyst",
    icon: <BarChart3 size={16} />,
    color: "text-cfo-teal",
    badge: "AI",
  },
  {
    id: "year-analyst",
    label: "Year Analyst",
    icon: <CalendarDays size={16} />,
    color: "text-cfo-teal",
    badge: "YoY",
  },
  {
    id: "business-history",
    label: "Business History",
    icon: <ClipboardList size={16} />,
    color: "text-cfo-amber",
    badge: "New",
  },
  {
    id: "pl",
    label: "P&L Statement",
    icon: <FileText size={16} />,
    color: "text-cfo-green",
  },
  {
    id: "balance-sheet",
    label: "Balance Sheet",
    icon: <Scale size={16} />,
    color: "text-cfo-amber",
  },
  {
    id: "cash-flow",
    label: "Cash Flow",
    icon: <TrendingUp size={16} />,
    color: "text-cfo-indigo",
  },
  {
    id: "gst",
    label: "GST Calculator",
    icon: <Calculator size={16} />,
    color: "text-cfo-teal",
  },
  {
    id: "history",
    label: "Report History",
    icon: <History size={16} />,
    color: "text-muted-foreground",
  },
  {
    id: "item-catalog",
    label: "Item Catalog",
    icon: <Package size={16} />,
    color: "text-cfo-amber",
  },
  {
    id: "bill-generator",
    label: "Bill Generator",
    icon: <Receipt size={16} />,
    color: "text-cfo-green",
  },
];

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  open: boolean;
  onToggle: () => void;
}

export function Sidebar({
  currentPage,
  onNavigate,
  open,
  onToggle,
}: SidebarProps) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { istTime, istDate } = useISTClock();
  const isLoggedIn = !!identity;
  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal
    ? `${principal.slice(0, 5)}...${principal.slice(-4)}`
    : "";

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden w-full h-full cursor-default"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 flex flex-col",
          "bg-sidebar border-r border-sidebar-border",
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-cfo-indigo/20 border border-cfo-indigo/40 flex items-center justify-center">
                <BrainCircuit size={18} className="text-cfo-indigo" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cfo-green animate-pulse" />
            </div>
            <div>
              <div className="text-base font-display font-bold text-foreground tracking-tight">
                CFO.ai
              </div>
              <div className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
                Intelligence Suite
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close sidebar"
            className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
            onClick={onToggle}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="mb-2 px-2">
            <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
              Navigation
            </span>
          </div>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    data-ocid={`nav.${item.id}.link`}
                    onClick={() => {
                      onNavigate(item.id);
                      if (open) onToggle();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium",
                      "transition-all duration-150 group relative",
                      isActive
                        ? "bg-cfo-indigo/15 text-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cfo-indigo rounded-full" />
                    )}
                    <span
                      className={cn(
                        isActive ? "text-cfo-indigo" : item.color,
                        "transition-colors",
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-[9px] font-mono bg-cfo-teal/20 text-cfo-teal px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-sidebar-border space-y-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-secondary/50">
              <div className="w-7 h-7 rounded-full bg-cfo-indigo/20 border border-cfo-indigo/30 flex items-center justify-center shrink-0">
                <User size={12} className="text-cfo-indigo" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono text-foreground truncate">
                  {shortPrincipal}
                </div>
                <div className="text-[10px] text-cfo-green">● Connected</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={clear}
                title="Disconnect"
              >
                <LogOut size={12} />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs border-border hover:border-cfo-indigo/50 hover:text-cfo-indigo"
              onClick={login}
              disabled={loginStatus === "logging-in"}
            >
              <LogIn size={12} />
              {loginStatus === "logging-in"
                ? "Connecting..."
                : "Connect Wallet"}
            </Button>
          )}

          {/* IST Clock Widget */}
          <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-cfo-indigo/5 border border-cfo-indigo/15">
            <Clock size={12} className="text-cfo-indigo shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-semibold text-foreground tracking-wider">
                  {istTime}
                </span>
                <span className="text-[9px] font-mono bg-cfo-indigo/20 text-cfo-indigo px-1 py-0.5 rounded uppercase tracking-wider">
                  IST
                </span>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground truncate">
                {istDate}
              </div>
            </div>
          </div>

          <div className="px-2 text-[10px] text-muted-foreground leading-relaxed">
            © {new Date().getFullYear()}. Built with{" "}
            <span className="text-cfo-red">♥</span> using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cfo-indigo hover:underline"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </aside>

      {/* Mobile menu button (rendered outside sidebar) */}
      <button
        type="button"
        aria-label="Open menu"
        className="fixed top-4 left-4 z-30 lg:hidden w-9 h-9 rounded-lg bg-sidebar border border-sidebar-border flex items-center justify-center text-foreground"
        onClick={onToggle}
      >
        <Menu size={16} />
      </button>
    </>
  );
}
