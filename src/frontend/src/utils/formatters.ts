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

export function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000; // nanoseconds to ms
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDatetime(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function parseInputNum(val: string): number {
  return Number.parseFloat(val.replace(/[$,%,]/g, "")) || 0;
}
