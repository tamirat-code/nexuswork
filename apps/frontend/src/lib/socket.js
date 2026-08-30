import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5000");

export function createContractSocket(token) {
  return io(`${SOCKET_URL}/contracts`, {
    withCredentials: true,
    autoConnect: false,
  });
}

export function createNotificationSocket(token) {
  return io(`${SOCKET_URL}/notifications`, {
    withCredentials: true,
    autoConnect: false,
  });
}
export function createMeetingSocket(token) {
  // AuthProvider stores `true` as a session marker because authentication is
  // cookie-based. Only send Socket.IO auth when a real JWT string is present;
  // otherwise socketAuth will authenticate from the HttpOnly cookie.
  const socketAuth = typeof token === "string" && token.trim() ? { token } : undefined;
  return io(`${SOCKET_URL}/meetings`, {
    auth: socketAuth,
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });
}
