import type { ExplainableBreakdown } from "./buildExplainableBreakdown";

export function renderForEntrepreneur(breakdown: ExplainableBreakdown): string {
  const lines: string[] = [];

  lines.push(`📊 ${breakdown.summary.headline}`);
  lines.push("");
  lines.push(breakdown.summary.score_line);
  lines.push(breakdown.summary.confidence_line);

  if (breakdown.drivers.positive.length > 0) {
    lines.push("");
    lines.push("Wat gaat goed:");
    for (const driver of breakdown.drivers.positive) {
      lines.push(`• ${driver}`);
    }
  }

  if (breakdown.drivers.negative.length > 0) {
    lines.push("");
    lines.push("Aandachtspunten:");
    for (const driver of breakdown.drivers.negative) {
      lines.push(`• ${driver}`);
    }
  }

  if (breakdown.improvements.length > 0) {
    lines.push("");
    lines.push("💡 Tips:");
    for (const tip of breakdown.improvements) {
      lines.push(`• ${tip}`);
    }
  }

  lines.push("");
  lines.push(breakdown.disclaimer);

  return lines.join("\n");
}
