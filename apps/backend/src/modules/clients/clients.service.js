import ClientProfile from "./clients.model.js";

export async function getOrCreateProfile(userId) {
  let profile = await ClientProfile.findOne({ user_id: userId });
  if (!profile) profile = await ClientProfile.create({ user_id: userId });
  return profile;
}

export async function updateProfile(userId, updates) {
  const allowed = ["organization_name", "organization_type"];
  const patch = {};
  for (const key of allowed) if (updates[key] !== undefined) patch[key] = updates[key];
  return ClientProfile.findOneAndUpdate({ user_id: userId }, patch, { new: true, upsert: true });
}
