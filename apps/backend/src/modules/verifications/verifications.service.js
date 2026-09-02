import Verification from "./verifications.model.js";
import SkillCertificationRequest from "./skill-certification-request.model.js";
import University from "../universities/universities.model.js";
import StudentProfile from "../students/students.model.js";
import User from "../users/users.model.js";
import File from "../files/files.model.js";
import { createNotification } from "../notifications/notifications.service.js";
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from "../../shared/exceptions/AppError.js";
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
      assessmentMethod: skill.assessment_method,
      assessmentScore: skill.assessment_score,
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

export async function exportVerifiedCredentialById(verificationId) {
  const verification = await Verification.findOne({ _id: verificationId, status: "approved" }).lean();
  if (!verification) throw new NotFoundError("Approved verification credential not found");
  const [university, user, profile] = await Promise.all([
    University.findById(verification.university_id).select("name domain").lean(),
    User.findById(verification.user_id).select("name").lean(),
    StudentProfile.findOne({ user_id: verification.user_id }).select("skills").lean(),
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
    try {
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
    } catch (err) {
      if (err?.code === 11000 && err?.keyPattern?.university_id && err?.keyPattern?.student_id_number) {
        throw new ConflictError(
          `Student ID ${verification.student_id_number} is already registered at this university. Resolve the duplicate before approving this request.`,
          "DUPLICATE_STUDENT_ID"
        );
      }
      throw err;
    }

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


function normalizeSkillKey(value) {
  return String(value || "").trim().toLowerCase();
}

async function assertUniversityReviewer({ universityId, reviewerId, reviewerRole }) {
  if (reviewerRole === "admin") return;
  const university = await University.findOne({ _id: universityId, contact_staff: reviewerId }).select("name contact_staff");
  if (!university) throw new ForbiddenError("Only staff at the student's university can review this request");
  return university;
}

export async function submitSkillCertificationRequest({ studentId, skillName, evidenceFileId, assessmentMethod, courseName, courseCode, courseCompletedAt, studentNotes }) {
  const profile = await StudentProfile.findOne({ user_id: studentId });
  if (!profile) throw new NotFoundError("Student profile not found");
  if (profile.verification_status !== "verified" || !profile.university_id) {
    throw new ValidationError("Complete university enrollment verification before requesting a certified skill");
  }

  let skill = profile.skills.find((item) => normalizeSkillKey(item.name) === normalizeSkillKey(skillName));
  if (!skill) {
    const user = await User.findById(studentId).select("skills").lean();
    const userSkillNames = (user?.skills || "").split(",").map((s) => s.trim().toLowerCase());
    if (userSkillNames.includes(normalizeSkillKey(skillName))) {
      profile.skills.push({ name: skillName.trim(), verification_method: "self_declared" });
      await profile.save();
      skill = profile.skills.find((item) => normalizeSkillKey(item.name) === normalizeSkillKey(skillName));
    }
  }
  if (!skill) throw new ValidationError("Only a skill already listed on your profile can be submitted");
  if (skill.verification_method === "university_certified") {
    throw new ValidationError("This skill is already university certified");
  }
  if (assessmentMethod === "coursework_linkage" && !courseName?.trim()) {
    throw new ValidationError("Course name is required for coursework evidence");
  }

  const file = await File.findOne({ _id: evidenceFileId, owner_id: studentId });
  if (!file) throw new ValidationError("Upload your own evidence file before submitting");
  if (file.related_type !== "skill_certification_evidence") {
    await File.findByIdAndUpdate(evidenceFileId, { related_type: "skill_certification_evidence" });
  }

  const existing = await SkillCertificationRequest.findOne({
    student_id: studentId,
    skill_key: normalizeSkillKey(skill.name),
    status: "pending",
  });
  if (existing) throw new ValidationError("A certification request for this skill is already pending");

  const request = await SkillCertificationRequest.create({
    student_id: studentId,
    university_id: profile.university_id,
    skill_name: skill.name,
    skill_key: normalizeSkillKey(skill.name),
    evidence_file_id: evidenceFileId,
    assessment_method: assessmentMethod,
    course_name: courseName?.trim(),
    course_code: courseCode?.trim(),
    course_completed_at: courseCompletedAt,
    student_notes: studentNotes.trim(),
  });
  await File.findByIdAndUpdate(evidenceFileId, { related_id: request._id });

  const university = await University.findById(profile.university_id).select("name contact_staff");
  try {
    await Promise.all((university?.contact_staff || []).map((staffId) => createNotification({
      userId: staffId,
      type: "system",
      title: "New skill certification request",
      body: `${skill.name} evidence from a student is ready for review at ${university.name}.`,
      data: { skill_certification_request_id: request._id },
    })));
  } catch (error) {
    console.error("[verifications] failed to notify skill reviewers:", error.message);
  }

  return SkillCertificationRequest.findById(request._id)
    .populate("university_id", "name domain")
    .populate("evidence_file_id", "url original_name mimetype size")
    .lean();
}

export async function getMySkillCertificationRequests(studentId) {
  return SkillCertificationRequest.find({ student_id: studentId })
    .populate("university_id", "name domain")
    .populate("evidence_file_id", "url original_name mimetype size")
    .sort({ createdAt: -1 })
    .lean();
}

export async function listSkillCertificationRequests({ requesterId, requesterRole, status = "pending", limit = 50, skip = 0 }) {
  const query = {};
  if (status !== "all") query.status = status;
  if (requesterRole !== "admin") {
    const university = await University.findOne({ contact_staff: requesterId }).select("_id");
    query.university_id = university?._id || null;
  }
  return SkillCertificationRequest.find(query)
    .populate("student_id", "name email avatarUrl")
    .populate("university_id", "name domain")
    .populate("evidence_file_id", "url original_name mimetype size")
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Math.min(Number(limit) || 50, 100))
    .lean();
}

export async function reviewSkillCertificationRequest({ requestId, reviewerId, reviewerRole, decision, assessmentScore, reviewNotes }) {
  const request = await SkillCertificationRequest.findById(requestId);
  if (!request) throw new NotFoundError("Skill certification request not found");
  if (request.status !== "pending") throw new ValidationError("This certification request has already been reviewed");
  await assertUniversityReviewer({ universityId: request.university_id, reviewerId, reviewerRole });
  if (request.assessment_method === "practical_assessment" && assessmentScore === undefined) {
    throw new ValidationError("A practical assessment requires a score from 0 to 100");
  }

  const profile = await StudentProfile.findOne({ user_id: request.student_id });
  const skill = profile?.skills?.find((item) => normalizeSkillKey(item.name) === request.skill_key);
  if (!skill) throw new ValidationError("The requested skill is no longer listed on the student's profile");

  request.status = decision;
  request.reviewed_by = reviewerId;
  request.reviewed_at = new Date();
  request.assessment_score = assessmentScore;
  request.review_notes = reviewNotes.trim();

  if (decision === "approved") {
    skill.verification_method = "university_certified";
    skill.certified_by = reviewerId;
    skill.certified_at = request.reviewed_at;
    skill.evidence_file_id = request.evidence_file_id;
    skill.assessment_method = request.assessment_method;
    skill.assessment_score = assessmentScore;
    skill.assessment_notes = request.review_notes;
    skill.course_name = request.course_name;
    skill.course_code = request.course_code;
    skill.course_completed_at = request.course_completed_at;
    await profile.save();
  }
  await request.save();

  try {
    await createNotification({
      userId: request.student_id,
      type: "system",
      title: decision === "approved" ? "Skill certification approved" : "Skill certification needs changes",
      body: decision === "approved"
        ? `${request.skill_name} is now university certified.`
        : `${request.skill_name} was not certified yet: ${request.review_notes}`,
      data: { skill_certification_request_id: request._id, decision },
    });
  } catch (error) {
    console.error("[verifications] failed to notify student:", error.message);
  }

  return SkillCertificationRequest.findById(request._id)
    .populate("student_id", "name email avatarUrl")
    .populate("university_id", "name domain")
    .populate("evidence_file_id", "url original_name mimetype size")
    .lean();
}
