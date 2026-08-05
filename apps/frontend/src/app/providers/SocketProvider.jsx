import { createContext, useContext, useEffect, useRef } from "react";
import { createContractSocket } from "../../lib/socket.js";
import { useAuth } from "./AuthProvider.jsx";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    const socket = createContractSocket(token);
    socket.connect();
    socketRef.current = socket;
    return () => socket.disconnect();
  }, [token]);

  return <SocketContext.Provider value={socketRef}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
