import test from "node:test";
import assert from "node:assert/strict";
import {
  getCompletenessFields,
  profileCompleteness,
  validateProfile,
} from "../src/features/profile/profile.utils.js";

test("getCompletenessFields returns role-specific fields", () => {
  const studentFields = getCompletenessFields("student").map((f) => f.key);
  const clientFields = getCompletenessFields("client").map((f) => f.key);
  const staffFields = getCompletenessFields("university_staff").map((f) => f.key);
  const adminFields = getCompletenessFields("admin").map((f) => f.key);

  assert.deepEqual(studentFields, [
    "name",
    "email",
    "headline",
    "bio",
    "location",
    "university",
    "skills",
    "website",
  ]);

  assert.deepEqual(clientFields, [
    "name",
    "email",
    "headline",
    "bio",
    "location",
    "website",
  ]);
  assert.equal(clientFields.includes("university"), false);
  assert.equal(clientFields.includes("skills"), false);

  assert.deepEqual(staffFields, [
    "name",
    "email",
    "headline",
    "bio",
    "location",
    "university",
    "website",
  ]);
  assert.equal(staffFields.includes("skills"), false);

  assert.deepEqual(adminFields, ["name", "email", "headline"]);
});

test("profileCompleteness reaches 100% for client without student fields", () => {
  const clientForm = {
    name: "Acme Corp Client",
    email: "client@acme.com",
    headline: "Hiring Manager",
    bio: "We build great software and hire top student talent.",
    location: "Addis Ababa",
    website: "https://acme.com",
    // university and skills are missing, but not required for clients
  };

  const result = profileCompleteness(clientForm, "client");
  assert.equal(result.percent, 100);
  assert.equal(result.done, 6);
  assert.equal(result.missing.length, 0);
});

test("profileCompleteness reaches 100% for admin with core identity fields", () => {
  const adminForm = {
    name: "System Admin",
    email: "admin@nexuswork.com",
    headline: "Platform Administrator",
  };

  const result = profileCompleteness(adminForm, "admin");
  assert.equal(result.percent, 100);
  assert.equal(result.done, 3);
  assert.equal(result.missing.length, 0);
});

test("validateProfile ignores inactive fields for role", () => {
  const clientForm = {
    name: "Valid Client",
    email: "client@acme.com",
    headline: "Manager",
    skills: "x".repeat(300), // Exceeds limit, but inactive for client role
  };

  const errors = validateProfile(clientForm, "client");
  assert.equal(errors.name, undefined);
  assert.equal(errors.email, undefined);
  assert.equal(errors.skills, undefined);
});
