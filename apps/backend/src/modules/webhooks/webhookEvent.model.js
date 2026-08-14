import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
  {
    event_id: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    processed_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

webhookEventSchema.index({ event_id: 1 }, { unique: true });

export default mongoose.model("WebhookEvent", webhookEventSchema);
