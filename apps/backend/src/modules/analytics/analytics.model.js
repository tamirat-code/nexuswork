import mongoose from "mongoose";

const analyticsEventSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    event_type: { type: String, required: true },
    entity_type: { type: String, default: "" },
    entity_id: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

analyticsEventSchema.index({ event_type: 1, createdAt: -1 });
analyticsEventSchema.index({ entity_type: 1, entity_id: 1 });
analyticsEventSchema.index({ user_id: 1, createdAt: -1 });

export default mongoose.model("AnalyticsEvent", analyticsEventSchema);