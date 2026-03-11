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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Package,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatCurrency } from "../../utils/formatters";

const STORAGE_KEY = "cfo_item_catalog";
const MAX_ITEMS = 50;
const GST_RATES = ["0", "5", "12", "18", "28"];
const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Food & Beverage",
  "Furniture",
  "Medicine",
  "Stationery",
  "Services",
  "Other",
];
const UNITS = ["pcs", "kg", "g", "litre", "ml", "metre", "box", "dozen", "set"];

export interface CatalogItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  gstRate: number;
  gstInclusive: boolean;
  description: string;
}

function loadItems(): CatalogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items = raw ? JSON.parse(raw) : [];
    // migrate old items without unit
    return items.map((it: CatalogItem) => ({ ...it, unit: it.unit ?? "pcs" }));
  } catch {
    return [];
  }
}

function saveItems(items: CatalogItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const EMPTY_FORM: Omit<CatalogItem, "id"> = {
  name: "",
  sku: "",
  category: "Other",
  unit: "pcs",
  costPrice: 0,
  sellingPrice: 0,
  gstRate: 18,
  gstInclusive: false,
  description: "",
};

export function ItemCatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>(loadItems);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<CatalogItem, "id">>(EMPTY_FORM);

  useEffect(() => {
    saveItems(items);
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter(
        (it) =>
          it.name.toLowerCase().includes(search.toLowerCase()) ||
          it.sku.toLowerCase().includes(search.toLowerCase()) ||
          it.category.toLowerCase().includes(search.toLowerCase()),
      ),
    [items, search],
  );

  const handleAdd = useCallback(() => {
    if (!form.name.trim()) {
      toast.error("Item name is required");
      return;
    }
    if (items.length >= MAX_ITEMS && !editId) {
      toast.error(`Maximum ${MAX_ITEMS} items allowed`);
      return;
    }
    if (editId) {
      setItems((prev) =>
        prev.map((it) => (it.id === editId ? { id: editId, ...form } : it)),
      );
      toast.success("Item updated");
    } else {
      setItems((prev) => [...prev, { id: crypto.randomUUID(), ...form }]);
      toast.success("Item added to catalog");
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditId(null);
  }, [form, items.length, editId]);

  const handleEdit = useCallback((item: CatalogItem) => {
    const { id, ...rest } = item;
    setForm(rest);
    setEditId(id);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    toast.success("Item removed");
  }, []);

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditId(null);
  };

  const effSell = (item: CatalogItem) => {
    if (item.gstInclusive) return item.sellingPrice;
    return item.sellingPrice * (1 + item.gstRate / 100);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package size={14} className="text-cfo-amber" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Bill Generator
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">
            Item Catalog
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Store up to {MAX_ITEMS} items with GST info for billing
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-2 text-xs no-print"
            data-ocid="catalog.print_button"
          >
            <Printer size={13} />
            Print
          </Button>
          {items.length < MAX_ITEMS && (
            <Button
              size="sm"
              onClick={() => {
                setEditId(null);
                setForm(EMPTY_FORM);
                setShowForm(true);
              }}
              className="gap-2 text-xs bg-cfo-amber hover:bg-cfo-amber/90 text-black"
              data-ocid="catalog.open_modal_button"
            >
              <Plus size={13} />
              Add Item
            </Button>
          )}
        </div>
      </div>

      {items.length >= MAX_ITEMS * 0.9 && (
        <div className="bg-cfo-amber/10 border border-cfo-amber/30 rounded-lg px-4 py-2.5 text-xs font-mono text-cfo-amber">
          ⚠ {items.length}/{MAX_ITEMS} items — approaching limit
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div
          className="bg-card border border-border rounded-lg p-5 space-y-5"
          data-ocid="catalog.panel"
        >
          <div className="flex items-center justify-between">
            <div className="border-l-2 border-l-cfo-amber pl-3">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                {editId ? "Edit Item" : "New Item"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground"
              data-ocid="catalog.close_button"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-muted-foreground">
                Item Name *
              </Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Laptop Stand"
                className="bg-input border-border h-9 text-sm"
                data-ocid="catalog.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-muted-foreground">
                Item Code / SKU
              </Label>
              <Input
                value={form.sku}
                onChange={(e) =>
                  setForm((p) => ({ ...p, sku: e.target.value }))
                }
                placeholder="e.g. LS-001"
                className="bg-input border-border h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-muted-foreground">
                Category
              </Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger
                  className="h-9 bg-input border-border text-sm"
                  data-ocid="catalog.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-muted-foreground">
                Unit of Measure
              </Label>
              <Select
                value={form.unit}
                onValueChange={(v) => setForm((p) => ({ ...p, unit: v }))}
              >
                <SelectTrigger className="h-9 bg-input border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-muted-foreground">
                Cost Price per {form.unit} (₹)
              </Label>
              <Input
                type="number"
                value={form.costPrice || ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    costPrice: Number.parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0.00"
                className="num-input bg-input border-border h-9 text-sm"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-muted-foreground">
                Selling Price per {form.unit} (₹)
              </Label>
              <Input
                type="number"
                value={form.sellingPrice || ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    sellingPrice: Number.parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0.00"
                className="num-input bg-input border-border h-9 text-sm"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-muted-foreground">
                GST Rate (%)
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {GST_RATES.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, gstRate: Number(rate) }))
                    }
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-mono font-semibold border transition-all",
                      form.gstRate === Number(rate)
                        ? "bg-cfo-teal/20 border-cfo-teal text-cfo-teal"
                        : "bg-secondary border-border text-muted-foreground hover:border-cfo-teal/50",
                    )}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center justify-between p-3 rounded-md bg-secondary/30 border border-border flex-1">
              <div>
                <div className="text-xs font-medium text-foreground">
                  GST Inclusive
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {form.gstInclusive
                    ? "Price includes GST"
                    : "GST added on top of price"}
                </div>
              </div>
              <Switch
                checked={form.gstInclusive}
                onCheckedChange={(v) =>
                  setForm((p) => ({ ...p, gstInclusive: v }))
                }
                data-ocid="catalog.switch"
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs font-mono text-muted-foreground">
                Description (optional)
              </Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Brief item description"
                className="bg-input border-border h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={handleAdd}
              className="bg-cfo-amber hover:bg-cfo-amber/90 text-black gap-2 text-xs"
              data-ocid="catalog.save_button"
            >
              {editId ? <Pencil size={13} /> : <Plus size={13} />}
              {editId ? "Update Item" : "Add to Catalog"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="text-xs"
              data-ocid="catalog.cancel_button"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Item Table */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="border-l-2 border-l-cfo-amber pl-3">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Catalog ({items.length}/{MAX_ITEMS} items)
            </span>
          </div>
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="pl-8 h-8 text-xs bg-input border-border w-48"
              data-ocid="catalog.search_input"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div
            className="py-12 text-center text-muted-foreground text-sm font-mono"
            data-ocid="catalog.empty_state"
          >
            {items.length === 0
              ? "No items yet — click Add Item to get started"
              : "No items match your search"}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="px-3 py-2.5 text-left font-mono text-muted-foreground">
                    Item
                  </th>
                  <th className="px-3 py-2.5 text-left font-mono text-muted-foreground">
                    SKU
                  </th>
                  <th className="px-3 py-2.5 text-left font-mono text-muted-foreground">
                    Category
                  </th>
                  <th className="px-3 py-2.5 text-left font-mono text-muted-foreground">
                    Unit
                  </th>
                  <th className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                    Cost/unit
                  </th>
                  <th className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                    Selling/unit
                  </th>
                  <th className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                    GST%
                  </th>
                  <th className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                    Effective Price
                  </th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/50 hover:bg-secondary/20"
                    data-ocid={`catalog.item.${idx + 1}`}
                  >
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-foreground">
                        {item.name}
                      </div>
                      {item.description && (
                        <div className="text-[10px] text-muted-foreground truncate max-w-32">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">
                      {item.sku || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {item.category}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">
                      {item.unit}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-foreground">
                      {formatCurrency(item.costPrice)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-cfo-indigo">
                      {formatCurrency(item.sellingPrice)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-semibold",
                          item.gstInclusive
                            ? "bg-cfo-teal/15 text-cfo-teal"
                            : "bg-cfo-amber/15 text-cfo-amber",
                        )}
                      >
                        {item.gstRate}%{item.gstInclusive ? " incl." : ""}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-cfo-green">
                      {formatCurrency(effSell(item))}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="text-muted-foreground hover:text-cfo-indigo transition-colors"
                          data-ocid={`catalog.edit_button.${idx + 1}`}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          data-ocid={`catalog.delete_button.${idx + 1}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
