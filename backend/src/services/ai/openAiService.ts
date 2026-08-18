import OpenAI from 'openai';
import { env } from '../../config/env.js';

export class OpenAiService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  /**
   * Placeholder method for analyzing feedback using OpenAI API.
   */
  public async analyzeFeedback(text: string): Promise<Record<string, unknown>> {
    if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === 'placeholder_openai_api_key_to_be_replaced') {
      return {
        status: 'mock',
        summary: 'Mock AI analysis result (Configure OPENAI_API_KEY for real analysis)',
        inputLength: text.length,
      };
    }

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert product insights analyst. Analyze the following customer feedback.',
        },
        {
          role: 'user',
          content: text,
        },
      ],
    });

    return {
      status: 'success',
      content: response.choices[0]?.message?.content || '',
    };
  }
}

export const openAiService = new OpenAiService();
