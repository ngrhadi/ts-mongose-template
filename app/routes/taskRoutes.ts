import * as TaskController from "../controllers/task/TaskController";
import { Router } from 'express';
import { authenticate } from '../middleware/authorization';

const taskRoutes = Router();

taskRoutes.post('/', authenticate, TaskController.createTask);
taskRoutes.get('/', authenticate, TaskController.getTasks);
taskRoutes.put('/:id', authenticate, TaskController.updateTask);
taskRoutes.get('/:id', authenticate, TaskController.getTaskById);
taskRoutes.delete('/:id', authenticate, TaskController.deleteTask);

export default taskRoutes;
