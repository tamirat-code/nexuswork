import mongoose from "mongoose";

export function getHealth() {
  return {
    status: "ok",
    uptime_seconds: process.uptime(),
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  };
}
