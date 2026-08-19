import mongoose from "mongoose";

const signatureSchema = new mongoose.Schema(
  {
    signed_at: {
      type: Date,
      required: true,
    },
    contract_version: {
      type: Number,
      required: true,
    },
    terms_fingerprint: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
    },
    user_agent: {
      type: String,
    },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    reviewed_at: {
      type: Date,
    },
    contract_version: {
      type: Number,
    },
    terms_fingerprint: {
      type: String,
    },
  },
  { _id: false }
);

const contractSchema = new mongoose.Schema(
  {
    proposal_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proposal",
      required: true,
      unique: true,
    },

    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending_review",
        "pending_signature",
        "active",
        "completed",
        "terminated",
      ],
      default: "pending_review",
      required: true,
    },

    version: {
      type: Number,
      required: true,
      default: 1,
    },

    terms: {
      title: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        required: true,
        trim: true,
      },

      total_amount: {
        type: Number,
        required: true,
        min: 0,
      },

      currency: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        default: "USD",
      },

      delivery_time_days: {
        type: Number,
        required: true,
        min: 1,
      },

      deadline: {
        type: Date,
        required: true,
      },

      revision_policy: {
        type: String,
        trim: true,
        default:
          "Reasonable revisions based on the agreed project scope.",
      },

      cancellation_terms: {
        type: String,
        trim: true,
        default:
          "Cancellation is subject to the platform dispute and contract termination policy.",
      },

      payment_terms: {
        type: String,
        trim: true,
        default:
          "Each milestone must be funded before work begins. Funds are released after client approval.",
      },
    },

    terms_fingerprint: {
      type: String,
      required: true,
    },

    client_review: {
      type: reviewSchema,
      default: null,
    },

    student_review: {
      type: reviewSchema,
      default: null,
    },

    client_signature: {
      type: signatureSchema,
      default: null,
    },

    student_signature: {
      type: signatureSchema,
      default: null,
    },

   
    client_signed_at: {
      type: Date,
      default: null,
    },

    student_signed_at: {
      type: Date,
      default: null,
    },

    signed_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

contractSchema.index({
  client_id: 1,
  status: 1,
});

contractSchema.index({
  student_id: 1,
  status: 1,
});

export default mongoose.model("Contract", contractSchema);