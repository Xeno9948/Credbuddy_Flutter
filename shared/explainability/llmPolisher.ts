import type { ExplainableBreakdown } from "./buildExplainableBreakdown";
import { POLISHER_SYSTEM_PROMPT } from "../llm/systemPrompts";
import { sanitizeLLMOutput, ensureDisclaimer } from "../llm/sanitizeOutput";

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
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { polished: false, entrepreneurText, lenderText };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: POLISHER_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Improve the wording of these two credit risk insight texts. Return them as JSON with keys "entrepreneur" and "analyst". Do not change any facts or numbers. Use only neutral, descriptive language.\n\nEntrepreneur text:\n${entrepreneurText}\n\nAnalyst text:\n${lenderText}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      return { polished: false, entrepreneurText, lenderText };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { polished: false, entrepreneurText, lenderText };
    }

    const parsed = JSON.parse(content);

    const rawEntrepreneur = parsed.entrepreneur ?? entrepreneurText;
    const rawLender = parsed.analyst ?? parsed.lender ?? lenderText;

    const sanitizedEntrepreneur = sanitizeLLMOutput(rawEntrepreneur, entrepreneurText);
    const sanitizedLender = sanitizeLLMOutput(rawLender, lenderText);

    return {
      polished: true,
      entrepreneurText: ensureDisclaimer(sanitizedEntrepreneur.text),
      lenderText: ensureDisclaimer(sanitizedLender.text),
    };
  } catch {
    return { polished: false, entrepreneurText, lenderText };
  }
}
