import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart2, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const MONTHLY_DATA = [
  { month: "Apr", revenue: 820000, netProfit: 112000 },
  { month: "May", revenue: 950000, netProfit: 138000 },
  { month: "Jun", revenue: 880000, netProfit: 102000 },
  { month: "Jul", revenue: 1050000, netProfit: 175000 },
  { month: "Aug", revenue: 1120000, netProfit: 196000 },
  { month: "Sep", revenue: 1300000, netProfit: 231000 },
  { month: "Oct", revenue: 1240000, netProfit: 210000 },
  { month: "Nov", revenue: 1450000, netProfit: 268000 },
  { month: "Dec", revenue: 1680000, netProfit: 315000 },
  { month: "Jan", revenue: 1530000, netProfit: 274000 },
  { month: "Feb", revenue: 1720000, netProfit: 340000 },
  { month: "Mar", revenue: 1950000, netProfit: 398000 },
];

function formatRupee(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

const revenueConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "oklch(0.65 0.18 250)" },
};

const profitConfig: ChartConfig = {
  netProfit: { label: "Net Profit", color: "oklch(0.65 0.18 145)" },
};

export function GrowthChartsPage() {
  const first = MONTHLY_DATA[0];
  const last = MONTHLY_DATA[MONTHLY_DATA.length - 1];
  const revGrowth = (
    ((last.revenue - first.revenue) / first.revenue) *
    100
  ).toFixed(1);
  const npGrowth = (
    ((last.netProfit - first.netProfit) / first.netProfit) *
    100
  ).toFixed(1);

  return (
    <div
      className="p-6 lg:p-8 space-y-8 animate-fade-in"
      data-ocid="growth_charts.page"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 size={14} className="text-cfo-indigo" />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            Financial Performance
          </span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">
          Growth Charts
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monthly Revenue &amp; Net Profit growth · Apr – Mar
        </p>
      </div>

      {/* Revenue Growth Chart */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-cfo-indigo" />
            <h2 className="text-sm font-display font-semibold text-foreground">
              Revenue Growth
            </h2>
          </div>
          <span className="text-xs font-mono text-cfo-green bg-cfo-green/10 px-2 py-0.5 rounded">
            +{revGrowth}% over 12 months
          </span>
        </div>
        <div className="p-5">
          <ChartContainer config={revenueConfig} className="h-[260px] w-full">
            <AreaChart
              data={MONTHLY_DATA}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="oklch(0.65 0.18 250)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="oklch(0.65 0.18 250)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.26 0.03 255)"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "oklch(0.6 0.01 255)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatRupee}
                tick={{ fontSize: 11, fill: "oklch(0.6 0.01 255)" }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => [
                      formatRupee(Number(value)),
                      "Revenue",
                    ]}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="oklch(0.65 0.18 250)"
                strokeWidth={2.5}
                fill="url(#revGrad)"
                dot={{ r: 4, fill: "oklch(0.65 0.18 250)", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "oklch(0.65 0.18 250)" }}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>

      {/* Net Profit Growth Chart */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-cfo-green" />
            <h2 className="text-sm font-display font-semibold text-foreground">
              Net Profit Growth
            </h2>
          </div>
          <span className="text-xs font-mono text-cfo-green bg-cfo-green/10 px-2 py-0.5 rounded">
            +{npGrowth}% over 12 months
          </span>
        </div>
        <div className="p-5">
          <ChartContainer config={profitConfig} className="h-[260px] w-full">
            <AreaChart
              data={MONTHLY_DATA}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="npGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="oklch(0.65 0.18 145)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="oklch(0.65 0.18 145)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.26 0.03 255)"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "oklch(0.6 0.01 255)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatRupee}
                tick={{ fontSize: 11, fill: "oklch(0.6 0.01 255)" }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => [
                      formatRupee(Number(value)),
                      "Net Profit",
                    ]}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="netProfit"
                stroke="oklch(0.65 0.18 145)"
                strokeWidth={2.5}
                fill="url(#npGrad)"
                dot={{ r: 4, fill: "oklch(0.65 0.18 145)", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "oklch(0.65 0.18 145)" }}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
