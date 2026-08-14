import { z } from "zod";

// --- Shared primitives ---
export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");
export const optionalObjectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")
  .optional()
  .nullable();

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
export const registerSchema = z.object({
  email,
  password,
  name,
  role,
  termsAccepted: z.boolean().refine((v) => v === true, "Terms must be accepted"),
  recaptchaToken: z.string().min(1, "reCAPTCHA token is required"),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, "Google credential is required"),
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

// --- Universities ---
export const createUniversitySchema = z.object({
  name: z.string().trim().min(1, "University name is required").max(200),
  domain: z.string().trim().min(1, "Domain is required").max(200),
  contact_staff: z.array(objectId).optional().default([]),
});

// --- Verifications ---
export const submitVerificationSchema = z.object({
  university_id: objectId,
  email_domain: z.string().trim().max(200).optional(),
  document_file_id: optionalObjectId,
});

export const reviewVerificationSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  rejection_reason: z.string().trim().max(500).optional(),
});

// --- Skills ---
export const createSkillSchema = z.object({
  name: z.string().trim().min(1, "Skill name is required").max(100),
  slug: z.string().trim().min(1, "Slug is required").max(100),
  category: z.string().trim().max(100).optional().default(""),
  description: z.string().trim().max(1000).optional().default(""),
});

export const updateSkillSchema = createSkillSchema.partial();

// --- Categories ---
export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100),
  slug: z.string().trim().min(1, "Slug is required").max(100),
  description: z.string().trim().max(1000).optional().default(""),
});

export const updateCategorySchema = createCategorySchema.partial();

// --- Projects ---
export const createProjectSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(10000),
  required_skills: z.array(z.string().trim().min(1).max(100)).max(50).optional().default([]),
  budget: positiveNumber,
  deadline: z.coerce.date("Invalid deadline"),
  category: z.string().trim().max(100).optional(),
  experience_level: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
  attachments: z.array(objectId).optional().default([]),
});

export const updateProjectSchema = createProjectSchema.partial();

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
});

export const submitWorkSchema = z.object({
  file_url: url,
  note: z.string().trim().max(2000).optional(),
});

// --- Submissions ---
export const createSubmissionSchema = z.object({
  file_url: url,
  note: z.string().trim().max(2000).optional(),
});

// --- Reviews ---
export const createReviewSchema = z.object({
  reviewee_id: objectId,
  rating: z.coerce.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  text: z.string().trim().max(2000).optional().default(""),
});

// --- Disputes ---
export const openDisputeSchema = z.object({
  milestone_id: objectId,
  reason: z.string().trim().min(10, "Reason must be at least 10 characters").max(2000),
});

export const resolveDisputeSchema = z.object({
  outcome: z.enum(["refund_client", "release_student"]),
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
  outcome: z.string().trim().min(1).max(100),
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