export const socketConfig = {
  path: "/socket.io",
  cors: { origin: process.env.CLIENT_URL || "*" },
};
