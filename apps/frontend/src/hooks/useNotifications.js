import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { listMyNotifications } from "../services/api/notifications.api.js";
import { useAuth } from "./useAuth.js";
import { useNotificationSocket } from "../app/providers/SocketProvider.jsx";

export function useNotifications() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const notificationSocket = useNotificationSocket();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listMyNotifications(token),
    enabled: !!token,
  });

    useEffect(() => {
    const socket = notificationSocket;

    if (!socket) return undefined;
    
    const handleNewNotification = (notification) => {
      console.log(
        "[notifications] new notification:",
        notification
      );

      queryClient.setQueryData(
        ["notifications"],
        (current) => {
          if (!current) {
            return {
              success: true,
              data: {
                notifications: [notification],
                unread_count: 1,
              },
            };
          }

          const currentData = current.data || {};

          const currentNotifications =
            Array.isArray(currentData.notifications)
              ? currentData.notifications
              : [];

          const alreadyExists = currentNotifications.some(
            (item) =>
              String(item._id) === String(notification._id)
          );

          if (alreadyExists) {
            return current;
          }

          return {
            ...current,
            data: {
              ...currentData,
              notifications: [
                notification,
                ...currentNotifications,
              ],
              unread_count:
                Number(currentData.unread_count || 0) + 1,
            },
          };
        }
      );

      toast(notification.title, {
        description:
          notification.message || notification.body || "",
      });
    };

    socket.on(
      "notification:new",
      handleNewNotification
    );

    return () => {
      socket.off(
        "notification:new",
        handleNewNotification
      );
    };
  }, [notificationSocket, queryClient]);

  const response = query.data;

  const notifications = Array.isArray(
    response?.data?.notifications
  )
    ? response.data.notifications
    : [];

  const unreadCount = Number(
    response?.data?.unread_count ||
      notifications.filter((n) => !n.read && !n.read_at).length
  );

  return {
    ...query,
    notifications,
    unreadCount,
  };
}