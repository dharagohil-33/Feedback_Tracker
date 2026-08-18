import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { createActionSchema, updateActionSchema, actionQuerySchema } from '../schemas/actionSchemas.js';
import * as actionService from '../services/actionService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ValidationError, UnauthorizedError } from '../utils/errors.js';

export async function getActionList(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('User authentication required');

    const queryParse = actionQuerySchema.safeParse(req.query);
    const queryData = queryParse.success ? queryParse.data : {};

    const items = await actionService.listUserActions(req.user.id, queryData);

    sendSuccess({
      res,
      statusCode: 200,
      message: 'Actions retrieved successfully',
      data: { items },
    });
  } catch (err) {
    next(err);
  }
}

export async function createAction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('User authentication required');

    const parseResult = createActionSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new ValidationError(issue ? issue.message : 'Invalid action data');
    }

    const action = await actionService.createAction(req.user.id, parseResult.data);

    sendSuccess({
      res,
      statusCode: 201,
      message: 'Action item created successfully',
      data: { action },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('User authentication required');

    const actionId = req.params.id;
    if (!actionId) throw new ValidationError('Action ID parameter is required');

    const parseResult = updateActionSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new ValidationError(issue ? issue.message : 'Invalid action update data');
    }

    const updated = await actionService.updateAction(req.user.id, actionId, parseResult.data);

    sendSuccess({
      res,
      statusCode: 200,
      message: 'Action item updated successfully',
      data: { action: updated },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('User authentication required');

    const actionId = req.params.id;
    if (!actionId) throw new ValidationError('Action ID parameter is required');

    const result = await actionService.deleteAction(req.user.id, actionId);

    sendSuccess({
      res,
      statusCode: 200,
      message: 'Action item deleted successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
