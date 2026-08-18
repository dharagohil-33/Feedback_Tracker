import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { createFeedbackSchema, updateFeedbackSchema, feedbackQuerySchema } from '../schemas/feedbackSchemas.js';
import * as feedbackService from '../services/feedbackService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ValidationError, UnauthorizedError } from '../utils/errors.js';

export async function getFeedbackList(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User authentication required');
    }

    const queryParse = feedbackQuerySchema.safeParse(req.query);
    const queryData = queryParse.success ? queryParse.data : { page: 1, limit: 20 };

    const result = await feedbackService.listUserFeedback(req.user.id, queryData);

    sendSuccess({
      res,
      statusCode: 200,
      message: 'Feedback list retrieved successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getFeedbackDetail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User authentication required');
    }

    const feedbackId = req.params.id;
    if (!feedbackId) {
      throw new ValidationError('Feedback ID parameter is required');
    }

    const item = await feedbackService.getFeedbackById(req.user.id, feedbackId);

    sendSuccess({
      res,
      statusCode: 200,
      message: 'Feedback detail retrieved successfully',
      data: { feedback: item },
    });
  } catch (err) {
    next(err);
  }
}

export async function createFeedback(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User authentication required');
    }

    const parseResult = createFeedbackSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new ValidationError(issue ? issue.message : 'Invalid feedback submission');
    }

    const newFeedback = await feedbackService.createFeedback(req.user.id, parseResult.data);

    sendSuccess({
      res,
      statusCode: 201,
      message: 'Feedback created successfully',
      data: { feedback: newFeedback },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateFeedback(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User authentication required');
    }

    const feedbackId = req.params.id;
    if (!feedbackId) {
      throw new ValidationError('Feedback ID parameter is required');
    }

    const parseResult = updateFeedbackSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new ValidationError(issue ? issue.message : 'Invalid feedback update data');
    }

    const updated = await feedbackService.updateFeedback(req.user.id, feedbackId, parseResult.data);

    sendSuccess({
      res,
      statusCode: 200,
      message: 'Feedback updated successfully',
      data: { feedback: updated },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteFeedback(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User authentication required');
    }

    const feedbackId = req.params.id;
    if (!feedbackId) {
      throw new ValidationError('Feedback ID parameter is required');
    }

    const result = await feedbackService.deleteFeedback(req.user.id, feedbackId);

    sendSuccess({
      res,
      statusCode: 200,
      message: 'Feedback record deleted successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function analyzeFeedback(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User authentication required');
    }

    const feedbackId = req.params.id;
    if (!feedbackId) {
      throw new ValidationError('Feedback ID parameter is required');
    }

    const result = await feedbackService.analyzeFeedback(req.user.id, feedbackId);

    sendSuccess({
      res,
      statusCode: 200,
      message: 'Feedback analyzed successfully by AI engine',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
