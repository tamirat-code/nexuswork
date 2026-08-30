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
  return io(`${SOCKET_URL}/meetings`, {
    auth: token ? { token } : undefined,
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });
}
