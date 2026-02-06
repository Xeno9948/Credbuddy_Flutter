import { classifyFeature } from "./bucket";
import {
  FEATURE_LABELS,
  FEATURE_LABELS_EN,
  IMPROVEMENT_TIPS,
  IMPROVEMENT_TIPS_EN,
  type FeatureKey,
  type Sentiment,
} from "./featureLabels";

export interface ExplainableInput {
  score: number;
  band: string;
  confidence: number;
  features: {
    data_discipline: number;
    revenue_stability: number;
    expense_pressure: number;
    buffer_behavior: number;
    trend_momentum: number;
    shock_recovery: number;
  };
  flags: string[];
  context: {
    lookback_days: number;
    business_type: string;
  };
}

export interface ExplainableBreakdown {
  summary: {
    headline: string;
    score_line: string;
    confidence_line: string;
  };
  drivers: {
    positive: string[];
    negative: string[];
  };
  improvements: string[];
  disclaimer: string;
  raw: {
    classified: Record<FeatureKey, Sentiment>;
    score: number;
    band: string;
    confidence: number;
    flags: string[];
    lookback_days: number;
    business_type: string;
  };
}

const FEATURE_KEYS: FeatureKey[] = [
  "data_discipline",
  "revenue_stability",
  "expense_pressure",
  "buffer_behavior",
  "trend_momentum",
  "shock_recovery",
];

const BAND_HEADLINES: Record<string, string> = {
  A: "Lower observed risk indicators",
  B: "Moderate observed risk indicators",
  C: "Elevated observed risk indicators",
  D: "Higher observed risk indicators",
};

export function buildExplainableBreakdown(
  input: ExplainableInput,
  language: "nl" | "en" = "nl"
): ExplainableBreakdown {
  const labels = language === "nl" ? FEATURE_LABELS : FEATURE_LABELS_EN;
  const tips = language === "nl" ? IMPROVEMENT_TIPS : IMPROVEMENT_TIPS_EN;

  const classified: Record<string, Sentiment> = {} as Record<FeatureKey, Sentiment>;
  const positiveDrivers: string[] = [];
  const negativeDrivers: string[] = [];
  const negativeFeatureKeys: FeatureKey[] = [];

  for (const key of FEATURE_KEYS) {
    const value = input.features[key];
    const sentiment = classifyFeature(value);
    classified[key] = sentiment;

    const text = labels[key][sentiment];

    if (sentiment === "positive") {
      positiveDrivers.push(text);
    } else if (sentiment === "negative") {
      negativeDrivers.push(text);
      negativeFeatureKeys.push(key);
    }
  }

  const neutralAsNegative: FeatureKey[] = [];
  if (negativeDrivers.length < 2) {
    for (const key of FEATURE_KEYS) {
      if (classified[key] === "neutral" && negativeDrivers.length + neutralAsNegative.length < 2) {
        negativeDrivers.push(labels[key].neutral);
        neutralAsNegative.push(key);
      }
    }
  }

  const improvements: string[] = [];
  const improvementSources = [...negativeFeatureKeys, ...neutralAsNegative];
  for (const key of improvementSources) {
    if (improvements.length >= 2) break;
    const featureTips = tips[key];
    if (featureTips.length > 0) {
      improvements.push(featureTips[0]);
    }
  }
  if (improvements.length < 2) {
    for (const key of improvementSources) {
      if (improvements.length >= 2) break;
      const featureTips = tips[key];
      if (featureTips.length > 1 && !improvements.includes(featureTips[1])) {
        improvements.push(featureTips[1]);
      }
    }
  }

  const lookbackText =
    language === "nl"
      ? `Gebaseerd op de laatste ${input.context.lookback_days} dagen`
      : `Based on the last ${input.context.lookback_days} days`;

  const confidencePct = Math.round(input.confidence * 100);

  const headline = BAND_HEADLINES[input.band] ?? BAND_HEADLINES["D"];

  const disclaimer =
    language === "nl"
      ? "Deze uitleg is alleen ter informatie en vormt geen financieel advies. Score v1 is experimenteel en gebaseerd op zelf-gerapporteerde cashflowdata."
      : "CredBuddy provides data-driven credit risk insights for informational purposes only. CredBuddy does not provide financial advice, credit decisions, or recommendations. The final decision remains entirely with the user or authorized partner. Score v1 is experimental and based on self-reported cashflow data.";

  return {
    summary: {
      headline,
      score_line: `Score: ${input.score}/1000 (Band ${input.band}). ${lookbackText}.`,
      confidence_line:
        language === "nl"
          ? `Betrouwbaarheid: ${confidencePct}%`
          : `Data confidence: ${confidencePct}%`,
    },
    drivers: {
      positive: positiveDrivers.slice(0, 3),
      negative: negativeDrivers.slice(0, 2),
    },
    improvements: improvements.slice(0, 2),
    disclaimer,
    raw: {
      classified: classified as Record<FeatureKey, Sentiment>,
      score: input.score,
      band: input.band,
      confidence: input.confidence,
      flags: input.flags,
      lookback_days: input.context.lookback_days,
      business_type: input.context.business_type,
    },
  };
}
