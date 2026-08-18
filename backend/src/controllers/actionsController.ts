import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/apiResponse.js';

export async function listActions(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess({
      res,
      message: 'Action items endpoint ready',
      data: [],
    });
  } catch (err) {
    next(err);
  }
}
