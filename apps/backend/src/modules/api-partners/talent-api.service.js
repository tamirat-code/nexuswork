import crypto from "node:crypto";
import mongoose from "mongoose";
import StudentProfile, { TALENT_API_CONSENT_FIELDS } from "../students/students.model.js";
import User from "../users/users.model.js";
import "../universities/universities.model.js";
import { recordEvent } from "../audit-logs/audit-logs.service.js";
import { ValidationError } from "../../shared/exceptions/AppError.js";

const DEFAULT_FIELDS = ["name", "skills", "verification"];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function regex(value) {
  return new RegExp(escapeRegex(value), "i");
}

function commaValues(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseObjectIds(value, label) {
  const values = commaValues(value);
  const invalid = values.find((item) => !mongoose.isValidObjectId(item));
  if (invalid) throw new ValidationError(`${label} contains an invalid identifier`);
  return values.map((item) => new mongoose.Types.ObjectId(item));
}

function requestedFields(value) {
  const fields = commaValues(value);
  const selected = fields.length ? [...new Set(fields)] : DEFAULT_FIELDS;
  const invalid = selected.find((field) => !TALENT_API_CONSENT_FIELDS.includes(field));
  if (invalid) throw new ValidationError(`Unsupported Talent API field: ${invalid}`);
  return selected;
}

function addIds(target, rows) {
  for (const row of rows) target.add(String(row.user_id || row._id));
}

function buildUserTextQuery(values) {
  return values.flatMap((value) => [
    { name: regex(value) },
    { university: regex(value) },
    { skills: regex(value) },
  ]);
}

function projectTalent(profile, fields) {
  const consented = new Set(profile.talent_api_consent?.fields || []);
  const allowed = new Set(fields.filter((field) => consented.has(field)));
  const user = profile.user_id;
  const result = { student_id: String(user?._id || profile.user_id) };

  if (allowed.has("name") && user?.name) result.name = user.name;
  if (allowed.has("skills")) {
    result.skills = (profile.skills || []).map((skill) => ({
      name: skill.name,
      category: skill.category || "",
      level: skill.level || null,
    }));
  }
  if (allowed.has("verification")) {
    result.verification = {
      status: profile.verification_status,
      skill_methods: [...new Set((profile.skills || []).map((skill) => skill.verification_method).filter(Boolean))],
    };
  }
  if (allowed.has("institution") && profile.university_id) {
    result.institution = {
      id: String(profile.university_id._id),
      name: profile.university_id.name,
    };
  }
  if (allowed.has("program")) result.program = profile.program || "";
  if (allowed.has("bio")) result.bio = profile.bio || "";

  return { result, fields: [...allowed] };
}

export async function searchTalent({ partner, query = {}, req }) {
  const q = String(query.q || "").trim();
  const skillValues = commaValues(query.skills);
  const institutionIds = parseObjectIds(query.institution_ids, "institution_ids");
  const fields = requestedFields(query.fields);
  const limit = Number(query.limit || 20);
  const skip = Number(query.skip || 0);

  const profileScope = {
    verification_status: "verified",
    "talent_api_consent.enabled": true,
  };
  if (institutionIds.length) profileScope.university_id = { $in: institutionIds };

  const candidateSets = [];
  if (q) {
    const [profileMatches, userMatches] = await Promise.all([
      StudentProfile.find({
        ...profileScope,
        $or: [{ program: regex(q) }, { bio: regex(q) }, { "skills.name": regex(q) }],
      }).select("user_id").lean(),
      User.find({ role: "student", status: "active", $or: buildUserTextQuery([q]) }).select("_id").lean(),
    ]);
    const qMatches = new Set();
    addIds(qMatches, profileMatches);
    addIds(qMatches, userMatches);
    candidateSets.push(qMatches);
  }

  if (skillValues.length) {
    const profileMatches = await StudentProfile.find({
      ...profileScope,
      skills: { $all: skillValues.map(regex) },
    }).select("user_id").lean();
    const userSkillQuery = {
      role: "student",
      status: "active",
      $and: skillValues.map((skill) => ({ skills: regex(skill) })),
    };
    const userMatches = await User.find(userSkillQuery).select("_id").lean();
    const skillMatches = new Set();
    addIds(skillMatches, profileMatches);
    addIds(skillMatches, userMatches);
    candidateSets.push(skillMatches);
  }

  const activeUserQuery = { role: "student", status: "active" };
  if (candidateSets.length) {
    const [first, ...rest] = candidateSets;
    const matchingUserIds = [...first].filter((id) => rest.every((set) => set.has(id)));
    activeUserQuery._id = { $in: matchingUserIds };
  }
  const activeUsers = await User.find(activeUserQuery).select("_id").lean();
  const profileQuery = { ...profileScope, user_id: { $in: activeUsers.map((user) => user._id) } };

  const [profiles, total] = await Promise.all([
    StudentProfile.find(profileQuery)
      .populate({ path: "user_id", select: "name role status", match: { role: "student", status: "active" } })
      .populate("university_id", "name")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    StudentProfile.countDocuments(profileQuery),
  ]);

  const results = [];
  const returnedFields = new Set();
  for (const profile of profiles) {
    if (!profile.user_id) continue;
    const projected = projectTalent(profile, fields);
    projected.fields.forEach((field) => returnedFields.add(field));
    results.push(projected.result);
  }

  await recordEvent({
    actor: { role: "system" },
    eventType: "partner_api_read",
    action: "partner_api.talent_search",
    entityType: "partner_api_call",
    entityId: partner._id,
    correlationId: req?.correlationId || req?.requestId || crypto.randomUUID(),
    requestId: req?.requestId || req?.correlationId,
    metadata: {
      partner_id: String(partner._id),
      endpoint: req?.originalUrl || "/partner/v1/talent/search",
      method: req?.method || "GET",
      fields_requested: fields,
      fields_returned: [...returnedFields],
      result_count: results.length,
      requested_total: total,
      filters: {
        q: q || undefined,
        skills: skillValues,
        institution_ids: institutionIds.map(String),
      },
    },
  });

  return {
    results,
    total,
    limit,
    skip,
    consent_policy: {
      verified_students_only: true,
      explicit_talent_api_consent_required: true,
      fields_are_field_level: true,
    },
  };
}
