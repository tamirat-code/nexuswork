import User from "./users.model.js";

export async function findByEmail(email) {
  return User.findOne({ email: email.toLowerCase() });
}

export async function getPublicProfile(userId) {
  const user = await User.findById(userId);
  if (!user) return null;
  const { _id, name, email, role, status } = user;
  return { id: _id, name, email, role, status };
}
