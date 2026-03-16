import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  CheckCircle2,
  Printer,
  Receipt,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import {
  FINANCIAL_PREFILL_KEY,
  SAVED_BILLS_KEY,
  type SavedBill,
  loadSavedBills,
} from "../../utils/financialSync";
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

function getISTDateTime() {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
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
  const lineCogs = line.item.costPrice * line.qty;
  return { unitPrice, gstAmount, lineSubtotal, lineGst, lineTotal, lineCogs };
}

// ─── Elastic Print Invoice — rendered via createPortal directly into document.body ───
function PrintInvoice({
  lines,
  totals,
  billNumber,
  customerName,
  billDateTime,
  indianMode,
}: {
  lines: BillLine[];
  totals: { subtotal: number; gst: number; total: number };
  billNumber: string;
  customerName: string;
  billDateTime: string;
  indianMode: boolean;
}) {
  const thStyle: React.CSSProperties = {
    padding: "6px 10px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    color: "#222",
    borderBottom: "2px solid #111",
    whiteSpace: "nowrap" as const,
    backgroundColor: "#f0f0f0",
  };
  const tdStyle: React.CSSProperties = {
    padding: "5px 10px",
    verticalAlign: "top" as const,
    borderBottom: "1px solid #e0e0e0",
  };

  const invoice = (
    <div
      id="print-invoice-portal"
      style={{
        display: "none",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "white",
        zIndex: 999999,
        margin: 0,
        padding: 0,
      }}
    >
      <div
        id="print-invoice-a4"
        style={{
          width: "210mm",
          height: "297mm",
          maxHeight: "297mm",
          boxSizing: "border-box",
          padding: "12mm 14mm 10mm 14mm",
          fontFamily: "'Space Grotesk', Arial, sans-serif",
          fontSize: "16px",
          color: "#111",
          background: "white",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ── Invoice Header ── */}
        <div style={{ flexShrink: 0, marginBottom: "7mm" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "2em",
                  fontWeight: 800,
                  letterSpacing: "-0.5px",
                  color: "#111",
                  lineHeight: 1.1,
                }}
              >
                TAX INVOICE
              </div>
              {customerName && (
                <div
                  style={{
                    fontSize: "0.95em",
                    marginTop: "4px",
                    color: "#444",
                  }}
                >
                  Bill To:{" "}
                  <strong style={{ color: "#111" }}>{customerName}</strong>
                </div>
              )}
            </div>
            <div style={{ textAlign: "right", color: "#555" }}>
              <div>
                Invoice No:{" "}
                <strong style={{ color: "#111" }}>{billNumber}</strong>
              </div>
              <div style={{ marginTop: "3px" }}>
                Date &amp; Time:{" "}
                <strong style={{ color: "#111" }}>
                  {billDateTime || getISTDateTime()}
                </strong>
              </div>
              <div
                style={{
                  marginTop: "2px",
                  fontSize: "0.8em",
                  color: "#888",
                  fontStyle: "italic",
                }}
              >
                Indian Standard Time (IST)
              </div>
            </div>
          </div>
          <div style={{ borderBottom: "3px solid #111", marginTop: "5mm" }} />
        </div>

        {/* ── Items Table ── */}
        <div style={{ flexShrink: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: "center", width: "4%" }}>
                  #
                </th>
                <th style={{ ...thStyle, textAlign: "left" }}>
                  Item Description
                </th>
                <th style={{ ...thStyle, textAlign: "right", width: "9%" }}>
                  Qty
                </th>
                <th style={{ ...thStyle, textAlign: "right", width: "12%" }}>
                  Rate (₹)
                </th>
                <th style={{ ...thStyle, textAlign: "center", width: "7%" }}>
                  GST%
                </th>
                {indianMode ? (
                  <>
                    <th
                      style={{ ...thStyle, textAlign: "right", width: "10%" }}
                    >
                      CGST (₹)
                    </th>
                    <th
                      style={{ ...thStyle, textAlign: "right", width: "10%" }}
                    >
                      SGST (₹)
                    </th>
                  </>
                ) : (
                  <th style={{ ...thStyle, textAlign: "right", width: "11%" }}>
                    GST (₹)
                  </th>
                )}
                <th style={{ ...thStyle, textAlign: "right", width: "13%" }}>
                  Total (₹)
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => {
                const calc = calcLine(line);
                return (
                  <tr
                    key={line.id}
                    style={{
                      backgroundColor: i % 2 === 0 ? "white" : "#f8f8f8",
                    }}
                  >
                    <td
                      style={{ ...tdStyle, textAlign: "center", color: "#888" }}
                    >
                      {i + 1}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: "#111" }}>
                        {line.item.name}
                      </div>
                      {line.item.sku && (
                        <div
                          style={{
                            fontSize: "0.8em",
                            color: "#999",
                            marginTop: "1px",
                          }}
                        >
                          SKU: {line.item.sku}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: "right",
                        fontFamily: "monospace",
                      }}
                    >
                      {line.qty} {line.item.unit}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: "right",
                        fontFamily: "monospace",
                      }}
                    >
                      {formatCurrency(calc.unitPrice)}
                    </td>
                    <td
                      style={{ ...tdStyle, textAlign: "center", color: "#555" }}
                    >
                      {line.item.gstRate}%
                    </td>
                    {indianMode ? (
                      <>
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "right",
                            fontFamily: "monospace",
                            color: "#555",
                          }}
                        >
                          {formatCurrency(calc.lineGst / 2)}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "right",
                            fontFamily: "monospace",
                            color: "#555",
                          }}
                        >
                          {formatCurrency(calc.lineGst / 2)}
                        </td>
                      </>
                    ) : (
                      <td
                        style={{
                          ...tdStyle,
                          textAlign: "right",
                          fontFamily: "monospace",
                          color: "#555",
                        }}
                      >
                        {formatCurrency(calc.lineGst)}
                      </td>
                    )}
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: "right",
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color: "#111",
                      }}
                    >
                      {formatCurrency(calc.lineTotal)}
                    </td>
                  </tr>
                );
              })}
              {lines.length === 0 && (
                <tr>
                  <td
                    colSpan={indianMode ? 8 : 7}
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      color: "#aaa",
                      padding: "20px 8px",
                      fontStyle: "italic",
                    }}
                  >
                    No items added
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Elastic Spacer — grows to fill page when few items ── */}
        <div style={{ flex: 1, minHeight: "6mm" }} />

        {/* ── Totals ── */}
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              borderTop: "3px solid #111",
              paddingTop: "4mm",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <table style={{ minWidth: "220px", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "3px 12px 3px 4px", color: "#555" }}>
                    Subtotal
                  </td>
                  <td
                    style={{
                      padding: "3px 0",
                      textAlign: "right",
                      fontFamily: "monospace",
                      color: "#333",
                    }}
                  >
                    {formatCurrency(totals.subtotal)}
                  </td>
                </tr>
                {indianMode ? (
                  <>
                    <tr>
                      <td
                        style={{ padding: "3px 12px 3px 4px", color: "#555" }}
                      >
                        CGST
                      </td>
                      <td
                        style={{
                          padding: "3px 0",
                          textAlign: "right",
                          fontFamily: "monospace",
                          color: "#555",
                        }}
                      >
                        {formatCurrency(totals.gst / 2)}
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{ padding: "3px 12px 3px 4px", color: "#555" }}
                      >
                        SGST
                      </td>
                      <td
                        style={{
                          padding: "3px 0",
                          textAlign: "right",
                          fontFamily: "monospace",
                          color: "#555",
                        }}
                      >
                        {formatCurrency(totals.gst / 2)}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td style={{ padding: "3px 12px 3px 4px", color: "#555" }}>
                      Total GST
                    </td>
                    <td
                      style={{
                        padding: "3px 0",
                        textAlign: "right",
                        fontFamily: "monospace",
                        color: "#555",
                      }}
                    >
                      {formatCurrency(totals.gst)}
                    </td>
                  </tr>
                )}
                <tr style={{ borderTop: "2px solid #bbb" }}>
                  <td
                    style={{
                      padding: "5px 12px 5px 4px",
                      fontWeight: 800,
                      fontSize: "1.15em",
                    }}
                  >
                    Grand Total
                  </td>
                  <td
                    style={{
                      padding: "5px 0",
                      textAlign: "right",
                      fontFamily: "monospace",
                      fontWeight: 800,
                      fontSize: "1.15em",
                      color: "#111",
                    }}
                  >
                    {formatCurrency(totals.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Footer ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: "7mm",
              paddingTop: "4mm",
              borderTop: "1px dashed #ccc",
              color: "#888",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: "#555" }}>
                Thank you for your business.
              </div>
              <div style={{ marginTop: "3px" }}>
                {indianMode ? "CGST + SGST Applied" : "IGST Applied"} · All
                amounts in ₹ (Indian Rupees)
              </div>
              <div style={{ marginTop: "3px" }}>
                Generated by CFO.ai · {billDateTime || getISTDateTime()} IST
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ marginBottom: "8mm" }}>Authorised Signatory</div>
              <div
                style={{
                  borderTop: "1px solid #888",
                  paddingTop: "2px",
                  width: "140px",
                  textAlign: "center",
                }}
              >
                Signature &amp; Stamp
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render directly into document.body so #root display:none cannot hide it
  return createPortal(invoice, document.body);
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function BillGeneratorPage() {
  const { isAuthenticated, openLoginModal } = useAuth();
  const [catalog, setCatalog] = useState<CatalogItem[]>(loadCatalog);
  const [lines, setLines] = useState<BillLine[]>([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [billNumber, setBillNumber] = useState(
    () => `INV-${Date.now().toString().slice(-6)}`,
  );
  const [indianMode, setIndianMode] = useState(true);
  const [savedCount, setSavedCount] = useState(() => loadSavedBills().length);
  const [billDateTime, setBillDateTime] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCatalog(loadCatalog());
    setBillDateTime(getISTDateTime());
  }, []);

  // ── Elastic print: start at large font and shrink only if needed ──
  useEffect(() => {
    const handleBeforePrint = () => {
      const portal = document.getElementById(
        "print-invoice-portal",
      ) as HTMLElement | null;
      const a4El = document.getElementById(
        "print-invoice-a4",
      ) as HTMLElement | null;
      if (!portal || !a4El) return;

      // Make visible so we can measure
      portal.style.display = "block";

      // Start at maximum font size and shrink until content fits in 297mm height
      // 297mm ≈ 1122px at 96dpi
      const maxH = 1122;
      let fs = 20; // start large
      a4El.style.fontSize = `${fs}px`;

      // Shrink until it fits
      while (fs > 7 && a4El.scrollHeight > maxH) {
        fs -= 0.5;
        a4El.style.fontSize = `${fs}px`;
      }
    };

    const handleAfterPrint = () => {
      const portal = document.getElementById(
        "print-invoice-portal",
      ) as HTMLElement | null;
      if (portal) portal.style.display = "none";
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
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

  const updateQty = useCallback((id: string, val: string, unit: string) => {
    let qty = Number.parseFloat(val);
    if (Number.isNaN(qty) || qty <= 0) return;
    if (unit === "pcs") qty = Math.round(qty);
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, qty } : l)));
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clearBill = () => {
    setLines([]);
    setCustomerName("");
    setBillNumber(`INV-${Date.now().toString().slice(-6)}`);
    setBillDateTime(getISTDateTime());
    setSearch("");
    setShowDropdown(false);
  };

  const totals = useMemo(() => {
    return lines.reduce(
      (acc, line) => {
        const calc = calcLine(line);
        return {
          subtotal: acc.subtotal + calc.lineSubtotal,
          gst: acc.gst + calc.lineGst,
          total: acc.total + calc.lineTotal,
          cogs: acc.cogs + calc.lineCogs,
        };
      },
      { subtotal: 0, gst: 0, total: 0, cogs: 0 },
    );
  }, [lines]);

  const clearAllBills = () => {
    if (
      !window.confirm(
        `Clear all ${savedCount} saved bill${savedCount > 1 ? "s" : ""}? This will also reset the financial data synced to P&L, Balance Sheet & Cash Flow.`,
      )
    )
      return;
    localStorage.removeItem(SAVED_BILLS_KEY);
    localStorage.removeItem(FINANCIAL_PREFILL_KEY);
    setSavedCount(0);
    toast.success("All saved bills cleared.");
  };
  const handlePrint = () => {
    setBillDateTime(getISTDateTime());
    setTimeout(() => window.print(), 50);
  };

  const handleSave = () => {
    if (lines.length === 0) {
      toast.error("Add items to the bill before saving.");
      return;
    }

    const firstCategory = lines[0]?.item.category || "General";
    const newBill: SavedBill = {
      id: crypto.randomUUID(),
      billNumber,
      customerName,
      date: new Date().toISOString(),
      subtotal: totals.subtotal,
      gst: totals.gst,
      total: totals.total,
      cogs: totals.cogs,
      category: firstCategory,
    };

    const existing = loadSavedBills();
    const updated = [...existing, newBill];
    localStorage.setItem(SAVED_BILLS_KEY, JSON.stringify(updated));
    setSavedCount(updated.length);

    const totalRevenue = updated.reduce((s, b) => s + b.subtotal, 0);
    const totalCogs = updated.reduce((s, b) => s + b.cogs, 0);
    const totalGst = updated.reduce((s, b) => s + b.gst, 0);
    const totalCash = updated.reduce((s, b) => s + b.total, 0);
    const netIncome = totalRevenue - totalCogs;

    const prefill = {
      revenue: String(Math.round(totalRevenue)),
      cogs: String(Math.round(totalCogs)),
      gstCollected: String(Math.round(totalGst)),
      cash: String(Math.round(totalCash)),
      netIncome: String(Math.round(netIncome)),
      lastUpdated: new Date().toISOString(),
      billCount: updated.length,
    };
    localStorage.setItem(FINANCIAL_PREFILL_KEY, JSON.stringify(prefill));

    toast.success(
      `Bill saved! Data synced to P&L, Balance Sheet & Cash Flow (${
        updated.length
      } bill${updated.length > 1 ? "s" : ""} total).`,
    );

    setBillNumber(`INV-${Date.now().toString().slice(-6)}`);
    setBillDateTime(getISTDateTime());
  };

  return (
    <>
      {/* ── Screen UI ── */}
      <div className="p-6 lg:p-8 space-y-6 bill-print-root">
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
            {savedCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cfo-green/10 border border-cfo-green/20 text-xs font-mono text-cfo-green no-print">
                <CheckCircle2 size={12} />
                {savedCount} bill{savedCount > 1 ? "s" : ""} saved
              </div>
            )}
            {savedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  !isAuthenticated ? openLoginModal() : clearAllBills()
                }
                className="gap-2 text-xs no-print border-red-500/40 text-red-400 hover:bg-red-500/10"
                data-ocid="bill.delete_button"
              >
                <Trash2 size={13} />
                Clear Bills
              </Button>
            )}
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
              onClick={() =>
                !isAuthenticated ? openLoginModal() : handleSave()
              }
              className="gap-2 text-xs no-print border-cfo-green/40 text-cfo-green hover:bg-cfo-green/10"
              data-ocid="bill.save_button"
              disabled={lines.length === 0}
            >
              <Save size={13} />
              Save Bill
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

        {/* Sync info banner */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-cfo-indigo/10 border border-cfo-indigo/20 text-xs font-mono text-muted-foreground no-print">
          <CheckCircle2 size={13} className="text-cfo-indigo mt-0.5 shrink-0" />
          <span>
            <span className="text-cfo-indigo font-semibold">
              Auto-sync enabled.
            </span>{" "}
            Saving a bill automatically transfers revenue, COGS, and cash data
            to your P&amp;L, Balance Sheet, and Cash Flow pages.
          </span>
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
                                    updateQty(
                                      line.id,
                                      e.target.value,
                                      line.item.unit,
                                    )
                                  }
                                  className="num-input h-6 w-16 text-xs bg-transparent border-border text-right p-1"
                                  min={line.item.unit === "pcs" ? "1" : "0.001"}
                                  step={
                                    line.item.unit === "pcs" ? "1" : "0.001"
                                  }
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
                                onClick={() =>
                                  !isAuthenticated
                                    ? openLoginModal()
                                    : removeLine(line.id)
                                }
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

              <div className="rounded-md border border-border overflow-hidden">
                <div className="px-4 py-2.5 bg-cfo-green/10 border-b border-border flex justify-between items-center">
                  <span className="text-xs font-display font-semibold text-cfo-green uppercase tracking-wider">
                    Tax Invoice
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {billDateTime || getISTDateTime()}
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
                <div className="space-y-2">
                  <Button
                    className="w-full bg-cfo-green hover:bg-cfo-green/90 text-black gap-2 text-xs"
                    onClick={() =>
                      !isAuthenticated ? openLoginModal() : handleSave()
                    }
                    data-ocid="bill.save_button"
                  >
                    <Save size={13} />
                    Save &amp; Sync to Reports
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-xs no-print"
                    onClick={handlePrint}
                    data-ocid="bill.submit_button"
                  >
                    <Printer size={13} />
                    Print Invoice
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Print Invoice — portalled into document.body (bypasses #root display:none) ── */}
      <PrintInvoice
        lines={lines}
        totals={totals}
        billNumber={billNumber}
        customerName={customerName}
        billDateTime={billDateTime}
        indianMode={indianMode}
      />
    </>
  );
}
