import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { updateNote, deleteNote } from '../controllers/noteController.js';

const router = Router();

router.use(requireAuth);

router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
