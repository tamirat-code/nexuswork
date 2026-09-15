import { z } from "zod";
import { objectId } from "../../shared/validators/schemas.js";

const domain = z.string().trim().toLowerCase().regex(/^(?=.{1,200}$)(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/, "Invalid domain");
const email = z.string().trim().toLowerCase().email("Invalid email address");

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(200),
  institution_id: objectId.optional().nullable(),
  billing_mode: z.enum(["escrow", "consolidated_invoice"]).optional().default("escrow"),
});

export const inviteMemberSchema = z.object({
  email,
  role: z.enum(["admin", "recruiter", "billing_viewer"]),
});

export const updateMemberSchema = z.object({
  role: z.enum(["admin", "recruiter", "billing_viewer"]),
});

export const onboardingRequestSchema = z.object({
  institutionName: z.string().trim().min(2).max(200),
  domain,
  contactName: z.string().trim().min(2).max(150),
  contactEmail: email,
  contactTitle: z.string().trim().min(2).max(150),
  evidence_file_id: objectId,
});

export const onboardingDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().trim().max(500).optional(),
});

export const organizationMemberParamsSchema = z.object({
  organizationId: objectId,
  userId: objectId,
});
