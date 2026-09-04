import University from "./universities.model.js";
import StudentProfile from "../students/students.model.js";
import StaffVerification from "../staff-verifications/staff-verifications.model.js";
import Verification from "../verifications/verifications.model.js";
import SkillCertificationRequest from "../verifications/skill-certification-request.model.js";
import { NotFoundError, ValidationError } from "../../shared/exceptions/AppError.js";

export async function listUniversities() {
  return University.find().sort({ name: 1 });
}

export async function getMyUniversity(userId) {
  return University.findOne({ contact_staff: userId });
}

export async function createUniversity({ name, domain }) {
  return University.create({ name, domain: domain.toLowerCase() });
}

export async function updateUniversity(id, updates) {
  const university = await University.findById(id);
  if (!university) throw new NotFoundError("University not found");
  if (updates.name !== undefined) university.name = updates.name;
  if (updates.domain !== undefined) university.domain = updates.domain.toLowerCase();
  try {
    await university.save();
  } catch (error) {
    if (error?.code === 11000) throw new ValidationError("That email domain is already registered");
    throw error;
  }
  return university;
}

export async function deleteUniversity(id) {
  const university = await University.findById(id).lean();
  if (!university) throw new NotFoundError("University not found");

  const [students, staffVerifications, verifications, skillRequests] = await Promise.all([
    StudentProfile.countDocuments({ university_id: id }),
    StaffVerification.countDocuments({ university_id: id }),
    Verification.countDocuments({ university_id: id }),
    SkillCertificationRequest.countDocuments({ university_id: id }),
  ]);
  if (university.contact_staff?.length || students || staffVerifications || verifications || skillRequests) {
    throw new ValidationError("This university cannot be deleted because it has linked users or verification records. Update it instead.");
  }
  await University.findByIdAndDelete(id);
  return { deleted: true };
}
