// AI recommendation module config (Section 4.15). The recommendation module
// runs inside this Node backend rather than a separate service.
export const aiConfig = {
  provider: process.env.AI_PROVIDER || "anthropic", // "anthropic" | "openai" | "none"
  apiKey: process.env.AI_API_KEY,
  model: process.env.AI_MODEL || "claude-sonnet-4-6",
};
