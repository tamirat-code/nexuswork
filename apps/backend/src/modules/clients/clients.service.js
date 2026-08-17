import ClientProfile from "./clients.model.js";
import User from "../users/users.model.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../../shared/exceptions/AppError.js";

export async function getOrCreateProfile(userId) {
  let profile = await ClientProfile.findOne({ user_id: userId });
  if (!profile) profile = await ClientProfile.create({ user_id: userId });
  return profile;
}

export async function updateProfile(userId, updates) {
  const allowed = ["organization_name", "organization_type"];
  const patch = {};
  for (const key of allowed) if (updates[key] !== undefined) patch[key] = updates[key];
  return ClientProfile.findOneAndUpdate({ user_id: userId }, patch, { new: true, upsert: true });
}

// --- Verification (admin reviews an organizational client's identity) ---

export async function submitClientVerification(userId, { documentFileId } = {}) {
  const profile = await getOrCreateProfile(userId);
  if (profile.verification_status === "verified") {
    throw new ValidationError("This client account is already verified");
  }
  profile.verification_status = "pending";
  profile.document_file_id = documentFileId;
  profile.reviewed_by = undefined;
  profile.reviewed_at = undefined;
  profile.rejection_reason = undefined;
  await profile.save();
  return profile;
}

export async function listClientVerifications({ status = "pending", limit = 50, skip = 0 } = {}) {
  const query = {};
  if (status && status !== "all") query.verification_status = status;
  return ClientProfile.find(query)
    .populate("user_id", "name email")
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Number(limit))
    .lean();
}

export async function reviewClientVerification({ clientUserId, reviewerId, decision, rejectionReason }) {
  if (!["approved", "rejected"].includes(decision)) {
    throw new ValidationError("Decision must be 'approved' or 'rejected'");
  }
  const profile = await ClientProfile.findOne({ user_id: clientUserId });
  if (!profile) throw new NotFoundError("Client profile not found");

  profile.verification_status = decision === "approved" ? "verified" : "rejected";
  profile.reviewed_by = reviewerId;
  profile.reviewed_at = new Date();
  profile.rejection_reason = decision === "rejected" ? (rejectionReason || "Not approved") : undefined;
  await profile.save();
  return profile;
}

export async function addPoster(ownerUserId, posterUserId) {
  if (String(ownerUserId) === String(posterUserId)) {
    throw new ValidationError("You are already the owner of this client account");
  }
  const posterUser = await User.findById(posterUserId);
  if (!posterUser || posterUser.role !== "client") {
    throw new ValidationError("The user being added must be an existing account with the client role");
  }

  const profile = await getOrCreateProfile(ownerUserId);
  const alreadyAdded = profile.additional_posters.some((id) => String(id) === String(posterUserId));
  if (alreadyAdded) throw new ValidationError("This user is already a designated poster on your account");

  profile.additional_posters.push(posterUserId);
  await profile.save();
  return profile;
}

export async function removePoster(ownerUserId, posterUserId) {
  const profile = await getOrCreateProfile(ownerUserId);
  profile.additional_posters = profile.additional_posters.filter((id) => String(id) !== String(posterUserId));
  await profile.save();
  return profile;
}


export async function isOrgMember(ownerUserId, requestingUserId) {
  if (String(ownerUserId) === String(requestingUserId)) return true;
  const profile = await ClientProfile.findOne({ user_id: ownerUserId }).lean();
  if (!profile) return false;
  return (profile.additional_posters || []).some((id) => String(id) === String(requestingUserId));
}
