import { env } from "./env.js";

export const socketConfig = {
  path: "/socket.io",
  maxHttpBufferSize: 256 * 1024,
  cors: { origin: env.clientUrl || "*" },
};
