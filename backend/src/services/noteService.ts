import { supabaseAdmin } from './supabase/supabaseClient.js';
import { CreateNoteInput, UpdateNoteInput } from '../schemas/noteSchemas.js';
import { AppError, NotFoundError, ForbiddenError } from '../utils/errors.js';

function formatNoteRecord(row: Record<string, unknown>) {
  const profile = row.profiles as Record<string, unknown> | undefined;
  return {
    id: row.id as string,
    feedbackId: row.feedback_id as string,
    content: (row.content as string) || '',
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    authorName: (profile?.full_name as string) || (profile?.email as string) || 'Team Member',
    authorEmail: (profile?.email as string) || '',
  };
}

export async function listFeedbackNotes(userId: string, feedbackId: string) {
  const { data, error } = await supabaseAdmin
    .from('internal_notes')
    .select('*, profiles(email, full_name)')
    .eq('feedback_id', feedbackId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new AppError(`Failed to fetch internal notes: ${error.message}`, 500);
  }

  return (data || []).map((row) => formatNoteRecord(row as Record<string, unknown>));
}

export async function getNoteById(userId: string, noteId: string) {
  const { data, error } = await supabaseAdmin
    .from('internal_notes')
    .select('*, profiles(email, full_name)')
    .eq('id', noteId)
    .maybeSingle();

  if (error || !data) {
    throw new NotFoundError('Internal note not found');
  }

  if (data.created_by && data.created_by !== userId) {
    throw new ForbiddenError('You are not authorized to access this internal note');
  }

  return formatNoteRecord(data as Record<string, unknown>);
}

export async function createFeedbackNote(userId: string, feedbackId: string, input: CreateNoteInput) {
  // Ensure profile row exists
  try {
    await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, email: 'user@company.com', updated_at: new Date().toISOString() }, { onConflict: 'id' });
  } catch (_err) {
    // Fallback
  }

  const insertData = {
    feedback_id: feedbackId,
    content: input.content,
    created_by: userId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('internal_notes')
    .insert(insertData)
    .select('*, profiles(email, full_name)')
    .single();

  if (error || !data) {
    throw new AppError(`Failed to create internal note: ${error?.message || 'Database error'}`, 400);
  }

  return formatNoteRecord(data as Record<string, unknown>);
}

export async function updateNote(userId: string, noteId: string, input: UpdateNoteInput) {
  await getNoteById(userId, noteId);

  const { data, error } = await supabaseAdmin
    .from('internal_notes')
    .update({ content: input.content, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .select('*, profiles(email, full_name)')
    .single();

  if (error || !data) {
    throw new AppError(`Failed to update internal note: ${error?.message || 'Database error'}`, 400);
  }

  return formatNoteRecord(data as Record<string, unknown>);
}

export async function deleteNote(userId: string, noteId: string) {
  await getNoteById(userId, noteId);

  const { error } = await supabaseAdmin.from('internal_notes').delete().eq('id', noteId);

  if (error) {
    throw new AppError(`Failed to delete internal note: ${error.message}`, 400);
  }

  return { success: true, id: noteId };
}
