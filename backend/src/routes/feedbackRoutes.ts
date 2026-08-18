import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getFeedbackList,
  getFeedbackDetail,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  analyzeFeedback,
} from '../controllers/feedbackController.js';
import { getFeedbackNotes, createFeedbackNote } from '../controllers/noteController.js';

const router = Router();

// Protect all feedback endpoints with Bearer token authentication
router.use(requireAuth);

router.get('/', getFeedbackList);
router.post('/', createFeedback);
router.get('/:id', getFeedbackDetail);
router.put('/:id', updateFeedback);
router.delete('/:id', deleteFeedback);
router.post('/:id/analyze', analyzeFeedback);

// Internal Notes nested routes under /api/feedback/:id/notes
router.get('/:id/notes', getFeedbackNotes);
router.post('/:id/notes', createFeedbackNote);

export default router;
