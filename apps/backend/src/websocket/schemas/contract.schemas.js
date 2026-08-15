import { z } from "zod";

export const joinSchema = z.string().min(1);

export const attachmentSchema = z.object({
  url: z.string().url(),
  name: z.string().optional(),
});

export const messageSendSchema = z.object({
  contract_id: z.string().min(1),
  body: z.string().min(1),
  attachments: z.array(attachmentSchema).optional(),
});
