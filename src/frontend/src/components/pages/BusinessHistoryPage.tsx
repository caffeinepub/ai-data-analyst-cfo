import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Plus, Trash2, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import {
  type BusinessHistoryEntry,
  deleteBusinessHistoryEntry,
  loadBusinessHistory,
  saveBusinessHistoryEntry,
} from "../../utils/financialSync";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const CATEGORIES = [
  "Cement",
  "Steel",
  "Stone",
  "General",
  "Electronics",
  "Retail",
  "Construction",
  "Manufacturing",
  "Services",
  "Food & Beverage",
  "Wholesale",
  "Export",
  "Other",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

function fmt(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

const EMPTY_FORM = {
  month: "",
  year: String(CURRENT_YEAR),
  revenue: "",
  operatingExpenses: "",
  investingExpenses: "",
  category: "General",
};

export function BusinessHistoryPage() {
  const { isAuthenticated, openLoginModal } = useAuth();
  const [entries, setEntries] = useState<BusinessHistoryEntry[]>(() =>
    loadBusinessHistory(),
  );
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.month) e.month = "Select a month";
    if (!form.year || Number.isNaN(Number(form.year)))
      e.year = "Enter a valid year";
    if (
      !form.revenue ||
      Number.isNaN(Number(form.revenue)) ||
      Number(form.revenue) < 0
    )
      e.revenue = "Enter a valid revenue";
    if (
      !form.operatingExpenses ||
      Number.isNaN(Number(form.operatingExpenses)) ||
      Number(form.operatingExpenses) < 0
    )
      e.operatingExpenses = "Enter valid operating expenses";
    if (
      form.investingExpenses !== "" &&
      (Number.isNaN(Number(form.investingExpenses)) ||
        Number(form.investingExpenses) < 0)
    )
      e.investingExpenses = "Enter valid investing expenses";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleAdd() {
    if (!validate()) return;
    const opEx = Math.round(Number(form.operatingExpenses));
    const invEx = Math.round(Number(form.investingExpenses) || 0);
    const totalExpenses = opEx + invEx;
    const entry: BusinessHistoryEntry = {
      id: `hist_${Date.now()}`,
      month: form.month,
      year: Number(form.year),
      revenue: Math.round(Number(form.revenue)),
      expenses: totalExpenses,
      operatingExpenses: opEx,
      investingExpenses: invEx,
      netProfit: Math.round(Number(form.revenue)) - totalExpenses,
      category: form.category,
      enteredAt: new Date().toISOString(),
    };
    const updated = saveBusinessHistoryEntry(entry);
    setEntries(updated);
    setForm({ ...EMPTY_FORM });
    setErrors({});
    toast.success(`${entry.month}-${entry.year} added to business history.`);
  }

  function handleDelete(id: string) {
    const updated = deleteBusinessHistoryEntry(id);
    setEntries(updated);
    toast.success("Entry removed.");
  }

  function handleClearAll() {
    if (
      !window.confirm(
        "Clear all manually entered business history? This cannot be undone.",
      )
    )
      return;
    localStorage.removeItem("cfo_business_history");
    setEntries([]);
    toast.success("Business history cleared.");
  }

  const totalRevenue = entries.reduce((s, e) => s + e.revenue, 0);
  const totalProfit = entries.reduce((s, e) => s + e.netProfit, 0);

  // Sort entries chronologically
  const sorted = [...entries].sort((a, b) =>
    a.year !== b.year
      ? a.year - b.year
      : MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month),
  );

  // Preview net profit in form
  const previewOpEx = Number(form.operatingExpenses) || 0;
  const previewInvEx = Number(form.investingExpenses) || 0;
  const previewNet = Number(form.revenue) - previewOpEx - previewInvEx;
  const showPreview = form.revenue !== "" && form.operatingExpenses !== "";

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cfo-amber/10">
            <ClipboardList className="h-6 w-6 text-cfo-amber" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Business History
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter past monthly data — auto-merged into all reports &amp;
              analysis
            </p>
          </div>
        </div>
        {entries.length > 0 && (
          <Button
            data-ocid="history.clear_button"
            variant="destructive"
            size="sm"
            className="gap-2 text-xs"
            onClick={() =>
              !isAuthenticated ? openLoginModal() : handleClearAll()
            }
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear All History
          </Button>
        )}
      </div>

      {/* Summary Strip */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Records</p>
            <p className="text-xl font-bold">{entries.length}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-xl font-bold text-cfo-indigo">
              {fmt(totalRevenue)}
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">
              Total Net Profit
            </p>
            <p
              className={`text-xl font-bold ${
                totalProfit >= 0 ? "text-cfo-green" : "text-cfo-red"
              }`}
            >
              {fmt(totalProfit)}
            </p>
          </div>
        </div>
      )}

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-cfo-green" />
            Add Monthly Record
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Month */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Month *</Label>
              <Select
                value={form.month}
                onValueChange={(v) => setForm((f) => ({ ...f, month: v }))}
              >
                <SelectTrigger
                  data-ocid="history.month.select"
                  className="text-sm"
                >
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.month && (
                <p className="text-xs text-destructive">{errors.month}</p>
              )}
            </div>

            {/* Year */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Year *</Label>
              <Select
                value={form.year}
                onValueChange={(v) => setForm((f) => ({ ...f, year: v }))}
              >
                <SelectTrigger
                  data-ocid="history.year.select"
                  className="text-sm"
                >
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.year && (
                <p className="text-xs text-destructive">{errors.year}</p>
              )}
            </div>

            {/* Revenue */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Revenue (₹) *</Label>
              <Input
                data-ocid="history.revenue.input"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 500000"
                value={form.revenue}
                onChange={(e) =>
                  setForm((f) => ({ ...f, revenue: e.target.value }))
                }
                className="text-sm"
              />
              {errors.revenue && (
                <p className="text-xs text-destructive">{errors.revenue}</p>
              )}
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger
                  data-ocid="history.category.select"
                  className="text-sm"
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
          </div>

          {/* Expense Fields Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Operating Expenses */}
            <div className="flex flex-col gap-1.5 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
              <Label className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Operating Expenses (₹) *
              </Label>
              <p className="text-[10px] text-muted-foreground">
                Day-to-day running costs: salaries, rent, utilities, marketing
              </p>
              <Input
                data-ocid="history.operating_expenses.input"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 280000"
                value={form.operatingExpenses}
                onChange={(e) =>
                  setForm((f) => ({ ...f, operatingExpenses: e.target.value }))
                }
                className="text-sm"
              />
              {errors.operatingExpenses && (
                <p className="text-xs text-destructive">
                  {errors.operatingExpenses}
                </p>
              )}
            </div>

            {/* Investing Expenses */}
            <div className="flex flex-col gap-1.5 bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
              <Label className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Investing Expenses (₹)
              </Label>
              <p className="text-[10px] text-muted-foreground">
                Capital expenditure: equipment, assets, infrastructure
                (optional)
              </p>
              <Input
                data-ocid="history.investing_expenses.input"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 40000"
                value={form.investingExpenses}
                onChange={(e) =>
                  setForm((f) => ({ ...f, investingExpenses: e.target.value }))
                }
                className="text-sm"
              />
              {errors.investingExpenses && (
                <p className="text-xs text-destructive">
                  {errors.investingExpenses}
                </p>
              )}
            </div>
          </div>

          {/* Net Profit Preview */}
          {showPreview && (
            <div className="flex flex-wrap items-center gap-4 text-sm bg-muted/30 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cfo-amber" />
                <span className="text-xs text-muted-foreground">
                  Total Expenses:
                </span>
                <span className="font-semibold text-cfo-amber">
                  {fmt(previewOpEx + previewInvEx)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cfo-green" />
                <span className="text-xs text-muted-foreground">
                  Calculated Net Profit:
                </span>
                <span
                  className={`font-semibold ${
                    previewNet >= 0 ? "text-cfo-green" : "text-cfo-red"
                  }`}
                >
                  {fmt(previewNet)}
                </span>
              </div>
            </div>
          )}

          <div>
            <Button
              data-ocid="history.add_button"
              onClick={() =>
                !isAuthenticated ? openLoginModal() : handleAdd()
              }
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add to History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      {entries.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-cfo-amber" />
              Saved History
              <Badge variant="outline" className="ml-auto text-xs">
                {entries.length} record{entries.length > 1 ? "s" : ""}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Operating Exp.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Investing Exp.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Total Expenses
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                      Net Profit
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      data-ocid={`history.item.${idx + 1}`}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-semibold">
                        {entry.month}-{entry.year}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {entry.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-cfo-indigo">
                        {fmt(entry.revenue)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-amber-500">
                        {fmt(entry.operatingExpenses ?? entry.expenses)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-blue-500">
                        {fmt(entry.investingExpenses ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-cfo-amber">
                        {fmt(entry.expenses)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-semibold ${
                          entry.netProfit >= 0
                            ? "text-cfo-green"
                            : "text-cfo-red"
                        }`}
                      >
                        {fmt(entry.netProfit)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          data-ocid={`history.delete_button.${idx + 1}`}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            !isAuthenticated
                              ? openLoginModal()
                              : handleDelete(entry.id)
                          }
                          title="Delete entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          data-ocid="history.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <ClipboardList className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            No history yet. Add your first monthly record above.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Saved data will automatically appear in AI Data Analyst, P&amp;L,
            Balance Sheet &amp; Cash Flow.
          </p>
        </div>
      )}
    </div>
  );
}
