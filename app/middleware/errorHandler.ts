import { Request, Response, NextFunction } from 'express';

export class APIError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'APIError';
    Error.captureStackTrace(this, this.constructor); // Optional: better stack trace
  }
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const globalErrorhandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err.stack);

  if (err instanceof APIError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  } else if (err.name === 'ValidationError') {
    res.status(400).json({
      status: 'error',
      message: 'Validation Error',
    });
  } else {
    res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred',
    });
  }
};
