import "dotenv/config";
import Project from "./projects.model.js";
import Skill from "../skills/skills.model.js";
import { connectDB } from "../../config/database.config.js";

const apply = process.env.MIGRATION_APPROVED === "true";
const limit = Math.max(1, Math.min(Number(process.env.MIGRATION_LIMIT) || 1000, 10000));

function normalized(value) {
  return String(value || "").trim().toLowerCase();
}

await connectDB();
const projects = await Project.find({
  required_skills: { $exists: true, $ne: [] },
  $or: [{ required_skill_ids: { $exists: false } }, { required_skill_ids: { $size: 0 } }],
}).select("_id required_skills").limit(limit).lean();

let matched = 0;
let skipped = 0;
for (const project of projects) {
  const names = [...new Set((project.required_skills || []).map(normalized).filter(Boolean))];
  const skills = await Skill.find({
    is_active: true,
    $or: [{ name: { $in: project.required_skills } }, { slug: { $in: names } }],
  }).select("_id name slug").lean();
  const keys = new Set(skills.flatMap((skill) => [normalized(skill.name), normalized(skill.slug)]));
  if (!names.every((name) => keys.has(name)) || skills.length !== names.length) {
    skipped += 1;
    continue;
  }
  matched += 1;
  if (apply) {
    await Project.updateOne(
      { _id: project._id, $or: [{ required_skill_ids: { $exists: false } }, { required_skill_ids: { $size: 0 } }] },
      { $set: { required_skill_ids: skills.map((skill) => skill._id) } }
    );
  }
}

console.log(`[project-skill-migration] mode=${apply ? "apply" : "dry-run"} scanned=${projects.length} matched=${matched} skipped=${skipped}`);
await import("mongoose").then(({ default: mongoose }) => mongoose.disconnect());
