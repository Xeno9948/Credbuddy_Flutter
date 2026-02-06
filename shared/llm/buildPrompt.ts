import { FAIS_SAFE_SYSTEM_PROMPT, POLISHER_SYSTEM_PROMPT, SCENARIO_SYSTEM_PROMPT } from "./systemPrompts";

export type PromptPurpose = "polisher" | "scenario" | "general";

export interface BuiltPrompt {
  system: string;
  user: string;
}

export function buildPrompt(
  purpose: PromptPurpose,
  userContent: string
): BuiltPrompt {
  let system: string;

  switch (purpose) {
    case "polisher":
      system = POLISHER_SYSTEM_PROMPT;
      break;
    case "scenario":
      system = SCENARIO_SYSTEM_PROMPT;
      break;
    case "general":
    default:
      system = FAIS_SAFE_SYSTEM_PROMPT;
      break;
  }

  return { system, user: userContent };
}
