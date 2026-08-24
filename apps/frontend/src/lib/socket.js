import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5000");

export function createContractSocket(token) {
  return io(`${SOCKET_URL}/contracts`, {
    auth: { token },
    autoConnect: false,
  });
}

export function createNotificationSocket(token) {
  return io(`${SOCKET_URL}/notifications`, {
    auth: { token },
    autoConnect: false,
  });
}