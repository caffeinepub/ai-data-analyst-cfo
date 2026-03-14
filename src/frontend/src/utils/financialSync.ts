// Shared financial data sync between Bill Generator and financial report pages

export const SAVED_BILLS_KEY = "cfo_saved_bills";
export const FINANCIAL_PREFILL_KEY = "cfo_financial_prefill";
export const ANALYST_DATA_KEY = "cfo_analyst_data";

export interface SavedBill {
  id: string;
  billNumber: string;
  customerName: string;
  date: string; // ISO date string
  subtotal: number;
  gst: number;
  total: number;
  cogs: number; // sum of costPrice * qty for all lines
  category: string; // first item's category or 'General'
}

export interface FinancialPrefill {
  revenue: string; // total subtotal from all bills
  cogs: string; // total COGS from all bills
  gstCollected: string; // total GST collected
  cash: string; // total received (grand total)
  netIncome: string; // revenue - cogs
  lastUpdated: string; // ISO timestamp
  billCount: number;
}

export function loadSavedBills(): SavedBill[] {
  try {
    const raw = localStorage.getItem(SAVED_BILLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBills(bills: SavedBill[]): void {
  localStorage.setItem(SAVED_BILLS_KEY, JSON.stringify(bills));
}

export function loadFinancialPrefill(): FinancialPrefill | null {
  try {
    const raw = localStorage.getItem(FINANCIAL_PREFILL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function buildAnalystCSV(bills: SavedBill[]): string {
  if (bills.length === 0) return "";

  // Group bills by month
  const monthMap: Record<
    string,
    { revenue: number; expenses: number; category: string }
  > = {};
  for (const bill of bills) {
    const d = new Date(bill.date);
    const month = `${d.toLocaleString("default", { month: "short" })}-${d.getFullYear()}`;
    if (!monthMap[month]) {
      monthMap[month] = { revenue: 0, expenses: 0, category: bill.category };
    }
    monthMap[month].revenue += bill.subtotal;
    monthMap[month].expenses += bill.cogs;
  }

  const rows = Object.entries(monthMap).map(([month, v]) => {
    const netProfit = v.revenue - v.expenses;
    return `${month},${Math.round(v.revenue)},${Math.round(v.expenses)},${Math.round(netProfit)},${v.category}`;
  });

  return `Month,Revenue,Expenses,NetProfit,Category\n${rows.join("\n")}`;
}
