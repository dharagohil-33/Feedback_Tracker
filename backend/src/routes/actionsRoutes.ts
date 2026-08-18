import { Router } from 'express';
import { listActions } from '../controllers/actionsController.js';

const router = Router();

router.get('/', listActions);

export default router;
