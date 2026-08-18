import { supabaseAdmin } from './supabase/supabaseClient.js';
import { AppError } from '../utils/errors.js';

export async function getInsightsAnalytics(_userId: string) {
  // Query all workspace feedback items
  const { data: feedbackData, error: fbErr } = await supabaseAdmin
    .from('feedback')
    .select('*');

  if (fbErr) {
    throw new AppError(`Failed to fetch feedback for insights: ${fbErr.message}`, 500);
  }

  const items = feedbackData || [];
  const feedbackIds = items.map((i) => i.id);

  // Query associated insights & feature requests
  let insightsData: Record<string, unknown>[] = [];
  let featureData: Record<string, unknown>[] = [];

  if (feedbackIds.length > 0) {
    const [{ data: insights }, { data: features }] = await Promise.all([
      supabaseAdmin.from('feedback_insights').select('*').in('feedback_id', feedbackIds),
      supabaseAdmin.from('feature_requests').select('*').in('feedback_id', feedbackIds),
    ]);
    insightsData = (insights as Record<string, unknown>[]) || [];
    featureData = (features as Record<string, unknown>[]) || [];
  }

  // Query open actions
  const { data: actionsData } = await supabaseAdmin
    .from('actions')
    .select('*')
    .neq('status', 'completed');

  // Category distribution
  const categoryCounts: Record<string, number> = {};
  items.forEach((i) => {
    const cat = (i.category as string) || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const feedbackByCategory = Object.entries(categoryCounts).map(([category, count]) => ({ category, count }));

  // Sentiment distribution
  const sentimentCounts: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };
  items.forEach((i) => {
    const sent = (i.sentiment as string) || 'neutral';
    sentimentCounts[sent] = (sentimentCounts[sent] || 0) + 1;
  });
  const feedbackBySentiment = Object.entries(sentimentCounts).map(([sentiment, count]) => ({ sentiment, count }));

  // Source distribution
  const sourceCounts: Record<string, number> = {};
  items.forEach((i) => {
    const src = (i.source as string) || 'Direct Feedback';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });
  const feedbackBySource = Object.entries(sourceCounts).map(([source, count]) => ({ source, count }));

  // Most common product issues (from feedback_insights)
  const mostCommonIssues = insightsData.slice(0, 15).map((ins) => ({
    id: ins.id as string,
    feedbackId: (ins.feedback_id as string) || '',
    insightText: (ins.insight_text as string) || '',
    insightType: (ins.insight_type as string) || 'Issue',
    confidence: ins.confidence ? Number(ins.confidence) : 0.9,
  }));

  // Most requested features (from feature_requests)
  const mostRequestedFeatures = featureData.slice(0, 15).map((fr) => ({
    id: fr.id as string,
    feedbackId: (fr.feedback_id as string) || '',
    title: (fr.title as string) || (fr.feature_description as string) || '',
    description: (fr.description as string) || (fr.feature_description as string) || '',
    priority: (fr.priority as string) || 'medium',
  }));

  // High priority feedback
  const highPriorityFeedback = items
    .filter((i) => i.priority === 'high' || i.priority === 'critical')
    .slice(0, 5)
    .map((i) => ({
      id: i.id,
      title: i.title,
      customerName: i.customer_name,
      category: i.category,
      priority: i.priority,
    }));

  // Open actions
  const openActions = (actionsData || []).slice(0, 5).map((a) => ({
    id: a.id,
    description: a.description,
    owner: a.owner,
    priority: a.priority,
    status: a.status,
  }));

  return {
    feedbackByCategory,
    feedbackBySentiment,
    feedbackBySource,
    mostCommonIssues,
    mostRequestedFeatures,
    highPriorityFeedback,
    openActions,
  };
}
