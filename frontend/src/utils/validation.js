import { z } from "zod";

// Base schemas
const baseSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  middleName: z.string().optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .regex(/^\+251[0-9]{9}$/, "Enter a valid Ethiopian phone number (+251...)"),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  dateOfBirth: z.string().refine((date) => {
    const age = new Date().getFullYear() - new Date(date).getFullYear();
    return age >= 16 && age <= 100;
  }, "You must be at least 16 years old"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  profilePicture: z.any().optional(),
});

const studentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  university: z.string().min(1, "University is required"),
  college: z.string().min(1, "College is required"),
  department: z.string().min(1, "Department is required"),
  program: z.string().min(1, "Program is required"),
  yearOfStudy: z.number().min(1).max(8, "Invalid year of study"),
  graduationYear: z.number().min(2024).max(2035),
  cgpa: z.number().min(0).max(4).optional(),
  githubProfile: z
    .string()
    .url("Invalid GitHub URL")
    .optional()
    .or(z.literal("")),
  linkedinProfile: z
    .string()
    .url("Invalid LinkedIn URL")
    .optional()
    .or(z.literal("")),
  portfolioWebsite: z
    .string()
    .url("Invalid portfolio URL")
    .optional()
    .or(z.literal("")),
});

const clientSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  companyEmail: z.string().email("Invalid company email"),
  industry: z.string().min(1, "Industry is required"),
  companyWebsite: z
    .string()
    .url("Invalid website URL")
    .optional()
    .or(z.literal("")),
  companySize: z.string().min(1, "Company size is required"),
  jobTitle: z.string().min(1, "Job title is required"),
});

const universityStaffSchema = z.object({
  staffId: z.string().min(1, "Staff ID is required"),
  university: z.string().min(1, "University is required"),
  faculty: z.string().min(1, "Faculty is required"),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
  officialEmail: z.string().email("Invalid official email"),
});
const adminSchema = z.object({
  adminCode: z
    .string()
    .min(1, "Admin access code is required")
    .refine((code) => code === "NEXUS2026", {
      message: "Invalid admin access code. Contact the platform owner.",
    }),
  adminTitle: z.string().min(1, "Job title is required"),
});

const securitySchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const agreementSchema = z.object({
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Terms of Service" }),
  }),
  agreeToPrivacy: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Privacy Policy" }),
  }),
  emailUpdates: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
});

export const getSchemaForStep = (step, role) => {
  switch (step) {
    case 0:
      return z.object({
        accountType: z.enum(["student", "client", "university_staff", "admin"]),
      });
    case 1:
      return baseSchema;
    case 2:
      if (role === "student") return studentSchema;
      if (role === "client") return clientSchema;
      if (role === "admin") return adminSchema; // ← ADD THIS
      return universityStaffSchema;
    case 3:
      return securitySchema;
    case 4:
      return agreementSchema;
    default:
      return z.object({});
  }
};

export const calculatePasswordStrength = (password) => {
  if (!password) return { score: 0, label: "Too weak", color: "bg-red-500" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Too weak", color: "bg-red-500", textColor: "text-red-500" },
    { label: "Weak", color: "bg-orange-500", textColor: "text-orange-500" },
    { label: "Fair", color: "bg-yellow-500", textColor: "text-yellow-500" },
    { label: "Good", color: "bg-teal-500", textColor: "text-teal-500" },
    { label: "Strong", color: "bg-emerald-500", textColor: "text-emerald-500" },
    { label: "Excellent", color: "bg-green-500", textColor: "text-green-500" },
  ];

  return { score, ...levels[score] };
};
