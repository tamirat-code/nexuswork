import { env } from "./env.js";

export const corsConfig = {
  origin: env.clientUrl || "*",
  credentials: true,
};
