import { z } from "zod";

// --- Shared primitives ---
export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");
export const optionalObjectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")
  .optional()
  .nullable();

export const objectIdParamsSchema = (key = "id") => z.object({ [key]: objectId });

export const email = z.string().trim().toLowerCase().email("Invalid email address");
export const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

export const name = z.string().trim().min(1, "Name is required").max(120, "Name is too long");
export const role = z.enum(["student", "client", "university_staff", "admin"]);
export const positiveNumber = z.coerce.number().positive("Must be a positive number");
export const nonNegativeNumber = z.coerce.number().min(0, "Must be zero or greater");
export const url = z.string().trim().url("Invalid URL").optional().nullable();

// --- Auth ---
export const registerSchema = z
  .object({
    email,
    password,
    name,
    role,
    termsAccepted: z.boolean().refine((v) => v === true, "Terms must be accepted"),
    recaptchaToken: z.string().min(1, "reCAPTCHA token is required"),
    // Phone and all role-specific profile details (university, student ID,
    // program, enrollment status, organization name) are optional at signup —
    // collected later from account settings so registration stays quick.
    phone: z.string().trim().max(30).regex(/^[+0-9()\-\s]+$/, "Invalid phone number").optional().or(z.literal("")),
    university_id: optionalObjectId,
    student_id_number: z.string().trim().max(50).optional(),
    program: z.string().trim().max(150).optional(),
    enrollment_status: z.enum(["enrolled", "graduated", "on_leave", "unknown"]).optional(),
    organizationName: z.string().trim().max(200).optional(),
    organizationType: z
      .enum(["individual", "company", "university_department", "ngo", "government"])
      .optional(),
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});
export const mfaCodeSchema = z.object({
  token: z.string().min(1, "MFA token is required"),
  code: z
    .string()
    .trim()
    .regex(
      /^(?:\d{6}|[A-Fa-f0-9]{5}-[A-Fa-f0-9]{5})$/,
      "Enter a 6-digit code or recovery code"
    ),
});
export const googleAuthSchema = z
  .object({
    credential: z.string().min(1, "Google credential is required"),
    recaptchaToken: z.string().min(1, "reCAPTCHA token is required"),
    phone: z.string().trim().min(7).max(30).regex(/^[+0-9()\-\s]+$/, "Invalid phone number").optional(),
    role: z.string().optional(),
    termsAccepted: z.boolean().optional(),
    organizationName: z.string().trim().max(200).optional(),
    organizationType: z
      .enum(["individual", "company", "university_department", "ngo", "government"])
      .optional(),
    // Role-specific profile details are optional at signup for Google sign-in
    // too — completed later from account settings.
    university_id: optionalObjectId,
    student_id_number: z.string().trim().max(50).optional(),
    program: z.string().trim().max(150).optional(),
    enrollment_status: z.enum(["enrolled", "graduated", "on_leave", "unknown"]).optional(),
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: password,
});

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: password,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

// --- Users ---
export const updateUserSchema = z.object({
  name: name.optional(),
  avatar_url: url,
  phone: z.string().trim().max(30).optional().nullable(),
  bio: z.string().trim().max(2000).optional(),
});

// --- Students ---
export const updateStudentProfileSchema = z.object({
  bio: z.string().trim().max(2000).optional(),
  university_id: optionalObjectId,
  enrollment_status: z.enum(["enrolled", "graduated", "on_leave", "unknown"]).optional(),
  student_id_number: z.string().trim().max(50).optional(),
  program: z.string().trim().max(150).optional(),
  skills: z
    .array(
      z.object({
        category: z.string().trim().max(100).optional().default(""),
        name: z.string().trim().min(1, "Skill name is required").max(100),
        level: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
        verification_method: z
          .enum(["self_declared", "assessment", "university_certified"])
          .optional()
          .default("self_declared"),
      })
    )
    .max(100, "Too many skills")
    .optional(),
});

// --- Clients ---
export const updateClientProfileSchema = z.object({
  organization_name: z.string().trim().min(1).max(200).optional(),
  organization_type: z.string().trim().max(100).optional(),
  website: url,
  description: z.string().trim().max(2000).optional(),
  contact_email: email.optional(),
});

export const addPosterSchema = z.object({
  user_id: objectId,
});

export const reviewClientVerificationSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  rejection_reason: z.string().trim().max(500).optional(),
});

export const requestWithdrawalSchema = z.object({
  amount: positiveNumber,
});

export const chapaPayoutDetailsSchema = z.object({
  bank_code: z.string().trim().min(1).max(30),
  account_name: z.string().trim().min(2).max(150),
  account_number: z.string().trim().regex(/^\d{5,30}$/, "Account number must contain 5 to 30 digits"),
});

// --- Universities ---
export const createUniversitySchema = z.object({
  name: z.string().trim().min(1, "University name is required").max(200),
  domain: z.string().trim().min(1, "Domain is required").max(200),
  contact_staff: z.array(objectId).optional().default([]),
});

// --- Verifications ---
// Identity/enrollment evidence a student must supply for university staff to review.
// email_domain is intentionally NOT accepted from the client — it's derived server-side
// from the authenticated user's own account email so it can't be spoofed.
export const submitVerificationSchema = z.object({
  university_id: objectId,
  full_name: z
    .string()
    .trim()
    .min(2, "Full legal name (as it appears on your ID) is required")
    .max(150),
  student_id_number: z
    .string()
    .trim()
    .min(1, "Student ID number is required")
    .max(50),
  program: z.string().trim().min(1, "Program / field of study is required").max(150),
  document_file_id: objectId, // required: identity/enrollment evidence must be uploaded first via /files/upload
});

export const reviewVerificationSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  rejection_reason: z.string().trim().max(500).optional(),
});

// --- Staff verifications ---
// university_id is intentionally NOT accepted from the client — it's derived
// server-side from the authenticated user's own account email domain, so a
// staff registrant can't file a request against a university their email
// has no relationship to. See staff-verifications.service.js.
export const submitStaffVerificationSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Full legal name (as it appears on your ID) is required")
    .max(150),
  job_title: z.string().trim().min(1, "Job title is required").max(150),
  department: z.string().trim().min(1, "Department is required").max(150),
  document_file_id: objectId, // required: staff ID / HR letter must be uploaded first via /files/upload
});

export const reviewStaffVerificationSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  rejection_reason: z.string().trim().max(500).optional(),
});

// --- Skills ---
export const createSkillSchema = z.object({
  name: z.string().trim().min(1, "Skill name is required").max(100),
  slug: z.string().trim().min(1, "Slug is required").max(100),
  category: z.string().trim().max(100).optional().default(""),
  description: z.string().trim().max(1000).optional().default(""),
  proposal_price_floor_minor_by_level: z.object({
    beginner: z.coerce.number().int().min(0).optional(),
    intermediate: z.coerce.number().int().min(0).optional(),
    advanced: z.coerce.number().int().min(0).optional(),
    expert: z.coerce.number().int().min(0).optional(),
  }).optional(),
});

export const updateSkillSchema = createSkillSchema.partial();

// --- Categories ---
export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100),
  slug: z.string().trim().min(1, "Slug is required").max(100),
  description: z.string().trim().max(1000).optional().default(""),
  icon: z.string().trim().max(100).optional().default(""),
  sort_order: z.coerce.number().int().optional().default(0),
  is_active: z.coerce.boolean().optional().default(true),
  proposal_price_floor_minor: z.coerce.number().int().min(0).optional().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

// --- Projects ---
const projectFieldsSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(10000),
  required_skills: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  required_skill_ids: z.array(objectId).max(50).optional(),
  budget: positiveNumber,
  budget_type: z.enum(["fixed", "range"]).optional(),
  budget_min: positiveNumber.optional(),
  budget_max: positiveNumber.optional(),
  currency: z.enum(["USD", "ETB"]).optional(),
  deadline: z.coerce.date("Invalid deadline"),
  category: z.string().trim().max(100).optional(),
  experience_level: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
  attachments: z.array(objectId).optional(),
  // If the caller is a designated additional poster (see clients module),
  // this attributes the project to the org owner's account instead of
  // their own. Ignored (and unnecessary) when posting for yourself.
  on_behalf_of_client_id: optionalObjectId,
});

function validateProjectBudget(value, context) {
  if (value.budget_type === "range") {
    if (value.budget_min === undefined || value.budget_max === undefined) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["budget_min"], message: "Both range budget values are required" });
    } else if (value.budget_min > value.budget_max) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["budget_max"], message: "Maximum budget must be at least the minimum" });
    }
  }
}

export const createProjectSchema = projectFieldsSchema.superRefine(validateProjectBudget);

export const updateProjectSchema = projectFieldsSchema.partial().superRefine(validateProjectBudget);

// --- Proposals ---
export const submitProposalSchema = z.object({
  project_id: objectId,
  price: positiveNumber,
  delivery_time_days: z.coerce.number().int().positive("Delivery time must be positive"),
  cover_note: z.string().trim().min(10, "Cover note must be at least 10 characters").max(5000),
});

// --- Contracts ---
export const createContractSchema = z.object({
  proposal_id: objectId,
});

// --- Milestones ---
export const createMilestoneSchema = z.object({
  title: z.string().trim().min(1, "Milestone title is required").max(200),
  amount: positiveNumber,
  due_date: z.coerce.date("Invalid due date"),
  description: z.string().trim().max(2000).optional().default(""),
  max_revisions: z.coerce.number().int().min(0).max(20).optional().default(3),
});

export const submitWorkSchema = z.object({
  file_url: url.optional(),
  file_ids: z.array(objectId).max(10, "A submission can contain at most 10 files").optional().default([]),
  note: z.string().trim().max(5000).optional().default(""),
});

export const meetingCreateSchema = z.object({
  contract_id: objectId,
  milestone_id: optionalObjectId,
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().default(""),
  scheduled_start: z.coerce.date(),
  scheduled_end: z.coerce.date().optional().nullable(),
});
export const meetingUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  scheduled_start: z.coerce.date().optional(),
  scheduled_end: z.coerce.date().optional().nullable(),
}).refine((v) => Object.keys(v).length > 0, "At least one field is required");

// --- Submissions ---
export const createSubmissionSchema = z.object({
  file_url: url.optional(),
  file_ids: z.array(objectId).max(10, "A submission can contain at most 10 files").optional().default([]),
  note: z.string().trim().max(5000).optional().default(""),
});

export const requestRevisionSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Revision reason must be at least 3 characters")
    .max(2000, "Revision reason is too long"),
});

// --- Reviews ---
export const createReviewSchema = z.object({
  reviewee_id: objectId,
  rating: z.coerce.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  text: z.string().trim().max(2000).optional().default(""),
});

// --- Disputes ---
export const openDisputeSchema = z.object({
  reason: z.string().trim().min(10, "Reason must be at least 10 characters").max(2000),
});

export const submitSkillCertificationRequestSchema = z.object({
  skill_name: z.string().trim().min(1).max(100),
  evidence_file_id: objectId,
  assessment_method: z.enum(["practical_assessment", "portfolio_review", "coursework_linkage"]),
  course_name: z.string().trim().max(200).optional(),
  course_code: z.string().trim().max(50).optional(),
  course_completed_at: z.coerce.date().optional(),
  student_notes: z.string().trim().min(20, "Explain what the evidence demonstrates in at least 20 characters").max(2000),
}).superRefine((value, context) => {
  if (value.assessment_method === "coursework_linkage" && !value.course_name) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["course_name"], message: "Course name is required for coursework evidence" });
  }
});

export const reviewSkillCertificationRequestSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  assessment_score: z.coerce.number().min(0).max(100).optional(),
  review_notes: z.string().trim().min(10, "Review notes must be at least 10 characters").max(2000),
});

export const resolveDisputeSchema = z.object({
  outcome: z.enum(["refund_client", "release_student", "resume_work"]),
  resolution_summary: z.string().trim().min(10, "Resolution summary must be at least 10 characters").max(2000),
});

// --- Messaging ---
export const sendMessageSchema = z.object({
  body: z.string().trim().min(1, "Message body is required").max(5000),
  attachments: z.array(objectId).optional().default([]),
});

// --- Portfolios ---
export const createPortfolioItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional().default(""),
  project_url: url,
  image_url: url,
  file_id: optionalObjectId,
  tags: z.array(z.string().trim().min(1).max(50)).max(30).optional().default([]),
  is_published: z.boolean().optional().default(true),
});

export const updatePortfolioItemSchema = createPortfolioItemSchema.partial();

export const milestoneConsentSchema = z.object({
  decision: z.enum(["approved", "denied"]),
});

// --- Invoices ---
export const createInvoiceSchema = z.object({
  contract_id: objectId,
  milestone_id: optionalObjectId,
  amount: positiveNumber,
  line_items: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(500),
        quantity: z.coerce.number().int().positive().default(1),
        unit_price: positiveNumber,
      })
    )
    .min(1, "At least one line item is required")
    .max(100),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
});

// --- Learning ---
export const createLearningResourceSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional().default(""),
  type: z.enum(["course", "article", "video", "certification"]).optional().default("course"),
  url: url,
  skills: z.array(z.string().trim().min(1).max(100)).max(50).optional().default([]),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
});

export const updateLearningResourceSchema = createLearningResourceSchema.partial();

// --- Notifications (internal creation) ---
export const createNotificationSchema = z.object({
  user_id: objectId,
  type: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(2000).optional().default(""),
  data: z.record(z.unknown()).optional().default({}),
});

// --- Admin ---
export const adminActionSchema = z.object({
  reason: z.string().trim().min(3, "Reason is required").max(500),
});

export const updateUserRoleSchema = z.object({
  new_role: role,
  reason: z.string().trim().min(3, "Reason is required").max(500),
});

export const resolveAdminDisputeSchema = z.object({
  resolution: z.string().trim().min(10, "Resolution must be at least 10 characters").max(2000),
  outcome: z.enum(["refund_client", "release_student", "resume_work"]),
});

// --- Analytics ---
export const trackEventSchema = z.object({
  event_type: z.string().trim().min(1).max(100),
  entity_type: z.string().trim().max(100).optional().default(""),
  entity_id: optionalObjectId,
  metadata: z.record(z.unknown()).optional().default({}),
});

// --- Query params (shared) ---
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  skip: z.coerce.number().int().min(0).optional().default(0),
  status: z.string().trim().max(50).optional(),
  search: z.string().trim().max(200).optional(),
  role: role.optional(),
  days: z.coerce.number().int().min(1).max(365).optional(),
});
