import { supabase } from './supabaseClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export class ApiError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface KeyInsight {
  id?: string;
  feedbackId?: string;
  insightText: string;
  insightType: string;
  confidence: number;
}

export interface FeatureRequestItem {
  id?: string;
  feedbackId?: string;
  title?: string;
  description?: string;
  featureDescription?: string;
  reason?: string;
  customerImpact?: string;
  priority?: string;
  status?: string;
}

export interface ActionItem {
  id: string;
  feedbackId?: string | null;
  description: string;
  owner: string;
  dueDate?: string | null;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Blocked' | 'Completed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InternalNote {
  id: string;
  feedbackId: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  authorEmail: string;
}

export interface FeedbackItem {
  id: string;
  title: string;
  customerName: string;
  customerEmail: string;
  feedbackDate: string;
  source: string;
  content: string;
  category: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  inputType: 'text' | 'file';
  fileName?: string | null;
  filePath?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  summary?: string | null;
  feedbackType?: string | null;
  sentiment?: string | null;
  priority?: string | null;
  productArea?: string | null;
  aiStatus?: string | null;
  aiProcessedAt?: string | null;
  keyInsights?: KeyInsight[];
  featureRequests?: FeatureRequestItem[];
  risks?: string[];
  recommendedActions?: string[];
}

export interface DashboardMetrics {
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  highPriority: number;
  openActions: number;
  completedActions: number;
  unresolvedFeedback: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentlyAddedFeedback: Partial<FeedbackItem>[];
}

export interface InsightsData {
  feedbackByCategory: { category: string; count: number }[];
  feedbackBySentiment: { sentiment: string; count: number }[];
  feedbackBySource: { source: string; count: number }[];
  mostCommonIssues: KeyInsight[];
  mostRequestedFeatures: FeatureRequestItem[];
  highPriorityFeedback: Partial<FeedbackItem>[];
  openActions: Partial<ActionItem>[];
}

export interface FeedbackListResponse {
  items: FeedbackItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch (err) {
    console.warn('Failed to retrieve Supabase session token:', err);
  }
  return {};
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const authHeaders = await getAuthHeader();

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options.headers || {}),
    },
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, config);
    const result: ApiResponse<T> = await response.json();

    if (!response.ok || !result.success) {
      throw new ApiError(
        result.message || result.error || `HTTP request failed with status ${response.status}`,
        response.status
      );
    }

    return result;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err instanceof Error ? err.message : 'Network request failed', 500);
  }
}

// Typed Feedback API helpers
export async function fetchFeedbackList(params?: {
  search?: string;
  category?: string;
  status?: string;
  source?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.category && params.category !== 'All') searchParams.set('category', params.category);
  if (params?.status && params.status !== 'All') searchParams.set('status', params.status);
  if (params?.source && params.source !== 'All') searchParams.set('source', params.source);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const queryString = searchParams.toString();
  const endpoint = `/feedback${queryString ? `?${queryString}` : ''}`;
  const res = await apiClient<FeedbackListResponse>(endpoint);
  return res.data;
}

export async function fetchFeedbackById(id: string) {
  const res = await apiClient<{ feedback: FeedbackItem }>(`/feedback/${id}`);
  return res.data?.feedback;
}

export async function createFeedbackApi(payload: unknown) {
  const res = await apiClient<{ feedback: FeedbackItem }>('/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data?.feedback;
}

export async function updateFeedbackApi(id: string, payload: unknown) {
  const res = await apiClient<{ feedback: FeedbackItem }>(`/feedback/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data?.feedback;
}

export async function deleteFeedbackApi(id: string) {
  const res = await apiClient<{ success: boolean; id: string }>(`/feedback/${id}`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function analyzeFeedbackApi(id: string) {
  const res = await apiClient<{ feedback: FeedbackItem; aiAnalysis: unknown }>(`/feedback/${id}/analyze`, {
    method: 'POST',
  });
  return res.data;
}

// Typed Action Items API helpers
export async function fetchActionsApi(params?: { feedbackId?: string; status?: string; priority?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.feedbackId) searchParams.set('feedbackId', params.feedbackId);
  if (params?.status && params.status !== 'All') searchParams.set('status', params.status);
  if (params?.priority && params.priority !== 'All') searchParams.set('priority', params.priority);

  const queryString = searchParams.toString();
  const res = await apiClient<{ items: ActionItem[] }>(`/actions${queryString ? `?${queryString}` : ''}`);
  return res.data?.items || [];
}

export async function createActionApi(payload: {
  feedbackId?: string | null;
  description: string;
  owner?: string;
  dueDate?: string | null;
  priority?: string;
  status?: string;
}) {
  const res = await apiClient<{ action: ActionItem }>('/actions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data?.action;
}

export async function updateActionApi(
  id: string,
  payload: Partial<{ description: string; owner: string; dueDate: string | null; priority: string; status: string }>
) {
  const res = await apiClient<{ action: ActionItem }>(`/actions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data?.action;
}

export async function deleteActionApi(id: string) {
  const res = await apiClient<{ success: boolean; id: string }>(`/actions/${id}`, {
    method: 'DELETE',
  });
  return res.data;
}

// Typed Internal Notes API helpers
export async function fetchNotesApi(feedbackId: string) {
  const res = await apiClient<{ items: InternalNote[] }>(`/feedback/${feedbackId}/notes`);
  return res.data?.items || [];
}

export async function createNoteApi(feedbackId: string, payload: { content: string }) {
  const res = await apiClient<{ note: InternalNote }>(`/feedback/${feedbackId}/notes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data?.note;
}

export async function updateNoteApi(noteId: string, payload: { content: string }) {
  const res = await apiClient<{ note: InternalNote }>(`/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data?.note;
}

export async function deleteNoteApi(noteId: string) {
  const res = await apiClient<{ success: boolean; id: string }>(`/notes/${noteId}`, {
    method: 'DELETE',
  });
  return res.data;
}

// Typed Dashboard & Insights API helpers
export async function fetchDashboardApi() {
  const res = await apiClient<DashboardData>('/dashboard');
  return res.data;
}

export async function fetchInsightsApi() {
  const res = await apiClient<InsightsData>('/insights');
  return res.data;
}
