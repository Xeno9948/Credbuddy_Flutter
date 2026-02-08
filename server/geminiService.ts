import { GoogleGenerativeAI } from "@google/generative-ai";
import { FAIS_SAFE_SYSTEM_PROMPT } from "@shared/llm/systemPrompts";
import { sanitizeLLMOutput, ensureDisclaimer } from "@shared/llm/sanitizeOutput";
import { SHORT_DISCLAIMER } from "@shared/constants";
import type { ScoreSnapshot, DailyEntry } from "@shared/schema";

// ─── Types ──────────────────────────────────────────────────────────

export interface ExplainScoreInput {
  score: number;
  band: string;
  features: Record<string, number>;
  flags: string[];
  businessType: string;
}

export interface ChatInput {
  userMessage: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  context: {
    score?: ScoreSnapshot | null;
    entries: DailyEntry[];
  };
}

export interface InsightsInput {
  score: ScoreSnapshot;
  entries: DailyEntry[];
  scoreHistory: ScoreSnapshot[];
}

export interface AiInsights {
  trendObservation: string;
  strengthIndicators: string[];
  improvementOpportunities: string[];
  disclaimer: string;
}

export interface ParsedEntry {
  revenueCents: number;
  expenseCents: number;
  confidence: "high" | "medium" | "low";
  expenseNote: string | null;
}

// ─── Initialize Gemini ──────────────────────────────────────────────

if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️  WARNING: GEMINI_API_KEY is not set. AI features will return fallback responses.");
  console.warn("   Get your API key from: https://aistudio.google.com/apikey");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Use Gemini 1.5 Flash for speed + cost efficiency
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 1000,
  },
});

// ─── Gemini Service ─────────────────────────────────────────────────

export const geminiService = {
  /**
   * Feature 1: Explain Score (replaces OpenAI polisher)
   * Generates a polished, FAIS-safe explanation of the credit score
   */
  async explainScore(input: ExplainScoreInput): Promise<string> {
    const prompt = `${FAIS_SAFE_SYSTEM_PROMPT}

You are explaining a credit score assessment. Provide a clear, informative explanation for the entrepreneur.

Score: ${input.score}/1000 (Band ${input.band})
Features: ${JSON.stringify(input.features)}
Risk Flags: ${JSON.stringify(input.flags)}
Business Type: ${input.businessType}

Generate a 3-4 sentence explanation that:
1. Highlights the main positive factors
2. Notes areas for improvement (if any)
3. Uses only neutral, descriptive language
4. Avoids prohibited terms (approve, recommend, advise, etc.)

Return ONLY the explanation text, no JSON or markdown.`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Apply FAIS guardrails
      const sanitized = sanitizeLLMOutput(text, "");
      return ensureDisclaimer(sanitized.text);
    } catch (err) {
      console.error("[Gemini] explainScore error:", err);
      // Fallback to generic explanation
      return ensureDisclaimer(
        `Your score is ${input.score}/1000 (Band ${input.band}). This reflects the observed patterns in your submitted data.`
      );
    }
  },

  /**
   * Feature 2: Natural Language Chat
   * Conversational AI assistant for answering questions about credit data
   */
  async chat(input: ChatInput): Promise<string> {
    const contextSummary = input.context.score
      ? `Current Score: ${input.context.score.score}/1000, Band ${input.context.score.band}.`
      : "No score available yet.";
    const entriesCount = input.context.entries.length;

    const systemInstruction = `${FAIS_SAFE_SYSTEM_PROMPT}

You are CredBuddy's AI assistant. Help entrepreneurs understand their credit data. ${contextSummary} Recent entries: ${entriesCount} days.

RULES:
- Answer questions about scores, entries, and credit metrics
- Never provide financial advice or recommendations
- Use data-driven, neutral language
- If asked about actions (loans, credit), say: "I provide insights only. Final decisions are yours."
- Be concise and helpful
- Always maintain FAIS-safe language`;

    try {
      const chatHistory = input.conversationHistory.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({
        history: chatHistory,
        systemInstruction,
      });

      const result = await chat.sendMessage(input.userMessage);
      const text = result.response.text();

      const sanitized = sanitizeLLMOutput(text, "");
      return ensureDisclaimer(sanitized.text);
    } catch (err) {
      console.error("[Gemini] chat error:", err);
      return ensureDisclaimer(
        "I'm having trouble processing your request right now. Please try again in a moment."
      );
    }
  },

  /**
   * Feature 3: AI Insights & Recommendations
   * Generates financial insights based on score trends and entry patterns
   */
  async generateInsights(input: InsightsInput): Promise<AiInsights> {
    const scoreChange =
      input.scoreHistory.length > 1
        ? input.scoreHistory[0].score - input.scoreHistory[input.scoreHistory.length - 1].score
        : 0;

    const avgRevenue =
      input.entries.length > 0
        ? input.entries.reduce((a, b) => a + b.revenueCents, 0) / input.entries.length / 100
        : 0;

    const prompt = `${FAIS_SAFE_SYSTEM_PROMPT}

Analyze this business's financial data and provide insights (NOT advice).

Current Score: ${input.score.score}/1000 (Band ${input.score.band})
Score Trend: ${input.scoreHistory.length} historical snapshots, change: ${scoreChange > 0 ? "+" : ""}${scoreChange} points
Recent Entries: ${input.entries.length} days
Average Revenue: R${avgRevenue.toFixed(2)} per day

Generate insights JSON with:
{
  "trendObservation": "1 sentence about score/revenue trend",
  "strengthIndicators": ["2-3 observed strengths"],
  "improvementOpportunities": ["2-3 areas that could be strengthened"],
  "disclaimer": "${SHORT_DISCLAIMER}"
}

Return ONLY valid JSON, no markdown code blocks.`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Parse JSON, fallback to safe defaults
      const cleanedText = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanedText);

      return {
        trendObservation: sanitizeLLMOutput(parsed.trendObservation || "Data analysis in progress.", "").text,
        strengthIndicators: (parsed.strengthIndicators || ["Data submitted"]).map(
          (s: string) => sanitizeLLMOutput(s, "").text
        ),
        improvementOpportunities: (parsed.improvementOpportunities || ["Continue daily submissions"]).map(
          (s: string) => sanitizeLLMOutput(s, "").text
        ),
        disclaimer: SHORT_DISCLAIMER,
      };
    } catch (err) {
      console.error("[Gemini] generateInsights error:", err);
      // Fallback to safe defaults
      return {
        trendObservation: "Insufficient data for detailed trend analysis.",
        strengthIndicators: ["Data submissions recorded"],
        improvementOpportunities: ["Continue submitting daily entries for better insights"],
        disclaimer: SHORT_DISCLAIMER,
      };
    }
  },

  /**
   * Feature 4: Smart Data Entry Parser
   * Parses natural language entry text into structured data
   */
  async parseNaturalLanguageEntry(text: string): Promise<ParsedEntry> {
    const prompt = `Parse this natural language business entry into structured data:

"${text}"

Extract revenue and expenses in cents (multiply Rand amounts by 100). Handle phrases like:
- "made 500 from 3 customers" → revenue: 50000 cents
- "spent 120 on supplies" → expense: 12000 cents
- "earned R250, paid R50 for transport" → revenue: 25000, expense: 5000
- "R350 sales, R80 expenses" → revenue: 35000, expense: 8000

Return JSON:
{
  "revenueCents": number or 0,
  "expenseCents": number or 0,
  "confidence": "high" | "medium" | "low",
  "expenseNote": "optional description or null"
}

Return ONLY valid JSON, no markdown code blocks.`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const cleanedText = responseText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanedText);

      return {
        revenueCents: parsed.revenueCents || 0,
        expenseCents: parsed.expenseCents || 0,
        confidence: parsed.confidence || "low",
        expenseNote: parsed.expenseNote || null,
      };
    } catch (err) {
      console.error("[Gemini] parseNaturalLanguageEntry error:", err);
      // Return low confidence fallback
      return {
        revenueCents: 0,
        expenseCents: 0,
        confidence: "low",
        expenseNote: null,
      };
    }
  },
};
