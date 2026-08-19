import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  createContractSocket,
  createNotificationSocket,
} from "../../lib/socket.js";

import { useAuth } from "./AuthProvider.jsx";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();

  
  const [contractSocket, setContractSocket] = useState(null);
  const [notificationSocket, setNotificationSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      setContractSocket(null);
      setNotificationSocket(null);
      return undefined;
    }

    const contractSock = createContractSocket(token);

    contractSock.on("connect", () => {
      console.log("[socket] contracts connected:", contractSock.id);
    });

    contractSock.on("connect_error", (error) => {
      console.error("[socket] contracts connection error:", error.message);
    });

    contractSock.connect();
    setContractSocket(contractSock);

    const notificationSock = createNotificationSocket(token);

    notificationSock.on("connect", () => {
      console.log("[socket] notifications connected:", notificationSock.id);
    });

    notificationSock.on("notification:connected", (payload) => {
      console.log("[socket] notification channel ready:", payload);
    });

    notificationSock.on("connect_error", (error) => {
      console.error("[socket] notifications connection error:", error.message);
    });

    notificationSock.connect();
    setNotificationSocket(notificationSock);

    return () => {
      contractSock.disconnect();
      notificationSock.disconnect();

      setContractSocket(null);
      setNotificationSocket(null);
    };
  }, [token]);

  return (
    <SocketContext.Provider
      value={{
        contractSocket,
        notificationSocket,
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