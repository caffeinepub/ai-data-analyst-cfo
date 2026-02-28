import { useState, useCallback } from "react";
import { TrendingUp, Save, Printer, Loader2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useCreateReportSession } from "../../hooks/useQueries";
import { ReportType } from "../../hooks/useQueries";
import { formatCurrency } from "../../utils/formatters";
import { cn } from "@/lib/utils";

interface CFData {
  period: string;
  // Operating
  netIncome: string;
  deprecAmortization: string;
  arChange: string;
  inventoryChange: string;
  apChange: string;
  otherOperating: string;
  // Investing
  purchaseEquipment: string;
  saleAssets: string;
  investmentsMade: string;
  otherInvesting: string;
  // Financing
  proceedsLoans: string;
  loanRepayments: string;
  dividendsPaid: string;
  shareIssuance: string;
  otherFinancing: string;
  // Summary
  openingCash: string;
}

const INITIAL_CF: CFData = {
  period: "monthly",
  netIncome: "", deprecAmortization: "", arChange: "", inventoryChange: "", apChange: "", otherOperating: "",
  purchaseEquipment: "", saleAssets: "", investmentsMade: "", otherInvesting: "",
  proceedsLoans: "", loanRepayments: "", dividendsPaid: "", shareIssuance: "", otherFinancing: "",
  openingCash: "",
};

function n(s: string) { return parseFloat(s.replace(/[$,%]/g, "")) || 0; }

function NumInput({ id, label, value, onChange, negative = false, hint }: {
  id: string; label: string; value: string; onChange: (v: string) => void; negative?: boolean; hint?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-[11px] font-mono text-muted-foreground">{label}</Label>
        {negative && <span className="text-[9px] font-mono text-cfo-red bg-cfo-red/10 px-1.5 py-0.5 rounded">outflow</span>}
        {hint && <span className="text-[9px] font-mono text-muted-foreground">{hint}</span>}
      </div>
      <Input id={id} type="number" value={value} onChange={e => onChange(e.target.value)}
        placeholder="0.00" className="num-input bg-input border-border h-8 text-xs" step="0.01" />
    </div>
  );
}

function CalcRow({ label, value, large = false, accent = false }: {
  label: string; value: number; large?: boolean; accent?: boolean;
}) {
  return (
    <div className={cn(
      "flex justify-between items-center px-3 py-2 rounded-md",
      accent ? "bg-cfo-indigo/10 border border-cfo-indigo/20 mt-2" : "bg-secondary/40 mt-1",
      large && "py-3"
    )}>
      <span className={cn("font-mono", large ? "text-sm font-semibold text-foreground" : "text-xs italic text-muted-foreground")}>
        {label}
        {!large && <span className="ml-2 text-[9px] bg-secondary px-1 rounded uppercase">auto</span>}
      </span>
      <span className={cn(
        "font-mono font-bold",
        large ? "text-base" : "text-sm",
        value > 0 ? "text-cfo-green" : value < 0 ? "text-cfo-red" : "text-muted-foreground"
      )}>
        {value < 0 ? `(${formatCurrency(Math.abs(value))})` : formatCurrency(value)}
      </span>
    </div>
  );
}

function SectionHeader({ title, color = "indigo" }: { title: string; color?: string }) {
  const borders: Record<string, string> = {
    indigo: "border-l-cfo-indigo",
    amber: "border-l-cfo-amber",
    green: "border-l-cfo-green",
    red: "border-l-cfo-red",
    teal: "border-l-cfo-teal",
  };
  return (
    <div className={cn("border-l-2 pl-3 py-0.5 mb-3", borders[color] || borders.indigo)}>
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{title}</span>
    </div>
  );
}

export function CashFlowPage() {
  const [data, setData] = useState<CFData>(INITIAL_CF);
  const createReport = useCreateReportSession();

  const set = useCallback((key: keyof CFData) => (val: string) => {
    setData(prev => ({ ...prev, [key]: val }));
  }, []);

  // Operating activities
  const netCashOperating =
    n(data.netIncome) +
    n(data.deprecAmortization) -
    n(data.arChange) -
    n(data.inventoryChange) +
    n(data.apChange) +
    n(data.otherOperating);

  // Investing activities
  const netCashInvesting =
    -n(data.purchaseEquipment) +
    n(data.saleAssets) -
    n(data.investmentsMade) +
    n(data.otherInvesting);

  // Financing activities
  const netCashFinancing =
    n(data.proceedsLoans) -
    n(data.loanRepayments) -
    n(data.dividendsPaid) +
    n(data.shareIssuance) +
    n(data.otherFinancing);

  // Summary
  const openingCash = n(data.openingCash);
  const netChangeInCash = netCashOperating + netCashInvesting + netCashFinancing;
  const closingCash = openingCash + netChangeInCash;
  const freeCashFlow = netCashOperating - n(data.purchaseEquipment);

  const handleSave = async () => {
    const id = crypto.randomUUID();
    const name = `Cash Flow Statement - ${data.period}`;
    const results = JSON.stringify({ netCashOperating, netCashInvesting, netCashFinancing, netChangeInCash, closingCash, freeCashFlow });
    toast.promise(
      createReport.mutateAsync({ id, name, reportType: ReportType.cash_flow, formData: JSON.stringify(data), results }),
      { loading: "Saving...", success: "Cash Flow saved!", error: "Failed to save" }
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-cfo-indigo" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Financial Report</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">Cash Flow Statement</h1>
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
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 text-xs no-print">
            <Printer size={13} />Print
          </Button>
          <Button size="sm" onClick={handleSave} disabled={createReport.isPending} className="gap-2 text-xs bg-cfo-indigo hover:bg-cfo-indigo/90 text-white">
            {createReport.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Operating Activities */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <SectionHeader title="Operating Activities" color="green" />
          <NumInput id="netIncome" label="Net Income" value={data.netIncome} onChange={set("netIncome")} hint="from P&L" />
          <NumInput id="deprecAmort" label="Add: Depreciation & Amortization" value={data.deprecAmortization} onChange={set("deprecAmortization")} />

          <div className="border-t border-border/50 pt-2">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Changes in Working Capital</div>
            <div className="space-y-2 pl-2 border-l border-border/50">
              <NumInput id="arChange" label="Accounts Receivable Change" value={data.arChange} onChange={set("arChange")} negative hint="increase = outflow" />
              <NumInput id="invChange" label="Inventory Change" value={data.inventoryChange} onChange={set("inventoryChange")} negative hint="increase = outflow" />
              <NumInput id="apChange" label="Accounts Payable Change" value={data.apChange} onChange={set("apChange")} hint="increase = inflow" />
              <NumInput id="otherOps" label="Other Operating" value={data.otherOperating} onChange={set("otherOperating")} />
            </div>
          </div>

          <CalcRow label="Net Cash from Operations" value={netCashOperating} large accent />
        </div>

        {/* Investing Activities */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <SectionHeader title="Investing Activities" color="amber" />
          <NumInput id="purchEquip" label="Purchase of Equipment" value={data.purchaseEquipment} onChange={set("purchaseEquipment")} negative />
          <NumInput id="saleAssets" label="Sale of Assets" value={data.saleAssets} onChange={set("saleAssets")} hint="inflow" />
          <NumInput id="investments" label="Investments Made" value={data.investmentsMade} onChange={set("investmentsMade")} negative />
          <NumInput id="otherInv" label="Other Investing" value={data.otherInvesting} onChange={set("otherInvesting")} />

          <CalcRow label="Net Cash from Investing" value={netCashInvesting} large accent />
        </div>

        {/* Financing Activities */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <SectionHeader title="Financing Activities" color="indigo" />
          <NumInput id="loans" label="Proceeds from Loans" value={data.proceedsLoans} onChange={set("proceedsLoans")} hint="inflow" />
          <NumInput id="repayments" label="Loan Repayments" value={data.loanRepayments} onChange={set("loanRepayments")} negative />
          <NumInput id="dividends" label="Dividends Paid" value={data.dividendsPaid} onChange={set("dividendsPaid")} negative />
          <NumInput id="shareIssue" label="Share Issuance" value={data.shareIssuance} onChange={set("shareIssuance")} hint="inflow" />
          <NumInput id="otherFin" label="Other Financing" value={data.otherFinancing} onChange={set("otherFinancing")} />

          <CalcRow label="Net Cash from Financing" value={netCashFinancing} large accent />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <SectionHeader title="Cash Position Summary" color="teal" />

          <div className="space-y-1.5">
            <NumInput id="openingCash" label="Opening Cash Balance" value={data.openingCash} onChange={set("openingCash")} />
          </div>

          <div className="space-y-2 pt-2">
            <CalcRow label="Net Cash from Operations" value={netCashOperating} />
            <CalcRow label="Net Cash from Investing" value={netCashInvesting} />
            <CalcRow label="Net Cash from Financing" value={netCashFinancing} />

            <div className={cn(
              "flex justify-between items-center px-4 py-3 rounded-md border-2 mt-2",
              netChangeInCash >= 0 ? "border-cfo-green/40 bg-cfo-green/5" : "border-cfo-red/40 bg-cfo-red/5"
            )}>
              <span className="text-sm font-display font-semibold text-foreground uppercase tracking-wider">Net Change in Cash</span>
              <span className={cn("text-xl font-mono font-bold", netChangeInCash >= 0 ? "text-cfo-green" : "text-cfo-red")}>
                {netChangeInCash < 0 ? `(${formatCurrency(Math.abs(netChangeInCash))})` : formatCurrency(netChangeInCash)}
              </span>
            </div>

            <div className={cn(
              "flex justify-between items-center px-4 py-3 rounded-md border-2",
              closingCash >= 0 ? "border-cfo-indigo/40 bg-cfo-indigo/5" : "border-cfo-red/40 bg-cfo-red/5"
            )}>
              <span className="text-sm font-display font-semibold text-foreground uppercase tracking-wider">Closing Cash Balance</span>
              <span className={cn("text-2xl font-mono font-bold", closingCash >= 0 ? "text-cfo-indigo" : "text-cfo-red")}>
                {formatCurrency(closingCash)}
              </span>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="bg-card border border-border rounded-lg p-5">
          <SectionHeader title="Cash Flow KPIs" color="indigo" />
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Free Cash Flow",
                value: freeCashFlow,
                desc: "Operating − CapEx",
                good: freeCashFlow > 0,
              },
              {
                label: "Operating Cash",
                value: netCashOperating,
                desc: "Core business",
                good: netCashOperating > 0,
              },
              {
                label: "Investing Cash",
                value: netCashInvesting,
                desc: "Growth spend",
                good: null,
              },
              {
                label: "Financing Cash",
                value: netCashFinancing,
                desc: "Debt / equity",
                good: null,
              },
            ].map(({ label, value, desc, good }) => (
              <div key={label} className={cn(
                "p-4 rounded-lg border",
                good === true ? "border-cfo-green/30 bg-cfo-green/5" :
                good === false ? "border-cfo-red/30 bg-cfo-red/5" :
                "border-border bg-secondary/30"
              )}>
                <div className="flex items-start gap-2 mb-2">
                  <DollarSign size={12} className={cn(good === true ? "text-cfo-green" : good === false ? "text-cfo-red" : "text-muted-foreground")} />
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</div>
                </div>
                <div className={cn(
                  "text-lg font-mono font-bold",
                  value > 0 ? "text-cfo-green" : value < 0 ? "text-cfo-red" : "text-muted-foreground"
                )}>
                  {value < 0 ? `(${formatCurrency(Math.abs(value))})` : formatCurrency(value)}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono mt-1">{desc}</div>
              </div>
            ))}
          </div>

          {/* Waterfall Summary */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3">Cash Waterfall</div>
            {[
              { label: "Opening Balance", value: openingCash },
              { label: "+ Operating", value: netCashOperating },
              { label: "+ Investing", value: netCashInvesting },
              { label: "+ Financing", value: netCashFinancing },
              { label: "= Closing Balance", value: closingCash, bold: true },
            ].map(({ label, value, bold }) => (
              <div key={label} className={cn(
                "flex justify-between py-1 text-xs font-mono",
                bold && "border-t border-border mt-1 pt-2 font-semibold text-foreground"
              )}>
                <span className={bold ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                <span className={cn(value > 0 ? "text-cfo-green" : value < 0 ? "text-cfo-red" : "text-muted-foreground")}>
                  {value < 0 ? `(${formatCurrency(Math.abs(value))})` : formatCurrency(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
