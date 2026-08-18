import Notification from "./notifications.model.js";
import { NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";
import { emitToUser } from "../../websocket/socket.registry.js";

export async function createNotification({
  userId,
  type,
  title,
  body,
  data,
}) {
  if (!userId) throw new ValidationError("userId is required");
  if (!type) throw new ValidationError("Notification type is required");
  if (!title) throw new ValidationError("Notification title is required");

  const notification = await Notification.create({
    user_id: userId,
    type,
    title,
    body: body || "",
    data: data || {},
  });

  // Push the notification to the user's connected browser immediately.
  emitToUser(userId, "notification:new", {
    _id: notification._id,
    user_id: notification.user_id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    message: notification.body,
    data: notification.data,
    read: false,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  });

  return notification;
}

export async function listNotificationsForUser(
  userId,
  { limit = 50, skip = 0, unreadOnly = false } = {}
) {
  const query = { user_id: userId };

  if (unreadOnly) {
    query.read_at = null;
  }

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean(),

    Notification.countDocuments({
      user_id: userId,
      read_at: null,
    }),
  ]);

  return {
    notifications,
    unread_count: unreadCount,
  };
}

export async function markAsRead(userId, notificationId) {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      user_id: userId,
    },
    {
      read_at: new Date(),
    },
    {
      new: true,
    }
  );

  if (!notification) {
    throw new NotFoundError("Notification not found");
  }

  return notification;
}

export async function markAllAsRead(userId) {
  const result = await Notification.updateMany(
    {
      user_id: userId,
      read_at: null,
    },
    {
      read_at: new Date(),
    }
  );

  return {
    modified_count: result.modifiedCount,
  };
}