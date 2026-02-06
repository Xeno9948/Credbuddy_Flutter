import type { ExplainableBreakdown } from "./buildExplainableBreakdown";

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
    const systemPrompt = `You are a text editor for a financial inclusion platform. Your ONLY job is to improve the wording and readability of the provided explanations.

STRICT RULES:
- Do NOT calculate anything
- Do NOT give financial advice
- Do NOT promise outcomes
- Do NOT add or remove any facts
- Do NOT change any numbers, scores, or percentages
- Keep the same structure and meaning
- Keep the same language (Dutch for entrepreneur, English for lender)
- Make sentences flow more naturally
- Keep it concise`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Please improve the wording of these two texts. Return them as JSON with keys "entrepreneur" and "lender". Do not change any facts or numbers.\n\nEntrepreneur text (Dutch):\n${entrepreneurText}\n\nLender text (English):\n${lenderText}`,
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

    return {
      polished: true,
      entrepreneurText: parsed.entrepreneur ?? entrepreneurText,
      lenderText: parsed.lender ?? lenderText,
    };
  } catch {
    return { polished: false, entrepreneurText, lenderText };
  }
}
