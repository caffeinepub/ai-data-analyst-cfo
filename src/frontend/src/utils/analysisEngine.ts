// ============================================================
// CFO.ai Analysis Engine - Full 10-Step Business Intelligence
// ============================================================

export interface ColumnStats {
  name: string;
  type: "numeric" | "date" | "text" | "boolean";
  count: number;
  missing: number;
  missingPct: number;
  // Numeric
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  q1?: number;
  q3?: number;
  sum?: number;
  // Text
  uniqueCount?: number;
  mode?: string;
  topValues?: { value: string; count: number; pct: number }[];
}

export interface Correlation {
  col1: string;
  col2: string;
  r: number;
  strength: "strong" | "moderate" | "weak";
  direction: "positive" | "negative";
}

export interface SegmentRow {
  segment: string;
  groupBy: string;
  count: number;
  [key: string]: string | number;
}

export interface KPI {
  name: string;
  label: string;
  total: number;
  average: number;
  max: number;
  min: number;
  trend?: "up" | "down" | "stable";
  growthRate?: number;
}

export interface Insight {
  type: "info" | "warning" | "success" | "danger";
  title: string;
  description: string;
}

export interface ParetoResult {
  column: string;
  top20PctRows: number;
  top20PctValue: number;
  top20PctShare: number;
  rows80PctValue: number;
  rows80PctShare: number;
}

export interface TrendPoint {
  label: string;
  value: number;
  growthRate?: number;
  isAnomaly?: boolean;
}

export interface VisualizationSuggestion {
  type: string;
  title: string;
  x?: string;
  y?: string;
  color?: string;
  reason: string;
}

export interface AnalysisReport {
  // Step 1
  overview: {
    totalRows: number;
    totalColumns: number;
    headers: string[];
    duplicateRows: number;
    totalMissing: number;
    dataQualityScore: number;
  };
  // Step 2
  cleaningSummary: {
    actions: string[];
    cleanedRows: number;
    removedDuplicates: number;
    imputedColumns: string[];
    highMissingColumns: string[];
  };
  // Step 3
  columnStats: ColumnStats[];
  correlations: Correlation[];
  // Step 4
  trends: {
    dateColumn?: string;
    points: TrendPoint[];
    peakPeriod?: string;
    troughPeriod?: string;
    overallGrowthRate?: number;
    cagr?: number;
    anomalies: string[];
  };
  // Step 5
  segments: {
    groupByColumn: string;
    rows: SegmentRow[];
    topPerformer: string;
    bottomPerformer: string;
  }[];
  // Step 6
  kpis: KPI[];
  // Step 7
  insights: Insight[];
  // Step 8
  pareto?: ParetoResult;
  // Step 9
  visualizationSuggestions: VisualizationSuggestion[];
  // Step 10
  executiveSummary: {
    overallPerformance: string;
    keyDrivers: string;
    recommendations: string;
  };
}

function parseCSV(raw: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = raw.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const sep = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(sep).map(h => h.trim().replace(/^["']|["']$/g, ''));

  const rows = lines.slice(1).map(line => {
    const vals = line.split(sep).map(v => v.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ''; });
    return row;
  });

  return { headers, rows };
}

function detectType(values: string[]): "numeric" | "date" | "text" | "boolean" {
  const nonEmpty = values.filter(v => v !== '');
  if (nonEmpty.length === 0) return "text";

  const boolSet = new Set(['true', 'false', 'yes', 'no', '1', '0']);
  if (nonEmpty.every(v => boolSet.has(v.toLowerCase()))) return "boolean";

  const numericCount = nonEmpty.filter(v => !isNaN(parseFloat(v.replace(/[$,%,]/g, ''))) && v !== '').length;
  if (numericCount / nonEmpty.length > 0.8) return "numeric";

  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^[A-Za-z]{3}-\d{4}$/,
    /^[A-Za-z]+-\d{4}$/,
    /^Q[1-4]-\d{4}$/,
    /^\d{4}$/,
  ];
  const dateCount = nonEmpty.filter(v => datePatterns.some(p => p.test(v))).length;
  if (dateCount / nonEmpty.length > 0.7) return "date";

  return "text";
}

function toNum(v: string): number {
  return parseFloat(v.replace(/[$,%]/g, '')) || 0;
}

function computeNumericStats(values: number[]): Partial<ColumnStats> {
  if (values.length === 0) return {};
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const sum = values.reduce((s, v) => s + v, 0);
  return { mean, median, std, min: sorted[0], max: sorted[n - 1], q1, q3, sum };
}

function pearsonR(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n === 0) return 0;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0));
  return den === 0 ? 0 : num / den;
}

function dateToOrder(v: string): number {
  const monthMap: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
  };
  const m = v.match(/^([A-Za-z]{3})-(\d{4})$/);
  if (m) return parseInt(m[2]) * 100 + (monthMap[m[1].toLowerCase()] || 0);
  const y = v.match(/^(\d{4})$/);
  if (y) return parseInt(y[1]) * 100;
  const q = v.match(/^Q([1-4])-(\d{4})$/);
  if (q) return parseInt(q[2]) * 100 + parseInt(q[1]) * 25;
  return 0;
}

function formatNum(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function analyzeDataset(rawData: string): AnalysisReport {
  const { headers, rows: rawRows } = parseCSV(rawData);

  if (headers.length === 0 || rawRows.length === 0) {
    return emptyReport();
  }

  // ─── STEP 1: Dataset Overview ─────────────────────────────
  const rowKeys = rawRows.map(r => JSON.stringify(r));
  const uniqueKeys = new Set(rowKeys);
  const duplicateRows = rawRows.length - uniqueKeys.size;

  let totalMissing = 0;
  headers.forEach(h => {
    rawRows.forEach(r => { if (!r[h] || r[h] === '') totalMissing++; });
  });

  const dataQualityScore = Math.max(0, Math.round(
    100 - (duplicateRows / rawRows.length) * 20 - (totalMissing / (rawRows.length * headers.length)) * 30
  ));

  // ─── STEP 2: Data Cleaning ────────────────────────────────
  const cleaningActions: string[] = [];
  let rows = [...rawRows];

  // Remove duplicates
  const seen = new Set<string>();
  rows = rows.filter(r => {
    const key = JSON.stringify(r);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (duplicateRows > 0) cleaningActions.push(`Removed ${duplicateRows} duplicate row(s)`);

  // Detect types per column
  const colTypes: Record<string, "numeric" | "date" | "text" | "boolean"> = {};
  headers.forEach(h => {
    colTypes[h] = detectType(rows.map(r => r[h]));
  });

  // Impute missing numerics with column mean
  const imputedColumns: string[] = [];
  const highMissingColumns: string[] = [];

  headers.forEach(h => {
    if (colTypes[h] !== 'numeric') return;
    const vals = rows.map(r => r[h]);
    const missing = vals.filter(v => !v || v === '').length;
    const pct = missing / vals.length;
    if (pct > 0.2) highMissingColumns.push(h);
    if (missing > 0) {
      const nums = vals.filter(v => v && v !== '').map(toNum);
      const mean = nums.length > 0 ? nums.reduce((s, v) => s + v, 0) / nums.length : 0;
      rows = rows.map(r => ({ ...r, [h]: r[h] || r[h] === '' ? (r[h] || String(mean)) : r[h] }));
      imputedColumns.push(h);
      cleaningActions.push(`Imputed ${missing} missing values in "${h}" with column mean (${mean.toFixed(2)})`);
    }
  });

  if (highMissingColumns.length > 0) {
    cleaningActions.push(`Flagged columns with >20% missing: ${highMissingColumns.join(', ')}`);
  }
  cleaningActions.push(`Normalized ${headers.length} column names`);
  cleaningActions.push(`Validated data types: ${Object.entries(colTypes).map(([k, v]) => `${k}=${v}`).join(', ')}`);

  // ─── STEP 3: Column Stats & Correlations ─────────────────
  const columnStats: ColumnStats[] = headers.map(h => {
    const vals = rows.map(r => r[h]);
    const missing = vals.filter(v => !v || v === '').length;
    const type = colTypes[h];

    const base: ColumnStats = {
      name: h,
      type,
      count: rows.length,
      missing,
      missingPct: missing / rows.length,
    };

    if (type === 'numeric') {
      const nums = vals.map(toNum);
      return { ...base, ...computeNumericStats(nums) };
    }

    if (type === 'text') {
      const freq: Record<string, number> = {};
      vals.forEach(v => { if (v) freq[v] = (freq[v] || 0) + 1; });
      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
      const topValues = sorted.slice(0, 5).map(([value, count]) => ({
        value,
        count,
        pct: count / rows.length,
      }));
      return {
        ...base,
        uniqueCount: Object.keys(freq).length,
        mode: sorted[0]?.[0] || '',
        topValues,
      };
    }

    return base;
  });

  // Correlations between numeric columns
  const numCols = headers.filter(h => colTypes[h] === 'numeric');
  const correlations: Correlation[] = [];
  for (let i = 0; i < numCols.length; i++) {
    for (let j = i + 1; j < numCols.length; j++) {
      const xs = rows.map(r => toNum(r[numCols[i]]));
      const ys = rows.map(r => toNum(r[numCols[j]]));
      const r = pearsonR(xs, ys);
      if (Math.abs(r) > 0.3) {
        const absR = Math.abs(r);
        correlations.push({
          col1: numCols[i],
          col2: numCols[j],
          r: parseFloat(r.toFixed(3)),
          strength: absR > 0.7 ? 'strong' : absR > 0.5 ? 'moderate' : 'weak',
          direction: r > 0 ? 'positive' : 'negative',
        });
      }
    }
  }
  correlations.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));

  // ─── STEP 4: Trend Analysis ───────────────────────────────
  const dateCol = headers.find(h => colTypes[h] === 'date');
  const trendResult: AnalysisReport['trends'] = {
    dateColumn: dateCol,
    points: [],
    anomalies: [],
  };

  if (dateCol) {
    const primaryNumCol = numCols.find(c => {
      const n = c.toLowerCase();
      return n.includes('revenue') || n.includes('sales') || n.includes('amount') || n.includes('total');
    }) || numCols[0];

    if (primaryNumCol) {
      const grouped: Record<string, number[]> = {};
      rows.forEach(r => {
        const d = r[dateCol];
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push(toNum(r[primaryNumCol]));
      });

      const periods = Object.keys(grouped).sort((a, b) => dateToOrder(a) - dateToOrder(b));
      const vals = periods.map(p => grouped[p].reduce((s, v) => s + v, 0));
      const { mean = 0, std = 0 } = computeNumericStats(vals) as { mean: number; std: number };

      const points: TrendPoint[] = periods.map((label, i) => {
        const value = vals[i];
        const growthRate = i > 0 ? (value - vals[i - 1]) / vals[i - 1] : undefined;
        const isAnomaly = Math.abs(value - mean) > 2 * std;
        if (isAnomaly) trendResult.anomalies.push(`Anomaly in ${label}: ${formatNum(value)} (${((value - mean) / std).toFixed(1)} std devs from mean)`);
        return { label, value, growthRate, isAnomaly };
      });

      trendResult.points = points;

      const maxIdx = vals.indexOf(Math.max(...vals));
      const minIdx = vals.indexOf(Math.min(...vals));
      trendResult.peakPeriod = periods[maxIdx];
      trendResult.troughPeriod = periods[minIdx];

      if (points.length >= 2) {
        const first = vals[0], last = vals[vals.length - 1];
        trendResult.overallGrowthRate = (last - first) / first;
        const years = periods.length / 12 || 1;
        trendResult.cagr = Math.pow(last / first, 1 / years) - 1;
      }
    }
  }

  // ─── STEP 5: Segment Analysis ─────────────────────────────
  const catCols = headers.filter(h => colTypes[h] === 'text');
  const segments: AnalysisReport['segments'] = [];

  catCols.slice(0, 3).forEach(groupCol => {
    if (!numCols.length) return;
    const groups: Record<string, number[][]> = {};

    rows.forEach(r => {
      const key = r[groupCol] || 'Unknown';
      if (!groups[key]) groups[key] = numCols.map(() => []);
      numCols.forEach((nc, i) => {
        groups[key][i].push(toNum(r[nc]));
      });
    });

    const primaryNumCol = numCols.find(c => {
      const n = c.toLowerCase();
      return n.includes('revenue') || n.includes('sales') || n.includes('amount');
    }) || numCols[0];
    const primaryIdx = numCols.indexOf(primaryNumCol);

    const segRows: SegmentRow[] = Object.entries(groups).map(([segment, colData]) => {
      const row: SegmentRow = {
        segment,
        groupBy: groupCol,
        count: colData[0].length,
      };
      numCols.forEach((nc, i) => {
        const sum = colData[i].reduce((s, v) => s + v, 0);
        row[`${nc}_sum`] = parseFloat(sum.toFixed(2));
        row[`${nc}_avg`] = parseFloat((sum / colData[i].length).toFixed(2));
      });
      return row;
    });

    segRows.sort((a, b) => (b[`${primaryNumCol}_sum`] as number) - (a[`${primaryNumCol}_sum`] as number));

    segments.push({
      groupByColumn: groupCol,
      rows: segRows,
      topPerformer: segRows[0]?.segment || '',
      bottomPerformer: segRows[segRows.length - 1]?.segment || '',
    });
  });

  // ─── STEP 6: KPI Extraction ───────────────────────────────
  const kpiKeywords = {
    Revenue: ['revenue', 'sales', 'income', 'turnover', 'receipts'],
    Cost: ['cost', 'expense', 'cogs', 'expenditure', 'spend'],
    Profit: ['profit', 'earnings', 'margin', 'net', 'gain'],
    Quantity: ['units', 'qty', 'quantity', 'volume', 'count'],
    Growth: ['growth', 'change', 'delta', 'increase'],
  };

  const kpis: KPI[] = [];
  numCols.forEach(col => {
    const lower = col.toLowerCase();
    let label = col;
    Object.entries(kpiKeywords).forEach(([l, kws]) => {
      if (kws.some(kw => lower.includes(kw))) label = l;
    });

    const vals = rows.map(r => toNum(r[col]));
    const stats = computeNumericStats(vals);
    if (!stats.sum) return;

    // Calculate growth from first to last if date sorted
    let growthRate: number | undefined;
    let trend: "up" | "down" | "stable" | undefined;
    if (dateCol && trendResult.points.length >= 2) {
      const firstVals = rows
        .filter(r => r[dateCol] === trendResult.points[0].label)
        .map(r => toNum(r[col]));
      const lastVals = rows
        .filter(r => r[dateCol] === trendResult.points[trendResult.points.length - 1].label)
        .map(r => toNum(r[col]));
      const firstSum = firstVals.reduce((s, v) => s + v, 0);
      const lastSum = lastVals.reduce((s, v) => s + v, 0);
      if (firstSum > 0) {
        growthRate = (lastSum - firstSum) / firstSum;
        trend = growthRate > 0.02 ? 'up' : growthRate < -0.02 ? 'down' : 'stable';
      }
    }

    kpis.push({
      name: col,
      label,
      total: parseFloat((stats.sum || 0).toFixed(2)),
      average: parseFloat((stats.mean || 0).toFixed(2)),
      max: parseFloat((stats.max || 0).toFixed(2)),
      min: parseFloat((stats.min || 0).toFixed(2)),
      trend,
      growthRate,
    });
  });

  // ─── STEP 7: Critical Insights ───────────────────────────
  const insights: Insight[] = [];

  // Missing data
  columnStats.forEach(cs => {
    if (cs.missingPct > 0.2) {
      insights.push({
        type: 'warning',
        title: `High Missing Data: ${cs.name}`,
        description: `Column "${cs.name}" has ${(cs.missingPct * 100).toFixed(1)}% missing values. Consider data collection improvements.`,
      });
    }
  });

  // Strong correlations
  correlations.slice(0, 3).forEach(c => {
    insights.push({
      type: c.strength === 'strong' ? 'success' : 'info',
      title: `${c.strength.charAt(0).toUpperCase() + c.strength.slice(1)} ${c.direction} correlation`,
      description: `"${c.col1}" and "${c.col2}" show a ${c.strength} ${c.direction} correlation (r = ${c.r}). ${c.direction === 'positive' ? 'They move together.' : 'They move inversely.'}`,
    });
  });

  // Trend insights
  if (trendResult.overallGrowthRate !== undefined) {
    const g = trendResult.overallGrowthRate;
    insights.push({
      type: g > 0.1 ? 'success' : g < -0.05 ? 'danger' : 'info',
      title: `Overall ${g >= 0 ? 'Growth' : 'Decline'}: ${(g * 100).toFixed(1)}%`,
      description: `From first to last period, the primary metric ${g >= 0 ? 'grew' : 'declined'} by ${(Math.abs(g) * 100).toFixed(1)}%.${trendResult.cagr !== undefined ? ` CAGR: ${(trendResult.cagr * 100).toFixed(2)}%` : ''}`,
    });
  }

  // Anomalies
  trendResult.anomalies.slice(0, 2).forEach(a => {
    insights.push({ type: 'warning', title: 'Anomaly Detected', description: a });
  });

  // Segment dominance
  if (segments.length > 0 && segments[0].rows.length > 0) {
    const seg = segments[0];
    const totalCol = `${kpis[0]?.name}_sum`;
    const total = seg.rows.reduce((s, r) => s + ((r[totalCol] as number) || 0), 0);
    const topShare = total > 0 ? ((seg.rows[0][totalCol] as number) || 0) / total : 0;
    insights.push({
      type: topShare > 0.4 ? 'warning' : 'info',
      title: `Segment Concentration: ${seg.topPerformer}`,
      description: `"${seg.topPerformer}" accounts for ${(topShare * 100).toFixed(1)}% of total ${seg.groupByColumn} performance.${topShare > 0.4 ? ' High concentration risk detected.' : ''}`,
    });
  }

  // Duplicate rows
  if (duplicateRows > 0) {
    insights.push({
      type: 'warning',
      title: `${duplicateRows} Duplicate Row(s) Found`,
      description: `${duplicateRows} duplicate rows were detected and removed during cleaning. Review data collection pipeline.`,
    });
  }

  // Top performer
  if (kpis.length > 0) {
    const topKPI = kpis.find(k => k.label === 'Revenue') || kpis[0];
    insights.push({
      type: 'info',
      title: `Key Metric: ${topKPI.name}`,
      description: `Total ${topKPI.name}: ${formatNum(topKPI.total)} | Avg: ${formatNum(topKPI.average)} | Range: ${formatNum(topKPI.min)} – ${formatNum(topKPI.max)}`,
    });
  }

  // ─── STEP 8: Pareto Analysis ─────────────────────────────
  let pareto: ParetoResult | undefined;
  if (kpis.length > 0) {
    const topKPI = kpis.find(k => k.label === 'Revenue') || kpis[0];
    const colVals = rows.map(r => toNum(r[topKPI.name])).sort((a, b) => b - a);
    const grandTotal = colVals.reduce((s, v) => s + v, 0);

    let cum = 0;
    let rows80 = 0;
    for (let i = 0; i < colVals.length; i++) {
      cum += colVals[i];
      rows80 = i + 1;
      if (cum >= grandTotal * 0.8) break;
    }

    const top20 = Math.max(1, Math.round(colVals.length * 0.2));
    const top20Val = colVals.slice(0, top20).reduce((s, v) => s + v, 0);

    pareto = {
      column: topKPI.name,
      top20PctRows: top20,
      top20PctValue: parseFloat(top20Val.toFixed(2)),
      top20PctShare: parseFloat((top20Val / grandTotal).toFixed(3)),
      rows80PctValue: rows80,
      rows80PctShare: parseFloat((rows80 / colVals.length).toFixed(3)),
    };

    insights.push({
      type: pareto.top20PctShare > 0.75 ? 'warning' : 'info',
      title: `Pareto Analysis: ${topKPI.name}`,
      description: `Top 20% of rows (${top20} rows) account for ${(pareto.top20PctShare * 100).toFixed(1)}% of total ${topKPI.name}. ${pareto.top20PctShare > 0.75 ? 'Strong 80/20 concentration.' : '80% of value is contributed by ' + rows80 + ' rows (' + (pareto.rows80PctShare * 100).toFixed(1) + '% of data).'}`,
    });
  }

  // ─── STEP 9: Visualization Suggestions ───────────────────
  const viz: VisualizationSuggestion[] = [];

  if (dateCol && numCols.length > 0) {
    viz.push({
      type: 'Line Chart',
      title: `${numCols[0]} Over Time`,
      x: dateCol,
      y: numCols[0],
      reason: `Time-series data detected in "${dateCol}". A line chart best reveals trends, growth, and seasonality.`,
    });
  }

  if (catCols.length > 0 && numCols.length > 0) {
    viz.push({
      type: 'Bar Chart',
      title: `${numCols[0]} by ${catCols[0]}`,
      x: catCols[0],
      y: numCols[0],
      reason: `Categorical column "${catCols[0]}" makes bar chart ideal for comparing performance across segments.`,
    });
  }

  if (numCols.length >= 2) {
    viz.push({
      type: 'Scatter Plot',
      title: `${numCols[0]} vs ${numCols[1]}`,
      x: numCols[0],
      y: numCols[1],
      reason: `Two numeric columns with correlation of ${correlations[0]?.r || 'N/A'}. Scatter plot reveals relationship strength.`,
    });
  }

  if (catCols.length > 0 && kpis.length > 0) {
    viz.push({
      type: 'Pie Chart',
      title: `${kpis[0].name} Share by ${catCols[0]}`,
      color: catCols[0],
      y: kpis[0].name,
      reason: `Segment proportional share is best visualized with a pie/donut chart for quick 80/20 identification.`,
    });
  }

  if (numCols.length >= 2 && catCols.length > 0) {
    viz.push({
      type: 'Heatmap',
      title: `Correlation Matrix`,
      reason: `${correlations.length} correlations detected. A heatmap matrix makes cross-variable relationships instantly readable.`,
    });
  }

  if (viz.length < 5 && numCols.length > 0) {
    viz.push({
      type: 'Histogram',
      title: `Distribution of ${numCols[0]}`,
      x: numCols[0],
      reason: `Distribution analysis reveals skewness, outliers, and value concentration in "${numCols[0]}".`,
    });
  }

  // ─── STEP 10: Executive Summary ──────────────────────────
  const topKPIStr = kpis.length > 0
    ? `Total ${kpis[0].name} of ${formatNum(kpis[0].total)}`
    : 'varied metrics';

  const growthStr = trendResult.overallGrowthRate !== undefined
    ? `${trendResult.overallGrowthRate >= 0 ? 'positive' : 'negative'} growth of ${(Math.abs(trendResult.overallGrowthRate) * 100).toFixed(1)}%`
    : 'stable performance';

  const topSegStr = segments.length > 0
    ? `"${segments[0].topPerformer}" leads in ${segments[0].groupByColumn}`
    : 'segment analysis complete';

  const corrStr = correlations.length > 0
    ? `Strong correlation between ${correlations[0].col1} and ${correlations[0].col2} (r=${correlations[0].r})`
    : 'correlations analyzed';

  const executiveSummary = {
    overallPerformance: `The dataset spans ${rows.length} records across ${headers.length} dimensions, revealing ${topKPIStr} with ${growthStr} over the analysis period. Data quality score is ${dataQualityScore}/100, with ${duplicateRows > 0 ? duplicateRows + ' duplicate rows removed and ' : ''}${imputedColumns.length > 0 ? imputedColumns.length + ' column(s) imputed' : 'clean data across all columns'}.`,
    keyDrivers: `${topSegStr} as the primary performance driver. ${corrStr}. ${trendResult.peakPeriod ? `Peak performance occurred in ${trendResult.peakPeriod}` : 'Trend peaks identified'}${trendResult.cagr !== undefined ? `, with a CAGR of ${(trendResult.cagr * 100).toFixed(2)}%` : ''}. ${pareto ? `Pareto analysis confirms top ${(pareto.top20PctShare * 100).toFixed(0)}% concentration in leading rows.` : ''}`,
    recommendations: `${highMissingColumns.length > 0 ? `Priority 1: Address data gaps in ${highMissingColumns.join(', ')} to improve analytical accuracy. ` : ''}${trendResult.anomalies.length > 0 ? `Investigate ${trendResult.anomalies.length} detected anomalies for operational root causes. ` : ''}Leverage the strong performance of ${segments[0]?.topPerformer || 'top segments'} and replicate success patterns across underperforming segments. Consider implementing monthly tracking dashboards for the ${kpis[0]?.name || 'primary'} KPI to enable proactive decision-making.`,
  };

  return {
    overview: {
      totalRows: rows.length,
      totalColumns: headers.length,
      headers,
      duplicateRows,
      totalMissing,
      dataQualityScore,
    },
    cleaningSummary: {
      actions: cleaningActions,
      cleanedRows: rows.length,
      removedDuplicates: duplicateRows,
      imputedColumns,
      highMissingColumns,
    },
    columnStats,
    correlations,
    trends: trendResult,
    segments,
    kpis,
    insights,
    pareto,
    visualizationSuggestions: viz,
    executiveSummary,
  };
}

function emptyReport(): AnalysisReport {
  return {
    overview: { totalRows: 0, totalColumns: 0, headers: [], duplicateRows: 0, totalMissing: 0, dataQualityScore: 0 },
    cleaningSummary: { actions: [], cleanedRows: 0, removedDuplicates: 0, imputedColumns: [], highMissingColumns: [] },
    columnStats: [],
    correlations: [],
    trends: { points: [], anomalies: [] },
    segments: [],
    kpis: [],
    insights: [],
    visualizationSuggestions: [],
    executiveSummary: { overallPerformance: '', keyDrivers: '', recommendations: '' },
  };
}
