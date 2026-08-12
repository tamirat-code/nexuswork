import { isValidEmail } from "../../utils/validation.utils.js";

/** Fields that make up a complete, trustworthy public profile. */
export const COMPLETENESS_FIELDS = [
  { key: "name", label: "Full name" },
  { key: "email", label: "Email address" },
  { key: "headline", label: "Professional headline" },
  { key: "bio", label: "Short bio" },
  { key: "location", label: "Location" },
  { key: "university", label: "University" },
  { key: "skills", label: "Skills" },
  { key: "website", label: "Portfolio or website link" },
];

const filled = (value) => typeof value === "string" && value.trim().length > 0;


export function profileCompleteness(form) {
  const missing = COMPLETENESS_FIELDS.filter((f) => !filled(form?.[f.key]));
  const done = COMPLETENESS_FIELDS.length - missing.length;
  return {
    done,
    total: COMPLETENESS_FIELDS.length,
    percent: Math.round((done / COMPLETENESS_FIELDS.length) * 100),
    missing,
  };
}

const LIMITS = { name: 100, headline: 120, bio: 600, location: 120, university: 140, skills: 200, website: 200 };

/** Client-side mirror of the API contract: required fields, lengths, formats. */
export function validateProfile(form) {
  const errors = {};

  if (!filled(form.name)) errors.name = "Enter your full name.";
  else if (form.name.trim().length < 2) errors.name = "Name must be at least 2 characters.";
  else if (form.name.length > LIMITS.name) errors.name = `Keep your name under ${LIMITS.name} characters.`;

  if (!filled(form.email)) errors.email = "Enter your email address.";
  else if (!isValidEmail(form.email.trim())) errors.email = "Enter a valid email address, e.g. you@university.edu.";

  for (const key of ["headline", "bio", "location", "university", "skills"]) {
    if (form[key] && form[key].length > LIMITS[key]) {
      errors[key] = `Keep this under ${LIMITS[key]} characters.`;
    }
  }

  if (filled(form.website)) {
    const url = form.website.trim();
    const ok = /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(url);
    if (!ok) errors.website = "Use a full link starting with https://";
    else if (url.length > LIMITS.website) errors.website = `Keep the link under ${LIMITS.website} characters.`;
  }

  return errors;
}

export const PROFILE_LIMITS = LIMITS;
