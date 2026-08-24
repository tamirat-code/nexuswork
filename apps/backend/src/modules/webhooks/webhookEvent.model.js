import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
  {
    event_id: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    status: { type: String, enum: ["processing", "succeeded", "failed"], default: "processing" },
    error_message: { type: String },
    processed_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.WebhookEvent || mongoose.model("WebhookEvent", webhookEventSchema);
