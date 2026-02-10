import type { ExplainableBreakdown } from "./buildExplainableBreakdown";
import { POLISHER_SYSTEM_PROMPT } from "../llm/systemPrompts";
import { sanitizeLLMOutput, ensureDisclaimer } from "../llm/sanitizeOutput";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface PolishedResult {
  polished: boolean;
  entrepreneurText: string;
  lenderText: string;
}

export async function polishWithLLM(
  breakdown: ExplainableBreakdown,
  entrepreneurText: string,
  lenderText: string
): Promise<PolishedResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { polished: false, entrepreneurText, lenderText };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      },
    });

    const prompt = `${POLISHER_SYSTEM_PROMPT}

Improve the wording of these two credit risk insight texts. Return them as JSON with keys "entrepreneur" and "analyst". Do not change any facts or numbers. Use only neutral, descriptive language.

Entrepreneur text:
${entrepreneurText}

Analyst text:
${lenderText}`;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    if (!content) {
      return { polished: false, entrepreneurText, lenderText };
    }

    // Clean JSON from markdown code blocks if present
    const cleanedContent = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanedContent);

    const rawEntrepreneur = parsed.entrepreneur ?? entrepreneurText;
    const rawLender = parsed.analyst ?? parsed.lender ?? lenderText;

    const sanitizedEntrepreneur = sanitizeLLMOutput(rawEntrepreneur, entrepreneurText);
    const sanitizedLender = sanitizeLLMOutput(rawLender, lenderText);

    return {
      polished: true,
      entrepreneurText: ensureDisclaimer(sanitizedEntrepreneur.text),
      lenderText: ensureDisclaimer(sanitizedLender.text),
    };
  } catch (err) {
    console.error("[LLM Polisher] Gemini error:", err);
    return { polished: false, entrepreneurText, lenderText };
  }
}
