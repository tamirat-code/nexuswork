import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: {
      type: String,
      select: false,
      required: function () {
        return this.auth_provider === "local";
      },
    },
    auth_provider: { type: String, enum: ["local", "google"], default: "local" },
    google_id: { type: String, unique: true, sparse: true }, // sparse = unique only among docs that HAVE this field
    role: {
      type: String,
      enum: ["student", "client", "university_staff", "admin"],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["active", "suspended", "deactivated"],
      default: "active",
    },
    email_verified: { type: Boolean, default: false },
    failed_login_attempts: { type: Number, default: 0 },
    locked_until: { type: Date, default: null },
    terms_accepted_at: { type: Date },
    terms_version: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);