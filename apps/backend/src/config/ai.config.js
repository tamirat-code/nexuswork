
const DEFAULT_MODEL_BY_PROVIDER = {
  anthropic: "claude-sonnet-4-6",
  groq: "llama-3.3-70b-versatile",
};

const provider = process.env.AI_PROVIDER || "anthropic";

export const aiConfig = {
  provider,
  apiKey: process.env.AI_API_KEY,
  model: process.env.AI_MODEL || DEFAULT_MODEL_BY_PROVIDER[provider] || "claude-sonnet-4-6",
};