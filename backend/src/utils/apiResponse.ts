import { Response } from 'express';

export interface ApiResponseOptions<T = unknown> {
  res: Response;
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>({
  res,
  statusCode = 200,
  message = 'Success',
  data,
  meta,
}: ApiResponseOptions<T>): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined && { data }),
    ...(meta !== undefined && { meta }),
  });
}

export function sendError({
  res,
  statusCode = 500,
  message = 'Internal Server Error',
  error,
}: {
  res: Response;
  statusCode?: number;
  message?: string;
  error?: unknown;
}): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(error !== undefined && { error }),
  });
}
