import winston from 'winston';
import morgan from 'morgan';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// Custom log levels and colors
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Development format (plain text, no colors)
const devFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        let log = `${timestamp} ${level.toUpperCase()}: ${message}`;
        if (stack) log += `\n${stack}`;
        return log;
    })
);

// Production format (structured JSON remains unchanged)
const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

// Plain text format for file transports (no colors)
const plainTextFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        let log = `${timestamp} ${level.toUpperCase()}: ${message}`;
        if (stack) log += `\n${stack}`;
        return log;
    })
);

// Ensure logs directory exists
const logsDir = path.resolve('logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Base logger
export const logger = winston.createLogger({
    levels: logLevels,
    format: winston.format.combine(
        winston.format.errors({ stack: true }),
        devFormat // Use plain text format for all environments
    ),
    transports: [
        // Console always, for all levels
        new winston.transports.Console({
            level: 'debug',
        }),

        // Default file transport for all levels (plain text format)
        new DailyRotateFile({
            filename: 'logs/logger-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
            level: 'debug', // Capture all levels
            format: plainTextFormat, // Use plain text format for files
        }),

        // Daily rotated files in production
        ...(process.env.NODE_ENV === 'production'
            ? [
                  new DailyRotateFile({
                      filename: 'logs/application-%DATE%.log',
                      datePattern: 'YYYY-MM-DD',
                      zippedArchive: true,
                      maxSize: '20m',
                      maxFiles: '14d',
                      level: 'info',
                      format: plainTextFormat, // Use plain text format for files
                  }),
                  new DailyRotateFile({
                      filename: 'logs/error-%DATE%.log',
                      datePattern: 'YYYY-MM-DD',
                      zippedArchive: true,
                      maxSize: '20m',
                      maxFiles: '30d',
                      level: 'error',
                      format: plainTextFormat, // Use plain text format for files
                  }),
              ]
            : []),
    ],
});

// Enhanced HTTP logger middleware
export const httpLogger = morgan(
    (tokens, req: Request, res: Response) => {
        const method = tokens.method(req, res);
        const url = tokens.url(req, res);
        const status = tokens.status(req, res);
        const responseTime = tokens['response-time'](req, res);
        const contentLength = tokens.res(req, res, 'content-length');
        const ip = tokens['remote-addr'](req, res);

        const logMessage = [
            `${tokens.date(req, res, 'iso')}`,
            `${method}`,
            `${url}`,
            `${status}`,
            `${responseTime}ms`,
            `${contentLength || '-'}b`,
            `${ip}`,
        ].join(' ');

        return logMessage;
    },
    {
        stream: {
            write: (message: string) => {
                logger.http(message.trim());
            },
        },
    }
);

// Utility functions
export const logError = (error: Error, context?: string) => {
    const message = context ? `${context}: ${error.message}` : error.message;
    logger.error({
        message,
        stack: error.stack,
    });
};

export const logRoute = (message: string, meta?: object) => {
    logger.info(message, meta);
};

export const logDebug = (message: string, meta?: object) => {
    logger.debug(message, meta);
};
