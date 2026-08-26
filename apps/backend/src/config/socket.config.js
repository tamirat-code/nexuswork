import { env } from "./env.js";

export const socketConfig = {
  path: "/socket.io",
  cors: { origin: env.clientUrl || "*" },
};
