import {
  asyncHandler,
} from "../../shared/utils/asyncHandler.js";

import {
  listNotificationsForUser,
  markAsRead,
  markAllAsRead,
} from "./notifications.service.js";


export const getNotifications =
  asyncHandler(async (req, res) => {

    const result =
      await listNotificationsForUser(
        req.user._id,
        {
          limit:
            req.query.limit,

          skip:
            req.query.skip,

          unreadOnly:
            req.query.unread ===
            "true",
        }
      );


    const notifications =
      result.notifications.map(
        (notification) => ({

          ...notification,

          read:
            Boolean(
              notification.read_at
            ),

          message:
            notification.body,

          data:
            notification.data ||
            {},

        })
      );


    res.json({

      success:
        true,

      data: {

        ...result,

        notifications,

      },

    });

  });


export const readNotification =
  asyncHandler(async (req, res) => {

    const notification =
      await markAsRead(
        req.user._id,
        req.params.id
      );


    res.json({

      success:
        true,

      data:
        notification,

    });

  });


export const readAll =
  asyncHandler(async (req, res) => {

    const result =
      await markAllAsRead(
        req.user._id
      );


    res.json({

      success:
        true,

      data:
        result,

    });

  });