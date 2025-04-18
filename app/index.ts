import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import { createClient } from 'redis';

import { logger, httpLogger, logError } from './utils/logger';
import Route from './routes/index';
import { configureCors } from './config/corsConfig';
import { globalErrorhandler } from './middleware/errorHandler';
import { urlVersioning } from './middleware/apiVersioning';
import { createBasicRateLimiter } from './middleware/rateLimiter';
import { sendSuccess, sendError } from './utils/responseHandler';
import { connectToMongoDB } from './config/mongose';

const app = express();
const HOST = process.env.HOST || 'http://127.0.0.1';
const PORT = process.env.PORT || 8000;

// Example: Using winston logger for application logs
logger.info('Application starting...');

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
connectToMongoDB().catch((error) =>
    logError(error as Error, `MongoDB connection error: ${error}`)
);

// Redis Client Setup
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redisClient = createClient({ url: REDIS_URL });

redisClient.on('connect', () => {
    logger.info('Connected to Redis');
});

redisClient.on('error', (error) => {
    logError(error as Error, 'Redis error');
});

// Morgan HTTP request logging
app.use(httpLogger);

// Config CORS
app.use(configureCors());

// Rate limiter middleware (50 requests per 1 minute)
app.use(createBasicRateLimiter(80, 1 * 60 * 1000));

// Body parser
app.use(express.json());

// API Versioning
app.use(urlVersioning(process.env.VERSI || 'v1'));

// Health Check
app.use('/api/v1/health', (_req: Request, res: Response) => {
    try {
        sendSuccess(res, 'Health check passed', null, 200);
    } catch (error) {
        sendError(res, error, 500);
    }
});

// API Routes
app.use('/api/v1', Route);

// Global Error Handler
app.use(globalErrorhandler);

// Start server
app.listen(PORT, () => {
    logger.info(`Server is now running on ${HOST}:${PORT}`);
});

export default app;
