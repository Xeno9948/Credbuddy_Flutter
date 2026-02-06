export const PRODUCT_NAME = "CredBuddy";

export const SHORT_DISCLAIMER = "Decision-support only. Final decisions remain with you.";

export const FULL_DISCLAIMER = `${PRODUCT_NAME} provides data-driven credit risk insights for informational purposes only. ${PRODUCT_NAME} does not provide financial advice, credit decisions, or recommendations. The final decision remains entirely with the user or authorized partner.`;

export const PDF_DISCLAIMER = `${PRODUCT_NAME} provides data-driven credit risk insights for informational purposes only. ${PRODUCT_NAME} does not provide financial advice, credit decisions, or recommendations. The final decision remains entirely with the user or authorized partner. Score v1 is experimental and based on self-reported cashflow data.`;

export const WHATSAPP_DISCLAIMER = `_${SHORT_DISCLAIMER}_`;

export const BAND_DESCRIPTORS: Record<string, string> = {
  A: "Lower observed risk indicators",
  B: "Moderate observed risk indicators",
  C: "Elevated observed risk indicators",
  D: "Higher observed risk indicators",
};

export const BAND_LABELS: Record<string, string> = {
  A: "A — Lower Risk",
  B: "B — Moderate",
  C: "C — Elevated",
  D: "D — Higher Risk",
};

export const POSITIONING = {
  tagline: "Data-driven credit risk insights",
  whatWeDo: "We provide descriptive risk indicators, scores, confidence levels, and data coverage based on observed cashflow data.",
  whatWeDoNot: [
    "We do NOT provide financial advice",
    "We do NOT approve or decline applications",
    "We do NOT recommend actions",
    "We do NOT make credit decisions",
  ],
};
