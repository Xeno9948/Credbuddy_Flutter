import type { Sentiment } from "./featureLabels";

export function classifyFeature(value: number): Sentiment {
  if (value >= 0.7) return "positive";
  if (value >= 0.4) return "neutral";
  return "negative";
}
