import { supabaseAdmin } from './supabase/supabaseClient.js';
import { CreateFeedbackInput, UpdateFeedbackInput, FeedbackQueryInput } from '../schemas/feedbackSchemas.js';
import { analyzeFeedbackContent } from './aiService.js';
import { AppError, NotFoundError } from '../utils/errors.js';

// Enum Translation Mappers
const sourceToDb: Record<string, string> = {
  'Customer Support': 'customer_support',
  'Survey': 'survey',
  'Product Review': 'product_review',
  'Sales Team': 'sales_team',
  'Direct Feedback': 'direct_feedback',
  'Internal Team': 'internal_team',
  'Other': 'other',
};

const dbToSource: Record<string, string> = {
  customer_support: 'Customer Support',
  survey: 'Survey',
  product_review: 'Product Review',
  sales_team: 'Sales Team',
  direct_feedback: 'Direct Feedback',
  internal_team: 'Internal Team',
  other: 'Other',
};

const categoryToDb: Record<string, string> = {
  'Bug': 'bug',
  'Feature Request': 'feature_request',
  'Usability': 'usability',
  'Performance': 'performance',
  'Billing': 'billing',
  'Customer Service': 'customer_service',
  'Product Experience': 'product_experience',
  'Other': 'other',
};

const dbToCategory: Record<string, string> = {
  bug: 'Bug',
  feature_request: 'Feature Request',
  usability: 'Usability',
  performance: 'Performance',
  billing: 'Billing',
  customer_service: 'Customer Service',
  product_experience: 'Product Experience',
  other: 'Other',
};

const statusToDb: Record<string, string> = {
  'Open': 'new',
  'In Progress': 'in_progress',
  'Resolved': 'resolved',
};

const dbToStatus: Record<string, string> = {
  new: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

const feedbackTypeToDb: Record<string, string> = {
  bug: 'bug_report',
  bug_report: 'bug_report',
  feature_request: 'feature_request',
  complaint: 'complaint',
  suggestion: 'suggestion',
  positive_feedback: 'positive_feedback',
  general_feedback: 'general_feedback',
};

const priorityToDb: Record<string, string> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'high',
};

function formatFeedbackRecord(
  row: Record<string, unknown>,
  insights: Record<string, unknown>[] = [],
  featureRequests: Record<string, unknown>[] = []
) {
  return {
    id: row.id as string,
    title: (row.title as string) || '',
    customerName: (row.customer_name as string) || '',
    customerEmail: (row.customer_email as string) || '',
    feedbackDate: (row.feedback_date as string) || (row.created_at as string),
    source: dbToSource[row.source as string] || (row.source as string) || 'Direct Feedback',
    content: (row.content as string) || '',
    category: dbToCategory[row.category as string] || (row.category as string) || 'Other',
    status: dbToStatus[row.status as string] || (row.status as string) || 'Open',
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    inputType: (row.input_type as 'text' | 'file') || 'text',
    fileName: (row.file_name as string) || null,
    filePath: (row.file_path as string) || null,
    fileSize: row.file_size ? Number(row.file_size) : null,
    mimeType: (row.mime_type as string) || null,
    // AI fields
    summary: (row.summary as string) || null,
    feedbackType: (row.feedback_type as string) || null,
    sentiment: (row.sentiment as string) || null,
    priority: (row.priority as string) || 'medium',
    productArea: (row.product_area as string) || null,
    aiStatus: (row.ai_status as string) || 'pending',
    aiProcessedAt: (row.ai_processed_at as string) || null,
    // Related AI entities
    keyInsights: insights.map((i) => ({
      id: i.id as string,
      insightText: (i.insight_text as string) || '',
      insightType: (i.insight_type as string) || 'General Insight',
      confidence: i.confidence ? Number(i.confidence) : 0.9,
    })),
    featureRequests: featureRequests.map((f) => ({
      id: f.id as string,
      title: (f.title as string) || (f.feature_description as string) || '',
      description: (f.description as string) || (f.feature_description as string) || '',
      reason: (f.reason as string) || 'Customer request',
      customerImpact: (f.customer_impact as string) || 'Medium impact',
      priority: (f.priority as string) || 'medium',
      status: (f.status as string) || 'new',
    })),
  };
}

export async function listUserFeedback(_userId: string, query: FeedbackQueryInput) {
  let builder = supabaseAdmin
    .from('feedback')
    .select('*', { count: 'exact' });

  // Server-side search across title, customer_name, customer_email, content
  if (query.search && query.search.trim() !== '') {
    const term = `%${query.search.trim()}%`;
    builder = builder.or(`title.ilike.${term},customer_name.ilike.${term},customer_email.ilike.${term},content.ilike.${term}`);
  }

  // Filter by Category
  if (query.category && query.category !== 'All') {
    const dbCat = categoryToDb[query.category] || query.category.toLowerCase().replace(/\s+/g, '_');
    builder = builder.eq('category', dbCat);
  }

  // Filter by Status
  if (query.status && query.status !== 'All') {
    const dbStat = statusToDb[query.status] || query.status.toLowerCase().replace(/\s+/g, '_');
    builder = builder.eq('status', dbStat);
  }

  // Filter by Source
  if (query.source && query.source !== 'All') {
    const dbSrc = sourceToDb[query.source] || query.source.toLowerCase().replace(/\s+/g, '_');
    builder = builder.eq('source', dbSrc);
  }

  // Pagination
  const page = query.page || 1;
  const limit = query.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  builder = builder.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await builder;

  if (error) {
    throw new AppError(`Failed to fetch feedback: ${error.message}`, 500);
  }

  return {
    items: (data || []).map((row) => formatFeedbackRecord(row as Record<string, unknown>)),
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function getFeedbackById(_userId: string, feedbackId: string) {
  const { data, error } = await supabaseAdmin
    .from('feedback')
    .select('*')
    .eq('id', feedbackId)
    .maybeSingle();

  if (error || !data) {
    throw new NotFoundError('Feedback record not found');
  }

  // Fetch associated insights & feature requests
  const [{ data: insights }, { data: featureRequests }] = await Promise.all([
    supabaseAdmin.from('feedback_insights').select('*').eq('feedback_id', feedbackId),
    supabaseAdmin.from('feature_requests').select('*').eq('feedback_id', feedbackId),
  ]);

  return formatFeedbackRecord(
    data as Record<string, unknown>,
    (insights as Record<string, unknown>[]) || [],
    (featureRequests as Record<string, unknown>[]) || []
  );
}

export async function createFeedback(userId: string, input: CreateFeedbackInput) {
  // Ensure profile row exists in public.profiles to fulfill foreign key constraint
  try {
    await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, email: input.customerEmail || 'user@company.com', updated_at: new Date().toISOString() }, { onConflict: 'id' });
  } catch (_err) {
    // Fallback if profile exists
  }

  const insertData: Record<string, unknown> = {
    title: input.title,
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    feedback_date: input.feedbackDate ? new Date(input.feedbackDate).toISOString() : new Date().toISOString(),
    source: sourceToDb[input.source] || 'direct_feedback',
    content: input.content,
    category: categoryToDb[input.category] || 'other',
    status: statusToDb[input.status] || 'new',
    created_by: userId,
    input_type: input.inputType || 'text',
    file_name: input.fileName || null,
    file_path: input.filePath || null,
    file_size: input.fileSize || null,
    mime_type: input.mimeType || null,
    ai_status: 'pending',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('feedback')
    .insert(insertData)
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError(`Failed to create feedback: ${error?.message || 'Database error'}`, 400);
  }

  return formatFeedbackRecord(data as Record<string, unknown>);
}

export async function updateFeedback(userId: string, feedbackId: string, input: UpdateFeedbackInput) {
  await getFeedbackById(userId, feedbackId);

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) updateData.title = input.title;
  if (input.customerName !== undefined) updateData.customer_name = input.customerName;
  if (input.customerEmail !== undefined) updateData.customer_email = input.customerEmail;
  if (input.feedbackDate !== undefined) updateData.feedback_date = new Date(input.feedbackDate).toISOString();
  if (input.source !== undefined) updateData.source = sourceToDb[input.source] || input.source;
  if (input.category !== undefined) updateData.category = categoryToDb[input.category] || input.category;
  if (input.status !== undefined) updateData.status = statusToDb[input.status] || input.status;
  if (input.content !== undefined) updateData.content = input.content;

  const { data, error } = await supabaseAdmin
    .from('feedback')
    .update(updateData)
    .eq('id', feedbackId)
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError(`Failed to update feedback: ${error?.message || 'Database error'}`, 400);
  }

  return formatFeedbackRecord(data as Record<string, unknown>);
}

export async function deleteFeedback(userId: string, feedbackId: string) {
  await getFeedbackById(userId, feedbackId);

  // Cascading cleanups for associated entities
  await Promise.all([
    supabaseAdmin.from('feedback_insights').delete().eq('feedback_id', feedbackId),
    supabaseAdmin.from('feature_requests').delete().eq('feedback_id', feedbackId),
    supabaseAdmin.from('actions').delete().eq('feedback_id', feedbackId),
    supabaseAdmin.from('internal_notes').delete().eq('feedback_id', feedbackId),
  ]);

  const { error } = await supabaseAdmin.from('feedback').delete().eq('id', feedbackId);

  if (error) {
    throw new AppError(`Failed to delete feedback record: ${error.message}`, 400);
  }

  return { success: true, id: feedbackId };
}

export async function analyzeFeedback(userId: string, feedbackId: string) {
  // Fetch feedback item
  const { data: fbData, error: fbErr } = await supabaseAdmin
    .from('feedback')
    .select('*')
    .eq('id', feedbackId)
    .maybeSingle();

  if (fbErr || !fbData) {
    throw new NotFoundError('Feedback record not found for AI analysis');
  }

  // Update status to processing
  await supabaseAdmin
    .from('feedback')
    .update({ ai_status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', feedbackId);

  try {
    // Invoke OpenAI via backend service
    const aiResult = await analyzeFeedbackContent(fbData.title || '', fbData.content || '');

    // Map AI priority & feedback type to DB enums
    const dbPriority = priorityToDb[aiResult.priority.toLowerCase()] || 'medium';
    const dbFeedbackType = feedbackTypeToDb[aiResult.feedbackType.toLowerCase()] || 'general_feedback';
    const dbCategory = categoryToDb[aiResult.category] || fbData.category || 'other';

    // Update feedback record with AI results
    const { data: updatedFb, error: updateErr } = await supabaseAdmin
      .from('feedback')
      .update({
        summary: aiResult.summary,
        category: dbCategory,
        feedback_type: dbFeedbackType,
        sentiment: aiResult.sentiment.toLowerCase(),
        priority: dbPriority,
        product_area: aiResult.productArea,
        ai_status: 'completed',
        ai_processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', feedbackId)
      .select('*')
      .single();

    if (updateErr) {
      throw new AppError(`Failed saving AI analysis to feedback: ${updateErr.message}`, 500);
    }

    // Clear old insights & feature requests to support re-analysis without duplicates
    await Promise.all([
      supabaseAdmin.from('feedback_insights').delete().eq('feedback_id', feedbackId),
      supabaseAdmin.from('feature_requests').delete().eq('feedback_id', feedbackId),
    ]);

    // Insert new Key Insights
    let insertedInsights: Record<string, unknown>[] = [];
    if (aiResult.keyInsights && aiResult.keyInsights.length > 0) {
      const insightRows = aiResult.keyInsights.map((insight: Record<string, unknown> | string) => ({
        feedback_id: feedbackId,
        insight_text: typeof insight === 'string' ? insight : ((insight.insightText as string) || (insight.text as string) || ''),
        insight_type: (typeof insight === 'object' && (insight.insightType as string)) || 'General Insight',
        confidence: (typeof insight === 'object' && insight.confidence) ? Number(insight.confidence) : 0.95,
      }));
      const { data: insData } = await supabaseAdmin.from('feedback_insights').insert(insightRows).select('*');
      insertedInsights = (insData as Record<string, unknown>[]) || [];
    }

    // Insert new Feature Requests
    let insertedFeatures: Record<string, unknown>[] = [];
    if (aiResult.featureRequests && aiResult.featureRequests.length > 0) {
      const featureRows = aiResult.featureRequests.map((req: Record<string, unknown>) => ({
        feedback_id: feedbackId,
        title: (req.title as string) || (req.featureDescription as string) || '',
        description: (req.description as string) || (req.featureDescription as string) || '',
        feature_description: (req.featureDescription as string) || (req.description as string) || '',
        reason: (req.reason as string) || 'Customer request',
        customer_impact: (req.customerImpact as string) || 'Medium impact',
        priority: dbPriority,
        status: 'new',
      }));
      const { data: featData } = await supabaseAdmin.from('feature_requests').insert(featureRows).select('*');
      insertedFeatures = (featData as Record<string, unknown>[]) || [];
    }

    // Auto-create Follow-up Action Items in database from AI recommended actions (strictly deduplicated)
    if (aiResult.recommendedActions && aiResult.recommendedActions.length > 0) {
      const { data: existingActions } = await supabaseAdmin
        .from('actions')
        .select('description')
        .eq('feedback_id', feedbackId);

      const existingDescs = new Set((existingActions || []).map((a) => (a.description || '').trim().toLowerCase()));

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);

      const newActionRows = aiResult.recommendedActions
        .filter((recText: string) => recText && recText.trim() !== '' && !existingDescs.has(recText.trim().toLowerCase()))
        .map((recText: string) => ({
          feedback_id: feedbackId,
          description: recText.trim(),
          owner: 'Unassigned',
          due_date: dueDate.toISOString(),
          priority: dbPriority,
          status: 'open',
          created_by: userId,
        }));

      if (newActionRows.length > 0) {
        await supabaseAdmin.from('actions').insert(newActionRows);
      }
    }

    return {
      feedback: formatFeedbackRecord(
        updatedFb as Record<string, unknown>,
        insertedInsights,
        insertedFeatures
      ),
      aiAnalysis: aiResult,
    };
  } catch (err) {
    // Mark AI status as failed if processing errors occur
    await supabaseAdmin
      .from('feedback')
      .update({ ai_status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', feedbackId);

    throw new AppError(`AI Analysis failed: ${err instanceof Error ? err.message : 'Unknown AI error'}`, 500);
  }
}
