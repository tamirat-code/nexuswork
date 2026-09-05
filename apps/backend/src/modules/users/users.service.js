import User from "./users.model.js";
import { storageConfig } from "../../config/storage.config.js";
import { uploadToS3 } from "../../shared/utils/s3.client.js";
import { getPrivateObjectUrl } from "../../shared/utils/private-storage.client.js";
import mime from "mime-types";

export async function findByEmail(email) {
  return User.findOne({ email: email.toLowerCase() });
}

export async function getPublicProfile(userId) {
  const user = await User.findById(userId);
  if (!user) return null;
  const { _id, name, email, role, status } = user;
  return { id: _id, name, email, role, status };
}

export async function getPrivateProfile(userId) {
  const user = await User.findById(userId);
  if (!user) return null;
  const {
    _id,
    name,
    email,
    role,
    status,
    headline,
    bio,
    location,
    university,
    skills,
    website,
    avatarUrl,
    avatarKey,
    universityVerified,
    notification_prefs,
    preferred_language,
    cv_file_id,
    email_verified,
  } = user;
  let freshAvatarUrl = avatarUrl;
  if (storageConfig.driver === "s3" && (avatarKey || avatarUrl)) {
    try {
      const key = avatarKey || new URL(avatarUrl).pathname.split("/").filter(Boolean).slice(1).join("/");
      if (key) freshAvatarUrl = await getPrivateObjectUrl(key, 300);
    } catch {
      // Keep the stored value as a fallback for legacy avatar records.
    }
  }
  return {
    id: _id,
    name,
    email,
    role,
    status,
    headline,
    bio,
    location,
    university,
    skills,
    website,
    avatarUrl: freshAvatarUrl,
    universityVerified,
    notification_prefs,
    preferred_language,
    cv_file_id,
    email_verified,
    staffVerified: user.staffVerified,
  };
}

export async function updateMe(userId, payload) {
  const allowed = ["name", "email", "headline", "bio", "location", "university", "skills", "website", "notification_prefs", "preferred_language"];
  const update = {};
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(payload, k)) update[k] = payload[k];
  }

  const existingUser = await User.findById(userId);
  if (!existingUser) return null;

  let emailChanged = false;
  if (update.email) {
    update.email = String(update.email).toLowerCase();
    if (update.email !== existingUser.email) {
      emailChanged = true;
      update.email_verified = false;
    }
  }

  const user = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true });
  if (!user) return null;

  if (emailChanged) {
    try {
      const { resendVerificationEmail } = await import("../auth/auth.service.js");
      await resendVerificationEmail(user._id);
    } catch (err) {
      // Best-effort send
    }
  }

  return getPrivateProfile(user._id);
}

export async function updateLanguage(userId, preferred_language) {
  return updateMe(userId, { preferred_language });
}

export async function updateAvatar(userId, avatarData) {
  if (!avatarData) return null;
  // If using S3/minio driver, accept a data URL (base64) and upload.
  if (storageConfig.driver === "s3") {
    // avatarData expected to be data:[<mediatype>][;base64],<data>
    const m = /^data:([^;]+);base64,(.+)$/.exec(avatarData);
    if (!m) throw Object.assign(new Error("Invalid avatar data URL"), { status: 400 });
    const contentType = m[1];
    const base64 = m[2];
    const buffer = Buffer.from(base64, "base64");
    const ext = (mime.extension(contentType) || "bin").replace(/\s+/g, "");
    const key = `avatars/${userId}-${Date.now()}.${ext}`;
    const bucket = storageConfig.bucket;
    if (!bucket) throw Object.assign(new Error("S3_BUCKET not configured"), { status: 500 });
    const url = await uploadToS3({ bucket, key, body: buffer, contentType });
    const user = await User.findByIdAndUpdate(userId, { avatarUrl: url, avatarKey: key }, { new: true });
    if (!user) return null;
    return { avatarUrl: url };
  }


  const user = await User.findByIdAndUpdate(userId, { avatarUrl: avatarData }, { new: true });
  if (!user) return null;
  return { avatarUrl: user.avatarUrl };
}

export async function removeAvatar(userId) {
  const user = await User.findByIdAndUpdate(userId, { avatarUrl: null }, { new: true });
  if (!user) return null;
  return { success: true };
}

export async function exportMyData(userId) {
  const user = await User.findById(userId).select("-password_hash -mfa_secret_encrypted -mfa_pending_secret_encrypted -mfa_recovery_code_hashes").lean();
  if (!user) return null;
  return { exported_at: new Date().toISOString(), user };
}

export async function deactivateMyAccount(userId) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { status: "deactivated" }, $inc: { auth_session_version: 1 } },
    { new: true }
  ).select("_id status").lean();
  return user ? { id: user._id, status: user.status } : null;
}
