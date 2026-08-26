import { env } from "./env.js";

export const authConfig = {
  jwtSecret: env.jwtSecret,
  jwtExpiresIn: env.jwtExpiresIn,
  bcryptSaltRounds: 10,
};
