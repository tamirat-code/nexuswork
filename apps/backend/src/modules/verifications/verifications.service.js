import Verification from "./verifications.model.js";
import University from "../universities/universities.model.js";
import StudentProfile from "../students/students.model.js";
import User from "../users/users.model.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../../shared/exceptions/AppError.js";

export async function submitVerification({ userId, universityId, emailDomain, documentFileId }) {
  const university = await University.findById(universityId);
  if (!university) throw new NotFoundError("University not found");


  if (emailDomain && university.domain && emailDomain.toLowerCase() !== university.domain.toLowerCase()) {
    throw new ValidationError(`Email domain "${emailDomain}" does not match ${university.name}'s domain "${university.domain}"`);
  }

  const existing = await Verification.findOne({ user_id: userId, university_id: universityId });
  if (existing) {
    if (existing.status === "pending") throw new ValidationError("Verification request already pending");
    if (existing.status === "approved") throw new ValidationError("Already verified for this university");
  }

  return Verification.findOneAndUpdate(
    { user_id: userId, university_id: universityId },
    {
      user_id: userId,
      university_id: universityId,
      email_domain: emailDomain || university.domain,
      document_file_id: documentFileId,
      status: "pending",
      reviewed_by: undefined,
      reviewed_at: undefined,
      rejection_reason: undefined,
    },
    { upsert: true, new: true }
  );
}

export async function getMyVerifications(userId) {
  return Verification.find({ user_id: userId }).populate("university_id", "name domain").sort({ createdAt: -1 }).lean();
}

async function scopedUniversityFilter(requesterId, requesterRole) {
  if (!requesterRole || requesterRole === "admin") return {};

  const university = await University.findOne({ contact_staff: requesterId });
  return { university_id: university ? university._id : null }; // null -> no matches
}

export async function listVerifications({ status, limit = 50, skip = 0, requesterId, requesterRole }) {
  const query = await scopedUniversityFilter(requesterId, requesterRole);
  if (status && status !== "all") query.status = status;

  return Verification.find(query)
    .populate("user_id", "name email avatarUrl")
    .populate("university_id", "name domain")
    .populate("document_file_id", "url original_name mimetype")
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Number(limit))
    .lean();
}

export async function getVerificationStats({ requesterId, requesterRole }) {
  const scope = await scopedUniversityFilter(requesterId, requesterRole);
  const counts = await Verification.aggregate([
    { $match: scope },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  return {
    pending: byStatus.pending || 0,
    approved: byStatus.approved || 0,
    rejected: byStatus.rejected || 0,
  };
}

export async function reviewVerification({ verificationId, reviewerId, reviewerRole, decision, rejectionReason }) {
  if (!["approved", "rejected"].includes(decision)) {
    throw new ValidationError("Decision must be 'approved' or 'rejected'");
  }

  const verification = await Verification.findById(verificationId);
  if (!verification) throw new NotFoundError("Verification request not found");

  if (reviewerRole !== "admin") {
    const university = await University.findById(verification.university_id);
    const isContactStaff = university?.contact_staff?.some((id) => String(id) === String(reviewerId));
    if (!isContactStaff) throw new ForbiddenError("Only university staff or admins can review verification requests");
  }

  verification.status = decision;
  verification.reviewed_by = reviewerId;
  verification.reviewed_at = new Date();
  verification.rejection_reason = decision === "rejected" ? (rejectionReason || "Not approved") : undefined;

  if (decision === "approved") {
    // Mark the student profile as verified
    await StudentProfile.findOneAndUpdate(
      { user_id: verification.user_id },
      { verification_status: "verified" },
      { new: true }
    );
    
    await User.findByIdAndUpdate(verification.user_id, { universityVerified: true });
  } else {

    await StudentProfile.findOneAndUpdate(
      { user_id: verification.user_id },
      { verification_status: "rejected" }
    );
  }

  await verification.save();
  return verification;
}


export async function certifyStudentSkill({ studentUserId, skillName, staffUserId, staffRole }) {
  const profile = await StudentProfile.findOne({ user_id: studentUserId });
  if (!profile) throw new NotFoundError("Student profile not found");

  if (staffRole !== "admin") {
    if (!profile.university_id) {
      throw new ForbiddenError("Student has no associated university to certify a skill against");
    }
    const university = await University.findById(profile.university_id);
    const isContactStaff = university?.contact_staff?.some((id) => String(id) === String(staffUserId));
    if (!isContactStaff) {
      throw new ForbiddenError("Only staff at the student's own university, or an admin, can certify this skill");
    }
  }

  const skill = profile.skills.find((s) => String(s.name).toLowerCase() === String(skillName).toLowerCase());
  if (!skill) throw new NotFoundError(`Student does not have a skill named "${skillName}" on their profile`);

  skill.verification_method = "university_certified";
  skill.certified_by = staffUserId;
  skill.certified_at = new Date();

  await profile.save();
  return profile;
}