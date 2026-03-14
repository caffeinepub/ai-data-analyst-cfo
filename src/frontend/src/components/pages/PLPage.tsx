import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FileText, Loader2, Printer, Save, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useCreateReportSession } from "../../hooks/useQueries";
import { ReportType } from "../../hooks/useQueries";
import {
  FINANCIAL_PREFILL_KEY,
  loadFinancialPrefill,
} from "../../utils/financialSync";
import { formatCurrency, formatPct } from "../../utils/formatters";

interface PLData {
  period: string;
  dateFrom: string;
  dateTo: string;
  // Income
  revenue: string;
  otherIncome: string;
  // COGS & Gross
  cogs: string;
  // Operating Expenses
  salaries: string;
  rent: string;
  marketing: string;
  depreciation: string;
  otherOpex: string;
  // Below the line
  interestExpense: string;
  taxRate: string;
}

const INITIAL_PL: PLData = {
  period: "monthly",
  dateFrom: "",
  dateTo: "",
  revenue: "",
  otherIncome: "",
  cogs: "",
  salaries: "",
  rent: "",
  marketing: "",
  depreciation: "",
  otherOpex: "",
  interestExpense: "",
  taxRate: "25",
};

function numVal(s: string): number {
  return Number.parseFloat(s.replace(/[$,%,]/g, "")) || 0;
}

function CalcRow({
  label,
  value,
  highlight = false,
  negative = false,
  large = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  negative?: boolean;
  large?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between items-center px-3 py-2 rounded-md",
        highlight
          ? "bg-cfo-indigo/10 border border-cfo-indigo/20"
          : "bg-cfo-surface/50",
        large && "py-3",
      )}
    >
      <span
        className={cn(
          "text-xs font-mono italic text-muted-foreground",
          large && "text-sm font-semibold not-italic text-foreground",
        )}
      >
        {label}
        {!large && (
          <span className="ml-2 text-[9px] bg-secondary px-1 rounded uppercase">
            calc
          </span>
        )}
      </span>
      <span
        className={cn(
          "font-mono font-bold",
          large ? "text-base" : "text-sm",
          negative
            ? value < 0
              ? "text-cfo-red"
              : "text-cfo-green"
            : "text-cfo-teal",
        )}
      >
        {value < 0
          ? `-${formatCurrency(Math.abs(value))}`
          : formatCurrency(value)}
      </span>
    </div>
  );
}

function NumInput({
  id,
  label,
  value,
  onChange,
  placeholder = "0.00",
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-mono text-muted-foreground">
        {label}
      </Label>
      {hint && (
        <p className="text-[10px] text-muted-foreground/70 font-mono">{hint}</p>
      )}
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="num-input bg-input border-border h-9 text-sm"
        min="0"
        step="0.01"
      />
    </div>
  );
}

function SectionHeader({
  title,
  color = "indigo",
}: { title: string; color?: string }) {
  const borderColors: Record<string, string> = {
    indigo: "border-l-cfo-indigo",
    teal: "border-l-cfo-teal",
    amber: "border-l-cfo-amber",
    green: "border-l-cfo-green",
    red: "border-l-cfo-red",
  };
  return (
    <div
      className={cn(
        "border-l-2 pl-3 py-1 mb-4",
        borderColors[color] || borderColors.indigo,
      )}
    >
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
        {title}
      </span>
    </div>
  );
}

export function PLPage() {
  const [data, setData] = useState<PLData>(INITIAL_PL);
  const createReport = useCreateReportSession();

  useEffect(() => {
    const prefill = loadFinancialPrefill();
    if (prefill) {
      setData((prev) => ({
        ...prev,
        revenue: prefill.revenue || prev.revenue,
        cogs: prefill.cogs || prev.cogs,
      }));
      if (prefill.revenue) {
        toast.info(
          `Auto-filled revenue & COGS from ${prefill.billCount} saved bill${prefill.billCount > 1 ? "s" : ""}. Review and adjust as needed.`,
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = useCallback(
    (key: keyof PLData) => (val: string) => {
      setData((prev) => ({ ...prev, [key]: val }));
    },
    [],
  );

  // Calculations
  const revenue = numVal(data.revenue);
  const otherIncome = numVal(data.otherIncome);
  const totalRevenue = revenue + otherIncome;

  const cogs = numVal(data.cogs);
  const grossProfit = totalRevenue - cogs;
  const grossMarginPct =
    totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const salaries = numVal(data.salaries);
  const rent = numVal(data.rent);
  const marketing = numVal(data.marketing);
  const depreciation = numVal(data.depreciation);
  const otherOpex = numVal(data.otherOpex);
  const totalOpex = salaries + rent + marketing + depreciation + otherOpex;

  const ebitda = grossProfit - totalOpex;
  const interestExpense = numVal(data.interestExpense);
  const ebit = ebitda - interestExpense;

  const taxRate = numVal(data.taxRate);
  const taxAmount = ebit > 0 ? (ebit * taxRate) / 100 : 0;
  const netProfit = ebit - taxAmount;
  const netProfitMargin =
    totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const operatingRatio =
    totalRevenue > 0 ? (totalOpex / totalRevenue) * 100 : 0;
  const breakEvenRevenue =
    totalRevenue > 0 && grossMarginPct > 0
      ? totalOpex / (grossMarginPct / 100)
      : 0;

  const handleSave = async () => {
    const id = crypto.randomUUID();
    const name = `P&L Statement - ${data.period} (${data.dateFrom || "undated"})`;
    const results = JSON.stringify({
      totalRevenue,
      grossProfit,
      grossMarginPct,
      totalOpex,
      ebitda,
      ebit,
      taxAmount,
      netProfit,
      netProfitMargin,
    });
    toast.promise(
      createReport.mutateAsync({
        id,
        name,
        reportType: ReportType.pl,
        formData: JSON.stringify(data),
        results,
      }),
      {
        loading: "Saving P&L...",
        success: "P&L saved!",
        error: "Failed to save",
      },
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={14} className="text-cfo-green" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Financial Report
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">
            Profit & Loss Statement
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={data.period} onValueChange={set("period")}>
            <SelectTrigger className="w-36 h-9 text-xs bg-input border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={data.dateFrom}
            onChange={(e) => set("dateFrom")(e.target.value)}
            className="w-36 h-9 text-xs bg-input border-border"
            placeholder="From"
          />
          <Input
            type="date"
            value={data.dateTo}
            onChange={(e) => set("dateTo")(e.target.value)}
            className="w-36 h-9 text-xs bg-input border-border"
            placeholder="To"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-2 text-xs no-print"
          >
            <Printer size={13} />
            Print
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={createReport.isPending}
            className="gap-2 text-xs bg-cfo-indigo hover:bg-cfo-indigo/90 text-white"
          >
            {createReport.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Save size={13} />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Income */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <SectionHeader title="Revenue & Income" color="green" />

          <NumInput
            id="revenue"
            label="Revenue / Sales"
            value={data.revenue}
            onChange={set("revenue")}
          />
          <NumInput
            id="otherIncome"
            label="Other Income"
            value={data.otherIncome}
            onChange={set("otherIncome")}
          />

          <CalcRow label="Total Revenue" value={totalRevenue} highlight />

          <div className="border-t border-border pt-4">
            <SectionHeader title="Cost of Goods Sold" color="red" />
            <NumInput
              id="cogs"
              label="Cost of Goods Sold (COGS)"
              value={data.cogs}
              onChange={set("cogs")}
            />
          </div>

          <CalcRow label="Gross Profit" value={grossProfit} negative />
          <CalcRow
            label={`Gross Margin (${formatPct(grossMarginPct)})`}
            value={grossMarginPct}
          />

          <div className="border-t border-border pt-4">
            <SectionHeader title="Operating Expenses" color="amber" />
            <div className="space-y-3">
              <NumInput
                id="salaries"
                label="Salaries & Wages"
                value={data.salaries}
                onChange={set("salaries")}
              />
              <NumInput
                id="rent"
                label="Rent & Utilities"
                value={data.rent}
                onChange={set("rent")}
              />
              <NumInput
                id="marketing"
                label="Marketing & Advertising"
                value={data.marketing}
                onChange={set("marketing")}
              />
              <NumInput
                id="depreciation"
                label="Depreciation"
                value={data.depreciation}
                onChange={set("depreciation")}
              />
              <NumInput
                id="otherOpex"
                label="Other Operating Expenses"
                value={data.otherOpex}
                onChange={set("otherOpex")}
              />
            </div>
          </div>

          <CalcRow
            label="Total Operating Expenses"
            value={totalOpex}
            highlight
          />
        </div>

        {/* Right: Results */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <SectionHeader title="Profitability" color="indigo" />

          <CalcRow label="EBITDA" value={ebitda} negative highlight />
          <NumInput
            id="interestExpense"
            label="Interest Expense"
            value={data.interestExpense}
            onChange={set("interestExpense")}
          />
          <CalcRow label="EBIT (Earnings Before Tax)" value={ebit} negative />

          <div className="space-y-1.5">
            <Label
              htmlFor="taxRate"
              className="text-xs font-mono text-muted-foreground"
            >
              Tax Rate (%)
            </Label>
            <Input
              id="taxRate"
              type="number"
              value={data.taxRate}
              onChange={(e) => set("taxRate")(e.target.value)}
              className="num-input bg-input border-border h-9 text-sm"
              min="0"
              max="100"
              step="0.1"
            />
          </div>

          <CalcRow label="Tax Amount" value={taxAmount} />

          <div
            className={cn(
              "p-4 rounded-lg border-2 mt-2",
              netProfit >= 0
                ? "border-cfo-green/40 bg-cfo-green/5"
                : "border-cfo-red/40 bg-cfo-red/5",
            )}
          >
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">
              Net {netProfit >= 0 ? "Profit" : "Loss"}
            </div>
            <div
              className={cn(
                "text-3xl font-mono font-bold",
                netProfit >= 0 ? "text-cfo-green" : "text-cfo-red",
              )}
            >
              {netProfit < 0 ? "-" : ""}
              {formatCurrency(Math.abs(netProfit))}
            </div>
            <div className="text-xs font-mono text-muted-foreground mt-1">
              Net Margin:{" "}
              <span
                className={netProfit >= 0 ? "text-cfo-green" : "text-cfo-red"}
              >
                {formatPct(netProfitMargin)}
              </span>
            </div>
          </div>

          {/* Ratios */}
          <div className="border-t border-border pt-4">
            <SectionHeader title="Financial Ratios" color="teal" />
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Gross Margin",
                  value: formatPct(grossMarginPct),
                  good: grossMarginPct > 30,
                },
                {
                  label: "Net Margin",
                  value: formatPct(netProfitMargin),
                  good: netProfitMargin > 10,
                },
                {
                  label: "Operating Ratio",
                  value: formatPct(operatingRatio),
                  good: operatingRatio < 70,
                },
                {
                  label: "Break-even Revenue",
                  value: formatCurrency(breakEvenRevenue),
                  good: revenue >= breakEvenRevenue,
                },
              ].map(({ label, value, good }) => (
                <div key={label} className="bg-secondary/30 rounded-md p-3">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    {label}
                  </div>
                  <div
                    className={cn(
                      "text-sm font-mono font-bold mt-1",
                      good ? "text-cfo-green" : "text-cfo-amber",
                    )}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Income Statement Summary */}
          <div className="border-t border-border pt-4">
            <SectionHeader title="Income Statement Summary" color="indigo" />
            <div className="space-y-1 text-xs font-mono">
              {[
                { label: "Total Revenue", value: totalRevenue, indent: 0 },
                { label: "Less: COGS", value: -cogs, indent: 1 },
                {
                  label: "Gross Profit",
                  value: grossProfit,
                  indent: 0,
                  bold: true,
                },
                {
                  label: "Less: Operating Expenses",
                  value: -totalOpex,
                  indent: 1,
                },
                { label: "EBITDA", value: ebitda, indent: 0, bold: true },
                { label: "Less: Interest", value: -interestExpense, indent: 1 },
                { label: "EBIT", value: ebit, indent: 0 },
                { label: "Less: Tax", value: -taxAmount, indent: 1 },
                {
                  label: "Net Profit / (Loss)",
                  value: netProfit,
                  indent: 0,
                  bold: true,
                  highlight: true,
                },
              ].map(({ label, value, indent, bold, highlight }) => (
                <div
                  key={label}
                  className={cn(
                    "flex justify-between py-1",
                    indent > 0 && "pl-4 text-muted-foreground",
                    highlight && "border-t border-border pt-2 mt-1",
                    bold && "font-semibold text-foreground",
                  )}
                >
                  <span>{label}</span>
                  <span
                    className={
                      value < 0
                        ? "text-cfo-red"
                        : value > 0
                          ? ""
                          : "text-muted-foreground"
                    }
                  >
                    {value < 0
                      ? `-${formatCurrency(Math.abs(value))}`
                      : formatCurrency(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="bg-card border border-border rounded-lg p-5">
        <SectionHeader title="Performance Analysis" color="indigo" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Revenue Health",
              status: totalRevenue > 0 ? "Active" : "No Data",
              detail: `${formatCurrency(totalRevenue)} total`,
              color:
                totalRevenue > 0 ? "text-cfo-green" : "text-muted-foreground",
            },
            {
              label: "Profitability",
              status:
                netProfit > 0
                  ? "Profitable"
                  : netProfit < 0
                    ? "Loss-Making"
                    : "Break-Even",
              detail: formatPct(netProfitMargin),
              color:
                netProfit > 0
                  ? "text-cfo-green"
                  : netProfit < 0
                    ? "text-cfo-red"
                    : "text-cfo-amber",
            },
            {
              label: "Gross Margin",
              status:
                grossMarginPct > 50
                  ? "Excellent"
                  : grossMarginPct > 30
                    ? "Good"
                    : grossMarginPct > 0
                      ? "Low"
                      : "N/A",
              detail: formatPct(grossMarginPct),
              color:
                grossMarginPct > 50
                  ? "text-cfo-green"
                  : grossMarginPct > 30
                    ? "text-cfo-amber"
                    : "text-cfo-red",
            },
            {
              label: "Operating Efficiency",
              status:
                operatingRatio < 60
                  ? "Efficient"
                  : operatingRatio < 80
                    ? "Moderate"
                    : "High Cost",
              detail: `${formatPct(operatingRatio)} opex ratio`,
              color:
                operatingRatio < 60
                  ? "text-cfo-green"
                  : operatingRatio < 80
                    ? "text-cfo-amber"
                    : "text-cfo-red",
            },
          ].map(({ label, status, detail, color }) => (
            <div
              key={label}
              className="bg-secondary/30 rounded-md p-3 flex items-center gap-3"
            >
              <TrendingUp size={14} className={color} />
              <div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase">
                  {label}
                </div>
                <div className={cn("text-sm font-semibold", color)}>
                  {status}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
