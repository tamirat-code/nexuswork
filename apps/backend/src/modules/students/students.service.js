
import StudentProfile from "./students.model.js";
import User from "../users/users.model.js";

export async function getProfileByUserId(userId) {
  return StudentProfile.findOne({ user_id: userId });
}


export async function listStudentDirectory({ search = "", limit = 24, skip = 0 } = {}) {
  const userQuery = { role: "student", status: "active" };
  if (search) {
    userQuery.$or = [
      { name: { $regex: search, $options: "i" } },
      { university: { $regex: search, $options: "i" } },
      { skills: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(userQuery)
    .select("name university location avatarUrl skills")
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Number(limit))
    .lean();

  const profiles = await StudentProfile.find({ user_id: { $in: users.map((u) => u._id) } })
    .select("user_id verification_status skills")
    .lean();
  const profileByUserId = new Map(profiles.map((p) => [String(p.user_id), p]));

  return users.map((u) => {
    const profile = profileByUserId.get(String(u._id));
    const skills = profile?.skills?.length
      ? profile.skills
      : (u.skills || "")
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean)
          .map((name) => ({ name }));

    return {
      _id: u._id,
      name: u.name,
      university: u.university,
      location: u.location,
      avatar: u.avatarUrl,
      verification_status: profile?.verification_status || "pending",
      skills,
    };
  });
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