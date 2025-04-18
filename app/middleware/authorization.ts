import redisService from '../config/redis';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { sendFail } from '../utils/responseHandler';

declare global {
    namespace Express {
        interface Request {
            user?: string | JwtPayload;
        }
    }
}

export const cacheToken = async (token: string, ttl: number) => {
    await redisService.cacheToken(token, ttl);
};

export const verifyToken = async (token: string) => {
    return redisService.verifyToken(token);
};

export const invalidateToken = async (token: string) => {
    await redisService.invalidateToken(token);
};

// Custom middleware to log request and response
export const logRequestResponse = (req: Request, res: Response, next: NextFunction) => {
    const { method, url, headers, body } = req;

    // Log the incoming request
    logger.info(`Incoming Request: ${method} ${url}`, {
        headers,
        body,
    });

    const originalSend = res.send;
    res.send = function (data) {
        logger.info(`Outgoing Response: ${method} ${url}`, {
            status: res.statusCode,
            response: data,
        });
        return originalSend.apply(res, [arguments[0]]);
    };

    next();
};

export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendFail(res, 'Authorization token required', undefined, 401);
        return;
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return sendFail(res, 'Unauthorized', undefined, 401);
    }

    try {
        if (!process.env.JWT_SECRET) {
            throw new Error(
                'JWT_SECRET is not defined in environment variables'
            );
        }

        // Verify token Redis cache
        const isTokenValid = await verifyToken(token);
        if (!isTokenValid) {
            return sendFail(res, 'Invalid or expired token', undefined, 401);
        }

        // Decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return sendFail(res, 'Invalid token', undefined, 401);
    }
};
