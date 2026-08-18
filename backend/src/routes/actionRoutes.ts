import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getActionList,
  createAction,
  updateAction,
  deleteAction,
} from '../controllers/actionController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getActionList);
router.post('/', createAction);
router.put('/:id', updateAction);
router.delete('/:id', deleteAction);

export default router;
