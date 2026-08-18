import { supabaseAdmin } from './supabaseClient.js';

export const FEEDBACK_FILES_BUCKET = 'feedback-files';

export class StorageService {
  /**
   * Upload plain text feedback file to Supabase Storage.
   */
  public async uploadFeedbackText(
    filePath: string,
    content: string
  ): Promise<{ path: string; publicUrl?: string }> {
    const fileBuffer = Buffer.from(content, 'utf-8');
    const { data, error } = await supabaseAdmin.storage
      .from(FEEDBACK_FILES_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: 'text/plain; charset=utf-8',
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload feedback file to Supabase Storage: ${error.message}`);
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(FEEDBACK_FILES_BUCKET)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      publicUrl: urlData?.publicUrl,
    };
  }

  /**
   * Download feedback file content as text.
   */
  public async downloadFeedbackFile(filePath: string): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
      .from(FEEDBACK_FILES_BUCKET)
      .download(filePath);

    if (error || !data) {
      throw new Error(`Failed to download feedback file: ${error?.message || 'No data'}`);
    }

    return await data.text();
  }
}

export const storageService = new StorageService();
