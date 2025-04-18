import dotenv from 'dotenv';
dotenv.config();

import cors, { CorsOptionsDelegate, CorsRequest } from 'cors';


export function configureCors() {
  const corsOptionsDelegate: CorsOptionsDelegate = (
    req: CorsRequest,
    callback
  ) => {
    const allowedOrigins = [
      'http://localhost:3000',
      process.env.PRODUCTION_URL,
    ];

    const origin = req.headers.origin;

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Version'],
        exposedHeaders: ['X-Total-Count', 'Content-Range'],
        credentials: true,
        preflightContinue: false,
        maxAge: 600,
        optionsSuccessStatus: 204,
      });
    } else {
      callback(new Error('Not allowed by CORS'), undefined);
    }
  };

  return cors(corsOptionsDelegate);
}
