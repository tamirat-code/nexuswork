export function validateUpdateMe(payload) {
  const errors = [];
  if (payload.name !== undefined) {
    if (typeof payload.name !== "string" || payload.name.trim().length === 0) errors.push("name");
    if (payload.name && payload.name.length > 200) errors.push("name_length");
  }
  if (payload.email !== undefined) {
    if (typeof payload.email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) errors.push("email");
  }
  if (payload.headline !== undefined && typeof payload.headline !== "string") errors.push("headline");
  if (payload.bio !== undefined && typeof payload.bio !== "string") errors.push("bio");
  if (payload.skills !== undefined && typeof payload.skills !== "string") errors.push("skills");

  if (errors.length) {
    const err = new Error(`Invalid profile fields: ${errors.join(",")}`);
    err.status = 400;
    throw err;
  }
}
