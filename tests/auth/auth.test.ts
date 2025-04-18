import { strict as assert } from 'assert';
import { describe, it, before, after, afterEach } from 'mocha';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import app from '../../app/index';
import User from '../../app/entities/user/User';
import { setupTestDB, teardownTestDB, clearDB } from '../test-helper';

describe('Auth API', () => {
    const testUser = {
        username: 'Test User',
        email: 'testuser@example.com',
        password: 'P@ssw0rd',
    };

    // Setup and teardown in-memory database
    before(async () => {
        await setupTestDB();
    });

    after(async () => {
        await teardownTestDB();
    });

    afterEach(async () => {
        await clearDB();
    });

    describe('POST /api/v1/auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app).post('/api/v1/auth/register').send(testUser);

            assert.equal(res.status, 201);
            assert.equal(res.body.message, 'User registered successfully');
            assert.equal(res.body.data.email, testUser.email);
            assert.equal(res.body.data.username, testUser.username);
            assert.ok(!res.body.data.password);

            // Verify user was actually created in DB
            const user = await User.findOne({ email: testUser.email });
            assert.ok(user);
            assert.equal(user.username, testUser.username);
            assert.equal(user.email, testUser.email);
        });

        it('should return validation error for missing fields', async () => {
            const res = await request(app).post('/api/v1/auth/register').send({ email: testUser.email });

            assert.equal(res.status, 400);
            assert.equal(res.body.message, 'Validation error');
            assert.ok(Array.isArray(res.body.errors));
            assert.ok(res.body.errors.some((e: any) => e.path === 'username'));
            assert.ok(res.body.errors.some((e: any) => e.path === 'password'));
        });

        it('should return error for duplicate email', async () => {
            await request(app).post('/api/v1/auth/register').send(testUser);

            const res = await request(app).post('/api/v1/auth/register').send(testUser);

            assert.equal(res.status, 409);
            assert.equal(res.body.message, 'Email already in use');
        });
    });

    describe('POST /api/v1/auth/login', () => {
        beforeEach(async () => {
            // Create a user for login tests
            await request(app).post('/api/v1/auth/register').send(testUser);
        });

        it('should login successfully with valid credentials', async () => {
            const res = await request(app).post('/api/v1/auth/login').send({
                email: testUser.email,
                password: testUser.password,
            });

            assert.equal(res.status, 200);
            assert.equal(res.body.message, 'Login successful');
            assert.ok(res.body.data.token);
            assert.equal(res.body.data.user.email, testUser.email);
            assert.equal(res.body.data.user.username, testUser.username);
        });

        it('should return error for invalid email', async () => {
            const res = await request(app).post('/api/v1/auth/login').send({
                email: 'invalid@example.com',
                password: testUser.password,
            });

            assert.equal(res.status, 400);
            assert.equal(res.body.message, 'Invalid email or password');
        });

        it('should return error for invalid password', async () => {
            const res = await request(app).post('/api/v1/auth/login').send({
                email: testUser.email,
                password: 'wrongpassword',
            });

            assert.equal(res.status, 400);
            assert.equal(res.body.message, 'Invalid email or password');
        });
    });

    describe('POST /api/v1/auth/logout', () => {
        let token: string;

        beforeEach(async () => {
            // Create a user and log in to get a token
            await request(app).post('/api/v1/auth/register').send(testUser);
            const loginRes = await request(app).post('/api/v1/auth/login').send({
                email: testUser.email,
                password: testUser.password,
            });
            token = loginRes.body.data.token;
        });

        it('should logout successfully with a valid token', async () => {
            const res = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${token}`);

            assert.equal(res.status, 200);
            assert.equal(res.body.message, 'Logout successful');
        });

        it('should return error for missing token', async () => {
            const res = await request(app).post('/api/v1/auth/logout');

            assert.equal(res.status, 401);
            assert.equal(res.body.message, 'Authorization token required');
        });

        it('should return error for invalid token', async () => {
            const res = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', 'Bearer invalidtoken');

            assert.equal(res.status, 401);
            assert.equal(res.body.message, 'Invalid token');
        });

        it('should return error for expired token', async () => {
            // Simulate an expired token by using a short-lived token
            const expiredToken = jwt.sign(
                { id: 'testuserid', email: testUser.email },
                process.env.JWT_SECRET!,
                { expiresIn: '1ms' }
            );

            const res = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${expiredToken}`);

            assert.equal(res.status, 401);
            assert.equal(res.body.message, 'Token expired');
        });
    });
});
