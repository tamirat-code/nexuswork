import {
  createContext,
  useContext,
  useEffect,
  useRef,
} from "react";

import {
  createContractSocket,
  createNotificationSocket,
} from "../../lib/socket.js";

import { useAuth } from "./AuthProvider.jsx";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();

  const contractSocketRef = useRef(null);
  const notificationSocketRef = useRef(null);

  useEffect(() => {
    if (!token) {
      contractSocketRef.current?.disconnect();
      notificationSocketRef.current?.disconnect();

      contractSocketRef.current = null;
      notificationSocketRef.current = null;

      return;
    }

   
    const contractSocket = createContractSocket(token);

    contractSocket.on("connect", () => {
      console.log("[socket] contracts connected:", contractSocket.id);
    });

    contractSocket.on("connect_error", (error) => {
      console.error(
        "[socket] contracts connection error:",
        error.message
      );
    });

    contractSocket.connect();

    contractSocketRef.current = contractSocket;

   
    const notificationSocket = createNotificationSocket(token);

    notificationSocket.on("connect", () => {
      console.log(
        "[socket] notifications connected:",
        notificationSocket.id
      );
    });

    notificationSocket.on("notification:connected", (payload) => {
      console.log(
        "[socket] notification channel ready:",
        payload
      );
    });

    notificationSocket.on("connect_error", (error) => {
      console.error(
        "[socket] notifications connection error:",
        error.message
      );
    });

    notificationSocket.connect();

    notificationSocketRef.current = notificationSocket;

    return () => {
      contractSocket.disconnect();
      notificationSocket.disconnect();

      contractSocketRef.current = null;
      notificationSocketRef.current = null;
    };
  }, [token]);

  return (
    <SocketContext.Provider
      value={{
        contractSocket: contractSocketRef,
        notificationSocket: notificationSocketRef,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

export function useNotificationSocket() {
  const context = useContext(SocketContext);

  return context?.notificationSocket || null;
}