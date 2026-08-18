import { Router } from 'express';
import { listNotes } from '../controllers/notesController.js';

const router = Router();

router.get('/', listNotes);

export default router;
