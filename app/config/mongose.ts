import mongoose from 'mongoose';
import { logger, logError } from '../utils/logger';

export const connectToMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL!, {
            auth: {
                username: process.env.MONGOUSER,
                password: process.env.MONGOPASSWORD,
            },
            authSource: 'admin', // Critical for authentication
        });
        logger.info('MongoDB connected');
    } catch (error) {
        logError(error as Error, 'MongoDB connection error');
        process.exit(1);
    }
};
