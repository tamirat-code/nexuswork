import StudentProfile from "./students.model.js";

export async function getProfileByUserId(userId) {
  return StudentProfile.findOne({ user_id: userId });
}

export async function updateProfile(userId, updates) {
  const allowed = ["bio", "skills", "university_id", "enrollment_status"];
  const patch = {};
  for (const key of allowed) if (updates[key] !== undefined) patch[key] = updates[key];
  return StudentProfile.findOneAndUpdate({ user_id: userId }, patch, { new: true });
}
