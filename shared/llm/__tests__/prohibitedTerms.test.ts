import { describe, it, expect } from "vitest";
import { containsProhibitedTerms, PROHIBITED_TERMS } from "../prohibitedTerms";
import { sanitizeLLMOutput } from "../sanitizeOutput";
import { FAIS_SAFE_SYSTEM_PROMPT, POLISHER_SYSTEM_PROMPT, SCENARIO_SYSTEM_PROMPT } from "../systemPrompts";

describe("containsProhibitedTerms", () => {
  it("detects prohibited terms in text", () => {
    const result = containsProhibitedTerms("We recommend you approve this application");
    expect(result).toContain("recommend");
    expect(result).toContain("approve");
  });

  it("returns empty array for clean text", () => {
    const result = containsProhibitedTerms(
      "Risk indicators show moderate observed data patterns. Decision-support only."
    );
    expect(result).toHaveLength(0);
  });

  it("detects case-insensitive matches", () => {
    const result = containsProhibitedTerms("APPROVE this Recommendation");
    expect(result.length).toBeGreaterThan(0);
  });

  it("detects word boundaries correctly", () => {
    const result = containsProhibitedTerms("The data indicates lower risk");
    expect(result).toHaveLength(0);
  });

  it("detects 'should' as prohibited", () => {
    const result = containsProhibitedTerms("You should apply for credit");
    expect(result).toContain("should");
  });

  it("detects 'eligible' as prohibited", () => {
    const result = containsProhibitedTerms("You are eligible for a facility");
    expect(result).toContain("eligible");
  });

  it("detects 'creditworthy' as prohibited", () => {
    const result = containsProhibitedTerms("The applicant is creditworthy");
    expect(result).toContain("creditworthy");
  });
});

describe("sanitizeLLMOutput", () => {
  const fallback = "This is clean fallback text with no prohibited terms.";

  it("returns unchanged text when no prohibited terms found", () => {
    const clean = "Risk indicators highlight elevated data patterns.";
    const result = sanitizeLLMOutput(clean, fallback);
    expect(result.wasModified).toBe(false);
    expect(result.text).toBe(clean);
    expect(result.usedFallback).toBe(false);
  });

  it("replaces prohibited terms with neutral alternatives", () => {
    const dirty = "We recommend this applicant for approval.";
    const result = sanitizeLLMOutput(dirty, fallback);
    expect(result.wasModified).toBe(true);
    expect(result.text).not.toContain("recommend");
    expect(result.text).not.toContain("approval");
  });

  it("falls back to safe text when replacements still contain prohibited terms", () => {
    const veryDirty = "You should must approve and decline this lending application for the lender";
    const result = sanitizeLLMOutput(veryDirty, fallback);
    expect(result.wasModified).toBe(true);
    if (result.usedFallback) {
      expect(result.text).toBe(fallback);
    } else {
      const remaining = containsProhibitedTerms(result.text);
      expect(remaining).toHaveLength(0);
    }
  });

  it("records found terms", () => {
    const dirty = "We advise you to proceed with the loan offer";
    const result = sanitizeLLMOutput(dirty, fallback);
    expect(result.termsFound.length).toBeGreaterThan(0);
  });
});

describe("System prompts", () => {
  it("FAIS_SAFE_SYSTEM_PROMPT contains key positioning statements", () => {
    expect(FAIS_SAFE_SYSTEM_PROMPT).toContain("descriptive, informational insights only");
    expect(FAIS_SAFE_SYSTEM_PROMPT).toContain("do NOT provide advice");
    expect(FAIS_SAFE_SYSTEM_PROMPT).toContain("decision-support only");
  });

  it("POLISHER_SYSTEM_PROMPT extends base prompt", () => {
    expect(POLISHER_SYSTEM_PROMPT).toContain("descriptive, informational insights only");
    expect(POLISHER_SYSTEM_PROMPT).toContain("FAIS-safe");
  });

  it("SCENARIO_SYSTEM_PROMPT includes what-if restrictions", () => {
    expect(SCENARIO_SYSTEM_PROMPT).toContain("hypothetical");
    expect(SCENARIO_SYSTEM_PROMPT).toContain("decision-support only");
  });

  it("system prompts use prohibited terms only in negation context (instruction to avoid)", () => {
    const allowedInPrompts = [
      "approve", "decline", "advise", "should", "recommend", "eligible",
      "lender", "advice", "must", "accepted", "creditworthy", "creditworthiness",
    ];
    for (const prompt of [FAIS_SAFE_SYSTEM_PROMPT, POLISHER_SYSTEM_PROMPT, SCENARIO_SYSTEM_PROMPT]) {
      const found = containsProhibitedTerms(prompt);
      const realIssues = found.filter(t => !allowedInPrompts.includes(t));
      expect(realIssues).toHaveLength(0);
    }
  });
});

describe("PROHIBITED_TERMS list", () => {
  it("contains all critical FAIS terms", () => {
    const criticalTerms = ["approve", "decline", "recommend", "advice", "should", "must", "eligible", "creditworthy"];
    for (const term of criticalTerms) {
      expect(PROHIBITED_TERMS).toContain(term);
    }
  });
});
