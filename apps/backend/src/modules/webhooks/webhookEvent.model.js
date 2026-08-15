import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
  {
    event_id: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    processed_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.WebhookEvent || mongoose.model("WebhookEvent", webhookEventSchema);
