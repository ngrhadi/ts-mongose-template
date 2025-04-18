import { Router } from 'express';
import userRoutes from './userRoutes';
import taskRoutes from './taskRoutes';

const router = Router();

router.use('/auth', userRoutes);
router.use('/task', taskRoutes);

export default router;
