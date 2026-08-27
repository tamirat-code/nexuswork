import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import { ValidationError } from "../../shared/exceptions/AppError.js";
import { verifyCredentialProof } from "./credential-signing.js";
import { renderCredentialCardPdf } from "../../templates/credential/credential-card.pdf.js";
import {
  submitVerification,
  getMyVerifications,
  listVerifications,
  getVerificationStats,
  reviewVerification,
  certifyStudentSkill,
  exportVerifiedCredential,
} from "./verifications.service.js";

export const requestVerification = asyncHandler(async (req, res) => {
  requireFields(req.body, ["university_id", "full_name", "student_id_number", "program", "document_file_id"]);
  const verification = await submitVerification({
    userId: req.user._id,
    
    userEmail: req.user.email,
    universityId: req.body.university_id,
    fullName: req.body.full_name,
    studentIdNumber: req.body.student_id_number,
    program: req.body.program,
    documentFileId: req.body.document_file_id,
  });
  res.status(201).json({ success: true, data: verification });
});

export const getMine = asyncHandler(async (req, res) => {
  const verifications = await getMyVerifications(req.user._id);
  res.json({ success: true, data: verifications });
});

export const exportCredential = asyncHandler(async (req, res) => {
  const credential = await exportVerifiedCredential(req.params.id, req.user._id);
  res.setHeader("Content-Type", "application/ld+json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="nexuswork-credential-${req.params.id}.vc.jsonld"`);
  res.json(credential);
});

export const exportCredentialCard = asyncHandler(async (req, res) => {
  const credential = await exportVerifiedCredential(req.params.id, req.user._id);
  const pdfBuffer = await renderCredentialCardPdf(credential);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="nexuswork-credential-card-${req.params.id}.pdf"`);
  res.send(pdfBuffer);
});

export const verifyCredential = asyncHandler(async (req, res) => {
  const credential = req.body?.credential ?? req.body;
  if (!credential || typeof credential !== "object" || Array.isArray(credential)) {
    throw new ValidationError("Submit a credential JSON object to verify");
  }

  const result = verifyCredentialProof(credential);
  const subject = credential.credentialSubject ?? {};
  const achievement = subject.achievement ?? {};

  res.json({
    success: true,
    data: {
      ...result,
      issuer: credential.issuer?.name || null,
      subject: subject.name || null,
      credentialName: achievement.name || credential.name || null,
      issuedAt: credential.validFrom || credential.proof?.created || null,
      verificationMethod: credential.proof?.verificationMethod || null,
      status: credential.credentialStatus?.status || null,
      skills: Array.isArray(achievement.alignment)
        ? achievement.alignment.map((skill) => ({
            name: skill.name,
            category: skill.category,
            level: skill.level,
          }))
        : [],
    },
  });
});

export const getAll = asyncHandler(async (req, res) => {
  const verifications = await listVerifications({
    status: req.query.status,
    limit: req.query.limit,
    skip: req.query.skip,

    requesterId: req.user._id,
    requesterRole: req.user.role,
  });
  res.json({ success: true, data: verifications });
});

export const stats = asyncHandler(async (req, res) => {
  const result = await getVerificationStats({
    requesterId: req.user._id,
    requesterRole: req.user.role,
  });
  res.json({ success: true, data: result });
});

export const review = asyncHandler(async (req, res) => {
  requireFields(req.body, ["decision"]);
  const verification = await reviewVerification({
    verificationId: req.params.id,
    reviewerId: req.user._id,
    reviewerRole: req.user.role,
    decision: req.body.decision,
    rejectionReason: req.body.rejection_reason,
  });
  res.json({ success: true, data: verification });
});

export const certifySkill = asyncHandler(async (req, res) => {
  requireFields(req.body, ["skill_name"]);
  const profile = await certifyStudentSkill({
    studentUserId: req.params.userId,
    skillName: req.body.skill_name,
    staffUserId: req.user._id,
    staffRole: req.user.role,
  });
  res.json({ success: true, data: profile });
});
