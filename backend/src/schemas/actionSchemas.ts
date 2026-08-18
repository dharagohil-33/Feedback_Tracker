import { z } from 'zod';

export const ACTION_PRIORITIES = ['Low', 'Medium', 'High'] as const;
export const ACTION_STATUSES = ['Open', 'In Progress', 'Blocked', 'Completed'] as const;

export const createActionSchema = z.object({
  feedbackId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Action description is required'),
  owner: z.string().trim().default('Unassigned'),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(ACTION_PRIORITIES).default('Medium'),
  status: z.enum(ACTION_STATUSES).default('Open'),
});

export const updateActionSchema = z.object({
  description: z.string().min(1).optional(),
  owner: z.string().trim().optional(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(ACTION_PRIORITIES).optional(),
  status: z.enum(ACTION_STATUSES).optional(),
});

export const actionQuerySchema = z.object({
  feedbackId: z.string().uuid().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
});

export type CreateActionInput = z.infer<typeof createActionSchema>;
export type UpdateActionInput = z.infer<typeof updateActionSchema>;
export type ActionQueryInput = z.infer<typeof actionQuerySchema>;
