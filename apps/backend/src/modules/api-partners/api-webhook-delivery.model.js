import mongoose from "mongoose";

const apiWebhookDeliverySchema = new mongoose.Schema(
  {
    subscription_id: { type: mongoose.Schema.Types.ObjectId, ref: "ApiWebhookSubscription", required: true },
    partner_id: { type: mongoose.Schema.Types.ObjectId, ref: "ApiPartner", required: true },
    event_id: { type: String, required: true },
    event_type: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ["pending", "delivering", "delivered", "failed", "exhausted"], default: "pending" },
    attempt_count: { type: Number, default: 0, min: 0 },
    next_attempt_at: { type: Date, default: Date.now },
    lease_until: { type: Date },
    response_status: { type: Number },
    response_body: { type: String, maxlength: 2000 },
    last_error: { type: String, maxlength: 2000 },
    delivered_at: { type: Date },
  },
  { timestamps: true }
);

apiWebhookDeliverySchema.index({ subscription_id: 1, event_id: 1 }, { unique: true });
apiWebhookDeliverySchema.index({ status: 1, next_attempt_at: 1 });
apiWebhookDeliverySchema.index({ partner_id: 1, createdAt: -1 });

export default mongoose.model("ApiWebhookDelivery", apiWebhookDeliverySchema);
