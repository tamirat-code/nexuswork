import mongoose from "mongoose";

const revokedTokenSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  expires_at: { type: Date, required: true },
});
revokedTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
export const RevokedToken = mongoose.model("RevokedToken", revokedTokenSchema);

const passwordResetTokenSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  token_hash: { type: String, required: true },
  expires_at: { type: Date, required: true },
  used: { type: Boolean, default: false },
});
passwordResetTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
export const PasswordResetToken = mongoose.model("PasswordResetToken", passwordResetTokenSchema);

const emailVerificationTokenSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  token_hash: { type: String, required: true },
  expires_at: { type: Date, required: true },
});
emailVerificationTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
export const EmailVerificationToken = mongoose.model("EmailVerificationToken", emailVerificationTokenSchema);