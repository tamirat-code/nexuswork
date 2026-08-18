import { apiRequest } from "../../lib/http.js";


export const listMyNotifications = (
  token
) =>
  apiRequest(
    "/notifications",
    {
      token,
    }
  );


export const markNotificationRead = (
  id,
  token
) =>
  apiRequest(
    `/notifications/${id}/read`,
    {
      method: "PATCH",
      token,
    }
  );


export const markAllNotificationsRead = (
  token
) =>
  apiRequest(
    "/notifications/read-all",
    {
      method: "PATCH",
      token,
    }
  );