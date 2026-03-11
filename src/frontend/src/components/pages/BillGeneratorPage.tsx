import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Plus,
  Printer,
  Receipt,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency } from "../../utils/formatters";
import type { CatalogItem } from "./ItemCatalogPage";

const CATALOG_KEY = "cfo_item_catalog";

function loadCatalog(): CatalogItem[] {
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return items.map((it: CatalogItem) => ({ ...it, unit: it.unit ?? "pcs" }));
  } catch {
    return [];
  }
}

interface BillLine {
  id: string;
  item: CatalogItem;
  qty: number;
}

function calcLine(line: BillLine) {
  const unitPrice = line.item.gstInclusive
    ? line.item.sellingPrice / (1 + line.item.gstRate / 100)
    : line.item.sellingPrice;
  const gstAmount = (unitPrice * line.item.gstRate) / 100;
  const lineSubtotal = unitPrice * line.qty;
  const lineGst = gstAmount * line.qty;
  const lineTotal = lineSubtotal + lineGst;
  return { unitPrice, gstAmount, lineSubtotal, lineGst, lineTotal };
}

export function BillGeneratorPage() {
  const [catalog, setCatalog] = useState<CatalogItem[]>(loadCatalog);
  const [lines, setLines] = useState<BillLine[]>([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [billNumber, setBillNumber] = useState(
    () => `INV-${Date.now().toString().slice(-6)}`,
  );
  const [indianMode, setIndianMode] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCatalog(loadCatalog());
  }, []);

  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return catalog
      .filter(
        (it) =>
          it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [catalog, search]);

  const addItem = useCallback((item: CatalogItem) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) {
        return prev.map((l) =>
          l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [...prev, { id: crypto.randomUUID(), item, qty: 1 }];
    });
    setSearch("");
    setShowDropdown(false);
  }, []);

  const updateQty = useCallback((id: string, val: string) => {
    const qty = Number.parseFloat(val);
    if (Number.isNaN(qty) || qty <= 0) return;
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, qty } : l)));
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clearBill = () => {
    setLines([]);
    setCustomerName("");
    setBillNumber(`INV-${Date.now().toString().slice(-6)}`);
  };

  const totals = useMemo(() => {
    return lines.reduce(
      (acc, line) => {
        const calc = calcLine(line);
        return {
          subtotal: acc.subtotal + calc.lineSubtotal,
          gst: acc.gst + calc.lineGst,
          total: acc.total + calc.lineTotal,
        };
      },
      { subtotal: 0, gst: 0, total: 0 },
    );
  }, [lines]);

  const handlePrint = () => window.print();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt size={14} className="text-cfo-green" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Bill Generator
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">
            Bill Generator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create GST invoices from your item catalog
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearBill}
            className="gap-2 text-xs no-print"
            data-ocid="bill.secondary_button"
          >
            <X size={13} />
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2 text-xs no-print"
            data-ocid="bill.print_button"
          >
            <Printer size={13} />
            Print Bill
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Bill Builder */}
        <div className="lg:col-span-2 space-y-5">
          {/* Bill Info */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <div className="border-l-2 border-l-cfo-green pl-3">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Bill Details
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-muted-foreground">
                  Customer Name
                </Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer / Company name"
                  className="bg-input border-border h-9 text-sm"
                  data-ocid="bill.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-muted-foreground">
                  Bill Number
                </Label>
                <Input
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  placeholder="INV-001"
                  className="bg-input border-border h-9 text-sm"
                  data-ocid="bill.search_input"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-secondary/30 border border-border">
              <div>
                <div className="text-xs font-medium text-foreground">
                  Indian GST Mode (CGST + SGST)
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  Split GST into CGST and SGST components
                </div>
              </div>
              <Switch
                checked={indianMode}
                onCheckedChange={setIndianMode}
                data-ocid="bill.switch"
              />
            </div>
          </div>

          {/* Item Search */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <div className="border-l-2 border-l-cfo-indigo pl-3">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Add Items
              </span>
            </div>

            {catalog.length === 0 ? (
              <div
                className="py-6 text-center text-sm font-mono text-muted-foreground border border-dashed border-border rounded-md"
                data-ocid="bill.empty_state"
              >
                <AlertCircle
                  size={20}
                  className="mx-auto mb-2 text-cfo-amber"
                />
                No items in catalog — add items in the Item Catalog page first
              </div>
            ) : (
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  placeholder="Search item name or SKU..."
                  className="pl-8 h-9 bg-input border-border text-sm"
                  data-ocid="bill.search_input"
                />
                {showDropdown && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-md shadow-lg overflow-hidden">
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-secondary/50 text-left transition-colors"
                        onMouseDown={() => addItem(item)}
                        data-ocid="bill.primary_button"
                      >
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {item.name}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            {item.sku && `${item.sku} · `}
                            {item.category} · GST {item.gstRate}% · per{" "}
                            {item.unit}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono font-semibold text-cfo-green">
                            {formatCurrency(item.sellingPrice)}/{item.unit}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            {item.gstInclusive ? "incl. GST" : "+ GST"}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bill Lines */}
          {lines.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <div className="border-l-2 border-l-cfo-teal pl-3">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Bill Items ({lines.length})
                </span>
              </div>

              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border">
                      <th className="px-3 py-2.5 text-left font-mono text-muted-foreground">
                        Item
                      </th>
                      <th className="px-3 py-2.5 text-left font-mono text-muted-foreground">
                        Code
                      </th>
                      <th className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                        Qty
                      </th>
                      <th className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                        Unit (₹)
                      </th>
                      <th className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                        GST%
                      </th>
                      <th className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                        GST (₹)
                      </th>
                      <th className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                        Total (₹)
                      </th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, idx) => {
                      const calc = calcLine(line);
                      return (
                        <tr
                          key={line.id}
                          className="border-b border-border/50 hover:bg-secondary/20"
                          data-ocid={`bill.item.${idx + 1}`}
                        >
                          <td className="px-3 py-2">
                            <div className="font-medium text-foreground">
                              {line.item.name}
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground">
                              per {line.item.unit}
                            </div>
                          </td>
                          <td className="px-3 py-2 font-mono text-muted-foreground">
                            {line.item.sku || "—"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Input
                                type="number"
                                defaultValue={line.qty}
                                key={line.qty}
                                onChange={(e) =>
                                  updateQty(line.id, e.target.value)
                                }
                                className="num-input h-6 w-16 text-xs bg-transparent border-border text-right p-1"
                                min="0.001"
                                step="0.001"
                              />
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {line.item.unit}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {formatCurrency(calc.unitPrice)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-cfo-amber">
                            {line.item.gstRate}%
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-cfo-amber">
                            {formatCurrency(calc.lineGst)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-cfo-green">
                            {formatCurrency(calc.lineTotal)}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => removeLine(line.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              data-ocid={`bill.delete_button.${idx + 1}`}
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Bill Summary */}
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4 sticky top-4">
            <div className="border-l-2 border-l-cfo-green pl-3">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Bill Summary
              </span>
            </div>

            {/* Print header (only visible when printing) */}
            <div className="hidden print:block mb-4">
              <div className="text-lg font-bold">TAX INVOICE</div>
              <div className="text-xs text-gray-500">
                Bill No: {billNumber} · {new Date().toLocaleDateString()}
              </div>
              {customerName && (
                <div className="text-sm mt-1">To: {customerName}</div>
              )}
            </div>

            <div className="rounded-md border border-border overflow-hidden">
              <div className="px-4 py-2.5 bg-cfo-green/10 border-b border-border flex justify-between items-center">
                <span className="text-xs font-display font-semibold text-cfo-green uppercase tracking-wider">
                  Tax Invoice
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="px-4 py-3 space-y-2 text-xs font-mono">
                {customerName && (
                  <div className="flex justify-between text-muted-foreground pb-2 border-b border-border/50">
                    <span>Customer</span>
                    <span className="text-foreground font-medium">
                      {customerName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Bill No.</span>
                  <span className="text-foreground">{billNumber}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Items</span>
                  <span className="text-foreground">{lines.length}</span>
                </div>
                <div className="border-t border-border/50 pt-2 space-y-1.5">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-foreground">
                      {formatCurrency(totals.subtotal)}
                    </span>
                  </div>

                  {indianMode ? (
                    <>
                      <div className="flex justify-between text-cfo-amber/80">
                        <span>CGST</span>
                        <span>{formatCurrency(totals.gst / 2)}</span>
                      </div>
                      <div className="flex justify-between text-cfo-amber/80">
                        <span>SGST</span>
                        <span>{formatCurrency(totals.gst / 2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-cfo-amber">
                      <span>Total GST</span>
                      <span>{formatCurrency(totals.gst)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-cfo-amber border-t border-border/50 pt-1">
                    <span>Total GST</span>
                    <span>{formatCurrency(totals.gst)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-cfo-green text-sm border-t border-border pt-1.5">
                    <span>Grand Total</span>
                    <span>{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {lines.length === 0 && (
              <div
                className="py-6 text-center text-xs font-mono text-muted-foreground"
                data-ocid="bill.empty_state"
              >
                No items added yet
              </div>
            )}

            {lines.length > 0 && (
              <Button
                className="w-full bg-cfo-green hover:bg-cfo-green/90 text-black gap-2 text-xs"
                onClick={handlePrint}
                data-ocid="bill.submit_button"
              >
                <Printer size={13} />
                Print Invoice
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
