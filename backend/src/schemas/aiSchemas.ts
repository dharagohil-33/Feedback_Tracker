import { z } from 'zod';
import { FEEDBACK_CATEGORIES } from './feedbackSchemas.js';

export const AI_FEEDBACK_TYPES = [
  'bug',
  'feature_request',
  'complaint',
  'suggestion',
  'positive_feedback',
  'general_feedback',
] as const;

export const AI_SENTIMENTS = ['positive', 'neutral', 'negative'] as const;

export const AI_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

export const aiInsightSchema = z.object({
  insightText: z.string().min(1),
  insightType: z.string().default('General Insight'),
  confidence: z.number().min(0).max(1).default(0.9),
});

export const aiFeatureRequestSchema = z.object({
  featureDescription: z.string().min(1),
  reason: z.string().default('Customer requested capability'),
  customerImpact: z.string().default('Medium impact'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

export const aiAnalysisResponseSchema = z.object({
  summary: z.string().min(1, 'Summary cannot be empty'),
  category: z.enum(FEEDBACK_CATEGORIES).default('Other'),
  feedbackType: z.enum(AI_FEEDBACK_TYPES).default('general_feedback'),
  sentiment: z.enum(AI_SENTIMENTS).default('neutral'),
  priority: z.enum(AI_PRIORITIES).default('medium'),
  productArea: z.string().default('Core Application'),
  keyInsights: z.array(aiInsightSchema).default([]),
  featureRequests: z.array(aiFeatureRequestSchema).default([]),
  risks: z.array(z.string()).default([]),
  recommendedActions: z.array(z.string()).default([]),
});

export type AiInsight = z.infer<typeof aiInsightSchema>;
export type AiFeatureRequest = z.infer<typeof aiFeatureRequestSchema>;
export type AiAnalysisResponse = z.infer<typeof aiAnalysisResponseSchema>;
