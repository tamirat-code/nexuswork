import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  useNavigate,
} from "react-router-dom";

import { toast } from "sonner";

import {
  Bell,
  CheckCheck,
  ChevronRight,
} from "lucide-react";

import {
  listMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../services/api/notifications.api.js";

import {
  useAuth,
} from "../../hooks/useAuth.js";

import {
  Card,
} from "../../components/ui/shadcn/card.jsx";

import {
  Badge,
} from "../../components/ui/shadcn/badge.jsx";

import {
  Button,
} from "../../components/ui/shadcn/button.jsx";

import {
  Skeleton,
} from "../../components/ui/shadcn/skeleton.jsx";

import {
  formatTimeAgo,
} from "../../utils/date.utils.js";


export default function NotificationsPage() {

  const { token } =
    useAuth();

  const navigate =
    useNavigate();

  const queryClient =
    useQueryClient();


  const {
    data,
    isLoading,
    error,
  } = useQuery({

    queryKey:
      ["notifications"],

    queryFn:
      () =>
        listMyNotifications(
          token
        ),

    enabled:
      !!token,

  });


 
  const items =
    Array.isArray(
      data?.data
    )
      ? data.data

      : Array.isArray(
          data?.data?.notifications
        )
        ? data.data.notifications

        : [];


  const markOne =
    useMutation({

      mutationFn:
        (id) =>
          markNotificationRead(
            id,
            token
          ),

      onSuccess:
        () => {

          queryClient.invalidateQueries({
            queryKey:
              ["notifications"],
          });

        },

    });


  const markAll =
    useMutation({

      mutationFn:
        () =>
          markAllNotificationsRead(
            token
          ),

      onSuccess:
        () => {

          queryClient.invalidateQueries({
            queryKey:
              ["notifications"],
          });

          toast.success(
            "All caught up"
          );

        },

    });


  const unread =
    items.filter(
      (notification) =>
        !notification.read &&
        !notification.read_at
    ).length;


  
  const openNotification =
    async (notification) => {

      if (
        !notification.read &&
        !notification.read_at
      ) {

        try {

          await markOne.mutateAsync(
            notification._id
          );

        } catch (err) {

        
          console.error(
            "Could not mark notification as read:",
            err
          );

        }

      }


      const notificationType =
        notification.type;


      const proposalId =
        notification.data?.proposal_id ||
        notification.data?.proposalId;


     
      if (
        (
          notificationType ===
            "proposal_received" ||
          notification.data?.action ===
            "review_proposal"
        ) &&
        proposalId
      ) {

        navigate(
          `/proposals?proposalId=${encodeURIComponent(
            proposalId
          )}`
        );

        return;
      }


      
      if (
        (
          notificationType ===
            "proposal_accepted" ||
          notificationType ===
            "proposal_rejected"
        ) &&
        proposalId
      ) {

        navigate(
          `/proposals?proposalId=${encodeURIComponent(
            proposalId
          )}`
        );

        return;
      }


      /*
       * Staff verification notifications.
       */
      const staffVerificationId =
        notification.data?.staff_verification_id ||
        notification.data?.staffVerificationId;


      if (
        notification.data?.action ===
          "review_staff_verification" &&
        staffVerificationId
      ) {

        navigate(
          `/admin?staffVerificationId=${encodeURIComponent(
            staffVerificationId
          )}`
        );

        return;
      }


      if (
        notificationType ===
          "staff_verification_approved" ||
        notificationType ===
          "staff_verification_rejected" ||
        notification.data?.action ===
          "view_staff_verification"
      ) {

        navigate(
          "/profile"
        );

        return;
      }


      /*
       * Contract notification.
       */
      const contractId =
        notification.data?.contract_id ||
        notification.data?.contractId;


      if (
        notification.data?.action ===
          "view_contract" &&
        contractId
      ) {

        navigate(
          `/contracts/${contractId}`
        );

        return;
      }


      
    };


  if (isLoading) {

    return (

      <div className="space-y-3">

        <Skeleton
          className="h-16 w-full"
        />

        <Skeleton
          className="h-16 w-full"
        />

        <Skeleton
          className="h-16 w-full"
        />

      </div>

    );

  }


  if (error) {

    return (

      <Card className="p-8 text-center">

        <h2 className="font-display text-lg text-slate">
          Couldn't load notifications
        </h2>

        <p className="mt-2 text-sm text-slate-300">
          {error.message}
        </p>

      </Card>

    );

  }


  return (

    <div className="w-full animate-fade-up">

      {/* Header */}

      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-300 pb-6">

        <div>

          <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">
            Inbox
          </p>

          <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">
            Notifications
          </h1>

          <p className="mt-2 text-sm text-slate-300">

            {unread > 0
              ? `${unread} unread`
              : "You're all caught up"}

          </p>

        </div>


        {unread > 0 && (

          <Button
            variant="secondary"
            size="sm"
            loading={
              markAll.isPending
            }
            onClick={() =>
              markAll.mutate()
            }
          >

            <CheckCheck className="h-4 w-4" />

            Mark all read

          </Button>

        )}

      </header>


    

      {items.length === 0 && (

        <Card className="mt-8 p-14 text-center">

          <Bell className="mx-auto h-10 w-10 text-slate-300" />

          <h3 className="mt-4 font-display text-lg text-slate">
            Nothing here yet
          </h3>

          <p className="mt-2 text-sm text-slate-300">
            Proposal, milestone, contract, and
            dispute updates will appear here.
          </p>

        </Card>

      )}



      <div className="mt-6 space-y-2">

        {items.map(
          (notification) => {

            const isRead =
              Boolean(
                notification.read
              ) ||
              Boolean(
                notification.read_at
              );


            const isProposalNotification =
              notification.type ===
                "proposal_received" ||
              notification.type ===
                "proposal_accepted" ||
              notification.type ===
                "proposal_rejected" ||
              notification.data?.action ===
                "review_proposal";


            const isStaffVerificationAdminAction =
              notification.data?.action ===
                "review_staff_verification";

            const isStaffVerificationStatusUpdate =
              notification.type ===
                "staff_verification_approved" ||
              notification.type ===
                "staff_verification_rejected" ||
              notification.data?.action ===
                "view_staff_verification";


            return (

              <button

                key={
                  notification._id
                }

                type="button"

                onClick={() =>
                  openNotification(
                    notification
                  )
                }

                className={`group w-full cursor-pointer rounded-card border p-4 text-left transition-all hover:border-brass/40 hover:bg-ink-50 ${
                  isRead
                    ? "border-ink-300 bg-ink-50"
                    : "border-brass/30 bg-brass/5"
                }`}

              >

                <div className="flex items-start gap-3">

                  {/* Icon */}

                  <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink-300">

                    <Bell className="h-4 w-4 text-brass" />

                  </div>


                  {/* Content */}

                  <div className="min-w-0 flex-1">

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <p className="font-semibold text-slate">
                          {notification.title}
                        </p>

                        <p className="mt-1 text-sm leading-relaxed text-slate-300">

                          {notification.message ||
                            notification.body ||
                            ""}

                        </p>

                      </div>


                      {!isRead && (

                        <Badge
                          variant="default"
                          className="shrink-0"
                        >
                          New
                        </Badge>

                      )}

                    </div>


                    <div className="mt-2 flex items-center justify-between">

                      <p className="text-xs text-slate-300">
                        {formatTimeAgo(
                          notification.createdAt
                        )}
                      </p>


                      {isProposalNotification && (

                        <span className="flex items-center gap-1 text-xs font-semibold text-brass opacity-0 transition-opacity group-hover:opacity-100">

                          Review proposal

                          <ChevronRight className="h-3.5 w-3.5" />

                        </span>

                      )}


                      {isStaffVerificationAdminAction && (

                        <span className="flex items-center gap-1 text-xs font-semibold text-brass opacity-0 transition-opacity group-hover:opacity-100">

                          Review request

                          <ChevronRight className="h-3.5 w-3.5" />

                        </span>

                      )}


                      {isStaffVerificationStatusUpdate && (

                        <span className="flex items-center gap-1 text-xs font-semibold text-brass opacity-0 transition-opacity group-hover:opacity-100">

                          View status

                          <ChevronRight className="h-3.5 w-3.5" />

                        </span>

                      )}

                    </div>

                  </div>

                </div>

              </button>

            );

          }
        )}

      </div>

    </div>

  );

}