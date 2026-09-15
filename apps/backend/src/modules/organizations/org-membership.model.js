import mongoose from "mongoose";

const orgMembershipSchema = new mongoose.Schema(
  {
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["admin", "recruiter", "billing_viewer"], required: true },
    status: { type: String, enum: ["active", "removed"], default: "active" },
    invited_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joined_at: { type: Date, default: Date.now },
    removed_at: { type: Date, default: null },
  },
  { timestamps: true }
);

orgMembershipSchema.index({ organization_id: 1, user_id: 1 }, { unique: true });
orgMembershipSchema.index({ user_id: 1, status: 1 });

export default mongoose.model("OrgMembership", orgMembershipSchema);
