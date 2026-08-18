import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { createNoteSchema, updateNoteSchema } from '../schemas/noteSchemas.js';
import * as noteService from '../services/noteService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ValidationError, UnauthorizedError } from '../utils/errors.js';

export async function getFeedbackNotes(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('User authentication required');

    const feedbackId = req.params.id;
    if (!feedbackId) throw new ValidationError('Feedback ID parameter is required');

    const items = await noteService.listFeedbackNotes(req.user.id, feedbackId);

    sendSuccess({
      res,
      statusCode: 200,
      message: 'Internal notes retrieved successfully',
      data: { items },
    });
  } catch (err) {
    next(err);
  }
}

export async function createFeedbackNote(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('User authentication required');

    const feedbackId = req.params.id;
    if (!feedbackId) throw new ValidationError('Feedback ID parameter is required');

    const parseResult = createNoteSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new ValidationError(issue ? issue.message : 'Invalid note data');
    }

    const note = await noteService.createFeedbackNote(req.user.id, feedbackId, parseResult.data);

    sendSuccess({
      res,
      statusCode: 201,
      message: 'Internal note created successfully',
      data: { note },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateNote(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('User authentication required');

    const noteId = req.params.id;
    if (!noteId) throw new ValidationError('Note ID parameter is required');

    const parseResult = updateNoteSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new ValidationError(issue ? issue.message : 'Invalid note update data');
    }

    const updated = await noteService.updateNote(req.user.id, noteId, parseResult.data);

    sendSuccess({
      res,
      statusCode: 200,
      message: 'Internal note updated successfully',
      data: { note: updated },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteNote(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('User authentication required');

    const noteId = req.params.id;
    if (!noteId) throw new ValidationError('Note ID parameter is required');

    const result = await noteService.deleteNote(req.user.id, noteId);

    sendSuccess({
      res,
      statusCode: 200,
      message: 'Internal note deleted successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
