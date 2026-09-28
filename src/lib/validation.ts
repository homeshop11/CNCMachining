import { z } from 'zod';

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

export const attachmentSchema = z.object({
  name: z.string().trim().min(1).max(255),
  size: z.number().int().min(1).max(MAX_ATTACHMENT_SIZE),
  mimeType: z.enum([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
  ]),
});

export const inquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  company: z.string().trim().min(2).max(160),
  country: z.string().trim().max(80).optional().default(''),
  productLine: z
    .enum(['cnc-machining', 'cnc-turning', 'cnc-milling', '5-axis-machining', 'sheet-metal'])
    .optional()
    .default('cnc-machining'),
  message: z.string().trim().min(10).max(5000),
  consent: z.literal(true),
  turnstileToken: z.string().trim().max(2048).optional().default(''),
  attachments: z.array(attachmentSchema).max(5).optional().default([]),
  website: z.string().trim().max(0).optional().default(''),
});

export type InquiryPayload = z.infer<typeof inquirySchema>;
