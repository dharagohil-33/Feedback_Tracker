import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import feedbackRoutes from './feedbackRoutes.js';
import actionRoutes from './actionRoutes.js';
import noteRoutes from './noteRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import insightsRoutes from './insightsRoutes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/feedback', feedbackRoutes);
apiRouter.use('/actions', actionRoutes);
apiRouter.use('/notes', noteRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/insights', insightsRoutes);

export default apiRouter;
