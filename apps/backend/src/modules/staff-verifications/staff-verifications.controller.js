import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { requireFields } from "../../shared/validators/validate.js";
import {
  submitStaffVerification,
  getMyStaffVerifications,
  listStaffVerifications,
  getStaffVerificationStats,
  reviewStaffVerification,
} from "./staff-verifications.service.js";

export const requestStaffVerification = asyncHandler(async (req, res) => {
  requireFields(req.body, ["university_id", "full_name", "job_title", "department", "document_file_id"]);
  const verification = await submitStaffVerification({
    userId: req.user._id,
    userEmail: req.user.email,
    universityId: req.body.university_id,
    fullName: req.body.full_name,
    jobTitle: req.body.job_title,
    department: req.body.department,
    documentFileId: req.body.document_file_id,
  });
  res.status(201).json({ success: true, data: verification });
});

export const getMine = asyncHandler(async (req, res) => {
  const verifications = await getMyStaffVerifications(req.user._id);
  res.json({ success: true, data: verifications });
});

export const getAll = asyncHandler(async (req, res) => {
  const verifications = await listStaffVerifications({
    status: req.query.status,
    limit: req.query.limit,
    skip: req.query.skip,
  });
  res.json({ success: true, data: verifications });
});

export const stats = asyncHandler(async (req, res) => {
  const result = await getStaffVerificationStats();
  res.json({ success: true, data: result });
});

export const review = asyncHandler(async (req, res) => {
  requireFields(req.body, ["decision"]);
  const verification = await reviewStaffVerification({
    verificationId: req.params.id,
    reviewerId: req.user._id,
    reviewerRole: req.user.role,
    decision: req.body.decision,
    rejectionReason: req.body.rejection_reason,
  });
  res.json({ success: true, data: verification });
});
