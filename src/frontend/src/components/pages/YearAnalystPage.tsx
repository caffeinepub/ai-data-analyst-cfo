import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart2,
  CalendarDays,
  Database,
  Download,
  PieChartIcon,
  Play,
  Printer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import {
  ANALYST_DATA_KEY,
  buildYearlyAnalystCSV,
  loadBusinessHistory,
  loadSavedBills,
} from "../../utils/financialSync";

const CHART_COLORS = [
  "#6366f1",
  "#22d3ee",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#a78bfa",
  "#34d399",
  "#fb923c",
];

interface ParsedRow {
  month: string; // reusing field name but contains year label
  revenue: number;
  expenses: number;
  operatingExpenses: number;
  investingExpenses: number;
  netProfit: number;
  category: string;
}

interface AnalysisResult {
  rows: ParsedRow[];
  bestMonth: ParsedRow;
  worstMonth: ParsedRow;
  totalRevenue: number;
  totalProfit: number;
  avgMargin: number;
  cagr: number | null;
  overallGrowth: number | null;
  categories: { name: string; value: number }[];
  momGrowth: { month: string; growth: number }[];
  revenueGrowth: { month: string; growth: number }[];
  heatmapData: { row: string; col: string; value: number }[];
}

function parseCSV(csv: string): ParsedRow[] {
  const lines = csv.trim().split("\n").filter(Boolean);
  if (lines.length < 2) throw new Error("CSV must have header + data rows");
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const findCol = (names: string[]) =>
    headers.findIndex((h) => names.some((n) => h.includes(n)));

  const monthIdx = findCol(["year", "month", "date", "period"]);
  const revenueIdx = findCol(["revenue", "sales", "income"]);
  const expensesIdx = findCol(["expense", "cost"]);
  const profitIdx = findCol(["profit", "net"]);
  const categoryIdx = findCol(["category", "segment", "product", "region"]);
  const operatingExpIdx = findCol(["operatingexpenses", "operating"]);
  const investingExpIdx = findCol(["investingexpenses", "investing"]);

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const revenue = revenueIdx >= 0 ? Number(cols[revenueIdx]) || 0 : 0;
    const expenses = expensesIdx >= 0 ? Number(cols[expensesIdx]) || 0 : 0;
    const netProfit =
      profitIdx >= 0 ? Number(cols[profitIdx]) || 0 : revenue - expenses;
    const operatingExpenses =
      operatingExpIdx >= 0 ? Number(cols[operatingExpIdx]) || 0 : expenses;
    const investingExpenses =
      investingExpIdx >= 0 ? Number(cols[investingExpIdx]) || 0 : 0;
    rows.push({
      month: monthIdx >= 0 ? cols[monthIdx] : `Row ${i}`,
      revenue,
      expenses,
      operatingExpenses,
      investingExpenses,
      netProfit,
      category: categoryIdx >= 0 ? cols[categoryIdx] : "General",
    });
  }
  return rows;
}

function analyze(rows: ParsedRow[]): AnalysisResult {
  const sorted = [...rows];
  const bestMonth = sorted.reduce((a, b) => (a.revenue > b.revenue ? a : b));
  const worstMonth = sorted.reduce((a, b) => (a.revenue < b.revenue ? a : b));

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalProfit = rows.reduce((s, r) => s + r.netProfit, 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  let cagr: number | null = null;
  let overallGrowth: number | null = null;
  if (rows.length >= 2 && rows[0].revenue > 0) {
    const n = rows.length;
    overallGrowth =
      ((rows[n - 1].revenue - rows[0].revenue) / rows[0].revenue) * 100;
    if (n > 1) {
      cagr =
        ((rows[n - 1].revenue / rows[0].revenue) ** (1 / (n - 1)) - 1) * 100;
    }
  }

  const catMap: Record<string, number> = {};
  for (const r of rows) {
    catMap[r.category] = (catMap[r.category] || 0) + r.revenue;
  }
  const categories = Object.entries(catMap).map(([name, value]) => ({
    name,
    value,
  }));

  const momGrowth: { month: string; growth: number }[] = [];
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1].revenue;
    const curr = rows[i].revenue;
    momGrowth.push({
      month: rows[i].month,
      growth: prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0,
    });
  }

  const metrics = [
    "Revenue",
    "Operating Expenses",
    "Investing Expenses",
    "Net Profit",
  ];
  const heatmapData: { row: string; col: string; value: number }[] = [];
  const metricValues = {
    Revenue: rows.map((r) => r.revenue),
    "Operating Expenses": rows.map((r) => r.operatingExpenses),
    "Investing Expenses": rows.map((r) => r.investingExpenses),
    "Net Profit": rows.map((r) => r.netProfit),
  };
  function corr(a: number[], b: number[]) {
    const n = a.length;
    if (n < 2) return 1;
    const ma = a.reduce((s, v) => s + v, 0) / n;
    const mb = b.reduce((s, v) => s + v, 0) / n;
    const num = a.reduce((s, v, i) => s + (v - ma) * (b[i] - mb), 0);
    const da = Math.sqrt(a.reduce((s, v) => s + (v - ma) ** 2, 0));
    const db = Math.sqrt(b.reduce((s, v) => s + (v - mb) ** 2, 0));
    if (da === 0 || db === 0) return 0;
    return num / (da * db);
  }
  for (const r of metrics) {
    for (const c of metrics) {
      heatmapData.push({
        row: r,
        col: c,
        value:
          Math.round(
            corr(
              metricValues[r as keyof typeof metricValues],
              metricValues[c as keyof typeof metricValues],
            ) * 100,
          ) / 100,
      });
    }
  }

  const revenueGrowth = rows.map((r, i) => {
    const prev = i > 0 ? rows[i - 1].revenue : 0;
    const curr = r.revenue;
    const growth =
      prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : 0;
    return { month: r.month, growth };
  });

  return {
    rows,
    bestMonth,
    worstMonth,
    totalRevenue,
    totalProfit,
    avgMargin,
    cagr,
    overallGrowth,
    categories,
    momGrowth,
    revenueGrowth,
    heatmapData,
  };
}

function fmt(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function HeatmapCell({ value }: { value: number }) {
  const abs = Math.abs(value);
  const isPos = value >= 0;
  const opacity = 0.15 + abs * 0.75;
  const bg = isPos
    ? `rgba(99,102,241,${opacity})`
    : `rgba(244,63,94,${opacity})`;
  return (
    <div
      className="flex items-center justify-center rounded text-xs font-bold"
      style={{ backgroundColor: bg, color: "#f1f5f9", height: 52 }}
    >
      {value.toFixed(2)}
    </div>
  );
}

export function YearAnalystPage() {
  const { isAuthenticated, openLoginModal } = useAuth();
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  function loadYearlyData() {
    const bills = loadSavedBills();
    const history = loadBusinessHistory();
    if (bills.length === 0 && history.length === 0) {
      toast.info(
        "No saved bills or business history found. Add data in Bill Generator or Business History first.",
      );
      return;
    }
    const csv = buildYearlyAnalystCSV(bills);
    setCsvText(csv);
    setError("");
    const sources: string[] = [];
    if (bills.length > 0)
      sources.push(`${bills.length} bill${bills.length > 1 ? "s" : ""}`);
    if (history.length > 0)
      sources.push(
        `${history.length} history record${history.length > 1 ? "s" : ""}`,
      );
    toast.success(`Loaded yearly data from ${sources.join(" and ")}.`);
  }

  // Auto-load on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only load
  useEffect(() => {
    loadYearlyData();
  }, []);

  function analyze_data() {
    setError("");
    try {
      const rows = parseCSV(csvText);
      if (rows.length === 0) throw new Error("No data rows found");
      setResult(analyze(rows));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to parse CSV";
      setError(msg);
      setResult(null);
    }
  }

  function handleSaveAnalysis() {
    if (!csvText.trim()) return;
    localStorage.setItem(`${ANALYST_DATA_KEY}_yearly`, csvText);
    toast.success("Yearly analysis data saved successfully.");
  }

  function handlePrintAnalysis() {
    window.print();
  }

  const metrics = result ? ["Revenue", "Expenses", "Net Profit"] : [];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <CalendarDays className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Year-to-Year Data Analyst
            </h1>
            <p className="text-sm text-muted-foreground">
              Annual analysis — auto-aggregated from your saved bills by year
            </p>
          </div>
        </div>
        {result && (
          <div className="flex gap-2 no-print">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                !isAuthenticated ? openLoginModal() : handleSaveAnalysis()
              }
              className="gap-2 text-xs"
              data-ocid="year-analyst.save_button"
            >
              <Download className="h-3.5 w-3.5" />
              Save Analysis
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintAnalysis}
              className="gap-2 text-xs"
              data-ocid="year-analyst.print_button"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Report
            </Button>
          </div>
        )}
      </div>

      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-primary" />
            Yearly Business Data Input
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              Paste CSV data (columns: Year, Revenue, Expenses, NetProfit,
              Category) — or load directly from saved bills grouped by year
            </Label>
            <Textarea
              data-ocid="year-analyst.input"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Year,Revenue,Expenses,NetProfit,Category&#10;2024,9840000,6720000,3120000,Electronics"
              className="font-mono text-xs min-h-[140px] bg-background/50"
            />
          </div>
          {error && (
            <div
              data-ocid="year-analyst.error_state"
              className="flex items-center gap-2 text-destructive text-sm"
            >
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}
          <div className="flex gap-3 flex-wrap">
            <Button
              data-ocid="year-analyst.load_business_button"
              variant="outline"
              onClick={loadYearlyData}
              className="gap-2"
            >
              <Database className="h-4 w-4" />
              Load Yearly Data
            </Button>
            <Button
              data-ocid="year-analyst.submit_button"
              onClick={analyze_data}
              disabled={!csvText.trim()}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Analyze Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Business Summary */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Business Summary (Year-to-Year)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Revenue
                  </p>
                  <p className="text-xl font-bold text-primary">
                    {fmt(result.totalRevenue)}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Net Profit
                  </p>
                  <p className="text-xl font-bold text-green-500">
                    {fmt(result.totalProfit)}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Avg Profit Margin
                  </p>
                  <p className="text-xl font-bold">
                    {Math.round(result.avgMargin)}%
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Years
                  </p>
                  <p className="text-xl font-bold">{result.rows.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <TrendingUp className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-green-400 font-semibold uppercase tracking-wider mb-1">
                      Best Year
                    </p>
                    <p className="font-bold text-lg">
                      {result.bestMonth.month}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Revenue: {fmt(result.bestMonth.revenue)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Profit: {fmt(result.bestMonth.netProfit)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <TrendingDown className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1">
                      Worst Year
                    </p>
                    <p className="font-bold text-lg">
                      {result.worstMonth.month}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Revenue: {fmt(result.worstMonth.revenue)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Profit: {fmt(result.worstMonth.netProfit)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <BarChart2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">
                      Growth Metrics
                    </p>
                    {result.cagr !== null && (
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className="text-primary border-primary/40 text-xs"
                        >
                          CAGR: {result.cagr.toFixed(1)}% / year
                        </Badge>
                      </div>
                    )}
                    {result.overallGrowth !== null && (
                      <p className="text-sm text-muted-foreground">
                        Overall Growth:{" "}
                        <span
                          className={
                            result.overallGrowth >= 0
                              ? "text-green-500 font-semibold"
                              : "text-red-500 font-semibold"
                          }
                        >
                          {result.overallGrowth >= 0 ? "+" : ""}
                          {Math.round(result.overallGrowth)}%
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.rows[0].month} →{" "}
                      {result.rows[result.rows.length - 1].month}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Revenue Growth */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                  Year-over-Year Revenue Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={result.rows}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      label={{
                        value: "Year",
                        position: "insideBottom",
                        offset: -2,
                        fill: "#94a3b8",
                        fontSize: 11,
                      }}
                    />
                    <YAxis
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      formatter={(v: number) => [fmt(v), "Revenue"]}
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 8,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#6366f1" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 2. Net Profit Growth */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Year-over-Year Net Profit Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={result.rows}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      formatter={(v: number) => [fmt(v), "Net Profit"]}
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 8,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="netProfit"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#10b981" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 3. Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieChartIcon className="h-4 w-4 text-amber-400" />
                  Revenue by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={result.categories}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) =>
                        `${name} ${Math.round((percent || 0) * 100)}%`
                      }
                      labelLine={false}
                    >
                      {result.categories.map((cat, i) => (
                        <Cell
                          key={cat.name}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [fmt(v), "Revenue"]}
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 4. YoY Growth */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  Year-over-Year Growth %
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={result.momGrowth}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v}%`, "YoY Growth"]}
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="growth" radius={[4, 4, 0, 0]}>
                      {result.momGrowth.map((entry) => (
                        <Cell
                          key={entry.month}
                          fill={entry.growth >= 0 ? "#22d3ee" : "#f43f5e"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 5. Top Categories Bar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart2 className="h-4 w-4 text-violet-400" />
                  Top Categories by Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={[...result.categories].sort(
                      (a, b) => b.value - a.value,
                    )}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      formatter={(v: number) => [fmt(v), "Revenue"]}
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {result.categories.map((cat, i) => (
                        <Cell
                          key={cat.name}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 6. Revenue Growth % */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  Year-over-Year Revenue Growth %
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={result.revenueGrowth}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      formatter={(v: number) => [
                        `${v > 0 ? "+" : ""}${v}%`,
                        "Revenue Growth %",
                      ]}
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="growth">
                      {result.revenueGrowth.map((entry) => (
                        <Cell
                          key={entry.month}
                          fill={entry.growth >= 0 ? "#22c55e" : "#ef4444"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 7. Profit Margin Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-orange-400" />
                  Annual Profit Margin Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={result.rows.map((r) => ({
                      month: r.month,
                      margin:
                        r.revenue > 0
                          ? Math.round((r.netProfit / r.revenue) * 100)
                          : 0,
                    }))}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v}%`, "Profit Margin"]}
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 8,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="margin"
                      stroke="#f97316"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#f97316" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 8. Revenue vs Profit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart2 className="h-4 w-4 text-pink-400" />
                  Annual Revenue vs Net Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={result.rows}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      formatter={(v: number, name: string) => [
                        fmt(v),
                        name === "revenue" ? "Revenue" : "Net Profit",
                      ]}
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                      name="Revenue"
                    />
                    <Bar
                      dataKey="netProfit"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      name="Net Profit"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 9. Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart2 className="h-4 w-4 text-rose-400" />
                Metrics Correlation Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div
                  className="grid gap-2 min-w-[320px]"
                  style={{
                    gridTemplateColumns: `120px repeat(${metrics.length}, 1fr)`,
                  }}
                >
                  <div />
                  {metrics.map((m) => (
                    <div
                      key={m}
                      className="text-center text-xs font-semibold text-muted-foreground pb-1"
                    >
                      {m}
                    </div>
                  ))}
                  {metrics.map((row) => (
                    <>
                      <div
                        key={`${row}_label`}
                        className="flex items-center text-xs font-semibold text-muted-foreground pr-2"
                      >
                        {row}
                      </div>
                      {metrics.map((col) => {
                        const cell = result.heatmapData.find(
                          (d) => d.row === row && d.col === col,
                        );
                        return (
                          <HeatmapCell
                            key={col}
                            value={cell ? cell.value : 0}
                          />
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ background: "rgba(99,102,241,0.9)" }}
                  />
                  Strong Positive Correlation
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ background: "rgba(244,63,94,0.9)" }}
                  />
                  Negative Correlation
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ background: "rgba(99,102,241,0.2)" }}
                  />
                  Weak Correlation
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
