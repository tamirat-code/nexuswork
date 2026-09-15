import mongoose from "mongoose";

const apiRateLimitSchema = new mongoose.Schema(
  {
    partner_id: { type: mongoose.Schema.Types.ObjectId, ref: "ApiPartner", required: true },
    window_start: { type: Date, required: true },
    request_count: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

apiRateLimitSchema.index({ partner_id: 1, window_start: 1 }, { unique: true });
apiRateLimitSchema.index({ window_start: 1 }, { expireAfterSeconds: 3_600 });

export default mongoose.model("ApiRateLimitBucket", apiRateLimitSchema);
