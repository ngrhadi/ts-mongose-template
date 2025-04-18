import { Request, Response } from 'express';
import { Task } from '../../entities/task/Task';
import { sendSuccess, sendError, sendFail } from '../../utils/responseHandler';
import { logError } from '../../utils/logger';

// Create a new task
export async function createTask(req: Request, res: Response): Promise<void> {
    try {
        const { title, description, status } = req.body;
        const taskStatus = status ?? 'pending';

        // Check for missing fields
        const missingFields = [];
        if (!title) missingFields.push({ path: 'title', message: 'title is required' });
        if (!description) missingFields.push({ path: 'description', message: 'description is required' });

        if (missingFields.length > 0) {
            return sendFail(res, 'Validation error', missingFields, 400);
        }

        const userId = typeof req.user === 'object' && 'id' in req.user ? req.user.id : null;

        if (!userId) {
            return sendFail(res, 'User not authenticated', undefined, 401);
        }

        const task = await Task.create({
            title,
            description,
            status: taskStatus,
            user: userId,
        });
        sendSuccess(res, 'Task created successfully', task, 201);
    } catch (error) {
        logError(error as Error, 'Task creation error');
        sendError(res, error, 500);
    }
};

// Get all tasks
export async function getTasks(req: Request, res: Response): Promise<void> {
    try {
        const tasks = await Task.find().populate('user');
        sendSuccess(res, 'Tasks retrieved successfully', tasks, 200);
    } catch (error) {
        logError(error as Error, 'Error retrieving tasks');
        sendError(res, error, 500);
    }
};

// Get a single task by ID
export async function getTaskById(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const task = await Task.findById(id).populate('user'); // Populate user data
        if (!task) {
            return sendFail(res, 'Task not found', undefined, 404);
        }
        sendSuccess(res, 'Task retrieved successfully', task, 200);
    } catch (error) {
        logError(error as Error, 'Error retrieving task by ID');
        sendError(res, error, 500);
    }
};

// Update a task by ID
export async function updateTask(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const updates = req.body;

        const userId =
            typeof req.user === 'object' && 'id' in req.user
                ? req.user.id
                : null;

        if (!userId) {
            return sendFail(res, 'User not authenticated', undefined, 401);
        }

        const task = await Task.findByIdAndUpdate(
            id,
            { ...updates, user: userId },
            {
                new: true,
                runValidators: true,
            }
        ).populate('user');
        if (!task) {
            return sendFail(res, 'Task not found', undefined, 404);
        }
        sendSuccess(res, 'Task updated successfully', task, 200);
    } catch (error) {
        logError(error as Error, 'Error updating task');
        sendError(res, error, 500);
    }
};

// Delete a task by ID
export async function deleteTask(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const task = await Task.findByIdAndDelete(id);
        if (!task) {
            return sendFail(res, 'Task not found', undefined, 404);
        }
        sendSuccess(res, 'Task deleted successfully', null, 200);
    } catch (error) {
        logError(error as Error, 'Error deleting task');
        sendError(res, error, 500);
    }
};
