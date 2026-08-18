import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import * as insightsService from '../services/insightsService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { UnauthorizedError } from '../utils/errors.js';

export async function getInsights(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('User authentication required');

    const result = await insightsService.getInsightsAnalytics(req.user.id);

    sendSuccess({
      res,
      statusCode: 200,
      message: 'Product insights analytics retrieved successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
