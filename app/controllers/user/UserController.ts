import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../../entities/user/User';
import { sendSuccess, sendError, sendFail } from '../../utils/responseHandler';
import { logger, logError } from '../../utils/logger';
import { cacheToken, invalidateToken } from '../../middleware/authorization';
import { validateUser } from '../../entities/user/User';

export async function register(req: Request, res: Response): Promise<void> {
    try {
        const validationResult = validateUser(req.body);
        if (!validationResult.success) {
            const apiErrors = validationResult.error.errors.map((err) => ({
                path: err.path.join('.'),
                message: err.message,
            }));
            return sendFail(res, 'Validation error', apiErrors, 400);
        }

        const { username, email, password } = req.body;

        // Check for duplicate email or username
        const existingUser = await User.findOne({
            $or: [{ email }, { username }],
        });

        if (existingUser) {
            const conflictField =
                existingUser.email === email ? 'Email' : 'Username';
            sendFail(res, `${conflictField} already in use`, undefined, 409);
            return;
        }

        // Create a new user
        const newUser = new User({ username, email, password });
        await newUser.save();

        sendSuccess(
            res,
            'User registered successfully',
            {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
            },
            201
        );
    } catch (error) {
        logError(error as Error, 'Registration error');
        sendError(res, error, 500);
    }
}

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            sendFail(res, 'Invalid email or password', undefined, 400);
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            sendFail(res, 'Invalid email or password', undefined, 400);
            return;
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET!,
            { expiresIn: '1h' }
        );

        try {
            await cacheToken(token, 3600);
            sendSuccess(res, 'Login successful', {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    username: user.username,
                },
            });
        } catch (redisError) {
            console.error(
                'Redis cache failed, proceeding without caching:',
                redisError
            );
            sendSuccess(res, 'Login successful (cache disabled)', {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    username: user.username,
                },
            });
        }
    } catch (error) {
        sendError(res, 'Login failed', 500);
    }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendFail(res, 'Authorization token required', undefined, 401);
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            id: string;
        };

        await invalidateToken(token);

        logger.info(`User ${decoded.id} logged out`, { userId: decoded.id });

        sendSuccess(res, 'Logout successful', null);
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            await invalidateToken(token);
            sendFail(res, 'Token expired', undefined, 401);
        } else if (error instanceof jwt.JsonWebTokenError) {
            sendFail(res, 'Invalid token', undefined, 401);
        } else {
            console.error('Logout error:', undefined, error);
            sendError(res, 'Logout failed', 500);
        }
    }
};
