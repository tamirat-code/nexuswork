import mongoose from "mongoose";

const apiUsageSchema = new mongoose.Schema(
  {
    partner_id: { type: mongoose.Schema.Types.ObjectId, ref: "ApiPartner", required: true },
    period_start: { type: Date, required: true },
    period_end: { type: Date, required: true },
    request_count: { type: Number, default: 0, min: 0 },
    wallet_debited_minor: { type: Number, default: 0, min: 0 },
    data_read_count: { type: Number, default: 0, min: 0 },
    export_count: { type: Number, default: 0, min: 0 },
    thresholds_notified: { type: [Number], default: [] },
    last_request_at: { type: Date },
  },
  { timestamps: true }
);

apiUsageSchema.index({ partner_id: 1, period_start: 1 }, { unique: true });
apiUsageSchema.index({ period_end: 1 });

export default mongoose.model("ApiUsage", apiUsageSchema);
