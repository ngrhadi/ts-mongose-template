import { createClient } from 'redis';
import { logError } from '../utils/logger';

class RedisService {
    private client: ReturnType<typeof createClient>;
    private static instance: RedisService;

    private constructor() {
        this.client = createClient({
            url: process.env.REDIS_URL,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 5) {
                        logError(new Error(`Retries: ${retries}`), 'Too many retries, closing Redis');
                        return new Error('Redis connection failed');
                    }
                    return Math.min(retries * 100, 5000);
                },
            },
        });

        this.client.on('error', (error) =>
            logError(error as Error, 'Redis Client Error')
        );
        this.client.connect();
    }

    public static getInstance(): RedisService {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }

    public async cacheToken(token: string, ttl: number): Promise<void> {
        try {
            await this.client.set(`token:${token}`, 'valid', { EX: ttl });
        } catch (error) {
            logError(error as Error, 'Redis cache error');
            throw error;
        }
    }

    public async isTokenBlacklisted(token: string): Promise<boolean> {
        try {
            const result = await this.client.exists(`blacklist:${token}`);
            return result === 1;
        } catch (error) {
            logError(error as Error, 'Redis blacklist check error');
            return false;
        }
    }

    public async verifyToken(token: string): Promise<boolean> {
        if (await this.isTokenBlacklisted(token)) {
            return false;
        }
        return (await this.client.get(`token:${token}`)) === 'valid';
    }

    public async invalidateToken(token: string): Promise<void> {
        try {
            await this.client.del(`token:${token}`);

            const ttl = await this.client.ttl(`token:${token}`);
            if (ttl > 0) {
                await this.client.set(`blacklist:${token}`, 'invalid', {
                    EX: ttl,
                });
            }
        } catch (error) {
            logError(error as Error, 'Redis invalidation error');
            throw error;
        }
    }
}

export default RedisService.getInstance();
