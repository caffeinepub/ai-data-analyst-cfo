import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Printer,
  Save,
  Scale,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useCreateReportSession } from "../../hooks/useQueries";
import { ReportType } from "../../hooks/useQueries";
import { formatCurrency, formatNumber } from "../../utils/formatters";

interface BSData {
  asOfDate: string;
  // Current Assets
  cash: string;
  accountsReceivable: string;
  inventory: string;
  prepaidExpenses: string;
  otherCurrentAssets: string;
  // Non-Current Assets
  propertyEquipment: string;
  accumulatedDepreciation: string;
  intangibleAssets: string;
  longTermInvestments: string;
  otherNonCurrentAssets: string;
  // Current Liabilities
  accountsPayable: string;
  shortTermDebt: string;
  accruedExpenses: string;
  otherCurrentLiabilities: string;
  // Non-Current Liabilities
  longTermDebt: string;
  deferredTax: string;
  otherLongTermLiabilities: string;
  // Equity
  shareCapital: string;
  retainedEarnings: string;
  otherReserves: string;
}

const INITIAL_BS: BSData = {
  asOfDate: "",
  cash: "",
  accountsReceivable: "",
  inventory: "",
  prepaidExpenses: "",
  otherCurrentAssets: "",
  propertyEquipment: "",
  accumulatedDepreciation: "",
  intangibleAssets: "",
  longTermInvestments: "",
  otherNonCurrentAssets: "",
  accountsPayable: "",
  shortTermDebt: "",
  accruedExpenses: "",
  otherCurrentLiabilities: "",
  longTermDebt: "",
  deferredTax: "",
  otherLongTermLiabilities: "",
  shareCapital: "",
  retainedEarnings: "",
  otherReserves: "",
};

function n(s: string) {
  return Number.parseFloat(s.replace(/[$,%]/g, "")) || 0;
}
function fmtC(v: number) {
  return formatCurrency(v);
}

function NumInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label
        htmlFor={id}
        className="text-[11px] font-mono text-muted-foreground"
      >
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className="num-input bg-input border-border h-8 text-xs"
        min="0"
        step="0.01"
      />
    </div>
  );
}

function SubTotal({
  label,
  value,
  accent = false,
}: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={cn(
        "flex justify-between items-center px-3 py-2 rounded-md mt-2",
        accent
          ? "bg-cfo-indigo/10 border border-cfo-indigo/20"
          : "bg-secondary/40",
      )}
    >
      <span className="text-xs font-mono font-semibold text-foreground">
        {label}
      </span>
      <span className="text-sm font-mono font-bold text-cfo-teal">
        {fmtC(value)}
      </span>
    </div>
  );
}

function GrandTotal({
  label,
  value,
  color = "indigo",
}: { label: string; value: number; color?: string }) {
  const colors: Record<string, string> = {
    indigo: "bg-cfo-indigo/15 border-cfo-indigo/30 text-cfo-indigo",
    amber: "bg-cfo-amber/15 border-cfo-amber/30 text-cfo-amber",
    green: "bg-cfo-green/15 border-cfo-green/30 text-cfo-green",
  };
  return (
    <div
      className={cn(
        "flex justify-between items-center px-4 py-3 rounded-md border mt-3",
        colors[color],
      )}
    >
      <span className="text-sm font-display font-bold uppercase tracking-wider">
        {label}
      </span>
      <span className="text-xl font-mono font-bold">{fmtC(value)}</span>
    </div>
  );
}

function SectionHeader({
  title,
  color = "indigo",
}: { title: string; color?: string }) {
  const borders: Record<string, string> = {
    indigo: "border-l-cfo-indigo",
    amber: "border-l-cfo-amber",
    green: "border-l-cfo-green",
    red: "border-l-cfo-red",
    teal: "border-l-cfo-teal",
  };
  return (
    <div
      className={cn(
        "border-l-2 pl-3 py-0.5 mb-3",
        borders[color] || borders.indigo,
      )}
    >
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
        {title}
      </span>
    </div>
  );
}

export function BalanceSheetPage() {
  const [data, setData] = useState<BSData>(INITIAL_BS);
  const createReport = useCreateReportSession();

  const set = useCallback(
    (key: keyof BSData) => (val: string) => {
      setData((prev) => ({ ...prev, [key]: val }));
    },
    [],
  );

  // Assets
  const totalCurrentAssets =
    n(data.cash) +
    n(data.accountsReceivable) +
    n(data.inventory) +
    n(data.prepaidExpenses) +
    n(data.otherCurrentAssets);
  const netPPE = n(data.propertyEquipment) - n(data.accumulatedDepreciation);
  const totalNonCurrentAssets =
    netPPE +
    n(data.intangibleAssets) +
    n(data.longTermInvestments) +
    n(data.otherNonCurrentAssets);
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

  // Liabilities
  const totalCurrentLiabilities =
    n(data.accountsPayable) +
    n(data.shortTermDebt) +
    n(data.accruedExpenses) +
    n(data.otherCurrentLiabilities);
  const totalNonCurrentLiabilities =
    n(data.longTermDebt) +
    n(data.deferredTax) +
    n(data.otherLongTermLiabilities);
  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

  // Equity
  const totalEquity =
    n(data.shareCapital) + n(data.retainedEarnings) + n(data.otherReserves);
  const totalLiabilitiesEquity = totalLiabilities + totalEquity;

  // Balance check
  const diff = Math.abs(totalAssets - totalLiabilitiesEquity);
  const isBalanced = diff < 0.01;

  // Ratios
  const currentRatio =
    totalCurrentLiabilities > 0
      ? totalCurrentAssets / totalCurrentLiabilities
      : 0;
  const quickAssets = n(data.cash) + n(data.accountsReceivable);
  const quickRatio =
    totalCurrentLiabilities > 0 ? quickAssets / totalCurrentLiabilities : 0;
  const totalDebt = n(data.longTermDebt) + n(data.shortTermDebt);
  const debtToEquity = totalEquity > 0 ? totalDebt / totalEquity : 0;
  const debtToAssets = totalAssets > 0 ? totalLiabilities / totalAssets : 0;

  const handleSave = async () => {
    const id = crypto.randomUUID();
    const name = `Balance Sheet ${data.asOfDate ? `as of ${data.asOfDate}` : ""}`;
    const results = JSON.stringify({
      totalAssets,
      totalLiabilities,
      totalEquity,
      isBalanced,
      currentRatio,
      quickRatio,
      debtToEquity,
      debtToAssets,
    });
    toast.promise(
      createReport.mutateAsync({
        id,
        name,
        reportType: ReportType.balance_sheet,
        formData: JSON.stringify(data),
        results,
      }),
      {
        loading: "Saving...",
        success: "Balance Sheet saved!",
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
            <Scale size={14} className="text-cfo-amber" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Financial Report
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">
            Balance Sheet
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="asOfDate"
              className="text-xs font-mono text-muted-foreground whitespace-nowrap"
            >
              As of:
            </Label>
            <Input
              id="asOfDate"
              type="date"
              value={data.asOfDate}
              onChange={(e) => set("asOfDate")(e.target.value)}
              className="w-36 h-9 text-xs bg-input border-border"
            />
          </div>

          {/* Balance Indicator */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono font-semibold",
              isBalanced
                ? "bg-cfo-green/15 text-cfo-green border border-cfo-green/30"
                : "bg-cfo-red/15 text-cfo-red border border-cfo-red/30",
            )}
          >
            {isBalanced ? (
              <CheckCircle size={12} />
            ) : (
              <AlertTriangle size={12} />
            )}
            {isBalanced ? "BALANCED" : `UNBALANCED — diff: ${fmtC(diff)}`}
          </div>

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

      {/* Three-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Assets */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <SectionHeader title="Assets" color="indigo" />

          <div>
            <SectionHeader title="Current Assets" color="teal" />
            <div className="space-y-2">
              <NumInput
                id="cash"
                label="Cash & Cash Equivalents"
                value={data.cash}
                onChange={set("cash")}
              />
              <NumInput
                id="ar"
                label="Accounts Receivable"
                value={data.accountsReceivable}
                onChange={set("accountsReceivable")}
              />
              <NumInput
                id="inventory"
                label="Inventory"
                value={data.inventory}
                onChange={set("inventory")}
              />
              <NumInput
                id="prepaid"
                label="Prepaid Expenses"
                value={data.prepaidExpenses}
                onChange={set("prepaidExpenses")}
              />
              <NumInput
                id="otherCA"
                label="Other Current Assets"
                value={data.otherCurrentAssets}
                onChange={set("otherCurrentAssets")}
              />
            </div>
            <SubTotal label="Total Current Assets" value={totalCurrentAssets} />
          </div>

          <div>
            <SectionHeader title="Non-Current Assets" color="indigo" />
            <div className="space-y-2">
              <NumInput
                id="ppe"
                label="Property & Equipment"
                value={data.propertyEquipment}
                onChange={set("propertyEquipment")}
              />
              <NumInput
                id="accDep"
                label="Less: Accumulated Depreciation"
                value={data.accumulatedDepreciation}
                onChange={set("accumulatedDepreciation")}
              />
              <div className="flex justify-between text-xs font-mono text-muted-foreground px-1">
                <span>Net PP&E</span>
                <span className="text-foreground">{fmtC(netPPE)}</span>
              </div>
              <NumInput
                id="intangible"
                label="Intangible Assets"
                value={data.intangibleAssets}
                onChange={set("intangibleAssets")}
              />
              <NumInput
                id="ltInvestments"
                label="Long-term Investments"
                value={data.longTermInvestments}
                onChange={set("longTermInvestments")}
              />
              <NumInput
                id="otherNCA"
                label="Other Non-Current Assets"
                value={data.otherNonCurrentAssets}
                onChange={set("otherNonCurrentAssets")}
              />
            </div>
            <SubTotal
              label="Total Non-Current Assets"
              value={totalNonCurrentAssets}
            />
          </div>

          <GrandTotal label="Total Assets" value={totalAssets} color="indigo" />
        </div>

        {/* Liabilities */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <SectionHeader title="Liabilities" color="amber" />

          <div>
            <SectionHeader title="Current Liabilities" color="red" />
            <div className="space-y-2">
              <NumInput
                id="ap"
                label="Accounts Payable"
                value={data.accountsPayable}
                onChange={set("accountsPayable")}
              />
              <NumInput
                id="stDebt"
                label="Short-term Debt"
                value={data.shortTermDebt}
                onChange={set("shortTermDebt")}
              />
              <NumInput
                id="accrued"
                label="Accrued Expenses"
                value={data.accruedExpenses}
                onChange={set("accruedExpenses")}
              />
              <NumInput
                id="otherCL"
                label="Other Current Liabilities"
                value={data.otherCurrentLiabilities}
                onChange={set("otherCurrentLiabilities")}
              />
            </div>
            <SubTotal
              label="Total Current Liabilities"
              value={totalCurrentLiabilities}
            />
          </div>

          <div>
            <SectionHeader title="Non-Current Liabilities" color="amber" />
            <div className="space-y-2">
              <NumInput
                id="ltDebt"
                label="Long-term Debt"
                value={data.longTermDebt}
                onChange={set("longTermDebt")}
              />
              <NumInput
                id="deferredTax"
                label="Deferred Tax Liability"
                value={data.deferredTax}
                onChange={set("deferredTax")}
              />
              <NumInput
                id="otherLTL"
                label="Other Long-term Liabilities"
                value={data.otherLongTermLiabilities}
                onChange={set("otherLongTermLiabilities")}
              />
            </div>
            <SubTotal
              label="Total Non-Current Liabilities"
              value={totalNonCurrentLiabilities}
            />
          </div>

          <GrandTotal
            label="Total Liabilities"
            value={totalLiabilities}
            color="amber"
          />
        </div>

        {/* Equity & Ratios */}
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <SectionHeader title="Equity" color="green" />

            <div className="space-y-2">
              <NumInput
                id="shareCapital"
                label="Share Capital"
                value={data.shareCapital}
                onChange={set("shareCapital")}
              />
              <NumInput
                id="retainedEarnings"
                label="Retained Earnings"
                value={data.retainedEarnings}
                onChange={set("retainedEarnings")}
              />
              <NumInput
                id="otherReserves"
                label="Other Reserves"
                value={data.otherReserves}
                onChange={set("otherReserves")}
              />
            </div>

            <GrandTotal
              label="Total Equity"
              value={totalEquity}
              color="green"
            />
            <GrandTotal
              label="Total Liabilities + Equity"
              value={totalLiabilitiesEquity}
              color="indigo"
            />
          </div>

          {/* Financial Ratios */}
          <div className="bg-card border border-border rounded-lg p-5">
            <SectionHeader title="Financial Ratios" color="teal" />
            <div className="space-y-3">
              {[
                {
                  label: "Current Ratio",
                  value: formatNumber(currentRatio),
                  status:
                    currentRatio >= 2
                      ? "Strong"
                      : currentRatio >= 1
                        ? "Adequate"
                        : "Low",
                  color:
                    currentRatio >= 2
                      ? "text-cfo-green"
                      : currentRatio >= 1
                        ? "text-cfo-amber"
                        : "text-cfo-red",
                  hint: "≥2.0 ideal",
                },
                {
                  label: "Quick Ratio",
                  value: formatNumber(quickRatio),
                  status: quickRatio >= 1 ? "Good" : "Low",
                  color: quickRatio >= 1 ? "text-cfo-green" : "text-cfo-red",
                  hint: "≥1.0 ideal",
                },
                {
                  label: "Debt-to-Equity",
                  value: formatNumber(debtToEquity),
                  status:
                    debtToEquity < 1
                      ? "Conservative"
                      : debtToEquity < 2
                        ? "Moderate"
                        : "High",
                  color:
                    debtToEquity < 1
                      ? "text-cfo-green"
                      : debtToEquity < 2
                        ? "text-cfo-amber"
                        : "text-cfo-red",
                  hint: "<1.0 conservative",
                },
                {
                  label: "Debt-to-Assets",
                  value: `${(debtToAssets * 100).toFixed(1)}%`,
                  status:
                    debtToAssets < 0.4
                      ? "Low Leverage"
                      : debtToAssets < 0.6
                        ? "Moderate"
                        : "High Leverage",
                  color:
                    debtToAssets < 0.4
                      ? "text-cfo-green"
                      : debtToAssets < 0.6
                        ? "text-cfo-amber"
                        : "text-cfo-red",
                  hint: "<40% conservative",
                },
              ].map(({ label, value, status, color, hint }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2 border-b border-border/50"
                >
                  <div>
                    <div className="text-xs font-medium text-foreground">
                      {label}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {hint}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-foreground">
                      {value}
                    </div>
                    <div className={cn("text-[10px] font-mono", color)}>
                      {status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
