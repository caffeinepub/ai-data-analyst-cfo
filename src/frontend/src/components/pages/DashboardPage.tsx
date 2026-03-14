import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  Clock,
  FileText,
  Scale,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useISTClock } from "../../hooks/useISTClock";
import {
  useGetAllDatasetSessions,
  useGetAllReportSessions,
  useGetDashboardStats,
} from "../../hooks/useQueries";
import { formatDatetime } from "../../utils/formatters";
import type { PageId } from "../Sidebar";

interface StatCard {
  label: string;
  key:
    | "plCount"
    | "balanceSheetCount"
    | "cashFlowCount"
    | "gstCount"
    | "dataAnalysisCount";
  icon: React.ReactNode;
  color: string;
  glowClass: string;
  borderClass: string;
  page: PageId;
}

const STAT_CARDS: StatCard[] = [
  {
    label: "P&L Reports",
    key: "plCount",
    icon: <FileText size={18} />,
    color: "text-cfo-green",
    glowClass: "stat-glow-teal",
    borderClass: "border-l-cfo-green",
    page: "pl",
  },
  {
    label: "Balance Sheets",
    key: "balanceSheetCount",
    icon: <Scale size={18} />,
    color: "text-cfo-amber",
    glowClass: "stat-glow-amber",
    borderClass: "border-l-cfo-amber",
    page: "balance-sheet",
  },
  {
    label: "Cash Flows",
    key: "cashFlowCount",
    icon: <TrendingUp size={18} />,
    color: "text-cfo-indigo",
    glowClass: "stat-glow-indigo",
    borderClass: "border-l-cfo-indigo",
    page: "cash-flow",
  },
  {
    label: "GST Reports",
    key: "gstCount",
    icon: <Calculator size={18} />,
    color: "text-cfo-teal",
    glowClass: "stat-glow-teal",
    borderClass: "border-l-cfo-teal",
    page: "gst",
  },
  {
    label: "Data Analyses",
    key: "dataAnalysisCount",
    icon: <BarChart3 size={18} />,
    color: "text-cfo-indigo",
    glowClass: "stat-glow-indigo",
    borderClass: "border-l-cfo-indigo",
    page: "analyst",
  },
];

const REPORT_TYPE_LABELS: Record<string, string> = {
  pl: "P&L",
  gst: "GST",
  balance_sheet: "Balance Sheet",
  cash_flow: "Cash Flow",
  data_analysis: "Data Analysis",
};

const REPORT_TYPE_COLORS: Record<string, string> = {
  pl: "bg-cfo-green/15 text-cfo-green",
  gst: "bg-cfo-teal/15 text-cfo-teal",
  balance_sheet: "bg-cfo-amber/15 text-cfo-amber",
  cash_flow: "bg-cfo-indigo/15 text-cfo-indigo",
  data_analysis: "bg-primary/15 text-primary",
};

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: reportSessions = [] } = useGetAllReportSessions();
  const { data: datasetSessions = [] } = useGetAllDatasetSessions();
  const { istTime, istDate } = useISTClock();

  // Combine and sort recent activity
  const recentActivity = [
    ...reportSessions.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.reportType as string,
      updatedAt: s.updatedAt,
      isDataset: false,
    })),
    ...datasetSessions.map((s) => ({
      id: s.id,
      name: s.name,
      type: "data_analysis",
      updatedAt: s.updatedAt,
      isDataset: true,
    })),
  ]
    .sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt))
    .slice(0, 7);

  const QUICK_ACTIONS = [
    {
      label: "New Analysis",
      icon: <BarChart3 size={14} />,
      page: "analyst" as PageId,
      color:
        "border-cfo-indigo/40 hover:bg-cfo-indigo/10 hover:border-cfo-indigo/60 text-cfo-indigo",
    },
    {
      label: "New P&L",
      icon: <FileText size={14} />,
      page: "pl" as PageId,
      color:
        "border-cfo-green/40 hover:bg-cfo-green/10 hover:border-cfo-green/60 text-cfo-green",
    },
    {
      label: "Balance Sheet",
      icon: <Scale size={14} />,
      page: "balance-sheet" as PageId,
      color:
        "border-cfo-amber/40 hover:bg-cfo-amber/10 hover:border-cfo-amber/60 text-cfo-amber",
    },
    {
      label: "Cash Flow",
      icon: <TrendingUp size={14} />,
      page: "cash-flow" as PageId,
      color:
        "border-cfo-indigo/40 hover:bg-cfo-indigo/10 hover:border-cfo-indigo/60 text-cfo-indigo",
    },
    {
      label: "GST Calc",
      icon: <Calculator size={14} />,
      page: "gst" as PageId,
      color:
        "border-cfo-teal/40 hover:bg-cfo-teal/10 hover:border-cfo-teal/60 text-cfo-teal",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-cfo-amber" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Live Dashboard
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">
            Command Center
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-muted-foreground font-mono">{istDate}</p>
            <div className="flex items-center gap-1.5 bg-cfo-indigo/10 border border-cfo-indigo/20 rounded px-2 py-0.5">
              <Clock size={10} className="text-cfo-indigo" />
              <span className="text-xs font-mono font-semibold text-cfo-indigo tracking-wider">
                {istTime}
              </span>
              <span className="text-[9px] font-mono text-cfo-indigo/70 uppercase">
                IST
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.page}
              type="button"
              onClick={() => onNavigate(action.page)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium",
                "border transition-all duration-150",
                action.color,
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {STAT_CARDS.map((card, i) => (
          <button
            key={card.key}
            type="button"
            onClick={() => onNavigate(card.page)}
            className={cn(
              "group relative bg-card border border-border rounded-lg p-4 text-left",
              "hover:border-border/80 transition-all duration-200 cursor-pointer",
              "border-l-2",
              card.borderClass,
              i === 0
                ? "animate-fade-in"
                : `animate-fade-in-delay-${Math.min(i, 3)}`,
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-md flex items-center justify-center",
                  `bg-${card.color.replace("text-", "")}/10`,
                )}
              >
                <span className={card.color}>{card.icon}</span>
              </div>
              <ArrowRight
                size={12}
                className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-12 mb-1" />
            ) : (
              <div className="text-2xl font-mono font-bold text-foreground">
                {stats ? Number(stats[card.key]).toLocaleString() : "0"}
              </div>
            )}
            <div className="text-xs text-muted-foreground font-medium mt-0.5">
              {card.label}
            </div>
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-cfo-indigo" />
              <h2 className="text-sm font-display font-semibold text-foreground uppercase tracking-wider">
                Recent Activity
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("history")}
              className="text-xs text-cfo-indigo hover:underline font-medium"
            >
              View all →
            </button>
          </div>

          <div className="divide-y divide-border">
            {recentActivity.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <BarChart3
                  size={32}
                  className="mx-auto text-muted-foreground mb-3 opacity-30"
                />
                <p className="text-sm text-muted-foreground">
                  No reports yet. Start by creating your first analysis.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => onNavigate("analyst")}
                >
                  Start Analysis
                </Button>
              </div>
            ) : (
              recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors"
                >
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      item.isDataset ? "bg-cfo-indigo" : "bg-cfo-teal",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {formatDatetime(item.updatedAt)}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider",
                      REPORT_TYPE_COLORS[item.type] ||
                        "bg-secondary text-muted-foreground",
                    )}
                  >
                    {REPORT_TYPE_LABELS[item.type] || item.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Zap size={14} className="text-cfo-amber" />
            <h2 className="text-sm font-display font-semibold text-foreground uppercase tracking-wider">
              Quick Actions
            </h2>
          </div>
          <div className="p-4 space-y-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.page}
                type="button"
                onClick={() => onNavigate(action.page)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium",
                  "border bg-secondary/30 hover:bg-secondary/60 text-foreground",
                  "transition-all duration-150 group",
                  action.color.split(" ")[0],
                )}
              >
                <span
                  className={cn(
                    "transition-colors",
                    action.color.split(" ").find((c) => c.startsWith("text-")),
                  )}
                >
                  {action.icon}
                </span>
                {action.label}
                <ArrowRight
                  size={12}
                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </button>
            ))}
          </div>

          {/* System Status */}
          <div className="px-5 py-4 border-t border-border">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">
              System Status
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Analysis Engine</span>
                <span className="text-cfo-green font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cfo-green animate-pulse" />
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Backend</span>
                <span className="text-cfo-green font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cfo-green animate-pulse" />
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">ICP Node</span>
                <span className="text-cfo-amber font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cfo-amber" />
                  Syncing
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
