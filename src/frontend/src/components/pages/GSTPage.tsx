import { useState, useCallback } from "react";
import { Calculator, Plus, Trash2, Save, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useCreateReportSession } from "../../hooks/useQueries";
import { ReportType } from "../../hooks/useQueries";
import { formatCurrency } from "../../utils/formatters";
import { cn } from "@/lib/utils";

interface GSTItem {
  id: string;
  name: string;
  amount: string;
  rate: string;
}

const GST_RATES = ["5", "10", "12", "15", "18", "20", "28"];

function n(s: string) { return parseFloat(s.replace(/[$,%]/g, "")) || 0; }

function calcGST(amount: number, rate: number, isInclusive: boolean) {
  if (isInclusive) {
    const baseAmount = amount / (1 + rate / 100);
    const gstAmount = amount - baseAmount;
    return { baseAmount, gstAmount, totalAmount: amount };
  } else {
    const gstAmount = (amount * rate) / 100;
    return { baseAmount: amount, gstAmount, totalAmount: amount + gstAmount };
  }
}

export function GSTPage() {
  const [amount, setAmount] = useState("");
  const [gstRate, setGstRate] = useState("18");
  const [customRate, setCustomRate] = useState("");
  const [isInclusive, setIsInclusive] = useState(false);
  const [isIndianMode, setIsIndianMode] = useState(false);
  const [hsnCode, setHsnCode] = useState("");
  const [items, setItems] = useState<GSTItem[]>([
    { id: crypto.randomUUID(), name: "Item 1", amount: "", rate: "18" },
  ]);

  const createReport = useCreateReportSession();

  const effectiveRate = gstRate === "custom" ? n(customRate) : n(gstRate);
  const inputAmount = n(amount);
  const { baseAmount, gstAmount, totalAmount } = calcGST(inputAmount, effectiveRate, isInclusive);
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;

  const addItem = () => {
    setItems(prev => [...prev, { id: crypto.randomUUID(), name: `Item ${prev.length + 1}`, amount: "", rate: "18" }]);
  };

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateItem = useCallback((id: string, field: keyof GSTItem, value: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }, []);

  const itemsWithCalc = items.map(item => {
    const itemAmt = n(item.amount);
    const itemRate = n(item.rate);
    const { gstAmount: itemGst, totalAmount: itemTotal } = calcGST(itemAmt, itemRate, false);
    return { ...item, gstAmount: itemGst, totalAmount: itemTotal, baseAmount: itemAmt };
  });

  const bulkTotals = itemsWithCalc.reduce(
    (acc, item) => ({
      base: acc.base + item.baseAmount,
      gst: acc.gst + item.gstAmount,
      total: acc.total + item.totalAmount,
    }),
    { base: 0, gst: 0, total: 0 }
  );

  const handleSave = async () => {
    const id = crypto.randomUUID();
    const name = `GST Calculation - ${effectiveRate}%`;
    const formData = JSON.stringify({ amount, gstRate: effectiveRate, isInclusive, items });
    const results = JSON.stringify({ baseAmount, gstAmount, totalAmount, bulkTotals });
    toast.promise(
      createReport.mutateAsync({ id, name, reportType: ReportType.gst, formData, results }),
      { loading: "Saving...", success: "GST report saved!", error: "Failed to save" }
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calculator size={14} className="text-cfo-teal" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Tax Calculator</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">GST Calculator</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 text-xs no-print">
            <Printer size={13} />Print
          </Button>
          <Button size="sm" onClick={handleSave} disabled={createReport.isPending} className="gap-2 text-xs bg-cfo-indigo hover:bg-cfo-indigo/90 text-white">
            {createReport.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Calculator */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-5">
          <div className="border-l-2 border-l-cfo-teal pl-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Quick Calculator</span>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <Label htmlFor="gst-amount" className="text-xs font-mono text-muted-foreground">Amount</Label>
            <Input
              id="gst-amount"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="num-input bg-input border-border h-10 text-base"
              min="0"
              step="0.01"
            />
          </div>

          {/* GST Rate */}
          <div className="space-y-1.5">
            <Label className="text-xs font-mono text-muted-foreground">GST Rate (%)</Label>
            <div className="flex flex-wrap gap-2">
              {GST_RATES.map(rate => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setGstRate(rate)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-mono font-semibold border transition-all",
                    gstRate === rate && gstRate !== "custom"
                      ? "bg-cfo-indigo/20 border-cfo-indigo text-cfo-indigo"
                      : "bg-secondary border-border text-muted-foreground hover:border-cfo-indigo/50"
                  )}
                >
                  {rate}%
                </button>
              ))}
              <button
                type="button"
                onClick={() => setGstRate("custom")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-mono font-semibold border transition-all",
                  gstRate === "custom"
                    ? "bg-cfo-amber/20 border-cfo-amber text-cfo-amber"
                    : "bg-secondary border-border text-muted-foreground hover:border-cfo-amber/50"
                )}
              >
                Custom
              </button>
            </div>
            {gstRate === "custom" && (
              <Input
                type="number"
                value={customRate}
                onChange={e => setCustomRate(e.target.value)}
                placeholder="Enter custom rate"
                className="num-input bg-input border-border h-9 text-sm mt-2"
                min="0"
                max="100"
                step="0.1"
              />
            )}
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-md bg-secondary/30 border border-border">
              <div>
                <div className="text-xs font-medium text-foreground">Amount is inclusive of GST</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {isInclusive ? "GST included in amount" : "GST will be added to amount"}
                </div>
              </div>
              <Switch checked={isInclusive} onCheckedChange={setIsInclusive} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-secondary/30 border border-border">
              <div>
                <div className="text-xs font-medium text-foreground">Indian GST Mode (CGST + SGST)</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  Split GST into CGST and SGST components
                </div>
              </div>
              <Switch checked={isIndianMode} onCheckedChange={setIsIndianMode} />
            </div>
          </div>

          {/* HSN Code */}
          <div className="space-y-1.5">
            <Label htmlFor="hsn" className="text-xs font-mono text-muted-foreground">HSN / SAC Code (Optional)</Label>
            <Input
              id="hsn"
              value={hsnCode}
              onChange={e => setHsnCode(e.target.value)}
              placeholder="e.g. 8471 for computers"
              className="bg-input border-border h-9 text-xs"
            />
          </div>

          {/* Results */}
          <div className="space-y-2 pt-2 border-t border-border">
            {[
              { label: "Base Amount", value: baseAmount, color: "text-foreground" },
              { label: `GST Amount (${effectiveRate}%)`, value: gstAmount, color: "text-cfo-amber" },
              { label: "Total Amount (with GST)", value: totalAmount, color: "text-cfo-green", large: true },
            ].map(({ label, value, color, large }) => (
              <div key={label} className={cn(
                "flex justify-between items-center px-4 py-2.5 rounded-md",
                large ? "bg-cfo-green/10 border border-cfo-green/30" : "bg-secondary/30"
              )}>
                <span className="text-xs font-mono text-muted-foreground">{label}</span>
                <span className={cn("font-mono font-bold", large ? "text-lg" : "text-sm", color)}>
                  {formatCurrency(value)}
                </span>
              </div>
            ))}

            {isIndianMode && (
              <div className="mt-3 p-3 rounded-md bg-cfo-indigo/10 border border-cfo-indigo/20">
                <div className="text-[10px] font-mono text-cfo-indigo uppercase tracking-wider mb-2">Indian GST Breakdown</div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CGST ({(effectiveRate / 2).toFixed(1)}%)</span>
                    <span className="text-cfo-indigo">{formatCurrency(cgst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SGST ({(effectiveRate / 2).toFixed(1)}%)</span>
                    <span className="text-cfo-indigo">{formatCurrency(sgst)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/50 pt-1.5">
                    <span className="font-semibold">Total GST</span>
                    <span className="font-semibold text-cfo-amber">{formatCurrency(gstAmount)}</span>
                  </div>
                  {hsnCode && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">HSN/SAC Code</span>
                      <span className="text-foreground">{hsnCode}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Calculator */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="border-l-2 border-l-cfo-amber pl-3">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Bulk Calculator</span>
            </div>
            <Button size="sm" variant="outline" onClick={addItem} className="gap-1.5 text-xs h-7">
              <Plus size={11} />
              Add Item
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="px-2 py-2 text-left font-mono text-muted-foreground">Item Name</th>
                  <th className="px-2 py-2 text-right font-mono text-muted-foreground">Amount</th>
                  <th className="px-2 py-2 text-right font-mono text-muted-foreground">Rate</th>
                  <th className="px-2 py-2 text-right font-mono text-muted-foreground">GST</th>
                  <th className="px-2 py-2 text-right font-mono text-muted-foreground">Total</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {itemsWithCalc.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="px-2 py-1.5">
                      <Input
                        value={item.name}
                        onChange={e => updateItem(item.id, "name", e.target.value)}
                        className="h-6 text-xs bg-transparent border-0 p-0 focus:ring-0 font-medium"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        value={item.amount}
                        onChange={e => updateItem(item.id, "amount", e.target.value)}
                        placeholder="0.00"
                        className="h-6 text-xs num-input bg-transparent border-0 p-0 w-20"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Select value={item.rate} onValueChange={v => updateItem(item.id, "rate", v)}>
                        <SelectTrigger className="h-6 w-16 text-xs bg-transparent border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GST_RATES.map(r => <SelectItem key={r} value={r}>{r}%</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-cfo-amber">{formatCurrency(item.gstAmount)}</td>
                    <td className="px-2 py-1.5 text-right font-mono font-semibold">{formatCurrency(item.totalAmount)}</td>
                    <td className="px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        disabled={items.length === 1}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-secondary/50 border-t border-border">
                  <td className="px-2 py-2 font-mono font-semibold text-foreground" colSpan={2}>
                    Total ({items.length} items)
                  </td>
                  <td className="px-2 py-2 text-right font-mono text-muted-foreground">{formatCurrency(bulkTotals.base)}</td>
                  <td className="px-2 py-2 text-right font-mono font-semibold text-cfo-amber">{formatCurrency(bulkTotals.gst)}</td>
                  <td className="px-2 py-2 text-right font-mono font-bold text-cfo-green">{formatCurrency(bulkTotals.total)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Invoice Summary */}
          <div className="mt-4 border-t border-border pt-4">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Invoice Summary</div>
            <div className="rounded-md border border-border overflow-hidden">
              <div className="px-4 py-2.5 bg-cfo-indigo/10 border-b border-border flex justify-between items-center">
                <span className="text-xs font-display font-semibold text-cfo-indigo uppercase tracking-wider">Tax Invoice</span>
                <span className="text-[10px] font-mono text-muted-foreground">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="px-4 py-3 space-y-2 text-xs font-mono">
                {itemsWithCalc.map(item => (
                  <div key={item.id} className="flex justify-between text-muted-foreground">
                    <span className="flex-1 truncate">{item.name || "Unnamed Item"}</span>
                    <span className="ml-4">{formatCurrency(item.baseAmount)}</span>
                    <span className="ml-2 text-cfo-amber">+{item.rate}% GST</span>
                    <span className="ml-4 font-semibold text-foreground">{formatCurrency(item.totalAmount)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 space-y-1">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(bulkTotals.base)}</span>
                  </div>
                  <div className="flex justify-between text-cfo-amber">
                    <span>Total GST</span>
                    <span>{formatCurrency(bulkTotals.gst)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-cfo-green text-sm border-t border-border pt-1.5">
                    <span>Invoice Total</span>
                    <span>{formatCurrency(bulkTotals.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
