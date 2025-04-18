import { Response } from 'express'; // Import Response type

type Status = 'success' | 'fail' | 'error';

interface ApiError {
  path?: string;
  message: string;
}

interface ApiResponse<T = any> {
  status: Status;
  message: string;
  errors?: ApiError[];
  error?: T;
  data?: T;
}

export function sendSuccess<T>(
  res: any,
  message: string,
  data?: T,
  statusCode = 200
): void {
  const response: ApiResponse<T> = { status: 'success', message, data };
  res.status(statusCode).json(response);
}

export function sendFail(
    res: Response,
    message: string,
    errors?: ApiError[] | string,
    statusCode: number = 400
): void {
    const response: ApiResponse = {
        status: 'fail',
        message,
    };

    // Handle different error formats
    if (Array.isArray(errors)) {
        response.errors = errors;
    } else if (typeof errors === 'string') {
        response.errors = [{ message: errors }];
    }

    res.status(statusCode).json(response);
}

export function sendError(res: Response, error: any, statusCode: number = 500): void {
  const response: ApiResponse = {
    status: 'error',
    message: error?.message || 'Something went wrong',
    errors: error?.errors || undefined,
  };
  res.status(statusCode).json(response);
}
