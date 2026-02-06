export type FeatureKey =
  | "data_discipline"
  | "revenue_stability"
  | "expense_pressure"
  | "buffer_behavior"
  | "trend_momentum"
  | "shock_recovery";

export type Sentiment = "positive" | "neutral" | "negative";

export interface FeatureLabelSet {
  positive: string;
  neutral: string;
  negative: string;
}

export const FEATURE_LABELS: Record<FeatureKey, FeatureLabelSet> = {
  data_discipline: {
    positive: "Je vult je cijfers bijna elke dag in",
    neutral: "Je vult je cijfers onregelmatig in",
    negative: "Je vult je cijfers te weinig in",
  },
  revenue_stability: {
    positive: "Je omzet is stabiel",
    neutral: "Je omzet schommelt",
    negative: "Je omzet wisselt sterk per dag",
  },
  expense_pressure: {
    positive: "Je uitgaven zijn goed in verhouding tot je omzet",
    neutral: "Je uitgaven drukken soms op je cashflow",
    negative: "Je uitgaven zijn vaak te hoog",
  },
  buffer_behavior: {
    positive: "Je hebt een goede financiële buffer",
    neutral: "Je buffer is beperkt",
    negative: "Je buffer is erg klein",
  },
  trend_momentum: {
    positive: "Je omzettrend is stijgend",
    neutral: "Je omzet blijft ongeveer gelijk",
    negative: "Je omzettrend is dalend",
  },
  shock_recovery: {
    positive: "Je herstelt snel na mindere dagen",
    neutral: "Je herstel na dips is gemiddeld",
    negative: "Het duurt lang voordat je herstelt na een dip",
  },
};

export const FEATURE_LABELS_EN: Record<FeatureKey, FeatureLabelSet> = {
  data_discipline: {
    positive: "Consistent daily data submission",
    neutral: "Irregular data submission pattern",
    negative: "Insufficient data submission frequency",
  },
  revenue_stability: {
    positive: "Revenue stream is stable",
    neutral: "Revenue shows moderate variability",
    negative: "Revenue exhibits high day-to-day volatility",
  },
  expense_pressure: {
    positive: "Expenses are well-proportioned relative to revenue",
    neutral: "Expenses occasionally pressure cashflow",
    negative: "Expenses frequently exceed sustainable levels",
  },
  buffer_behavior: {
    positive: "Adequate financial buffer maintained",
    neutral: "Limited cash reserves available",
    negative: "Critically low cash buffer",
  },
  trend_momentum: {
    positive: "Revenue trend is upward",
    neutral: "Revenue trend is flat",
    negative: "Revenue trend is declining",
  },
  shock_recovery: {
    positive: "Quick recovery after revenue dips",
    neutral: "Average recovery time after setbacks",
    negative: "Slow recovery following revenue disruptions",
  },
};

export const IMPROVEMENT_TIPS: Record<FeatureKey, string[]> = {
  data_discipline: [
    "Probeer elke dag je omzet in te voeren, ook als het R0 is",
    "Stel een dagelijkse herinnering in om je cijfers bij te werken",
  ],
  revenue_stability: [
    "Probeer je inkomstenbronnen te diversifiëren",
    "Analyseer welke dagen het beste presteren en waarom",
  ],
  expense_pressure: [
    "Bekijk je grootste uitgavenposten en kijk waar je kunt besparen",
    "Probeer je uitgaven op minder dan 70% van je omzet te houden",
  ],
  buffer_behavior: [
    "Probeer minimaal 3 dagen aan uitgaven als buffer aan te houden",
    "Leg elke week een klein bedrag opzij als noodreserve",
  ],
  trend_momentum: [
    "Focus op activiteiten die vorige week goed werkten",
    "Probeer je omzet week-over-week te verhogen met kleine stappen",
  ],
  shock_recovery: [
    "Maak een noodplan voor dagen met lage omzet",
    "Bouw relaties op met klanten voor meer voorspelbare inkomsten",
  ],
};

export const IMPROVEMENT_TIPS_EN: Record<FeatureKey, string[]> = {
  data_discipline: [
    "Submit daily entries consistently, even on zero-revenue days",
    "Set a daily reminder to log financial data",
  ],
  revenue_stability: [
    "Diversify revenue sources to reduce volatility",
    "Identify peak days and replicate successful patterns",
  ],
  expense_pressure: [
    "Review largest expense categories for reduction opportunities",
    "Target expense-to-revenue ratio below 70%",
  ],
  buffer_behavior: [
    "Maintain at least 3 days of expenses as cash reserves",
    "Set aside a small amount weekly as emergency buffer",
  ],
  trend_momentum: [
    "Double down on activities that drove recent revenue growth",
    "Set incremental weekly revenue targets",
  ],
  shock_recovery: [
    "Develop a contingency plan for low-revenue periods",
    "Build recurring customer relationships for income stability",
  ],
};
