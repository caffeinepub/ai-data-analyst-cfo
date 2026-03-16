// Shared financial data sync between Bill Generator and financial report pages

export const SAVED_BILLS_KEY = "cfo_saved_bills";
export const FINANCIAL_PREFILL_KEY = "cfo_financial_prefill";
export const ANALYST_DATA_KEY = "cfo_analyst_data";
export const BUSINESS_HISTORY_KEY = "cfo_business_history";

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

export interface BusinessHistoryEntry {
  id: string;
  month: string; // e.g. "Jan"
  year: number;
  revenue: number;
  expenses: number; // total expenses (operatingExpenses + investingExpenses)
  operatingExpenses: number; // day-to-day running costs
  investingExpenses: number; // capital / asset expenditures
  netProfit: number;
  category: string;
  enteredAt: string; // ISO timestamp
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

export function loadBusinessHistory(): BusinessHistoryEntry[] {
  try {
    const raw = localStorage.getItem(BUSINESS_HISTORY_KEY);
    if (!raw) return [];
    const entries: BusinessHistoryEntry[] = JSON.parse(raw);
    // Back-compat: fill in operatingExpenses / investingExpenses if missing
    return entries.map((e) => ({
      ...e,
      operatingExpenses: e.operatingExpenses ?? e.expenses,
      investingExpenses: e.investingExpenses ?? 0,
    }));
  } catch {
    return [];
  }
}

export function saveBusinessHistoryEntry(
  entry: BusinessHistoryEntry,
): BusinessHistoryEntry[] {
  const existing = loadBusinessHistory();
  // Prevent exact duplicate month+year
  const filtered = existing.filter(
    (e) => !(e.month === entry.month && e.year === entry.year),
  );
  const updated = [...filtered, entry];
  localStorage.setItem(BUSINESS_HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteBusinessHistoryEntry(id: string): BusinessHistoryEntry[] {
  const existing = loadBusinessHistory();
  const updated = existing.filter((e) => e.id !== id);
  localStorage.setItem(BUSINESS_HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

const MONTH_NAMES = [
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

function monthSortKey(month: string, year: number) {
  return year * 100 + MONTH_NAMES.indexOf(month);
}

export function buildAnalystCSV(bills: SavedBill[]): string {
  // Group bills by month
  const monthMap: Record<
    string,
    {
      revenue: number;
      expenses: number;
      operatingExpenses: number;
      investingExpenses: number;
      category: string;
      sortKey: number;
    }
  > = {};
  for (const bill of bills) {
    const d = new Date(bill.date);
    const month = `${d.toLocaleString("default", { month: "short" })}-${d.getFullYear()}`;
    if (!monthMap[month]) {
      monthMap[month] = {
        revenue: 0,
        expenses: 0,
        operatingExpenses: 0,
        investingExpenses: 0,
        category: bill.category,
        sortKey: d.getFullYear() * 100 + d.getMonth(),
      };
    }
    // Bills: cogs → operating expenses; no investing
    monthMap[month].revenue += bill.subtotal;
    monthMap[month].operatingExpenses += bill.cogs;
    monthMap[month].expenses += bill.cogs;
  }

  // Merge manually entered business history
  const history = loadBusinessHistory();
  for (const h of history) {
    const key = `${h.month}-${h.year}`;
    const opEx = h.operatingExpenses ?? h.expenses;
    const invEx = h.investingExpenses ?? 0;
    if (monthMap[key]) {
      monthMap[key].revenue += h.revenue;
      monthMap[key].operatingExpenses += opEx;
      monthMap[key].investingExpenses += invEx;
      monthMap[key].expenses += h.expenses;
    } else {
      monthMap[key] = {
        revenue: h.revenue,
        expenses: h.expenses,
        operatingExpenses: opEx,
        investingExpenses: invEx,
        category: h.category,
        sortKey: monthSortKey(h.month, h.year),
      };
    }
  }

  if (Object.keys(monthMap).length === 0) return "";

  const rows = Object.entries(monthMap)
    .sort((a, b) => a[1].sortKey - b[1].sortKey)
    .map(([month, v]) => {
      const netProfit = v.revenue - v.expenses;
      return `${month},${Math.round(v.revenue)},${Math.round(v.expenses)},${Math.round(netProfit)},${v.category},${Math.round(v.operatingExpenses)},${Math.round(v.investingExpenses)}`;
    });

  return `Month,Revenue,Expenses,NetProfit,Category,OperatingExpenses,InvestingExpenses\n${rows.join("\n")}`;
}

export function buildYearlyAnalystCSV(bills: SavedBill[]): string {
  // Group bills by year
  const yearMap: Record<
    string,
    {
      revenue: number;
      expenses: number;
      operatingExpenses: number;
      investingExpenses: number;
      category: string;
    }
  > = {};
  for (const bill of bills) {
    const d = new Date(bill.date);
    const year = d.getFullYear().toString();
    if (!yearMap[year]) {
      yearMap[year] = {
        revenue: 0,
        expenses: 0,
        operatingExpenses: 0,
        investingExpenses: 0,
        category: bill.category,
      };
    }
    yearMap[year].revenue += bill.subtotal;
    yearMap[year].operatingExpenses += bill.cogs;
    yearMap[year].expenses += bill.cogs;
  }

  // Merge manually entered business history
  const history = loadBusinessHistory();
  for (const h of history) {
    const year = String(h.year);
    const opEx = h.operatingExpenses ?? h.expenses;
    const invEx = h.investingExpenses ?? 0;
    if (yearMap[year]) {
      yearMap[year].revenue += h.revenue;
      yearMap[year].operatingExpenses += opEx;
      yearMap[year].investingExpenses += invEx;
      yearMap[year].expenses += h.expenses;
    } else {
      yearMap[year] = {
        revenue: h.revenue,
        expenses: h.expenses,
        operatingExpenses: opEx,
        investingExpenses: invEx,
        category: h.category,
      };
    }
  }

  if (Object.keys(yearMap).length === 0) return "";

  const rows = Object.entries(yearMap)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([year, v]) => {
      const netProfit = v.revenue - v.expenses;
      return `${year},${Math.round(v.revenue)},${Math.round(v.expenses)},${Math.round(netProfit)},${v.category},${Math.round(v.operatingExpenses)},${Math.round(v.investingExpenses)}`;
    });

  return `Year,Revenue,Expenses,NetProfit,Category,OperatingExpenses,InvestingExpenses\n${rows.join("\n")}`;
}
