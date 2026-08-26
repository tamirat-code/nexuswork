
const DEFAULT_MODEL_BY_PROVIDER = {
  anthropic: "claude-sonnet-4-6",
  groq: "llama-3.3-70b-versatile",
};

import { env } from "./env.js";

const provider = env.aiProvider;

export const aiConfig = {
  provider,
  apiKey: env.aiApiKey,
  model: env.aiModel || DEFAULT_MODEL_BY_PROVIDER[provider] || "claude-sonnet-4-6",
};
