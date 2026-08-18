import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import * as dashboardService from '../services/dashboardService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { UnauthorizedError } from '../utils/errors.js';

export async function getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError('User authentication required');

    const result = await dashboardService.getDashboardMetrics(req.user.id);

    sendSuccess({
      res,
      statusCode: 200,
      message: 'Dashboard metrics retrieved successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
