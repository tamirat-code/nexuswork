
import StudentProfile from "./students.model.js";
import User from "../users/users.model.js";
import Contract from "../contracts/contracts.model.js";
import { NotFoundError } from "../../shared/exceptions/AppError.js";

export async function getProfileByUserId(userId) {
  return StudentProfile.findOne({ user_id: userId });
}


export async function getPublicStudentProfile(userId) {
  const user = await User.findOne({ _id: userId, role: "student", status: "active" })
    .select("name headline bio location university skills website avatarUrl universityVerified createdAt")
    .lean();
  if (!user) throw new NotFoundError("Student not found");

  const profile = await StudentProfile.findOne({ user_id: userId }).lean();
  const [totalContracts, completedContracts] = await Promise.all([
    Contract.countDocuments({ student_id: userId }),
    Contract.countDocuments({ student_id: userId, status: "completed" }),
  ]);

  const skills = profile?.skills?.length
    ? profile.skills
    : (user.skills || "")
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => ({ name, verification_method: "self_declared" }));

  return {
    _id: user._id,
    name: user.name,
    headline: user.headline || "",
    bio: profile?.bio || user.bio || "",
    location: user.location || "",
    university: user.university || "",
    website: user.website || "",
    avatar: user.avatarUrl,
    universityVerified: !!user.universityVerified,
    verification_status: profile?.verification_status || "pending",
    enrollment_status: profile?.enrollment_status || "unknown",
    program: profile?.program || "",
    skills,
    memberSince: user.createdAt,
    totalContracts,
    completedContracts,
  };
}


const DEPARTMENT_KEYWORDS = {
  cs: ["computer science"],
  software: ["software engineering", "software"],
  it: ["information technology"],
  is: ["information systems"],
};

export async function listStudentDirectory({ search = "", department = "", limit = 24, skip = 0 } = {}) {
  const userQuery = { role: "student", status: "active" };
  if (search) {
    userQuery.$or = [
      { name: { $regex: search, $options: "i" } },
      { university: { $regex: search, $options: "i" } },
      { skills: { $regex: search, $options: "i" } },
    ];
  }

  if (department && department !== "all") {
    const keywords = DEPARTMENT_KEYWORDS[department] || [department];
    const pattern = keywords.map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const matchingProfiles = await StudentProfile.find({ program: { $regex: pattern, $options: "i" } })
      .select("user_id")
      .lean();
    const matchingUserIds = matchingProfiles.map((p) => p.user_id);
    userQuery._id = { $in: matchingUserIds };
  }

  const users = await User.find(userQuery)
    .select("name university location avatarUrl skills")
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Number(limit))
    .lean();

  const profiles = await StudentProfile.find({ user_id: { $in: users.map((u) => u._id) } })
    .select("user_id verification_status skills program")
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
      department: profile?.program || "",
      verification_status: profile?.verification_status || "pending",
      skills,
    };
  });
}

export async function updateProfile(userId, updates) {
  const allowed = ["bio", "skills", "university_id", "enrollment_status", "student_id_number", "program"];
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
          evidence_file_id: prior.evidence_file_id,
          assessment_method: prior.assessment_method,
          assessment_score: prior.assessment_score,
          assessment_notes: prior.assessment_notes,
        };
      }
      return { ...skill, verification_method: "self_declared", certified_by: undefined, certified_at: undefined };
    });
  }

  return StudentProfile.findOneAndUpdate({ user_id: userId }, patch, { new: true });
}
