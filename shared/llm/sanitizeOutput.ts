import { containsProhibitedTerms, NEUTRAL_REPLACEMENTS } from "./prohibitedTerms";
import { SHORT_DISCLAIMER } from "../constants";

export interface SanitizeResult {
  text: string;
  wasModified: boolean;
  termsFound: string[];
  usedFallback: boolean;
}

export function sanitizeLLMOutput(
  llmOutput: string,
  fallbackText: string
): SanitizeResult {
  const termsFound = containsProhibitedTerms(llmOutput);

  if (termsFound.length === 0) {
    return {
      text: llmOutput,
      wasModified: false,
      termsFound: [],
      usedFallback: false,
    };
  }

  let sanitized = llmOutput;
  for (const term of termsFound) {
    const replacement = NEUTRAL_REPLACEMENTS[term.toLowerCase()];
    if (replacement) {
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "gi");
      sanitized = sanitized.replace(regex, replacement);
    }
  }

  const remainingTerms = containsProhibitedTerms(sanitized);
  if (remainingTerms.length > 0) {
    return {
      text: fallbackText,
      wasModified: true,
      termsFound,
      usedFallback: true,
    };
  }

  return {
    text: sanitized,
    wasModified: true,
    termsFound,
    usedFallback: false,
  };
}

export function ensureDisclaimer(text: string): string {
  if (!text.includes(SHORT_DISCLAIMER)) {
    return `${text}\n\n${SHORT_DISCLAIMER}`;
  }
  return text;
}
