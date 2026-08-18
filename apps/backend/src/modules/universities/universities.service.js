import University from "./universities.model.js";

export async function listUniversities() {
  return University.find().sort({ name: 1 });
}

export async function getMyUniversity(userId) {
  return University.findOne({ contact_staff: userId });
}

export async function createUniversity({ name, domain }) {
  return University.create({ name, domain });
}