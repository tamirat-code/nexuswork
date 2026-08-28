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
    phone: { type: String, default: "", trim: true },
    // Profile fields used by the frontend
    headline: { type: String, default: "", trim: true },
    bio: { type: String, default: "" },
    location: { type: String, default: "", trim: true },
    university: { type: String, default: "", trim: true },
    skills: { type: String, default: "" }, // simple comma-separated string for now
    website: { type: String, default: "", trim: true },
    avatarUrl: { type: String, default: null },
    universityVerified: { type: Boolean, default: false },
    notification_prefs: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
    preferred_language: { type: String, enum: ["en", "am", "af"], default: "en" },
    // True only once a platform admin has approved this user's StaffVerification
    // request — matching an email domain at registration is never sufficient.
    staffVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "suspended", "deactivated"],
      default: "active",
    },
    email_verified: { type: Boolean, default: false },
    mfa_enabled: { type: Boolean, default: false },
    mfa_secret_encrypted: { type: String, default: null, select: false },
    mfa_pending_secret_encrypted: { type: String, default: null, select: false },
    mfa_recovery_code_hashes: { type: [String], default: [], select: false },
    failed_login_attempts: { type: Number, default: 0 },
    locked_until: { type: Date, default: null },
    // Incremented when credentials are reset so all previously issued sessions expire.
    auth_session_version: { type: Number, default: 0, min: 0 },
    terms_accepted_at: { type: Date },
    terms_version: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
