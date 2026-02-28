import { useState } from "react";
import {
  Database, ChevronDown, ChevronUp, Save, Printer,
  TrendingUp, BarChart3, AlertTriangle, CheckCircle,
  Info, Lightbulb, PieChart, LineChart, Search, History,
  Loader2, Play, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { analyzeDataset, type AnalysisReport, type ColumnStats, type Insight } from "../../utils/analysisEngine";
import { useCreateDatasetSession, useGetAllDatasetSessions, useDeleteDatasetSession } from "../../hooks/useQueries";
import { formatDatetime } from "../../utils/formatters";
import { cn } from "@/lib/utils";

const SAMPLE_CSV = `Month,Region,Product,Revenue,Cost,Units_Sold,Customer_Segment
Jan-2024,North,Product_A,45000,28000,150,Enterprise
Jan-2024,South,Product_B,32000,19000,210,SMB
Jan-2024,East,Product_A,28000,17500,95,Enterprise
Feb-2024,North,Product_B,51000,31000,170,Enterprise
Feb-2024,South,Product_A,29000,18000,190,SMB
Feb-2024,West,Product_C,18000,12000,120,Startup
Mar-2024,North,Product_A,58000,34000,195,Enterprise
Mar-2024,South,Product_B,41000,25000,270,SMB
Mar-2024,East,Product_C,22000,14500,145,Startup
Apr-2024,North,Product_B,62000,37000,205,Enterprise
Apr-2024,West,Product_A,35000,21000,160,SMB
Apr-2024,South,Product_C,27000,17000,175,Startup
May-2024,North,Product_A,71000,41000,235,Enterprise
May-2024,East,Product_B,44000,27000,290,SMB
May-2024,West,Product_C,31000,19500,200,Startup
Jun-2024,North,Product_A,68000,39000,225,Enterprise
Jun-2024,South,Product_B,55000,33000,365,SMB
Jun-2024,East,Product_C,38000,23000,245,Startup`;

function Section({ title, icon, children, defaultOpen = true, accent = "indigo" }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accent?: "indigo" | "teal" | "amber" | "green" | "red";
}) {
  const [open, setOpen] = useState(defaultOpen);
  const accentClasses = {
    indigo: "section-border-indigo text-cfo-indigo",
    teal: "section-border-teal text-cfo-teal",
    amber: "section-border-amber text-cfo-amber",
    green: "section-border-green text-cfo-green",
    red: "section-border-red text-cfo-red",
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between px-5 py-4",
          "border-l-2 hover:bg-secondary/30 transition-colors",
          accentClasses[accent].split(" ")[0]
        )}
      >
        <div className="flex items-center gap-3">
          <span className={accentClasses[accent].split(" ")[1]}>{icon}</span>
          <span className="text-sm font-display font-semibold text-foreground uppercase tracking-wider">{title}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 pt-4">{children}</div>}
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const typeConfig = {
    info: { cls: "insight-info", icon: <Info size={13} /> },
    warning: { cls: "insight-warning", icon: <AlertTriangle size={13} /> },
    success: { cls: "insight-success", icon: <CheckCircle size={13} /> },
    danger: { cls: "insight-danger", icon: <AlertTriangle size={13} /> },
  };
  const cfg = typeConfig[insight.type];
  return (
    <div className={cn("p-3 rounded-md mb-2", cfg.cls)}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">{cfg.icon}</span>
        <div>
          <div className="text-xs font-semibold text-foreground mb-0.5">{insight.title}</div>
          <div className="text-xs text-muted-foreground leading-relaxed">{insight.description}</div>
        </div>
      </div>
    </div>
  );
}

function StatTable({ stats }: { stats: ColumnStats[] }) {
  const numericStats = stats.filter(s => s.type === "numeric");
  const textStats = stats.filter(s => s.type !== "numeric");

  return (
    <div className="space-y-4">
      {numericStats.length > 0 && (
        <div>
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Numeric Columns</div>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  {["Column", "Type", "Count", "Missing", "Mean", "Median", "Std", "Min", "Max", "Sum"].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-mono text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="table-zebra">
                {numericStats.map((s) => (
                  <tr key={s.name} className="border-b border-border/50">
                    <td className="px-3 py-2 font-mono font-medium text-cfo-indigo">{s.name}</td>
                    <td className="px-3 py-2 font-mono text-cfo-teal">{s.type}</td>
                    <td className="px-3 py-2 font-mono">{s.count}</td>
                    <td className="px-3 py-2 font-mono text-cfo-amber">{s.missing} ({(s.missingPct * 100).toFixed(1)}%)</td>
                    <td className="px-3 py-2 font-mono">{s.mean?.toFixed(2) ?? '-'}</td>
                    <td className="px-3 py-2 font-mono">{s.median?.toFixed(2) ?? '-'}</td>
                    <td className="px-3 py-2 font-mono">{s.std?.toFixed(2) ?? '-'}</td>
                    <td className="px-3 py-2 font-mono text-cfo-red">{s.min?.toFixed(2) ?? '-'}</td>
                    <td className="px-3 py-2 font-mono text-cfo-green">{s.max?.toFixed(2) ?? '-'}</td>
                    <td className="px-3 py-2 font-mono font-semibold">{s.sum?.toLocaleString() ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {textStats.length > 0 && (
        <div>
          <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Categorical / Date Columns</div>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  {["Column", "Type", "Count", "Missing", "Unique Values", "Mode / Top Value", "Top 5 Values"].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-mono text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="table-zebra">
                {textStats.map((s) => (
                  <tr key={s.name} className="border-b border-border/50">
                    <td className="px-3 py-2 font-mono font-medium text-cfo-indigo">{s.name}</td>
                    <td className="px-3 py-2 font-mono text-cfo-teal">{s.type}</td>
                    <td className="px-3 py-2 font-mono">{s.count}</td>
                    <td className="px-3 py-2 font-mono text-cfo-amber">{s.missing}</td>
                    <td className="px-3 py-2 font-mono">{s.uniqueCount ?? '-'}</td>
                    <td className="px-3 py-2 font-mono font-medium">{s.mode ?? '-'}</td>
                    <td className="px-3 py-2 font-mono text-muted-foreground max-w-48">
                      {s.topValues?.map(v => `${v.value} (${(v.pct * 100).toFixed(0)}%)`).join(", ") ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function KPIChips({ report }: { report: AnalysisReport }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {report.kpis.map((kpi) => (
        <div key={kpi.name} className={cn(
          "p-3 rounded-lg border",
          kpi.trend === "up" ? "border-cfo-green/30 bg-cfo-green/5" :
          kpi.trend === "down" ? "border-cfo-red/30 bg-cfo-red/5" :
          "border-border bg-secondary/30"
        )}>
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{kpi.label} / {kpi.name}</div>
          <div className="text-lg font-mono font-bold text-foreground">{kpi.total.toLocaleString()}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground">avg: {kpi.average.toLocaleString()}</span>
            {kpi.growthRate !== undefined && (
              <span className={cn(
                "text-[10px] font-mono font-semibold",
                kpi.growthRate > 0 ? "text-cfo-green" : "text-cfo-red"
              )}>
                {kpi.growthRate > 0 ? "▲" : "▼"} {(Math.abs(kpi.growthRate) * 100).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DataAnalystPage() {
  const [rawData, setRawData] = useState("");
  const [analysisName, setAnalysisName] = useState("Dataset Analysis");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { data: savedSessions = [], isLoading: sessionsLoading } = useGetAllDatasetSessions();
  const createSession = useCreateDatasetSession();
  const deleteSession = useDeleteDatasetSession();

  const handleAnalyze = () => {
    if (!rawData.trim()) {
      toast.error("Please paste data to analyze");
      return;
    }
    setIsAnalyzing(true);
    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      try {
        const result = analyzeDataset(rawData);
        setReport(result);
        toast.success("Analysis complete — 10-step report generated");
      } catch {
        toast.error("Failed to parse data. Please check the format.");
      } finally {
        setIsAnalyzing(false);
      }
    }, 50);
  };

  const handleSave = async () => {
    if (!report) return;
    const id = crypto.randomUUID();
    toast.promise(
      createSession.mutateAsync({
        id,
        name: analysisName,
        rawData,
        analysisResults: JSON.stringify(report),
      }),
      {
        loading: "Saving analysis...",
        success: "Analysis saved to history",
        error: "Failed to save analysis",
      }
    );
  };

  const handleLoadSession = (session: { rawData: string; name: string; analysisResults: string }) => {
    setRawData(session.rawData);
    setAnalysisName(session.name);
    try {
      setReport(JSON.parse(session.analysisResults));
      toast.success(`Loaded: ${session.name}`);
    } catch {
      setReport(analyzeDataset(session.rawData));
    }
    setShowHistory(false);
  };

  const handleDeleteSession = (id: string) => {
    toast.promise(deleteSession.mutateAsync(id), {
      loading: "Deleting...",
      success: "Deleted",
      error: "Failed to delete",
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={14} className="text-cfo-teal" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Business Intelligence</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">
            AI Data Analyst
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Senior-Level Business Intelligence Engine · 10-Step Auto Analysis</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History size={13} />
            History ({savedSessions.length})
          </Button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Saved Analyses</span>
            <button type="button" onClick={() => setShowHistory(false)} className="text-xs text-muted-foreground hover:text-foreground">
              Close
            </button>
          </div>
          {sessionsLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : savedSessions.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No saved analyses yet</div>
          ) : (
            <div className="divide-y divide-border">
              {savedSessions.map(session => (
                <div key={session.id} className="px-5 py-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{session.name}</div>
                    <div className="text-xs font-mono text-muted-foreground">{formatDatetime(session.updatedAt)}</div>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => handleLoadSession(session)}>
                    Load
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs text-destructive hover:text-destructive" onClick={() => handleDeleteSession(session.id)}>
                    <Trash2 size={13} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input Section */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="analysis-name" className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Analysis Name
            </Label>
            <Input
              id="analysis-name"
              value={analysisName}
              onChange={e => setAnalysisName(e.target.value)}
              className="bg-input border-border text-sm h-9"
              placeholder="My Dataset Analysis"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="csv-input" className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Paste CSV or Tabular Data
            </Label>
            <button
              type="button"
              onClick={() => { setRawData(SAMPLE_CSV); setAnalysisName("Q1-Q2 2024 Sales Dataset"); }}
              className="text-xs text-cfo-indigo hover:underline font-mono"
            >
              Load Sample Data
            </button>
          </div>
          <Textarea
            id="csv-input"
            value={rawData}
            onChange={e => setRawData(e.target.value)}
            placeholder="Month,Region,Product,Revenue,Cost&#10;Jan-2024,North,Product_A,45000,28000&#10;..."
            className="font-mono text-xs min-h-36 bg-input border-border resize-y leading-relaxed"
          />
          <div className="flex items-center gap-4 mt-2">
            <span className="text-[11px] font-mono text-muted-foreground">
              <span className="text-cfo-teal">Format Guide:</span> CSV (comma), TSV (tab), or pipe-separated · First row = headers · {rawData.split('\n').filter(Boolean).length} rows pasted
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !rawData.trim()}
            className="gap-2 bg-cfo-indigo hover:bg-cfo-indigo/90 text-white"
          >
            {isAnalyzing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}
            {isAnalyzing ? "Analyzing..." : "Analyze Data"}
          </Button>
          {report && (
            <>
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={createSession.isPending}
                className="gap-2"
              >
                <Save size={14} />
                Save Analysis
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="gap-2"
              >
                <Printer size={14} />
                Print
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Report */}
      {report && (
        <div className="space-y-4" id="analysis-report">
          {/* Report Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border py-3 -mx-6 lg:-mx-8 px-6 lg:px-8 flex items-center justify-between no-print">
            <div className="flex items-center gap-3">
              <Database size={16} className="text-cfo-indigo" />
              <span className="font-display font-semibold text-sm text-foreground">{analysisName}</span>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {report.overview.totalRows} rows × {report.overview.totalColumns} cols
              </Badge>
              <Badge className={cn(
                "font-mono text-[10px]",
                report.overview.dataQualityScore >= 80 ? "bg-cfo-green/20 text-cfo-green" :
                report.overview.dataQualityScore >= 60 ? "bg-cfo-amber/20 text-cfo-amber" :
                "bg-cfo-red/20 text-cfo-red"
              )}>
                Quality: {report.overview.dataQualityScore}/100
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleSave} disabled={createSession.isPending} className="gap-1.5 text-xs">
                <Save size={12} /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-1.5 text-xs">
                <Printer size={12} /> Print
              </Button>
            </div>
          </div>

          {/* Step 1: Overview */}
          <Section title="1. Dataset Overview" icon={<Database size={15} />} accent="indigo">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Total Rows", value: report.overview.totalRows.toLocaleString(), color: "text-foreground" },
                { label: "Total Columns", value: report.overview.totalColumns.toString(), color: "text-foreground" },
                { label: "Duplicate Rows", value: report.overview.duplicateRows.toString(), color: report.overview.duplicateRows > 0 ? "text-cfo-amber" : "text-cfo-green" },
                { label: "Missing Values", value: report.overview.totalMissing.toString(), color: report.overview.totalMissing > 0 ? "text-cfo-amber" : "text-cfo-green" },
              ].map(item => (
                <div key={item.label} className="bg-secondary/30 rounded-md p-3">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{item.label}</div>
                  <div className={cn("text-xl font-mono font-bold mt-1", item.color)}>{item.value}</div>
                </div>
              ))}
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              <span className="text-cfo-teal font-semibold">Columns: </span>
              {report.overview.headers.map((h, i) => (
                <span key={h}>
                  <span className="text-foreground">{h}</span>
                  {i < report.overview.headers.length - 1 && <span className="text-muted-foreground">, </span>}
                </span>
              ))}
            </div>
          </Section>

          {/* Step 2: Cleaning */}
          <Section title="2. Data Cleaning Summary" icon={<CheckCircle size={15} />} accent="green">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-secondary/30 rounded-md p-3">
                <div className="text-[10px] font-mono text-muted-foreground uppercase">Cleaned Rows</div>
                <div className="text-xl font-mono font-bold text-cfo-green mt-1">{report.cleaningSummary.cleanedRows}</div>
              </div>
              <div className="bg-secondary/30 rounded-md p-3">
                <div className="text-[10px] font-mono text-muted-foreground uppercase">Removed Duplicates</div>
                <div className="text-xl font-mono font-bold text-cfo-amber mt-1">{report.cleaningSummary.removedDuplicates}</div>
              </div>
              <div className="bg-secondary/30 rounded-md p-3">
                <div className="text-[10px] font-mono text-muted-foreground uppercase">Imputed Columns</div>
                <div className="text-xl font-mono font-bold text-cfo-indigo mt-1">{report.cleaningSummary.imputedColumns.length}</div>
              </div>
            </div>
            <div className="space-y-1.5">
              {report.cleaningSummary.actions.map((action) => (
                <div key={action} className="flex items-start gap-2 text-xs">
                  <CheckCircle size={11} className="mt-0.5 text-cfo-green shrink-0" />
                  <span className="text-muted-foreground font-mono">{action}</span>
                </div>
              ))}
              {report.cleaningSummary.highMissingColumns.length > 0 && (
                <div className="flex items-start gap-2 text-xs">
                  <AlertTriangle size={11} className="mt-0.5 text-cfo-amber shrink-0" />
                  <span className="text-cfo-amber font-mono">High missing data flagged: {report.cleaningSummary.highMissingColumns.join(", ")}</span>
                </div>
              )}
            </div>
          </Section>

          {/* Step 3: EDA */}
          <Section title="3. Exploratory Analysis" icon={<Search size={15} />} accent="teal">
            <StatTable stats={report.columnStats} />
            {report.correlations.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Correlation Matrix</div>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-secondary/50 border-b border-border">
                        <th className="px-3 py-2 text-left font-mono text-muted-foreground">Column A</th>
                        <th className="px-3 py-2 text-left font-mono text-muted-foreground">Column B</th>
                        <th className="px-3 py-2 text-left font-mono text-muted-foreground">Pearson r</th>
                        <th className="px-3 py-2 text-left font-mono text-muted-foreground">Strength</th>
                        <th className="px-3 py-2 text-left font-mono text-muted-foreground">Direction</th>
                      </tr>
                    </thead>
                    <tbody className="table-zebra">
                      {report.correlations.map((c) => (
                        <tr key={`${c.col1}-${c.col2}`} className="border-b border-border/50">
                          <td className="px-3 py-2 font-mono text-cfo-indigo">{c.col1}</td>
                          <td className="px-3 py-2 font-mono text-cfo-teal">{c.col2}</td>
                          <td className="px-3 py-2 font-mono font-bold">{c.r}</td>
                          <td className="px-3 py-2">
                            <span className={cn("font-mono text-[10px] px-1.5 py-0.5 rounded uppercase",
                              c.strength === "strong" ? "bg-cfo-green/20 text-cfo-green" :
                              c.strength === "moderate" ? "bg-cfo-amber/20 text-cfo-amber" :
                              "bg-secondary text-muted-foreground"
                            )}>
                              {c.strength}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-muted-foreground">{c.direction}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Section>

          {/* Step 4: Trends */}
          <Section title="4. Trend Analysis" icon={<TrendingUp size={15} />} accent="amber">
            {report.trends.dateColumn ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Date Column", value: report.trends.dateColumn, color: "text-cfo-indigo" },
                    { label: "Periods", value: report.trends.points.length.toString(), color: "text-foreground" },
                    { label: "Peak Period", value: report.trends.peakPeriod || "—", color: "text-cfo-green" },
                    { label: "Trough Period", value: report.trends.troughPeriod || "—", color: "text-cfo-red" },
                  ].map(item => (
                    <div key={item.label} className="bg-secondary/30 rounded-md p-3">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase">{item.label}</div>
                      <div className={cn("text-sm font-mono font-bold mt-1 truncate", item.color)}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {report.trends.overallGrowthRate !== undefined && (
                  <div className="flex flex-wrap gap-3">
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono",
                      report.trends.overallGrowthRate >= 0 ? "bg-cfo-green/10 text-cfo-green" : "bg-cfo-red/10 text-cfo-red"
                    )}>
                      <TrendingUp size={12} />
                      Overall Growth: {(report.trends.overallGrowthRate * 100).toFixed(2)}%
                    </div>
                    {report.trends.cagr !== undefined && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono bg-cfo-indigo/10 text-cfo-indigo">
                        <BarChart3 size={12} />
                        CAGR: {(report.trends.cagr * 100).toFixed(2)}%
                      </div>
                    )}
                  </div>
                )}

                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-secondary/50 border-b border-border">
                        <th className="px-3 py-2 text-left font-mono text-muted-foreground">Period</th>
                        <th className="px-3 py-2 text-right font-mono text-muted-foreground">Value</th>
                        <th className="px-3 py-2 text-right font-mono text-muted-foreground">MoM Growth</th>
                        <th className="px-3 py-2 text-left font-mono text-muted-foreground">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="table-zebra">
                      {report.trends.points.map((p) => (
                        <tr key={p.label} className={cn("border-b border-border/50", p.isAnomaly && "bg-cfo-amber/5")}>
                          <td className="px-3 py-2 font-mono text-cfo-indigo">{p.label}</td>
                          <td className="px-3 py-2 font-mono text-right">{p.value.toLocaleString()}</td>
                          <td className={cn("px-3 py-2 font-mono text-right",
                            p.growthRate === undefined ? "text-muted-foreground" :
                            p.growthRate >= 0 ? "text-cfo-green" : "text-cfo-red"
                          )}>
                            {p.growthRate !== undefined ? `${(p.growthRate * 100).toFixed(1)}%` : "—"}
                          </td>
                          <td className="px-3 py-2">
                            {p.isAnomaly && (
                              <span className="text-[10px] font-mono bg-cfo-amber/20 text-cfo-amber px-1.5 py-0.5 rounded uppercase">
                                Anomaly
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {report.trends.anomalies.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-mono text-cfo-amber uppercase tracking-wider">Detected Anomalies</div>
                    {report.trends.anomalies.map((a) => (
                       <div key={a} className="flex items-start gap-2 text-xs">
                        <AlertTriangle size={11} className="mt-0.5 text-cfo-amber shrink-0" />
                        <span className="text-muted-foreground font-mono">{a}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground font-mono py-4 text-center">
                No date column detected. Add a date/period column for time-series trend analysis.
              </div>
            )}
          </Section>

          {/* Step 5: Segments */}
          <Section title="5. Segment Analysis" icon={<PieChart size={15} />} accent="teal">
            {report.segments.length === 0 ? (
              <div className="text-sm text-muted-foreground font-mono py-4 text-center">No categorical columns found for segmentation.</div>
            ) : (
              <div className="space-y-6">
                {report.segments.map((seg) => (
                  <div key={seg.groupByColumn}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                        Grouped by: <span className="text-cfo-teal">{seg.groupByColumn}</span>
                      </div>
                      <span className="text-xs font-mono bg-cfo-green/15 text-cfo-green px-2 py-0.5 rounded">
                        Top: {seg.topPerformer}
                      </span>
                      <span className="text-xs font-mono bg-cfo-red/15 text-cfo-red px-2 py-0.5 rounded">
                        Bottom: {seg.bottomPerformer}
                      </span>
                    </div>
                    <div className="overflow-x-auto rounded-md border border-border">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-secondary/50 border-b border-border">
                            <th className="px-3 py-2 text-left font-mono text-muted-foreground">Segment</th>
                            <th className="px-3 py-2 text-right font-mono text-muted-foreground">Count</th>
                            {seg.rows[0] && Object.keys(seg.rows[0])
                              .filter(k => k !== "segment" && k !== "groupBy" && k !== "count")
                              .map(k => (
                                <th key={k} className="px-3 py-2 text-right font-mono text-muted-foreground">{k}</th>
                              ))}
                          </tr>
                        </thead>
                        <tbody className="table-zebra">
                          {seg.rows.map((row, i) => (
                            <tr key={row.segment} className={cn("border-b border-border/50", i === 0 && "bg-cfo-green/5")}>
                              <td className="px-3 py-2 font-mono font-medium text-cfo-indigo">{row.segment}</td>
                              <td className="px-3 py-2 font-mono text-right">{row.count}</td>
                              {Object.entries(row)
                                .filter(([k]) => k !== "segment" && k !== "groupBy" && k !== "count")
                                .map(([k, v]) => (
                                  <td key={k} className="px-3 py-2 font-mono text-right">{typeof v === "number" ? v.toLocaleString() : v}</td>
                                ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Step 6: KPIs */}
          <Section title="6. Key Performance Indicators" icon={<TrendingUp size={15} />} accent="green">
            {report.kpis.length === 0 ? (
              <div className="text-sm text-muted-foreground font-mono py-4 text-center">No KPI columns detected.</div>
            ) : (
              <KPIChips report={report} />
            )}
          </Section>

          {/* Step 7: Insights */}
          <Section title="7. Critical Insights" icon={<Lightbulb size={15} />} accent="amber">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.insights.map((insight) => (
                <InsightCard key={insight.title} insight={insight} />
              ))}
            </div>
          </Section>

          {/* Step 8: Pareto */}
          <Section title="8. Pareto Analysis (80/20 Rule)" icon={<BarChart3 size={15} />} accent="indigo">
            {report.pareto ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-secondary/30 rounded-md p-3">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">Analyzed Column</div>
                    <div className="text-sm font-mono font-bold text-cfo-indigo mt-1">{report.pareto.column}</div>
                  </div>
                  <div className="bg-secondary/30 rounded-md p-3">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">Top 20% Rows</div>
                    <div className="text-xl font-mono font-bold text-foreground mt-1">{report.pareto.top20PctRows}</div>
                  </div>
                  <div className="bg-secondary/30 rounded-md p-3">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">Top 20% Value Share</div>
                    <div className={cn("text-xl font-mono font-bold mt-1",
                      report.pareto.top20PctShare > 0.7 ? "text-cfo-amber" : "text-cfo-green"
                    )}>
                      {(report.pareto.top20PctShare * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-secondary/30 rounded-md p-3">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">Rows for 80% Value</div>
                    <div className="text-xl font-mono font-bold text-foreground mt-1">{report.pareto.rows80PctValue}</div>
                  </div>
                </div>
                <div className={cn(
                  "p-4 rounded-md text-sm font-mono",
                  report.pareto.top20PctShare > 0.75 ? "bg-cfo-amber/10 text-cfo-amber border border-cfo-amber/20" : "bg-cfo-green/10 text-cfo-green border border-cfo-green/20"
                )}>
                  {report.pareto.top20PctShare > 0.75
                    ? `⚠ Strong Pareto concentration: The top 20% of rows (${report.pareto.top20PctRows}) drive ${(report.pareto.top20PctShare * 100).toFixed(0)}% of total ${report.pareto.column} — classic 80/20 pattern confirmed.`
                    : `✓ ${report.pareto.rows80PctValue} rows (${(report.pareto.rows80PctShare * 100).toFixed(0)}% of data) account for 80% of total ${report.pareto.column} value. Distribution is relatively balanced.`
                  }
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground font-mono py-4 text-center">No numeric columns available for Pareto analysis.</div>
            )}
          </Section>

          {/* Step 9: Visualizations */}
          <Section title="9. Visualization Recommendations" icon={<LineChart size={15} />} accent="teal">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {report.visualizationSuggestions.map((v) => (
                <div key={v.title} className="border border-border rounded-md p-4 hover:border-cfo-indigo/40 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 size={13} className="text-cfo-indigo" />
                    <span className="text-xs font-mono font-semibold text-cfo-indigo uppercase tracking-wider">{v.type}</span>
                  </div>
                  <div className="text-sm font-medium text-foreground mb-1">{v.title}</div>
                  {(v.x || v.y) && (
                    <div className="text-[11px] font-mono text-muted-foreground mb-2">
                      {v.x && <span>X: <span className="text-cfo-teal">{v.x}</span></span>}
                      {v.x && v.y && <span className="mx-1">·</span>}
                      {v.y && <span>Y: <span className="text-cfo-teal">{v.y}</span></span>}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground leading-relaxed">{v.reason}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Step 10: Executive Summary */}
          <Section title="10. Executive Summary" icon={<Info size={15} />} accent="indigo">
            <div className="space-y-4">
              {[
                { label: "Overall Performance", content: report.executiveSummary.overallPerformance, color: "section-border-indigo" },
                { label: "Key Drivers", content: report.executiveSummary.keyDrivers, color: "section-border-teal" },
                { label: "Recommendations", content: report.executiveSummary.recommendations, color: "section-border-green" },
              ].map(({ label, content, color }) => (
                <div key={label} className={cn("pl-4 py-2", color)}>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
                  <p className="text-sm text-foreground leading-relaxed">{content}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
