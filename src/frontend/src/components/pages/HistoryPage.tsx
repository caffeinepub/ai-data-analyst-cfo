import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Calculator,
  Eye,
  FileText,
  History,
  Scale,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { DatasetSession, ReportSession } from "../../backend.d";
import { useAuth } from "../../contexts/AuthContext";
import {
  useDeleteDatasetSession,
  useDeleteReportSession,
  useGetAllDatasetSessions,
  useGetAllReportSessions,
} from "../../hooks/useQueries";
import { formatDatetime } from "../../utils/formatters";

const REPORT_TYPE_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
  }
> = {
  pl: {
    label: "P&L",
    icon: <FileText size={12} />,
    color: "text-cfo-green",
    bgColor: "bg-cfo-green/15",
  },
  gst: {
    label: "GST",
    icon: <Calculator size={12} />,
    color: "text-cfo-teal",
    bgColor: "bg-cfo-teal/15",
  },
  balance_sheet: {
    label: "Balance Sheet",
    icon: <Scale size={12} />,
    color: "text-cfo-amber",
    bgColor: "bg-cfo-amber/15",
  },
  cash_flow: {
    label: "Cash Flow",
    icon: <TrendingUp size={12} />,
    color: "text-cfo-indigo",
    bgColor: "bg-cfo-indigo/15",
  },
  data_analysis: {
    label: "Data Analysis",
    icon: <BarChart3 size={12} />,
    color: "text-primary",
    bgColor: "bg-primary/15",
  },
};

function ViewReportModal({
  report,
  onClose,
}: {
  report: ReportSession | DatasetSession;
  onClose: () => void;
}) {
  const isDataset = "rawData" in report;

  let parsedResults: Record<string, unknown> = {};
  let parsedForm: Record<string, unknown> = {};

  try {
    parsedResults = JSON.parse(
      isDataset
        ? (report as DatasetSession).analysisResults
        : (report as ReportSession).results,
    );
  } catch {
    parsedResults = {};
  }
  try {
    parsedForm = isDataset
      ? {}
      : JSON.parse((report as ReportSession).formData || "{}");
  } catch {
    parsedForm = {};
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-cfo-indigo" />
            <span className="text-sm font-semibold text-foreground">
              {report.name}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xs font-mono"
          >
            ✕ Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Created: {formatDatetime(report.createdAt)}
          </div>

          {isDataset ? (
            <div>
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
                Raw Data Preview
              </div>
              <pre className="text-[11px] font-mono text-muted-foreground bg-secondary/30 rounded-md p-3 overflow-x-auto max-h-40 whitespace-pre-wrap">
                {(report as DatasetSession).rawData.slice(0, 500)}
                {(report as DatasetSession).rawData.length > 500 ? "\n..." : ""}
              </pre>

              {Object.keys(parsedResults).length > 0 && (
                <>
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mt-4 mb-2">
                    Analysis Results
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {["totalRows", "totalColumns", "dataQualityScore"].map(
                      (key) => {
                        const overview = parsedResults.overview as
                          | Record<string, unknown>
                          | undefined;
                        return overview ? (
                          <div
                            key={key}
                            className="bg-secondary/30 rounded-md p-2.5"
                          >
                            <div className="text-[9px] font-mono text-muted-foreground uppercase">
                              {key}
                            </div>
                            <div className="text-sm font-mono font-bold text-foreground mt-0.5">
                              {String(overview[key] || "—")}
                            </div>
                          </div>
                        ) : null;
                      },
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>
              {Object.keys(parsedForm).length > 0 && (
                <>
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
                    Form Data
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(parsedForm)
                      .filter(([, v]) => v && v !== "" && v !== "0")
                      .map(([key, val]) => (
                        <div
                          key={key}
                          className="flex justify-between bg-secondary/30 rounded px-2 py-1.5"
                        >
                          <span className="text-[10px] font-mono text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          <span className="text-[10px] font-mono font-medium text-foreground">
                            {String(val)}
                          </span>
                        </div>
                      ))}
                  </div>
                </>
              )}

              {Object.keys(parsedResults).length > 0 && (
                <>
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mt-4 mb-2">
                    Calculated Results
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(parsedResults).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex justify-between bg-secondary/30 rounded px-2 py-1.5"
                      >
                        <span className="text-[10px] font-mono text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-mono font-medium",
                            typeof val === "number" && val < 0
                              ? "text-cfo-red"
                              : "text-cfo-green",
                          )}
                        >
                          {typeof val === "number"
                            ? `₹${Math.abs(Number(val)).toLocaleString("en", { minimumFractionDigits: 2 })}${val < 0 ? " (loss)" : ""}`
                            : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function HistoryPage() {
  const [search, setSearch] = useState("");
  const [viewingReport, setViewingReport] = useState<
    ReportSession | DatasetSession | null
  >(null);

  const { data: reportSessions = [], isLoading: reportsLoading } =
    useGetAllReportSessions();
  const { data: datasetSessions = [], isLoading: datasetsLoading } =
    useGetAllDatasetSessions();
  const deleteReport = useDeleteReportSession();
  const { isAuthenticated, openLoginModal } = useAuth();
  const deleteDataset = useDeleteDatasetSession();

  const filteredReports = reportSessions.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.reportType.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredDatasets = datasetSessions.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDeleteReport = (id: string) => {
    toast.promise(deleteReport.mutateAsync(id), {
      loading: "Deleting...",
      success: "Report deleted",
      error: "Failed to delete",
    });
  };

  const handleDeleteDataset = (id: string) => {
    toast.promise(deleteDataset.mutateAsync(id), {
      loading: "Deleting...",
      success: "Analysis deleted",
      error: "Failed to delete",
    });
  };

  const ReportRow = ({ session }: { session: ReportSession }) => {
    const cfg =
      REPORT_TYPE_CONFIG[session.reportType] ||
      REPORT_TYPE_CONFIG.data_analysis;
    return (
      <div className="px-5 py-3.5 flex items-center gap-3 hover:bg-secondary/30 transition-colors border-b border-border/50">
        <div
          className={cn(
            "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
            cfg.bgColor,
          )}
        >
          <span className={cfg.color}>{cfg.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">
            {session.name}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {formatDatetime(session.updatedAt)}
          </div>
        </div>
        <Badge
          className={cn(
            "font-mono text-[10px] shrink-0",
            cfg.bgColor,
            cfg.color,
          )}
        >
          {cfg.label}
        </Badge>
        <div className="flex gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setViewingReport(session)}
          >
            <Eye size={13} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={() =>
              !isAuthenticated
                ? openLoginModal()
                : handleDeleteReport(session.id)
            }
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    );
  };

  const DatasetRow = ({ session }: { session: DatasetSession }) => {
    return (
      <div className="px-5 py-3.5 flex items-center gap-3 hover:bg-secondary/30 transition-colors border-b border-border/50">
        <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-primary/15">
          <BarChart3 size={12} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">
            {session.name}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {formatDatetime(session.updatedAt)}
          </div>
        </div>
        <Badge className="font-mono text-[10px] shrink-0 bg-primary/15 text-primary">
          Dataset
        </Badge>
        <div className="flex gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setViewingReport(session)}
          >
            <Eye size={13} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={() =>
              !isAuthenticated
                ? openLoginModal()
                : handleDeleteDataset(session.id)
            }
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History size={14} className="text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Archive
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">
            Report History
          </h1>
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports..."
            className="pl-9 bg-input border-border h-9 text-sm"
          />
        </div>
      </div>

      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="bg-secondary/50 border border-border h-9">
          <TabsTrigger
            value="financial"
            className="text-xs font-mono data-[state=active]:bg-card"
          >
            Financial Reports ({filteredReports.length})
          </TabsTrigger>
          <TabsTrigger
            value="datasets"
            className="text-xs font-mono data-[state=active]:bg-card"
          >
            Dataset Analyses ({filteredDatasets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {reportsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="py-16 text-center">
                <FileText
                  size={32}
                  className="mx-auto text-muted-foreground opacity-30 mb-3"
                />
                <p className="text-sm text-muted-foreground">
                  {search
                    ? "No matching reports"
                    : "No financial reports saved yet"}
                </p>
              </div>
            ) : (
              <div>
                {filteredReports.map((session) => (
                  <ReportRow key={session.id} session={session} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="datasets">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {datasetsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : filteredDatasets.length === 0 ? (
              <div className="py-16 text-center">
                <BarChart3
                  size={32}
                  className="mx-auto text-muted-foreground opacity-30 mb-3"
                />
                <p className="text-sm text-muted-foreground">
                  {search
                    ? "No matching analyses"
                    : "No dataset analyses saved yet"}
                </p>
              </div>
            ) : (
              <div>
                {filteredDatasets.map((session) => (
                  <DatasetRow key={session.id} session={session} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {viewingReport && (
        <ViewReportModal
          report={viewingReport}
          onClose={() => setViewingReport(null)}
        />
      )}
    </div>
  );
}
