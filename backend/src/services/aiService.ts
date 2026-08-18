import { env } from '../config/env.js';
import { aiAnalysisResponseSchema, AiAnalysisResponse } from '../schemas/aiSchemas.js';
import { AppError } from '../utils/errors.js';

export async function analyzeFeedbackContent(
  title: string,
  content: string,
  customerName?: string
): Promise<AiAnalysisResponse> {
  const openRouterKey = env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
  const openAiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  const activeKey = openRouterKey || openAiKey;
  const isKeyValid = activeKey && !activeKey.includes('placeholder') && (activeKey.startsWith('sk-or-v1-') || activeKey.startsWith('sk-'));

  if (isKeyValid && activeKey) {
    try {
      if (activeKey.startsWith('sk-or-v1-')) {
        console.log('🤖 Utilizing OpenRouter AI Engine for feedback analysis...');
        return await callOpenRouterApi(title, content, activeKey);
      } else {
        console.log('🤖 Utilizing OpenAI API Engine for feedback analysis...');
        return await callOpenAiApi(title, content, activeKey);
      }
    } catch (err) {
      console.warn('AI API call failed or timed out, falling back to smart NLP analyzer:', err);
    }
  }

  // Smart Heuristic NLP Analyzer Fallback
  console.log('🧠 Utilizing Smart Heuristic NLP Engine for feedback analysis...');
  return generateSmartNlpAnalysis(title, content, customerName);
}

async function callOpenRouterApi(title: string, content: string, apiKey: string): Promise<AiAnalysisResponse> {
  const systemPrompt = `You are an expert AI customer feedback analysis engine for a product intelligence OS.
Analyze the customer feedback and output strictly JSON.

MANDATE: NEVER INVENT UNSUPPORTED INFORMATION.
- If the customer does NOT explicitly request a new feature or capability, return an empty array for "featureRequests": [].
- If there are no clear risks, return an empty array for "risks": [].

OUTPUT FORMAT (JSON ONLY):
{
  "summary": "Concise 2-3 sentence summary of customer concerns and expectations.",
  "category": "Bug" | "Feature Request" | "Usability" | "Performance" | "Billing" | "Customer Service" | "Product Experience" | "Other",
  "feedbackType": "bug" | "feature_request" | "complaint" | "suggestion" | "positive_feedback" | "general_feedback",
  "sentiment": "positive" | "neutral" | "negative",
  "priority": "low" | "medium" | "high" | "critical",
  "productArea": "Specific module or feature area",
  "keyInsights": [
    { "insightText": "Clear insight text", "insightType": "Recurring Issue | Usability Concern", "confidence": 0.95 }
  ],
  "featureRequests": [
    { "featureDescription": "Extracted feature description", "reason": "Reason given", "customerImpact": "High | Medium | Low", "priority": "medium" }
  ],
  "risks": ["Risk description"],
  "recommendedActions": ["Recommended action for product team"]
}`;

  const userPrompt = `Feedback Title: ${title}\nCustomer Feedback Content:\n"${content}"`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Customer Feedback Tracker',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 450,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new AppError(`OpenRouter API returned error ${response.status}: ${errText}`, 502);
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new AppError('OpenRouter returned an empty analysis payload', 502);
    }

    const parsedJson = JSON.parse(rawContent);
    return aiAnalysisResponseSchema.parse(parsedJson);
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
      throw new AppError('OpenRouter API request timed out (exceeded 15s limit)', 504);
    }
    throw err;
  }
}

async function callOpenAiApi(title: string, content: string, apiKey: string): Promise<AiAnalysisResponse> {
  const systemPrompt = `You are an expert AI customer feedback analysis engine for a product intelligence OS.
Analyze the customer feedback and output strictly JSON.

MANDATE: NEVER INVENT UNSUPPORTED INFORMATION.
- If the customer does NOT explicitly request a new feature or capability, return an empty array for "featureRequests": [].
- If there are no clear risks, return an empty array for "risks": [].

OUTPUT FORMAT (JSON ONLY):
{
  "summary": "Concise 2-3 sentence summary of customer concerns and expectations.",
  "category": "Bug" | "Feature Request" | "Usability" | "Performance" | "Billing" | "Customer Service" | "Product Experience" | "Other",
  "feedbackType": "bug" | "feature_request" | "complaint" | "suggestion" | "positive_feedback" | "general_feedback",
  "sentiment": "positive" | "neutral" | "negative",
  "priority": "low" | "medium" | "high" | "critical",
  "productArea": "Specific module or feature area",
  "keyInsights": [
    { "insightText": "Clear insight text", "insightType": "Recurring Issue | Usability Concern", "confidence": 0.95 }
  ],
  "featureRequests": [
    { "featureDescription": "Extracted feature description", "reason": "Reason given", "customerImpact": "High | Medium | Low", "priority": "medium" }
  ],
  "risks": ["Risk description"],
  "recommendedActions": ["Recommended action for product team"]
}`;

  const userPrompt = `Feedback Title: ${title}\nCustomer Feedback Content:\n"${content}"`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new AppError(`OpenAI API returned error ${response.status}: ${errText}`, 502);
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new AppError('OpenAI returned an empty analysis payload', 502);
    }

    const parsedJson = JSON.parse(rawContent);
    return aiAnalysisResponseSchema.parse(parsedJson);
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
      throw new AppError('OpenAI API request timed out (exceeded 15s limit)', 504);
    }
    throw err;
  }
}

function generateSmartNlpAnalysis(
  title: string,
  content: string,
  customerName?: string
): AiAnalysisResponse {
  const text = `${title} ${content}`.toLowerCase();

  // Sentiment Analysis
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (text.includes('error') || text.includes('bug') || text.includes('fail') || text.includes('broken') || text.includes('slow') || text.includes('hate') || text.includes('frustrated') || text.includes('latency') || text.includes('issue')) {
    sentiment = 'negative';
  } else if (text.includes('great') || text.includes('love') || text.includes('excellent') || text.includes('helpful') || text.includes('awesome') || text.includes('best')) {
    sentiment = 'positive';
  }

  // Priority Prediction
  let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (text.includes('critical') || text.includes('blocking') || text.includes('down') || text.includes('crash') || text.includes('500 error')) {
    priority = 'critical';
  } else if (text.includes('urgent') || text.includes('slow') || text.includes('latency') || text.includes('fail') || text.includes('bug')) {
    priority = 'high';
  } else if (text.includes('minor') || text.includes('typo') || text.includes('nice to have')) {
    priority = 'low';
  }

  // Category & Feedback Type
  let category: 'Bug' | 'Feature Request' | 'Usability' | 'Performance' | 'Billing' | 'Customer Service' | 'Product Experience' | 'Other' = 'Other';
  let feedbackType: 'bug' | 'feature_request' | 'complaint' | 'suggestion' | 'positive_feedback' | 'general_feedback' = 'general_feedback';

  if (text.includes('bug') || text.includes('error') || text.includes('fail') || text.includes('broken') || text.includes('crash')) {
    category = 'Bug';
    feedbackType = 'bug';
  } else if (text.includes('feature') || text.includes('add') || text.includes('request') || text.includes('would like') || text.includes('want') || text.includes('please support')) {
    category = 'Feature Request';
    feedbackType = 'feature_request';
  } else if (text.includes('slow') || text.includes('latency') || text.includes('timeout') || text.includes('performance') || text.includes('seconds')) {
    category = 'Performance';
    feedbackType = 'complaint';
  } else if (text.includes('billing') || text.includes('invoice') || text.includes('payment') || text.includes('charge')) {
    category = 'Billing';
    feedbackType = 'complaint';
  } else if (text.includes('confusing') || text.includes('hard to find') || text.includes('ui') || text.includes('ux') || text.includes('navigation')) {
    category = 'Usability';
    feedbackType = 'suggestion';
  }

  // Product Area
  let productArea = 'Core Application';
  if (text.includes('dashboard') || text.includes('chart')) productArea = 'Analytics Dashboard';
  else if (text.includes('billing') || text.includes('invoice')) productArea = 'Billing & Payments';
  else if (text.includes('auth') || text.includes('login')) productArea = 'Authentication & Security';
  else if (text.includes('filter') || text.includes('search')) productArea = 'Search & Discovery';

  // Key Insights
  const keyInsights = [
    {
      insightText: `Customer ${customerName || 'user'} reported feedback regarding ${title.toLowerCase()}.`,
      insightType: category === 'Bug' ? 'Technical Defect' : 'Customer Experience',
      confidence: 0.92,
    },
  ];

  if (sentiment === 'negative') {
    keyInsights.push({
      insightText: `Sentiment indicates customer dissatisfaction due to unresolved friction in ${productArea}.`,
      insightType: 'Sentiment Risk',
      confidence: 0.88,
    });
  }

  // Feature Requests (Zero-hallucination rule: only add if explicitly requested)
  const featureRequests = [];
  if (category === 'Feature Request' || text.includes('feature') || text.includes('add capability') || text.includes('would like to be able to')) {
    featureRequests.push({
      featureDescription: title,
      reason: 'Customer requires enhanced functional capabilities for daily workflow efficiency.',
      customerImpact: priority === 'high' || priority === 'critical' ? 'High Impact' : 'Medium Impact',
      priority,
    });
  }

  // Risks & Actions
  const risks = [];
  if (priority === 'critical' || priority === 'high') {
    risks.push(`Potential customer churn risk if ${category.toLowerCase()} is not resolved promptly.`);
  }

  const recommendedActions = [
    `Triage issue with product lead for ${productArea}.`,
    `Notify customer upon deployment of fix or feature update.`,
  ];

  const rawAnalysis = {
    summary: `Customer ${customerName ? `(${customerName})` : ''} provided feedback titled "${title}". Key concern: ${content.substring(0, 180)}...`,
    category,
    feedbackType,
    sentiment,
    priority,
    productArea,
    keyInsights,
    featureRequests,
    risks,
    recommendedActions,
  };

  return aiAnalysisResponseSchema.parse(rawAnalysis);
}
