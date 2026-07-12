/**
 * aiEngine.ts
 * ──────────────────────────────────────────────────────────────────
 * Pure TypeScript AI intelligence engine for ProdTrack AI.
 * No external API required — derives all intelligence from
 * the production data already returned by the FastAPI backend.
 *
 * Exposed functions:
 *   generateInsights        → AI insight cards
 *   detectAnomalies         → anomaly list with severity
 *   computeMachineHealth    → per-machine health scores
 *   generateShiftSummary    → structured daily/shift summary
 *   generateRecommendations → prioritised action recommendations
 *   predictEndOfDay         → EOD production forecast
 *   parseNLQuery            → natural language query handler
 */

import type { ProductionIntelligence, ShiftReport } from '../types/production';

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

export type InsightSeverity = 'positive' | 'info' | 'warning' | 'critical';
export type InsightCategory =
  | 'production'
  | 'efficiency'
  | 'machine'
  | 'shift'
  | 'forecast'
  | 'anomaly'
  | 'quality';

export interface Insight {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  detail: string;
  metric?: string;
  icon: string; // lucide icon name
}

export type AnomalyPriority = 'P1' | 'P2' | 'P3';
export type AnomalyType =
  | 'sudden_drop'
  | 'below_threshold'
  | 'missing_data'
  | 'abnormal_high'
  | 'repeated_failure'
  | 'inconsistency';

export interface Anomaly {
  id: string;
  type: AnomalyType;
  priority: AnomalyPriority;
  title: string;
  description: string;
  machine?: string;
  shift?: string;
  date?: string;
  dismissed?: boolean;
}

export type HealthStatus = 'Excellent' | 'Good' | 'Warning' | 'Critical';

export interface MachineHealth {
  machineNo: string;
  score: number; // 0–100
  status: HealthStatus;
  trend: 'up' | 'down' | 'stable';
  avgEfficiency: number;
  totalReports: number;
  criticalEvents: number;
}

export interface ShiftSummary {
  date: string;
  shift?: string;
  totalProduction: number;
  targetProduction: number;
  targetAchievement: number; // %
  efficiency: number; // %
  bestMachine: string;
  bestMachineEfficiency: number;
  worstMachine: string;
  worstMachineEfficiency: number;
  anomalyCount: number;
  recommendations: Recommendation[];
  forecastNextShift: number;
  forecastConfidence: number;
  classificationSummary: string;
}

export type RecommendationPriority = 'high' | 'medium' | 'low';

export interface Recommendation {
  id: string;
  priority: RecommendationPriority;
  title: string;
  detail: string;
  machine?: string;
  icon: string;
}

export interface EODForecast {
  expectedProduction: number;
  targetProduction: number;
  riskOfMissingTarget: 'Low' | 'Medium' | 'High';
  confidence: number;
  weeklyExpected: number;
}

export interface NLQueryResult {
  question: string;
  answer: string;
  data?: Record<string, unknown>;
  suggestions: string[];
}

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`;

const pct = (n: number, decimals = 1) => `${n.toFixed(decimals)}%`;

/** Group reports by machine_no */
const byMachine = (reports: ShiftReport[]) =>
  reports.reduce<Record<string, ShiftReport[]>>((acc, r) => {
    (acc[r.machine_no] ??= []).push(r);
    return acc;
  }, {});

const avg = (nums: number[]) =>
  nums.length === 0 ? 0 : nums.reduce((a, b) => a + b, 0) / nums.length;

const today = () => new Date().toISOString().slice(0, 10);

const todayReports = (reports: ShiftReport[]) =>
  reports.filter((r) => r.date === today());

const sortByDate = (reports: ShiftReport[]) =>
  [...reports].sort((a, b) => a.date.localeCompare(b.date));

/* ═══════════════════════════════════════════════════════════════════
   1. GENERATE INSIGHTS
   ═══════════════════════════════════════════════════════════════════ */

export function generateInsights(
  reports: ShiftReport[],
  intelligence: ProductionIntelligence,
): Insight[] {
  const insights: Insight[] = [];
  if (!reports.length) return insights;

  const todayReps = todayReports(reports);

  /* ── Today vs yesterday ─────────────────────────────── */
  const { today: todayProd, yesterday: yesterdayProd, delta } = intelligence.today_vs_yesterday;

  if (delta > 0 && yesterdayProd > 0) {
    insights.push({
      id: uid('i'),
      category: 'production',
      severity: 'positive',
      title: `Production up ${pct(delta)} vs yesterday`,
      detail: `Today's output of ${todayProd.toLocaleString()} pieces exceeds yesterday's ${yesterdayProd.toLocaleString()} pieces.`,
      metric: `+${pct(delta)}`,
      icon: 'TrendingUp',
    });
  } else if (delta < -5 && yesterdayProd > 0) {
    insights.push({
      id: uid('i'),
      category: 'production',
      severity: delta < -15 ? 'critical' : 'warning',
      title: `Production down ${pct(Math.abs(delta))} vs yesterday`,
      detail: `Output dropped from ${yesterdayProd.toLocaleString()} to ${todayProd.toLocaleString()} pieces. Investigate root cause.`,
      metric: `${pct(delta)}`,
      icon: 'TrendingDown',
    });
  }

  /* ── Average efficiency ─────────────────────────────── */
  const avgEff = intelligence.average_efficiency;
  if (avgEff >= 95) {
    insights.push({
      id: uid('i'),
      category: 'efficiency',
      severity: 'positive',
      title: `Exceptional efficiency at ${pct(avgEff)}`,
      detail: 'Floor-wide efficiency exceeds 95% — all machines performing at target or above.',
      metric: pct(avgEff),
      icon: 'Zap',
    });
  } else if (avgEff < 80) {
    insights.push({
      id: uid('i'),
      category: 'efficiency',
      severity: avgEff < 70 ? 'critical' : 'warning',
      title: `Average efficiency below threshold: ${pct(avgEff)}`,
      detail: `Floor-wide efficiency is ${pct(avgEff)}, below the 80% minimum target. Immediate review recommended.`,
      metric: pct(avgEff),
      icon: 'AlertTriangle',
    });
  }

  /* ── Worst performing machine ───────────────────────── */
  if (intelligence.worst_performing_machine) {
    const w = intelligence.worst_performing_machine;
    insights.push({
      id: uid('i'),
      category: 'machine',
      severity: w.efficiency < 75 ? 'critical' : 'warning',
      title: `${w.machine_no} needs attention (${pct(w.efficiency)} efficiency)`,
      detail: `Machine ${w.machine_no} recorded the lowest efficiency on ${w.date}, Shift ${w.shift}. Consider maintenance or workload review.`,
      metric: pct(w.efficiency),
      icon: 'AlertCircle',
    });
  }

  /* ── Most inconsistent machine ──────────────────────── */
  if (intelligence.most_inconsistent_machine) {
    const m = intelligence.most_inconsistent_machine;
    if (m.variance > 20) {
      insights.push({
        id: uid('i'),
        category: 'machine',
        severity: 'warning',
        title: `${m.machine_no} shows high output variance`,
        detail: `Variance of ${m.variance.toFixed(1)} detected on ${m.machine_no}. Inconsistent production may indicate operator or mechanical issues.`,
        metric: `Var: ${m.variance.toFixed(1)}`,
        icon: 'Activity',
      });
    }
  }

  /* ── Best performing hour ───────────────────────────── */
  if (intelligence.best_performing_hour) {
    const h = intelligence.best_performing_hour;
    insights.push({
      id: uid('i'),
      category: 'production',
      severity: 'info',
      title: `Peak hour: ${h.time_slot} (${h.pieces.toLocaleString()} pcs)`,
      detail: `The ${h.time_slot} slot produced the highest output across all machines and shifts.`,
      metric: `${h.pieces.toLocaleString()} pcs`,
      icon: 'Clock',
    });
  }

  /* ── Shift comparison ───────────────────────────────── */
  if (intelligence.shift_comparison.length >= 2) {
    const sorted_shifts = [...intelligence.shift_comparison].sort(
      (a, b) => b.efficiency - a.efficiency,
    );
    const best = sorted_shifts[0];
    const worst = sorted_shifts[sorted_shifts.length - 1];
    if (best.efficiency - worst.efficiency > 10) {
      insights.push({
        id: uid('i'),
        category: 'shift',
        severity: 'info',
        title: `Shift ${best.label} outperforms Shift ${worst.label} by ${pct(best.efficiency - worst.efficiency)}`,
        detail: `Shift ${best.label} averaged ${pct(best.efficiency)} vs Shift ${worst.label} at ${pct(worst.efficiency)}. Consider shift allocation review.`,
        metric: `Δ ${pct(best.efficiency - worst.efficiency)}`,
        icon: 'BarChart3',
      });
    }
  }

  /* ── Forecast ───────────────────────────────────────── */
  const fc = intelligence.forecast;
  if (fc.risk === 'High') {
    insights.push({
      id: uid('i'),
      category: 'forecast',
      severity: 'critical',
      title: `High risk of missing next shift target`,
      detail: `AI predicts ${fc.expected_next_shift.toLocaleString()} pieces next shift with only ${fc.confidence}% confidence. Intervention recommended.`,
      metric: `${fc.confidence}% conf.`,
      icon: 'ShieldAlert',
    });
  } else if (fc.confidence >= 85) {
    insights.push({
      id: uid('i'),
      category: 'forecast',
      severity: 'positive',
      title: `Next shift forecast: ${fc.expected_next_shift.toLocaleString()} pieces`,
      detail: `High-confidence forecast (${fc.confidence}%) based on recent performance trends. Risk level: ${fc.risk}.`,
      metric: `${fc.confidence}% conf.`,
      icon: 'Sparkles',
    });
  }

  /* ── Sudden drops in today's reports ───────────────── */
  const drops = todayReps.filter((r) => r.analytics.sudden_drop);
  if (drops.length > 0) {
    insights.push({
      id: uid('i'),
      category: 'anomaly',
      severity: drops.length > 2 ? 'critical' : 'warning',
      title: `${drops.length} sudden production drop${drops.length > 1 ? 's' : ''} detected today`,
      detail: `Machines affected: ${drops.map((r) => r.machine_no).join(', ')}. Review hourly logs for each.`,
      metric: `${drops.length} event${drops.length > 1 ? 's' : ''}`,
      icon: 'AlertTriangle',
    });
  }

  /* ── Machines consistently exceeding target ─────────── */
  const topMachines = intelligence.top_machines.filter((m) => m.average_efficiency >= 100);
  if (topMachines.length > 0) {
    const names = topMachines.map((m) => m.machine_no).join(', ');
    insights.push({
      id: uid('i'),
      category: 'machine',
      severity: 'positive',
      title: `${topMachines.length === 1 ? names : `${topMachines.length} machines`} consistently exceed target`,
      detail: `${names} ${topMachines.length === 1 ? 'is' : 'are'} averaging above 100% target achievement. Benchmark against these for floor-wide improvement.`,
      metric: `${pct(avg(topMachines.map((m) => m.average_efficiency)))} avg`,
      icon: 'Award',
    });
  }

  /* ── Shift report quality ───────────────────────────── */
  const poorReports = reports.filter((r) => r.status === 'Poor').length;
  const totalReports = reports.length;
  if (totalReports > 0 && poorReports / totalReports > 0.25) {
    insights.push({
      id: uid('i'),
      category: 'quality',
      severity: 'warning',
      title: `${Math.round((poorReports / totalReports) * 100)}% of reports below threshold`,
      detail: `${poorReports} of ${totalReports} shift reports are classified as Poor. Quality review required.`,
      metric: `${poorReports}/${totalReports} Poor`,
      icon: 'ShieldCheck',
    });
  }

  /* ── Weekly production vs target ───────────────────── */
  const weeklyData = intelligence.weekly_trend;
  if (weeklyData.length >= 3) {
    const weeklyEff = avg(weeklyData.map((d) => d.efficiency));
    if (weeklyEff >= 90) {
      insights.push({
        id: uid('i'),
        category: 'production',
        severity: 'positive',
        title: `Excellent weekly performance: ${pct(weeklyEff)} avg efficiency`,
        detail: `This week's rolling average efficiency is ${pct(weeklyEff)}, indicating a strong and consistent production run.`,
        metric: pct(weeklyEff),
        icon: 'TrendingUp',
      });
    }
  }

  /* ── Machine comparison — outlier detection ─────────── */
  const machineComps = intelligence.machine_comparison;
  if (machineComps.length >= 2) {
    const efficiencies = machineComps.map((m) => m.average_efficiency);
    const floorAvg = avg(efficiencies);
    const underperformers = machineComps.filter(
      (m) => m.average_efficiency < floorAvg * 0.85,
    );
    if (underperformers.length > 0 && underperformers.length < machineComps.length) {
      insights.push({
        id: uid('i'),
        category: 'machine',
        severity: 'warning',
        title: `${underperformers.map((m) => m.machine_no).join(', ')} underperforming floor average`,
        detail: `Floor average efficiency: ${pct(floorAvg)}. These machines are >15% below average and may require investigation.`,
        metric: `Floor avg: ${pct(floorAvg)}`,
        icon: 'Settings',
      });
    }
  }

  return insights.slice(0, 10); // cap at 10 cards
}

/* ═══════════════════════════════════════════════════════════════════
   2. DETECT ANOMALIES
   ═══════════════════════════════════════════════════════════════════ */

export function detectAnomalies(reports: ShiftReport[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  if (!reports.length) return anomalies;

  const machineGroups = byMachine(reports);

  /* ── Sudden drops ───────────────────────────────────── */
  reports
    .filter((r) => r.analytics.sudden_drop)
    .forEach((r) => {
      anomalies.push({
        id: uid('a'),
        type: 'sudden_drop',
        priority: r.efficiency < 70 ? 'P1' : 'P2',
        title: 'Sudden Production Drop',
        description: `${r.machine_no} experienced a sudden drop in Shift ${r.shift} on ${r.date} (${r.analytics.largest_drop_percent.toFixed(1)}% fall between hours ${r.analytics.largest_drop_from ?? '?'} → ${r.analytics.largest_drop ?? '?'}).`,
        machine: r.machine_no,
        shift: r.shift,
        date: r.date,
      });
    });

  /* ── Machines consistently below 80% ───────────────── */
  Object.entries(machineGroups).forEach(([machine, reps]) => {
    const poorCount = reps.filter((r) => r.efficiency < 80).length;
    if (poorCount >= 3 && reps.length >= 3 && poorCount / reps.length >= 0.6) {
      anomalies.push({
        id: uid('a'),
        type: 'repeated_failure',
        priority: 'P1',
        title: 'Repeated Underperformance',
        description: `${machine} has been below 80% efficiency in ${poorCount} of ${reps.length} shifts. Preventive maintenance recommended.`,
        machine,
      });
    }
  });

  /* ── Abnormally high production (>120% target) ──────── */
  reports
    .filter((r) => r.efficiency > 120)
    .forEach((r) => {
      anomalies.push({
        id: uid('a'),
        type: 'abnormal_high',
        priority: 'P3',
        title: 'Abnormally High Output',
        description: `${r.machine_no} reported ${r.efficiency.toFixed(1)}% efficiency on ${r.date} Shift ${r.shift}. Verify data entry accuracy.`,
        machine: r.machine_no,
        shift: r.shift,
        date: r.date,
      });
    });

  /* ── High variance machines ─────────────────────────── */
  reports
    .filter((r) => r.analytics.variance > 35)
    .forEach((r) => {
      // Avoid duplicating machine entries
      if (!anomalies.find((a) => a.machine === r.machine_no && a.type === 'inconsistency')) {
        anomalies.push({
          id: uid('a'),
          type: 'inconsistency',
          priority: 'P2',
          title: 'High Output Inconsistency',
          description: `${r.machine_no} shows output variance of ${r.analytics.variance.toFixed(1)} in Shift ${r.shift}. Consistency score: ${r.analytics.consistency_score.toFixed(0)}/100.`,
          machine: r.machine_no,
          shift: r.shift,
          date: r.date,
        });
      }
    });

  // Sort by priority
  const priorityOrder: Record<AnomalyPriority, number> = { P1: 0, P2: 1, P3: 2 };
  return anomalies
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 12);
}

/* ═══════════════════════════════════════════════════════════════════
   3. MACHINE HEALTH SCORES
   ═══════════════════════════════════════════════════════════════════ */

export function computeMachineHealth(reports: ShiftReport[]): MachineHealth[] {
  const machineGroups = byMachine(reports);

  return Object.entries(machineGroups).map(([machineNo, reps]) => {
    const sorted = sortByDate(reps);
    const efficiencies = sorted.map((r) => r.efficiency);
    const avgEff = avg(efficiencies);

    // Trend: compare last 3 vs previous 3
    const recentEff = avg(efficiencies.slice(-3));
    const prevEff = efficiencies.length >= 6 ? avg(efficiencies.slice(-6, -3)) : avgEff;
    const trend: MachineHealth['trend'] =
      recentEff > prevEff + 3 ? 'up' : recentEff < prevEff - 3 ? 'down' : 'stable';

    // Scoring components (0–100 each)
    const efficiencyScore = Math.min(100, (avgEff / 90) * 40); // 40% weight
    const targetScore = Math.min(40, (reps.filter((r) => r.efficiency >= 90).length / reps.length) * 30); // 30% weight
    const consistencyScore = avg(reps.map((r) => r.analytics.consistency_score)) * 0.2; // 20% weight
    const dropPenalty = reps.filter((r) => r.analytics.sudden_drop).length * 5; // -5 per drop, 10% weight

    const rawScore = efficiencyScore + targetScore + consistencyScore - dropPenalty;
    const score = Math.max(0, Math.min(100, rawScore));

    const status: HealthStatus =
      score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Warning' : 'Critical';

    const criticalEvents = reps.filter(
      (r) => r.analytics.sudden_drop || r.efficiency < 70,
    ).length;

    return {
      machineNo,
      score: Math.round(score),
      status,
      trend,
      avgEfficiency: Math.round(avgEff * 10) / 10,
      totalReports: reps.length,
      criticalEvents,
    };
  }).sort((a, b) => b.score - a.score);
}

/* ═══════════════════════════════════════════════════════════════════
   4. SHIFT SUMMARY
   ═══════════════════════════════════════════════════════════════════ */

export function generateShiftSummary(
  reports: ShiftReport[],
  intelligence: ProductionIntelligence,
  dateFilter?: string,
  shiftFilter?: string,
): ShiftSummary {
  const filtered = reports.filter((r) => {
    if (dateFilter && r.date !== dateFilter) return false;
    if (shiftFilter && shiftFilter !== 'all' && r.shift !== shiftFilter) return false;
    return true;
  });

  const totalProduction = filtered.reduce((s, r) => s + r.total_pieces, 0);
  const targetProduction = filtered.reduce((s, r) => s + r.target_pieces, 0);
  const targetAchievement = targetProduction > 0 ? (totalProduction / targetProduction) * 100 : 0;
  const efficiency = avg(filtered.map((r) => r.efficiency));

  const sorted_eff = [...filtered].sort((a, b) => b.efficiency - a.efficiency);
  const best = sorted_eff[0];
  const worst = sorted_eff[sorted_eff.length - 1];

  const anomalies = detectAnomalies(filtered);
  const recommendations = generateRecommendations(intelligence, anomalies);

  return {
    date: dateFilter ?? today(),
    shift: shiftFilter,
    totalProduction,
    targetProduction,
    targetAchievement: Math.round(targetAchievement * 10) / 10,
    efficiency: Math.round(efficiency * 10) / 10,
    bestMachine: best?.machine_no ?? '—',
    bestMachineEfficiency: Math.round((best?.efficiency ?? 0) * 10) / 10,
    worstMachine: worst?.machine_no ?? '—',
    worstMachineEfficiency: Math.round((worst?.efficiency ?? 0) * 10) / 10,
    anomalyCount: anomalies.length,
    recommendations: recommendations.slice(0, 5),
    forecastNextShift: intelligence.forecast.expected_next_shift,
    forecastConfidence: intelligence.forecast.confidence,
    classificationSummary:
      targetAchievement >= 100
        ? 'Target Achieved'
        : targetAchievement >= 85
        ? 'Near Target'
        : targetAchievement >= 70
        ? 'Below Target'
        : 'Critical Underperformance',
  };
}

/* ═══════════════════════════════════════════════════════════════════
   5. RECOMMENDATIONS
   ═══════════════════════════════════════════════════════════════════ */

export function generateRecommendations(
  intelligence: ProductionIntelligence,
  anomalies: Anomaly[],
): Recommendation[] {
  const recs: Recommendation[] = [];

  // From anomalies
  const p1Drops = anomalies.filter((a) => a.type === 'repeated_failure' && a.priority === 'P1');
  p1Drops.forEach((a) => {
    recs.push({
      id: uid('r'),
      priority: 'high',
      title: `Schedule preventive maintenance on ${a.machine}`,
      detail: `${a.machine} has repeatedly underperformed. Maintenance downtime now will prevent larger losses.`,
      machine: a.machine,
      icon: 'Wrench',
    });
  });

  const suddenDrops = anomalies.filter((a) => a.type === 'sudden_drop' && a.priority === 'P1');
  suddenDrops.slice(0, 2).forEach((a) => {
    recs.push({
      id: uid('r'),
      priority: 'high',
      title: `Investigate output drop on ${a.machine}`,
      detail: `Sudden drop detected on ${a.date} Shift ${a.shift}. Check raw material supply, tooling, and operator logs.`,
      machine: a.machine,
      icon: 'Search',
    });
  });

  // From intelligence
  if (intelligence.worst_performing_machine) {
    const w = intelligence.worst_performing_machine;
    if (!recs.find((r) => r.machine === w.machine_no)) {
      recs.push({
        id: uid('r'),
        priority: w.efficiency < 75 ? 'high' : 'medium',
        title: `Increase focus on ${w.machine_no} (${pct(w.efficiency)} eff.)`,
        detail: `Consider additional operator support, tooling check, or quality review for this machine.`,
        machine: w.machine_no,
        icon: 'Target',
      });
    }
  }

  if (intelligence.forecast.risk === 'High') {
    recs.push({
      id: uid('r'),
      priority: 'high',
      title: 'Mobilise resources — target at risk next shift',
      detail: `AI confidence is ${intelligence.forecast.confidence}%. Consider overtime authorisation or workload redistribution.`,
      icon: 'AlertTriangle',
    });
  }

  if (intelligence.shift_comparison.length >= 2) {
    const sorted = [...intelligence.shift_comparison].sort((a, b) => b.efficiency - a.efficiency);
    const gap = sorted[0].efficiency - sorted[sorted.length - 1].efficiency;
    if (gap > 15) {
      recs.push({
        id: uid('r'),
        priority: 'medium',
        title: `Review shift allocation — ${pct(gap)} performance gap`,
        detail: `Shift ${sorted[sorted.length - 1].label} is significantly behind. Consider workforce rebalancing or shift supervisor review.`,
        icon: 'Users',
      });
    }
  }

  const inconsistentMachines = anomalies.filter((a) => a.type === 'inconsistency');
  if (inconsistentMachines.length > 0) {
    recs.push({
      id: uid('r'),
      priority: 'medium',
      title: 'Optimise machine changeover process',
      detail: `${inconsistentMachines.length} machine(s) show high output variance, often caused by inconsistent changeover or setup procedures.`,
      icon: 'RefreshCw',
    });
  }

  if (intelligence.average_efficiency < 85) {
    recs.push({
      id: uid('r'),
      priority: 'medium',
      title: 'Review floor-wide production targets',
      detail: `Average efficiency of ${pct(intelligence.average_efficiency)} suggests targets may need recalibration or process improvements are required.`,
      icon: 'BarChart3',
    });
  }

  const highProducers = intelligence.top_machines.filter((m) => m.average_efficiency >= 100);
  if (highProducers.length > 0) {
    recs.push({
      id: uid('r'),
      priority: 'low',
      title: `Replicate ${highProducers[0].machine_no}'s workflow across the floor`,
      detail: `${highProducers[0].machine_no} consistently achieves ${pct(highProducers[0].average_efficiency)}. Document and standardise its operating procedure.`,
      machine: highProducers[0].machine_no,
      icon: 'Copy',
    });
  }

  // Always add a general recommendation if list is short
  if (recs.length < 3) {
    recs.push({
      id: uid('r'),
      priority: 'low',
      title: 'Maintain current monitoring cadence',
      detail: 'Continue hourly entry logging and daily review sessions to sustain current performance levels.',
      icon: 'CheckCircle',
    });
  }

  const priorityOrder: Record<RecommendationPriority, number> = { high: 0, medium: 1, low: 2 };
  return recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/* ═══════════════════════════════════════════════════════════════════
   6. EOD FORECAST
   ═══════════════════════════════════════════════════════════════════ */

export function predictEndOfDay(
  reports: ShiftReport[],
  intelligence: ProductionIntelligence,
): EODForecast {
  const todayReps = todayReports(reports);
  const expectedProduction =
    todayReps.length > 0
      ? todayReps.reduce((s, r) => s + r.total_pieces, 0) +
        intelligence.forecast.expected_next_shift
      : intelligence.forecast.expected_next_shift;

  const targetProduction =
    todayReps.length > 0
      ? todayReps.reduce((s, r) => s + r.target_pieces, 0)
      : 0;

  const achievementRate = targetProduction > 0 ? expectedProduction / targetProduction : 1;

  const riskOfMissingTarget: EODForecast['riskOfMissingTarget'] =
    achievementRate >= 0.9 ? 'Low' : achievementRate >= 0.75 ? 'Medium' : 'High';

  const weeklyExpected =
    intelligence.weekly_trend.length > 0
      ? avg(intelligence.weekly_trend.map((d) => d.total_pieces)) * 7
      : expectedProduction * 7;

  return {
    expectedProduction,
    targetProduction,
    riskOfMissingTarget,
    confidence: intelligence.forecast.confidence,
    weeklyExpected: Math.round(weeklyExpected),
  };
}

/* ═══════════════════════════════════════════════════════════════════
   7. NATURAL LANGUAGE QUERY HANDLER
   ═══════════════════════════════════════════════════════════════════ */

export const NL_SUGGESTIONS = [
  'Why did production decrease today?',
  'Which machine underperformed?',
  'Compare Shift A and Shift B',
  'What is today\'s efficiency?',
  'Predict tomorrow\'s output',
  'Which hour had the highest output?',
  'Show machines below target',
  'What is the forecast for next shift?',
  'Which machine is most consistent?',
  'Generate a production summary',
];

export function parseNLQuery(
  query: string,
  reports: ShiftReport[],
  intelligence: ProductionIntelligence,
): NLQueryResult {
  const q = query.toLowerCase().trim();
  const suggestions = NL_SUGGESTIONS.filter((s) => s.toLowerCase() !== query.toLowerCase()).slice(0, 3);

  // Production decrease
  if (q.includes('decrease') || q.includes('drop') || q.includes('low') || q.includes('fell')) {
    const { today: t, yesterday: y, delta } = intelligence.today_vs_yesterday;
    if (delta < 0) {
      return {
        question: query,
        answer: `Production decreased by ${pct(Math.abs(delta))} today (${t.toLocaleString()} vs ${y.toLocaleString()} pieces yesterday). ${intelligence.worst_performing_machine ? `The primary contributor is ${intelligence.worst_performing_machine.machine_no} running at ${pct(intelligence.worst_performing_machine.efficiency)}.` : ''} ${reports.filter((r) => r.analytics.sudden_drop).length > 0 ? `Sudden drops were detected on ${reports.filter((r) => r.analytics.sudden_drop).map((r) => r.machine_no).join(', ')}.` : ''}`,
        data: { delta, today: t, yesterday: y },
        suggestions,
      };
    }
    return {
      question: query,
      answer: `Production has not decreased today. In fact, output is ${delta >= 0 ? 'up' : 'flat'} vs yesterday: ${t.toLocaleString()} pieces (${delta >= 0 ? '+' : ''}${pct(delta)} change).`,
      suggestions,
    };
  }

  // Underperforming machine
  if (q.includes('underperform') || q.includes('worst machine') || q.includes('bad machine') || q.includes('which machine')) {
    const w = intelligence.worst_performing_machine;
    if (w) {
      return {
        question: query,
        answer: `The worst performing machine is ${w.machine_no} with ${pct(w.efficiency)} efficiency recorded on ${w.date} Shift ${w.shift}. Recommend investigating tooling, raw material, or operator factors.`,
        data: w,
        suggestions,
      };
    }
    return { question: query, answer: 'No underperforming machines identified in current data.', suggestions };
  }

  // Shift comparison
  if (q.includes('shift') && (q.includes('compare') || q.includes('vs') || q.includes('versus') || q.includes('and'))) {
    const sc = intelligence.shift_comparison;
    if (sc.length === 0) return { question: query, answer: 'Not enough shift data available for comparison.', suggestions };
    const sorted = [...sc].sort((a, b) => b.efficiency - a.efficiency);
    const lines = sorted.map((s) => `Shift ${s.label}: ${s.total_pieces.toLocaleString()} pieces, ${pct(s.efficiency)} efficiency`);
    return {
      question: query,
      answer: `Shift comparison:\n${lines.join('\n')}\n\nBest performing: Shift ${sorted[0].label} (${pct(sorted[0].efficiency)}).`,
      data: { shift_comparison: sc },
      suggestions,
    };
  }

  // Today's efficiency
  if (q.includes('efficiency') || q.includes('performance')) {
    return {
      question: query,
      answer: `Current floor-wide average efficiency is ${pct(intelligence.average_efficiency)}. Target achievement: ${pct(intelligence.kpis.target_achievement)}. OEE score: ${pct(intelligence.kpis.oee_score)}.`,
      data: intelligence.kpis,
      suggestions,
    };
  }

  // Forecast / predict
  if (q.includes('predict') || q.includes('forecast') || q.includes('tomorrow') || q.includes('next shift')) {
    const fc = intelligence.forecast;
    return {
      question: query,
      answer: `Next shift forecast: ${fc.expected_next_shift.toLocaleString()} pieces with ${fc.confidence}% confidence. Risk level: ${fc.risk}. ${fc.risk === 'High' ? 'Consider deploying additional resources.' : 'Current trajectory is on track.'}`,
      data: fc,
      suggestions,
    };
  }

  // Best hour
  if (q.includes('hour') || q.includes('peak') || q.includes('highest')) {
    const h = intelligence.best_performing_hour;
    if (h) {
      return {
        question: query,
        answer: `The peak production hour was ${h.time_slot} with ${h.pieces.toLocaleString()} pieces produced across all machines.`,
        data: h,
        suggestions,
      };
    }
  }

  // Below target
  if (q.includes('below target') || q.includes('missed target') || q.includes('under target')) {
    const belowTarget = reports.filter((r) => r.efficiency < 90);
    if (belowTarget.length === 0) {
      return { question: query, answer: 'All machines are currently meeting their targets. Floor performance is on track.', suggestions };
    }
    return {
      question: query,
      answer: `${belowTarget.length} shift report(s) are below target: ${belowTarget.map((r) => `${r.machine_no} (${pct(r.efficiency)})`).join(', ')}.`,
      data: { count: belowTarget.length },
      suggestions,
    };
  }

  // Most consistent machine
  if (q.includes('consistent') || q.includes('reliable') || q.includes('stable')) {
    const topM = intelligence.top_machines[0];
    if (topM) {
      return {
        question: query,
        answer: `The most consistently high-performing machine is ${topM.machine_no} with an average efficiency of ${pct(topM.average_efficiency)} across ${topM.total_pieces.toLocaleString()} total pieces.`,
        data: topM,
        suggestions,
      };
    }
  }

  // Summary
  if (q.includes('summary') || q.includes('report') || q.includes('overview')) {
    const kpis = intelligence.kpis;
    return {
      question: query,
      answer: `Production Summary:\n• Total production: ${kpis.total_production.toLocaleString()} pieces\n• Target achievement: ${pct(kpis.target_achievement)}\n• OEE score: ${pct(kpis.oee_score)}\n• Average efficiency: ${pct(intelligence.average_efficiency)}\n• Forecast (next shift): ${intelligence.forecast.expected_next_shift.toLocaleString()} pieces\n• Risk: ${intelligence.forecast.risk}`,
      data: kpis,
      suggestions,
    };
  }

  // Fallback
  return {
    question: query,
    answer: `I understand you're asking about "${query}". Try one of the suggested questions below, or ask about production trends, machine performance, efficiency, or forecasts.`,
    suggestions: NL_SUGGESTIONS.slice(0, 4),
  };
}
