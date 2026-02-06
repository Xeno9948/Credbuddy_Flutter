import type { ExplainableBreakdown } from "./buildExplainableBreakdown";

export interface LenderExplanation {
  headline: string;
  scoreLine: string;
  confidenceLine: string;
  positiveDrivers: string[];
  negativeDrivers: string[];
  flags: string[];
  improvements: string[];
  disclaimer: string;
}

export function renderForLender(breakdown: ExplainableBreakdown): LenderExplanation {
  return {
    headline: breakdown.summary.headline,
    scoreLine: breakdown.summary.score_line,
    confidenceLine: breakdown.summary.confidence_line,
    positiveDrivers: breakdown.drivers.positive,
    negativeDrivers: breakdown.drivers.negative,
    flags: breakdown.raw.flags,
    improvements: breakdown.improvements,
    disclaimer: breakdown.disclaimer,
  };
}

export function renderForLenderText(breakdown: ExplainableBreakdown): string {
  const lines: string[] = [];

  lines.push(`CREDIT ASSESSMENT — ${breakdown.summary.headline.toUpperCase()}`);
  lines.push("");
  lines.push(breakdown.summary.score_line);
  lines.push(breakdown.summary.confidence_line);

  if (breakdown.drivers.positive.length > 0) {
    lines.push("");
    lines.push("Positive Indicators:");
    for (const driver of breakdown.drivers.positive) {
      lines.push(`  + ${driver}`);
    }
  }

  if (breakdown.drivers.negative.length > 0) {
    lines.push("");
    lines.push("Risk Indicators:");
    for (const driver of breakdown.drivers.negative) {
      lines.push(`  - ${driver}`);
    }
  }

  if (breakdown.raw.flags.length > 0) {
    lines.push("");
    lines.push("Active Risk Flags:");
    for (const flag of breakdown.raw.flags) {
      lines.push(`  ! ${flag}`);
    }
  }

  if (breakdown.improvements.length > 0) {
    lines.push("");
    lines.push("Observed Data Insights:");
    for (const tip of breakdown.improvements) {
      lines.push(`  > ${tip}`);
    }
  }

  lines.push("");
  lines.push(`DISCLAIMER: ${breakdown.disclaimer}`);

  return lines.join("\n");
}
