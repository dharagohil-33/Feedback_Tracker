import { supabaseAdmin } from './supabase/supabaseClient.js';
import { CreateActionInput, UpdateActionInput, ActionQueryInput } from '../schemas/actionSchemas.js';
import { AppError, NotFoundError } from '../utils/errors.js';

const priorityToDb: Record<string, string> = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
};

const dbToPriority: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const statusToDb: Record<string, string> = {
  Open: 'open',
  'In Progress': 'in_progress',
  Blocked: 'blocked',
  Completed: 'completed',
};

const dbToStatus: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  completed: 'Completed',
};

function formatActionRecord(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    feedbackId: (row.feedback_id as string) || null,
    description: (row.description as string) || '',
    owner: (row.owner as string) || 'Unassigned',
    dueDate: (row.due_date as string) || null,
    priority: dbToPriority[row.priority as string] || 'Medium',
    status: dbToStatus[row.status as string] || 'Open',
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function listUserActions(_userId: string, query?: ActionQueryInput) {
  let builder = supabaseAdmin.from('actions').select('*');

  if (query?.feedbackId) {
    builder = builder.eq('feedback_id', query.feedbackId);
  }

  if (query?.status) {
    const dbStat = statusToDb[query.status] || query.status.toLowerCase();
    builder = builder.eq('status', dbStat);
  }

  if (query?.priority) {
    const dbPrio = priorityToDb[query.priority] || query.priority.toLowerCase();
    builder = builder.eq('priority', dbPrio);
  }

  builder = builder.order('created_at', { ascending: false });

  const { data, error } = await builder;

  if (error) {
    throw new AppError(`Failed to fetch actions: ${error.message}`, 500);
  }

  return (data || []).map((row) => formatActionRecord(row as Record<string, unknown>));
}

export async function getActionById(_userId: string, actionId: string) {
  const { data, error } = await supabaseAdmin
    .from('actions')
    .select('*')
    .eq('id', actionId)
    .maybeSingle();

  if (error || !data) {
    throw new NotFoundError('Action item not found');
  }

  return formatActionRecord(data as Record<string, unknown>);
}

export async function createAction(userId: string, input: CreateActionInput) {
  // Ensure user profile exists
  try {
    await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, email: 'user@company.com', updated_at: new Date().toISOString() }, { onConflict: 'id' });
  } catch (_err) {
    // Fallback
  }

  const insertData = {
    feedback_id: input.feedbackId || null,
    description: input.description,
    owner: input.owner || 'Unassigned',
    due_date: input.dueDate ? new Date(input.dueDate).toISOString() : null,
    priority: priorityToDb[input.priority] || 'medium',
    status: statusToDb[input.status] || 'open',
    created_by: userId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('actions')
    .insert(insertData)
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError(`Failed to create action: ${error?.message || 'Database error'}`, 400);
  }

  return formatActionRecord(data as Record<string, unknown>);
}

export async function updateAction(userId: string, actionId: string, input: UpdateActionInput) {
  await getActionById(userId, actionId);

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.description !== undefined) updateData.description = input.description;
  if (input.owner !== undefined) updateData.owner = input.owner;
  if (input.dueDate !== undefined) updateData.due_date = input.dueDate ? new Date(input.dueDate).toISOString() : null;
  if (input.priority !== undefined) updateData.priority = priorityToDb[input.priority] || 'medium';
  if (input.status !== undefined) updateData.status = statusToDb[input.status] || 'open';

  const { data, error } = await supabaseAdmin
    .from('actions')
    .update(updateData)
    .eq('id', actionId)
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError(`Failed to update action: ${error?.message || 'Database error'}`, 400);
  }

  return formatActionRecord(data as Record<string, unknown>);
}

export async function deleteAction(userId: string, actionId: string) {
  await getActionById(userId, actionId);

  const { error } = await supabaseAdmin.from('actions').delete().eq('id', actionId);

  if (error) {
    throw new AppError(`Failed to delete action: ${error.message}`, 400);
  }

  return { success: true, id: actionId };
}
