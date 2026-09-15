import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import {
  getProfileByUserId,
  updateProfile,
  listStudentDirectory,
  getPublicStudentProfile,
  getTalentApiConsent,
  updateTalentApiConsent,
} from "./students.service.js";

export const listStudents = asyncHandler(async (req, res) => {
  const students = await listStudentDirectory({
    search: req.query.search,
    department: req.query.department,
    limit: req.query.limit,
    skip: req.query.skip,
  });
  res.json({ success: true, data: students });
});
export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await getProfileByUserId(req.user._id);
  res.json({ success: true, data: profile });
});

export const getStudentProfile = asyncHandler(async (req, res) => {
  const profile = await getPublicStudentProfile(req.params.id);
  res.json({ success: true, data: profile });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await updateProfile(req.user._id, req.body);
  res.json({ success: true, data: profile });
});

export const getMyTalentApiConsent = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getTalentApiConsent(req.user._id) });
});

export const updateMyTalentApiConsent = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await updateTalentApiConsent(req.user._id, req.body) });
});
