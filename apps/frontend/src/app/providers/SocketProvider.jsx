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
import { logger } from "../../lib/logger.js";

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
      logger.info("Contracts socket connected", { socketId: contractSock.id });
    });

    contractSock.on("connect_error", (error) => {
      logger.error("Contracts socket connection failed", error);
    });

    contractSock.connect();
    setContractSocket(contractSock);

    const notificationSock = createNotificationSocket(token);

    notificationSock.on("connect", () => {
      logger.info("Notifications socket connected", { socketId: notificationSock.id });
    });

    notificationSock.on("notification:connected", (payload) => {
      logger.debug("Notification channel ready", payload);
    });

    notificationSock.on("connect_error", (error) => {
      logger.error("Notifications socket connection failed", error);
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
