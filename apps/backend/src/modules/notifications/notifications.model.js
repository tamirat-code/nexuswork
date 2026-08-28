import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "proposal_received",
        "proposal_accepted",
        "proposal_rejected",

    
        "contract_reviewed",
        "contract_signed",

        "milestone_funded",
        "milestone_delivered",
        "milestone_revision_requested",
        "milestone_approved",
        "payment_received",
        "new_message",
        "review_received",
        "verification_approved",
        "verification_rejected",
        "staff_verification_approved",
        "staff_verification_rejected",
        "dispute_update",
        "meeting_created",
        "meeting_started",
        "meeting_starting_soon",
        "meeting_cancelled",
        "meeting_ended",
        "system",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    body: {
      type: String,
      default: "",
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    read_at: {
      type: Date,
    },

    email_sent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({
  user_id: 1,
  read_at: 1,
  createdAt: -1,
});

notificationSchema.index({
  user_id: 1,
  createdAt: -1,
});

export default mongoose.model("Notification", notificationSchema);
