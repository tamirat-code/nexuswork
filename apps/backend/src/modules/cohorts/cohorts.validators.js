import { z } from "zod";
import { objectId } from "../../shared/validators/schemas.js";

export const createCohortSchema = z.object({
  name: z.string().trim().min(2).max(200),
  institution_id: objectId.optional().nullable(),
  organization_id: objectId,
  seats: z.coerce.number().int().min(1).max(10000),
  skill_ids: z.array(objectId).max(50).default([]),
  application_deadline: z.coerce.date(),
  description: z.string().trim().min(10).max(5000),
  total_amount: z.coerce.number().min(0),
  currency: z.enum(["USD", "ETB"]).default("USD"),
  delivery_time_days: z.coerce.number().int().min(1).max(3650),
  milestone_title: z.string().trim().min(2).max(200).optional(),
  status: z.enum(["draft", "open"]).default("draft"),
});

export const cohortIdParamsSchema = z.object({ cohortId: objectId });
export const cohortApplicationParamsSchema = z.object({ cohortId: objectId, applicationId: objectId });
