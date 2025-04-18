import { strict as assert } from 'assert';
import { describe, it, before, after, afterEach } from 'mocha';
import request from 'supertest';

import app from '../../app/index';
import User from '../../app/entities/user/User';
import { setupTestDB, teardownTestDB, clearDB } from '../test-helper';

describe('POST /api/v1/auth/register', () => {
    const testUser = {
        username: 'Admin Test',
        email: 'admin@sample.com',
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

        // Ensure errors is an array
        assert.ok(Array.isArray(res.body.errors));

        // Validate the errors array
        assert.ok(res.body.errors.some((e: any) => e.path === 'username' && e.message === 'Username is required'));
        assert.ok(res.body.errors.some((e: any) => e.path === 'password' && e.message === 'Password is required'));
    });

    it('should return error for duplicate email', async () => {
        // First create a user
        await request(app)
            .post('/api/v1/auth/register')
            .send({ ...testUser, username: 'Admin Test 2' });

        // Try to create same user again
        const res = await request(app).post('/api/v1/auth/register').send(testUser);

        assert.equal(res.status, 409);
        assert.equal(res.body.message, 'Email already in use');
    });

    it('should return error for duplicate username', async () => {
        // First create a user
        await request(app)
            .post('/api/v1/auth/register')
            .send({ ...testUser, email: 'admin_new@sample.com' });

        // Try to create same user again
        const res = await request(app).post('/api/v1/auth/register').send(testUser);

        assert.equal(res.status, 409);
        assert.equal(res.body.message, 'Username already in use');
    });

    it('should return error for invalid email format', async () => {
        const res = await request(app).post('/api/v1/auth/register').send({
            ...testUser,
            email: 'invalid-email',
        });

        assert.equal(res.status, 400);
        assert.equal(res.body.message, 'Validation error');
        assert.ok(res.body.errors.some((e: any) => e.path === 'email'));
    });

    it('should return error for weak password', async () => {
        const res = await request(app).post('/api/v1/auth/register').send({
            ...testUser,
            email: 'another@example.com',
            password: '123',
        });

        assert.equal(res.status, 400);
        assert.equal(res.body.message, 'Validation error');
        assert.ok(res.body.errors.some((e: any) => e.path === 'password'));
    });
});
