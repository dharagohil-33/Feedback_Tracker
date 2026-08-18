import { z } from 'zod';

export const feedbackSubmissionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  source: z.enum(['manual', 'file', 'integration']).default('manual'),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
});

export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>;
