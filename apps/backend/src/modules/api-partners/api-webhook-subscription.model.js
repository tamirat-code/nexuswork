import mongoose from "mongoose";

export const PARTNER_WEBHOOK_EVENTS = ["talent.consent.updated", "usage.threshold"];

const apiWebhookSubscriptionSchema = new mongoose.Schema(
  {
    partner_id: { type: mongoose.Schema.Types.ObjectId, ref: "ApiPartner", required: true },
    url: { type: String, required: true, trim: true, maxlength: 2000 },
    events: [{ type: String, enum: PARTNER_WEBHOOK_EVENTS }],
    secret_encrypted: { type: String, required: true, select: false },
    secret_prefix: { type: String, required: true },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
    last_delivery_at: { type: Date },
    failure_count: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

apiWebhookSubscriptionSchema.index({ partner_id: 1, createdAt: -1 });
apiWebhookSubscriptionSchema.index({ partner_id: 1, status: 1 });

export default mongoose.model("ApiWebhookSubscription", apiWebhookSubscriptionSchema);
