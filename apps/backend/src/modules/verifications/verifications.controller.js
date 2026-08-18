import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import {
  submitVerification,
  getMyVerifications,
  listVerifications,
  getVerificationStats,
  reviewVerification,
  certifyStudentSkill,
} from "./verifications.service.js";

export const requestVerification = asyncHandler(async (req, res) => {
  requireFields(req.body, ["university_id"]);
  const verification = await submitVerification({
    userId: req.user._id,
    universityId: req.body.university_id,
    emailDomain: req.body.email_domain,
    documentFileId: req.body.document_file_id,
  });
  res.status(201).json({ success: true, data: verification });
});

export const getMine = asyncHandler(async (req, res) => {
  const verifications = await getMyVerifications(req.user._id);
  res.json({ success: true, data: verifications });
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