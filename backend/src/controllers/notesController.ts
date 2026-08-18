import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/apiResponse.js';

export async function listNotes(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess({
      res,
      message: 'Notes endpoint ready',
      data: [],
    });
  } catch (err) {
    next(err);
  }
}
