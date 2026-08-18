import { supabaseAdmin } from './supabase/supabaseClient.js';
import { AppError } from '../utils/errors.js';

export async function getDashboardMetrics(_userId: string) {
  // Query all feedback items in workspace
  const { data: feedbackData, error: fbErr } = await supabaseAdmin
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (fbErr) {
    throw new AppError(`Failed to fetch dashboard feedback: ${fbErr.message}`, 500);
  }

  // Query all action items in workspace
  const { data: actionsData, error: actErr } = await supabaseAdmin
    .from('actions')
    .select('*');

  if (actErr) {
    throw new AppError(`Failed to fetch dashboard actions: ${actErr.message}`, 500);
  }

  const items = feedbackData || [];
  const actions = actionsData || [];

  const totalFeedback = items.length;
  const positiveFeedback = items.filter((i) => i.sentiment === 'positive').length;
  const negativeFeedback = items.filter((i) => i.sentiment === 'negative').length;
  const highPriority = items.filter((i) => i.priority === 'high' || i.priority === 'critical').length;
  const unresolvedFeedback = items.filter((i) => i.status !== 'resolved' && i.status !== 'closed').length;

  const openActions = actions.filter((a) => a.status === 'open' || a.status === 'in_progress').length;
  const completedActions = actions.filter((a) => a.status === 'completed').length;

  // Format recent 5 feedback items
  const recentlyAddedFeedback = items.slice(0, 5).map((row) => ({
    id: row.id,
    title: row.title || '',
    customerName: row.customer_name || '',
    customerEmail: row.customer_email || '',
    category: row.category || 'other',
    status: row.status || 'new',
    sentiment: row.sentiment || 'neutral',
    priority: row.priority || 'medium',
    createdAt: row.created_at,
  }));

  return {
    metrics: {
      totalFeedback,
      positiveFeedback,
      negativeFeedback,
      highPriority,
      openActions,
      completedActions,
      unresolvedFeedback,
    },
    recentlyAddedFeedback,
  };
}
