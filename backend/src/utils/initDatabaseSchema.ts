import { supabaseAdmin } from '../services/supabase/supabaseClient.js';

export async function applyFileMetadataMigration(): Promise<void> {
  // Migration schema columns
}

export async function initDatabaseSchema(): Promise<void> {
  try {
    // Automatically ensure storage bucket 'feedback-files' exists in Supabase Storage
    const { error: bucketErr } = await supabaseAdmin.storage.createBucket('feedback-files', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
    });
    if (bucketErr && !bucketErr.message.includes('already exists')) {
      console.log('Notice on bucket creation:', bucketErr.message);
    } else {
      console.log('✅ Supabase Storage bucket "feedback-files" ready');
    }
  } catch (err) {
    console.warn('Storage init notice:', err);
  }
}
