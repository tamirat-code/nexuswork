import StudentProfile from "./students.model.js";

export async function getProfileByUserId(userId) {
  return StudentProfile.findOne({ user_id: userId });
}

export async function updateProfile(userId, updates) {
  const allowed = ["bio", "skills", "university_id", "enrollment_status"];
  const patch = {};
  for (const key of allowed) if (updates[key] !== undefined) patch[key] = updates[key];

  if (patch.skills) {
    const existing = await StudentProfile.findOne({ user_id: userId }).lean();
    const existingByName = new Map((existing?.skills || []).map((s) => [String(s.name).toLowerCase(), s]));

    
    patch.skills = patch.skills.map((skill) => {
      const prior = existingByName.get(String(skill.name).toLowerCase());
      if (prior && prior.verification_method && prior.verification_method !== "self_declared") {
        return {
          ...skill,
          verification_method: prior.verification_method,
          certified_by: prior.certified_by,
          certified_at: prior.certified_at,
        };
      }
      return { ...skill, verification_method: "self_declared", certified_by: undefined, certified_at: undefined };
    });
  }

  return StudentProfile.findOneAndUpdate({ user_id: userId }, patch, { new: true });
}