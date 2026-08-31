import { isValidEmail } from "../../utils/validation.utils.js";

/** Returns the fields that define a complete, trustworthy profile for a specific user role. */
export function getCompletenessFields(role = "student") {
  switch (role) {
    case "client":
      return [
        { key: "name", label: "Full name" },
        { key: "email", label: "Email address" },
        { key: "headline", label: "Job title or position" },
        { key: "bio", label: "Company description" },
        { key: "location", label: "Location" },
        { key: "website", label: "Company website URL" },
      ];
    case "university_staff":
      return [
        { key: "name", label: "Full name" },
        { key: "email", label: "Email address" },
        { key: "headline", label: "Job title or role" },
        { key: "bio", label: "Department description" },
        { key: "location", label: "Campus location" },
        { key: "university", label: "University" },
        { key: "website", label: "Department webpage URL" },
      ];
    case "admin":
      return [
        { key: "name", label: "Full name" },
        { key: "email", label: "Email address" },
        { key: "headline", label: "Admin title" },
      ];
    case "student":
    default:
      return [
        { key: "name", label: "Full name" },
        { key: "email", label: "Email address" },
        { key: "headline", label: "Professional headline" },
        { key: "bio", label: "Short bio" },
        { key: "location", label: "Location" },
        { key: "university", label: "University" },
        { key: "skills", label: "Skills" },
        { key: "website", label: "Portfolio or website link" },
      ];
  }
}

/** Legacy default list for backward compatibility. */
export const COMPLETENESS_FIELDS = getCompletenessFields("student");

const filled = (value) => typeof value === "string" && value.trim().length > 0;

export function profileCompleteness(form, role = "student") {
  const fields = getCompletenessFields(role);
  const missing = fields.filter((f) => !filled(form?.[f.key]));
  const done = fields.length - missing.length;
  return {
    done,
    total: fields.length,
    percent: fields.length > 0 ? Math.round((done / fields.length) * 100) : 100,
    missing,
  };
}

const LIMITS = { name: 100, headline: 120, bio: 600, location: 120, university: 140, skills: 200, website: 200 };

/** Client-side mirror of the API contract: required fields, lengths, formats tailored by role. */
export function validateProfile(form, role = "student") {
  const errors = {};

  if (!filled(form.name)) errors.name = "Enter your full name.";
  else if (form.name.trim().length < 2) errors.name = "Name must be at least 2 characters.";
  else if (form.name.length > LIMITS.name) errors.name = `Keep your name under ${LIMITS.name} characters.`;

  if (!filled(form.email)) errors.email = "Enter your email address.";
  else if (!isValidEmail(form.email.trim())) errors.email = "Enter a valid email address, e.g. you@example.com.";

  const activeFields = getCompletenessFields(role).map((f) => f.key);

  for (const key of ["headline", "bio", "location", "university", "skills"]) {
    if (activeFields.includes(key) && form[key] && form[key].length > LIMITS[key]) {
      errors[key] = `Keep this under ${LIMITS[key]} characters.`;
    }
  }

  if (activeFields.includes("website") && filled(form.website)) {
    const url = form.website.trim();
    const ok = /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(url);
    if (!ok) errors.website = "Use a full link starting with https://";
    else if (url.length > LIMITS.website) errors.website = `Keep the link under ${LIMITS.website} characters.`;
  }

  return errors;
}

export const PROFILE_LIMITS = LIMITS;
