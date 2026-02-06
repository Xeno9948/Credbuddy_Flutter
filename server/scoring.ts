import type { DailyEntry, CashEstimate } from "@shared/schema";

const EPS = 0.0001;
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

function std(arr: number[], mean: number): number {
  if (arr.length === 0) return 0;
  return Math.sqrt(arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length);
}

export interface FeatureBreakdown {
  dd: number;
  rs: number;
  ep: number;
  bb: number;
  tm: number;
  sr: number;
}

export interface ScoreResult {
  score: number;
  confidence: number; // 0-100
  band: "A" | "B" | "C" | "D";
  flags: string[];
  featureBreakdown: FeatureBreakdown;
}

export function computeCreditScore(
  entries: DailyEntry[],
  cashEstimate: CashEstimate | null
): ScoreResult {
  const now = new Date();
  const msPerDay = 86400000;

  const last14 = entries.filter((e) => {
    const d = new Date(e.date);
    const diff = now.getTime() - d.getTime();
    return diff >= 0 && diff <= 14 * msPerDay;
  });

  if (last14.length === 0) {
    return {
      score: 0,
      confidence: 50,
      band: "D",
      flags: ["R1 Low reliability"],
      featureBreakdown: { dd: 0.1, rs: 0, ep: 0.5, bb: 0.4, tm: 0.5, sr: 0.8 },
    };
  }

  // ─── F1: Data Discipline ────────────────────────────────
  const uniqueDays = new Set(last14.map((e) => e.date));
  const submission_rate = uniqueDays.size / 14;
  let dd = 0;
  if (submission_rate < 0.35) dd = 0.1;
  else if (submission_rate < 0.6) dd = 0.4;
  else if (submission_rate < 0.8) dd = 0.7;
  else dd = 1.0;

  // ─── F2: Revenue Stability ─────────────────────────────
  const revenues = last14.map((e) => e.revenueCents);
  const meanRev = revenues.reduce((a, b) => a + b, 0) / revenues.length;
  const cv = std(revenues, meanRev) / Math.max(meanRev, EPS);
  const rs = 1 - clamp(cv / 1.0, 0, 1);

  // ─── F3: Expense Pressure ──────────────────────────────
  const daysWithExpense = last14.filter((e) => e.expenseCents > 0);
  let ep = 0.5;
  let hasExpenses = false;

  if (daysWithExpense.length >= 7) {
    hasExpenses = true;
    const nets = last14.map((e) => e.revenueCents - e.expenseCents);
    const meanNet = nets.reduce((a, b) => a + b, 0) / nets.length;
    const margin = meanNet / Math.max(meanRev, EPS);
    ep = clamp((margin + 0.1) / 0.4, 0, 1);
  }

  // ─── F4: Buffer Behavior ──────────────────────────────
  let bb = 0.4;
  let hasBuffer = false;
  let buffer_days = 0;

  const avgDailyExpense =
    last14.reduce((a, b) => a + b.expenseCents, 0) / (uniqueDays.size || 1);
  const effectiveExpense =
    avgDailyExpense > 0 ? avgDailyExpense : 0.6 * (meanRev / (uniqueDays.size || 1));

  if (cashEstimate) {
    const ceDate = new Date(cashEstimate.asOfDate);
    const ageDays = (now.getTime() - ceDate.getTime()) / msPerDay;
    if (ageDays <= 7) {
      hasBuffer = true;
      buffer_days = cashEstimate.cashAvailableCents / Math.max(effectiveExpense, EPS);
      bb = clamp(buffer_days / 7, 0, 1);
    }
  }

  // ─── F5: Trend Momentum ───────────────────────────────
  const last7 = entries.filter((e) => {
    const diff = now.getTime() - new Date(e.date).getTime();
    return diff >= 0 && diff <= 7 * msPerDay;
  });
  const prev7 = entries.filter((e) => {
    const diff = now.getTime() - new Date(e.date).getTime();
    return diff > 7 * msPerDay && diff <= 14 * msPerDay;
  });

  const meanRevLast7 =
    last7.length > 0 ? last7.reduce((a, b) => a + b.revenueCents, 0) / last7.length : 0;
  const meanRevPrev7 =
    prev7.length > 0 ? prev7.reduce((a, b) => a + b.revenueCents, 0) / prev7.length : 0;

  let tm = 0.5;
  let delta = 0;
  if (prev7.length > 0) {
    delta = (meanRevLast7 - meanRevPrev7) / Math.max(meanRevPrev7, EPS);
    tm = clamp((delta + 0.1) / 0.3, 0, 1);
  } else if (last7.length > 0) {
    tm = 0.6;
  }

  // ─── F6: Shock Recovery ───────────────────────────────
  const meanRev14 = meanRev;
  const sorted14 = [...last14].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let dipCount = 0;
  let totalRecovery = 0;

  for (let i = 0; i < sorted14.length; i++) {
    if (sorted14[i].revenueCents < 0.5 * meanRev14) {
      dipCount++;
      let recovered = false;
      for (let j = i + 1; j < sorted14.length; j++) {
        if (sorted14[j].revenueCents >= meanRev14) {
          totalRecovery += j - i;
          recovered = true;
          break;
        }
      }
      if (!recovered) {
        totalRecovery += sorted14.length - 1 - i;
      }
    }
  }

  let sr = 0.8;
  if (dipCount > 0) {
    const avgRecovery = totalRecovery / dipCount;
    sr = 1 - clamp(avgRecovery / 7, 0, 1);
  }

  // ─── Weighted Score ───────────────────────────────────
  const weighted =
    0.2 * dd + 0.2 * rs + 0.15 * ep + 0.2 * bb + 0.1 * tm + 0.15 * sr;
  const score = Math.round(1000 * weighted);

  // ─── Flags ────────────────────────────────────────────
  const flags: string[] = [];
  if (submission_rate < 0.5) flags.push("R1 Low reliability");
  if (hasExpenses) {
    const last7Entries = last14.filter(
      (e) => (now.getTime() - new Date(e.date).getTime()) <= 7 * msPerDay
    );
    const deficitDays = last7Entries.filter(
      (e) => e.revenueCents - e.expenseCents < 0
    ).length;
    if (deficitDays >= 4) flags.push("R2 Sustained deficit");
  }
  if (cv > 0.9) flags.push("R3 High volatility");
  if (hasBuffer && buffer_days < 2) flags.push("R4 Low buffer");
  if (prev7.length > 0 && delta < -0.15) flags.push("R5 Declining revenue");

  // ─── Confidence ───────────────────────────────────────
  const data_days = uniqueDays.size;
  let conf = 0.5 + 0.03 * data_days + (hasExpenses ? 0.1 : 0) + (hasBuffer ? 0.1 : 0);
  conf = clamp(conf, 0, 1);
  const confidence = Math.round(conf * 100);

  // ─── Band ─────────────────────────────────────────────
  let band: ScoreResult["band"] = "D";
  if (score >= 720 && flags.length <= 1 && conf >= 0.7) band = "A";
  else if (score >= 620 && score <= 719 && flags.length <= 2 && conf >= 0.65) band = "B";
  else if ((score >= 520 && score <= 619) || (flags.length === 3 && conf >= 0.6)) band = "C";

  return {
    score,
    confidence,
    band,
    flags,
    featureBreakdown: { dd, rs, ep, bb, tm, sr },
  };
}

export function generateExplanations(
  breakdown: FeatureBreakdown,
  flags: string[],
  audience: "entrepreneur" | "lender"
): { reasons: string[]; tips: string[] } {
  const reasons: string[] = [];
  const tips: string[] = [];

  if (audience === "entrepreneur") {
    if (breakdown.dd >= 0.7) reasons.push("You've been consistent with your daily submissions - great job!");
    else reasons.push("Your submission rate has room to improve; try logging every day.");

    if (breakdown.rs >= 0.7) reasons.push("Your revenue is quite stable, which is a strong sign.");
    else reasons.push("Your daily revenue varies a lot. Consistency helps your score.");

    if (breakdown.bb >= 0.7) reasons.push("You have a healthy cash buffer relative to your expenses.");
    else if (breakdown.bb < 0.4) reasons.push("Your cash reserves are low relative to daily spending.");

    if (flags.includes("R5 Declining revenue")) reasons.push("Your revenue has been trending downward recently.");

    tips.push("Submit your revenue and expenses every day - even R0 days count!");
    if (breakdown.bb < 0.5) tips.push("Try to keep at least 3 days of expenses in reserve.");
  } else {
    if (breakdown.dd >= 0.7) reasons.push("High data discipline: consistent daily reporting across 14-day window.");
    else reasons.push("Below-average submission rate reduces data reliability.");

    if (breakdown.rs >= 0.7) reasons.push("Low revenue coefficient of variation indicates stable income.");
    else reasons.push("Elevated revenue volatility (CV > 0.5) increases risk profile.");

    if (breakdown.ep >= 0.6) reasons.push("Healthy operating margin based on reported expenses.");
    else if (breakdown.ep < 0.4) reasons.push("Tight or negative operating margin from expense pressure.");

    if (breakdown.tm >= 0.6) reasons.push("Positive week-over-week revenue momentum.");
    else if (breakdown.tm < 0.4) reasons.push("Negative trend momentum over the last 14 days.");

    if (flags.length === 0) reasons.push("No active risk flags detected.");

    tips.push("Daily submissions may improve data confidence levels.");
    tips.push("Cash buffer verification via CashEstimate would increase confidence score.");
  }

  return { reasons: reasons.slice(0, 5), tips: tips.slice(0, 2) };
}
