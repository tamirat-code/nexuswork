import StaffVerification from "./staff-verifications.model.js";
import University from "../universities/universities.model.js";
import User from "../users/users.model.js";
import File from "../files/files.model.js";
import { createNotification } from "../notifications/notifications.service.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../../shared/exceptions/AppError.js";

export async function submitStaffVerification({
  userId,
  userEmail,
  fullName,
  jobTitle,
  department,
  documentFileId,
}) {
  if (!documentFileId) {
    throw new ValidationError(
      "Upload a staff ID, HR/offer letter, or department directory page before submitting"
    );
  }

  const file = await File.findById(documentFileId);
  if (!file) throw new ValidationError("The uploaded document could not be found — please upload it again");
  if (String(file.owner_id) !== String(userId)) {
    throw new ValidationError("That document was not uploaded by you");
  }

  
  const emailDomain = String(userEmail || "").split("@")[1]?.toLowerCase() || "";
  const university = await University.findOne({ domain: emailDomain });
  if (!university) {
    throw new ValidationError(
      "Your email domain isn't registered to a university on NexusWork. Ask a platform admin to add your university first."
    );
  }

  const existing = await StaffVerification.findOne({ user_id: userId, university_id: university._id });
  if (existing) {
    if (existing.status === "pending") throw new ValidationError("Verification request already pending");
    if (existing.status === "approved") throw new ValidationError("Already verified for this university");
  }

  await File.findByIdAndUpdate(documentFileId, {
    related_type: "staff_verification_document",
    related_id: userId,
  });

  const verification = await StaffVerification.findOneAndUpdate(
    { user_id: userId, university_id: university._id },
    {
      user_id: userId,
      university_id: university._id,
      email_domain: emailDomain,
      email_domain_matched: true,
      full_name: fullName,
      job_title: jobTitle,
      department,
      document_file_id: documentFileId,
      status: "pending",
      reviewed_by: undefined,
      reviewed_at: undefined,
      rejection_reason: undefined,
    },
    { upsert: true, new: true }
  );

  // Notify every platform admin so the request doesn't sit unseen.
  try {
    const admins = await User.find({ role: "admin" }).select("_id");
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin._id,
          type: "system",
          title: "New staff verification request",
          body: `${fullName} requested staff access at ${university.name}.`,
          data: { staff_verification_id: verification._id, university_id: university._id },
        })
      )
    );
  } catch (err) {
    console.error("[staff-verifications] failed to notify admins:", err.message);
  }

  return verification;
}

export async function getMyStaffVerifications(userId) {
  return StaffVerification.find({ user_id: userId })
    .populate("university_id", "name domain")
    .sort({ createdAt: -1 })
    .lean();
}

export async function listStaffVerifications({ status, limit = 50, skip = 0 }) {
  const query = {};
  if (status && status !== "all") query.status = status;

  return StaffVerification.find(query)
    .populate("user_id", "name email avatarUrl")
    .populate("university_id", "name domain")
    .populate("document_file_id", "url original_name mimetype")
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Number(limit))
    .lean();
}

export async function getStaffVerificationStats() {
  const counts = await StaffVerification.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const byStatus = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  return {
    pending: byStatus.pending || 0,
    approved: byStatus.approved || 0,
    rejected: byStatus.rejected || 0,
  };
}

export async function reviewStaffVerification({ verificationId, reviewerId, reviewerRole, decision, rejectionReason }) {
  if (reviewerRole !== "admin") {
    throw new ForbiddenError("Only a platform admin can review staff verification requests");
  }
  if (!["approved", "rejected"].includes(decision)) {
    throw new ValidationError("Decision must be 'approved' or 'rejected'");
  }

  const verification = await StaffVerification.findById(verificationId);
  if (!verification) throw new NotFoundError("Staff verification request not found");

  verification.status = decision;
  verification.reviewed_by = reviewerId;
  verification.reviewed_at = new Date();
  verification.rejection_reason = decision === "rejected" ? (rejectionReason || "Not approved") : undefined;
  await verification.save();

  if (decision === "approved") {
    await University.findByIdAndUpdate(verification.university_id, {
      $addToSet: { contact_staff: verification.user_id },
    });
    await User.findByIdAndUpdate(verification.user_id, { staffVerified: true });
  }

  const type = decision === "approved" ? "staff_verification_approved" : "staff_verification_rejected";
  try {
    await createNotification({
      userId: verification.user_id,
      type,
      title: decision === "approved" ? "Staff access approved" : "Staff verification update",
      body:
        decision === "approved"
          ? "A platform admin confirmed your staff role — you can now review student verifications for your university."
          : `Your staff verification was not approved: ${verification.rejection_reason || "Please try again."}`,
      data: { staff_verification_id: verification._id },
    });
  } catch (err) {
    console.error("[staff-verifications] failed to notify requester:", err.message);
  }

  return verification;
}