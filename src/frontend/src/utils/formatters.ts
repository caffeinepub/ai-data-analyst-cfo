export function formatCurrency(value: number | string, symbol = "₹"): string {
  const n = typeof value === "string" ? Number.parseFloat(value) || 0 : value;
  return `${symbol}${Math.round(Math.abs(n)).toLocaleString("en-IN")}`;
}

export function formatNumber(value: number | string): string {
  const n = typeof value === "string" ? Number.parseFloat(value) || 0 : value;
  return Math.round(n).toLocaleString("en-IN");
}

export function formatPct(value: number): string {
  return `${Math.round(value)}%`;
}

function toIST(date: Date): Date {
  // IST is UTC+5:30
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 3600000);
}

export function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000; // nanoseconds to ms
  const ist = toIST(new Date(ms));
  return ist.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function formatDatetime(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

export function parseInputNum(val: string): number {
  return Number.parseFloat(val.replace(/[$,%,]/g, "")) || 0;
}
