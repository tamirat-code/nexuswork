import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
  {
    event_id: { type: String, required: true, unique: true },
    provider: { type: String },
    provider_event_id: { type: String },
    provider_transaction_id: { type: String },
    payment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    request_id: { type: String },
    type: { type: String, required: true },
    status: { type: String, enum: ["processing", "succeeded", "failed"], default: "processing" },
    processing_at: { type: Date, default: Date.now },
    error_message: { type: String },
    processed_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.WebhookEvent || mongoose.model("WebhookEvent", webhookEventSchema);
