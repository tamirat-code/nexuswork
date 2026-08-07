/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const NotificationContext = createContext(null);

const SEED = [
  { id: 1, message: "Milestone 2 funded — $450 held in escrow", type: "success", time: "2h ago", read: false },
  { id: 2, message: "New proposal on 'Event Web App'", type: "info", time: "5h ago", read: false },
  { id: 3, message: "University verified your enrollment", type: "success", time: "1d ago", read: true },
];

export function NotificationProvider({ children }) {
  const [items, setItems] = useState(SEED);
  const [toasts, setToasts] = useState([]);

  const notify = (message, type = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setItems((i) => [{ id, message, type, time: "just now", read: false }, ...i]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  const markRead = (id) => setItems((i) => i.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () => setItems((i) => i.map((n) => ({ ...n, read: true })));
  const unread = items.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ items, toasts, notify, markRead, markAllRead, unread }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}