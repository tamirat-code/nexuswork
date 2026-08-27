import Verification from "./verifications.model.js";
import University from "../universities/universities.model.js";
import StudentProfile from "../students/students.model.js";
import User from "../users/users.model.js";
import File from "../files/files.model.js";
import { createNotification } from "../notifications/notifications.service.js";
import { NotFoundError, ValidationError, ForbiddenError } from "../../shared/exceptions/AppError.js";
import { env } from "../../config/env.js";
import { signCredential } from "./credential-signing.js";

export function buildStudentCredential({ verification, university, user, profile }) {
  const credentialId = `${env.credentialIssuerUrl}/v1/verifications/${verification._id}/credential`;
  const issuerId = env.credentialIssuerUrl;
  const certifiedSkills = (profile?.skills || [])
    .filter((skill) => skill.verification_method === "university_certified")
    .map((skill) => ({
      id: `${issuerId}/v1/skills/${encodeURIComponent(String(skill.name).toLowerCase().replace(/\s+/g, "-"))}`,
      type: ["Achievement", "Skill"],
      name: skill.name,
      category: skill.category,
      level: skill.level,
      verificationMethod: skill.verification_method,
      certifiedAt: skill.certified_at,
    }));

  const credential = {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context.json",
    ],
    id: credentialId,
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    name: `NexusWork university verification — ${university.name}`,
    description: "A signed Open Badges 3.0 / W3C VC-compatible credential document issued by NexusWork.",
    issuer: { id: issuerId, name: "NexusWork" },
    validFrom: verification.reviewed_at || verification.updatedAt || verification.createdAt,
    credentialSubject: {
      id: `${issuerId}/v1/students/${user._id}`,
      type: ["AchievementSubject"],
      name: verification.full_name || user.name,
      achievement: {
        id: `${credentialId}#achievement`,
        type: "Achievement",
        name: `Verified student at ${university.name}`,
        description: `University verification for the ${verification.program} program.`,
        criteria: { narrative: "Identity and enrollment evidence reviewed by the issuing university or platform administrator." },
        achievementType: "Certificate",
        alignment: certifiedSkills,
      },
    },
    evidence: [{
      id: `${credentialId}#evidence`,
      type: ["Evidence"],
      verifier: university.name,
      program: verification.program,
      status: "approved",
    }],
    credentialStatus: {
      id: `${credentialId}/status`,
      type: "BitstringStatusListEntry",
      statusPurpose: "revocation",
      status: "active",
    },
  };

  return signCredential(credential);
}

export async function exportVerifiedCredential(verificationId, userId) {
  const verification = await Verification.findOne({ _id: verificationId, user_id: userId, status: "approved" }).lean();
  if (!verification) throw new NotFoundError("Approved verification credential not found");
  const [university, user, profile] = await Promise.all([
    University.findById(verification.university_id).select("name domain").lean(),
    User.findById(userId).select("name").lean(),
    StudentProfile.findOne({ user_id: userId }).select("skills").lean(),
  ]);
  if (!university || !user) throw new NotFoundError("Credential subject or issuer not found");
  return buildStudentCredential({ verification, university, user, profile });
}

export async function submitVerification({
  userId,
  userEmail,
  universityId,
  fullName,
  studentIdNumber,
  program,
  documentFileId,
}) {
  const university = await University.findById(universityId);
  if (!university) throw new NotFoundError("University not found");

  if (!documentFileId) {
    throw new ValidationError("Upload a photo of your student ID or an enrollment letter before submitting");
  }

  const file = await File.findById(documentFileId);
  if (!file) throw new ValidationError("The uploaded document could not be found — please upload it again");
  if (String(file.owner_id) !== String(userId)) {
    throw new ValidationError("That document was not uploaded by you");
  }

  const existing = await Verification.findOne({ user_id: userId, university_id: universityId });
  if (existing) {
    if (existing.status === "pending") throw new ValidationError("Verification request already pending");
    if (existing.status === "approved") throw new ValidationError("Already verified for this university");
  }

  
  const emailDomain = String(userEmail || "").split("@")[1]?.toLowerCase() || "";
  const emailDomainMatched = Boolean(
    emailDomain && university.domain && emailDomain === university.domain.toLowerCase()
  );

  await File.findByIdAndUpdate(documentFileId, {
    related_type: "verification_document",
    related_id: userId,
  });

  const verification = await Verification.findOneAndUpdate(
    { user_id: userId, university_id: universityId },
    {
      user_id: userId,
      university_id: universityId,
      email_domain: emailDomain,
      email_domain_matched: emailDomainMatched,
      full_name: fullName,
      student_id_number: studentIdNumber,
      program,
      document_file_id: documentFileId,
      status: "pending",
      reviewed_by: undefined,
      reviewed_at: undefined,
      rejection_reason: undefined,
    },
    { upsert: true, new: true }
  );

  // Notify each staff member at this university so they can review the queue.
  try {
    const staffIds = university.contact_staff || [];
    await Promise.all(
      staffIds.map((staffId) =>
        createNotification({
          userId: staffId,
          type: "system",
          title: "New verification request",
          body: `${fullName} requested verification at ${university.name}.`,
          data: { verification_id: verification._id, university_id: universityId },
        })
      )
    );
  } catch (err) {
    console.error("[verifications] failed to notify staff:", err.message);
  }

  return verification;
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
    
    await StudentProfile.findOneAndUpdate(
      { user_id: verification.user_id },
      {
        verification_status: "verified",
        university_id: verification.university_id,
        student_id_number: verification.student_id_number,
        program: verification.program,
      },
      { new: true, upsert: true }
    );

    await User.findByIdAndUpdate(verification.user_id, { universityVerified: true });
  } else {

    await StudentProfile.findOneAndUpdate(
      { user_id: verification.user_id },
      { verification_status: "rejected" }
    );
  }

  await verification.save();

  // Notify the student of the review outcome.
  const type = decision === "approved" ? "verification_approved" : "verification_rejected";
  try {
    await createNotification({
      userId: verification.user_id,
      type,
      title: decision === "approved" ? "University verification approved" : "Verification update",
      body:
        decision === "approved"
          ? "Your university has confirmed your identity — you can now submit proposals."
          : `Your verification was not approved: ${verification.rejection_reason || "Please try again."}`,
      data: { verification_id: verification._id },
    });
  } catch (err) {
    console.error("[verifications] failed to notify student:", err.message);
  }

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
