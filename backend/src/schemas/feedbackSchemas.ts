import { z } from 'zod';

export const FEEDBACK_SOURCES = [
  'Customer Support',
  'Survey',
  'Product Review',
  'Sales Team',
  'Direct Feedback',
  'Internal Team',
  'Other',
] as const;

export const FEEDBACK_CATEGORIES = [
  'Bug',
  'Feature Request',
  'Usability',
  'Performance',
  'Billing',
  'Customer Service',
  'Product Experience',
  'Other',
] as const;

export const FEEDBACK_STATUSES = [
  'Open',
  'In Progress',
  'Resolved',
] as const;

export const createFeedbackSchema = z.object({
  title: z
    .string({ required_error: 'Feedback title is required' })
    .trim()
    .min(1, 'Feedback title cannot be empty')
    .max(255, 'Title cannot exceed 255 characters'),
  customerName: z
    .string({ required_error: 'Customer name is required' })
    .trim()
    .min(1, 'Customer name cannot be empty'),
  customerEmail: z
    .string({ required_error: 'Customer email is required' })
    .trim()
    .email('Please enter a valid email address'),
  feedbackDate: z
    .string({ required_error: 'Feedback date is required' })
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid feedback date format' }),
  source: z.enum(FEEDBACK_SOURCES, {
    errorMap: () => ({ message: 'Invalid feedback source selected' }),
  }),
  category: z.enum(FEEDBACK_CATEGORIES, {
    errorMap: () => ({ message: 'Invalid feedback category selected' }),
  }),
  status: z.enum(FEEDBACK_STATUSES, {
    errorMap: () => ({ message: 'Invalid feedback status selected' }),
  }).default('Open'),
  content: z
    .string({ required_error: 'Feedback content is required' })
    .trim()
    .min(1, 'Feedback content cannot be empty'),
  inputType: z.enum(['text', 'file']).default('text'),
  fileName: z.string().optional().nullable(),
  filePath: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  fileData: z.string().optional().nullable(),
});

export const updateFeedbackSchema = createFeedbackSchema.partial();

export const feedbackQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  page: z.union([z.string(), z.number()]).optional().transform((val) => (val ? Number(val) : 1)),
  limit: z.union([z.string(), z.number()]).optional().transform((val) => (val ? Number(val) : 20)),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
export type FeedbackQueryInput = z.infer<typeof feedbackQuerySchema>;
