import { strict as assert } from 'assert';
import { describe, it, before, after, afterEach } from 'mocha';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import app from '../../index';
import {Task} from '../../entities/task/Task';
import { setupTestDB, teardownTestDB, clearDB } from '../test-helper';

describe('Task API', () => {
    const testUser = {
        username: 'Task User',
        email: 'taskuser@example.com',
        password: 'P@ssw0rd',
    };

    let token: string;
    let userJWT: { id: string; email: string };

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

    beforeEach(async () => {
        // Register and log in the user to get a token
        const registerRes = await request(app).post('/api/v1/auth/register').send(testUser);
        assert.equal(registerRes.status, 201, 'User registration failed');

        const loginRes = await request(app).post('/api/v1/auth/login').send({
            email: testUser.email,
            password: testUser.password,
        });

        assert.equal(loginRes.status, 200, 'User login failed');
        assert.ok(loginRes.body.data.token, 'Token is missing in login response');
        token = loginRes.body.data.token;
        userJWT = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string };
    });

    describe('POST /api/v1/task', () => {
        it('should create a new task successfully', async () => {
            const taskData = { title: 'Test Task', description: 'Task description' };
            const res = await request(app)
                .post('/api/v1/task')
                .set('Authorization', `Bearer ${token}`)
                .send(taskData);

            assert.equal(res.status, 201);
            assert.equal(res.body.message, 'Task created successfully');
            assert.equal(res.body.data.title, taskData.title);
            assert.equal(res.body.data.description, taskData.description);

            // Verify task was created in DB
            const task = await Task.findOne({ title: taskData.title });
            assert.ok(task);
            assert.equal(task.title, taskData.title);
            assert.equal(task.description, taskData.description);
        });

        it('should return error for missing fields', async () => {
            const res = await request(app)
                .post('/api/v1/task')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            assert.equal(res.status, 400);
            assert.equal(res.body.message, 'Validation error');
            assert.ok(Array.isArray(res.body.errors));
            assert.ok(res.body.errors.some((e: any) => e.path === 'title'));
        });

        it('should return error for unauthorized access', async () => {
            const taskData = { title: 'Unauthorized Task', description: 'Task description' };
            const res = await request(app).post('/api/v1/task').send(taskData);

            assert.equal(res.status, 401);
            assert.equal(res.body.message, 'Authorization token required');
        });
    });

    describe('GET /api/v1/task', () => {
        it('should retrieve all tasks for the user', async () => {
            // Create tasks
            await Task.create({ title: 'Task 1', description: 'Description 1', user: userJWT.id });
            await Task.create({ title: 'Task 2', description: 'Description 2', user: userJWT.id });

            const res = await request(app)
                .get('/api/v1/task')
                .set('Authorization', `Bearer ${token}`);

            assert.equal(res.status, 200);
            assert.equal(res.body.message, 'Tasks retrieved successfully');
            assert.ok(Array.isArray(res.body.data));
            assert.equal(res.body.data.length, 2);
        });

        it('should return error for unauthorized access', async () => {
            const res = await request(app).get('/api/v1/task');

            assert.equal(res.status, 401);
            assert.equal(res.body.message, 'Authorization token required');
        });
    });

    describe('PUT /api/v1/task/:id', () => {
        it('should update a task successfully', async () => {
            const task = await Task.create({
                title: 'Task to Update',
                description: 'Old description',
                user: userJWT.id,
            });

            const updatedData = { title: 'Updated Task', description: 'Updated description' };
            const res = await request(app)
                .put(`/api/v1/task/${task._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updatedData);

            assert.equal(res.status, 200);
            assert.equal(res.body.message, 'Task updated successfully');
            assert.equal(res.body.data.title, updatedData.title);
            assert.equal(res.body.data.description, updatedData.description);

            // Verify task was updated in DB
            const updatedTask = await Task.findById(task._id);
            assert.ok(updatedTask);
            assert.equal(updatedTask.title, updatedData.title);
            assert.equal(updatedTask.description, updatedData.description);
        });

        it('should return error for unauthorized access', async () => {
            const task = await Task.create({ title: 'Task to Update', description: 'Old description', user: userJWT.id });

            const updatedData = { title: 'Updated Task', description: 'Updated description' };
            const res = await request(app).put(`/api/v1/task/${task._id}`).send(updatedData);

            assert.equal(res.status, 401);
            assert.equal(res.body.message, 'Authorization token required');
        });
    });

    describe('DELETE /api/v1/task/:id', () => {
        it('should delete a task successfully', async () => {
            const task = await Task.create({ title: 'Task to Delete', description: 'Task description', user: userJWT.id });

            const res = await request(app)
                .delete(`/api/v1/task/${task._id}`)
                .set('Authorization', `Bearer ${token}`);

            assert.equal(res.status, 200);
            assert.equal(res.body.message, 'Task deleted successfully');

            // Verify task was deleted from DB
            const deletedTask = await Task.findById(task._id);
            assert.ok(!deletedTask);
        });

        it('should return error for unauthorized access', async () => {
            const task = await Task.create({
                title: 'Task to Delete',
                description: 'Task description',
                user: userJWT.id,
            });

            const res = await request(app).delete(`/api/v1/task/${task._id}`);

            assert.equal(res.status, 401);
            assert.equal(res.body.message, 'Authorization token required');
        });
    });
});
