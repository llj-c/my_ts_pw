import { test, expect } from '@playwright/test';
import { UserApi } from '@/common/api/userApi';

/**
 * 用户 API 测试示例
 * 展示如何使用 UserApi 进行用户相关的 API 测试
 */
test.describe('用户 API 测试', () => {
    let userApi: UserApi;

    test.beforeEach(async ({ request }) => {
        userApi = new UserApi(request);
        // 如果需要认证，先登录
        // await userApi.login();
    });

    test('获取用户列表', async () => {
        const response = await userApi.getUserList({
            page: 1,
            limit: 10,
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('total');
        expect(Array.isArray(body.data)).toBe(true);
    });

    test('根据 ID 获取用户信息', async () => {
        const userId = 1;
        const response = await userApi.getUserById(userId);

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('id', userId);
        expect(body).toHaveProperty('name');
        expect(body).toHaveProperty('email');
    });

    test('创建用户', async () => {
        const userData = {
            name: '测试用户',
            email: `test${Date.now()}@example.com`,
            password: 'password123',
        };

        const response = await userApi.createUser(userData);

        expect(response.status()).toBe(201);
        const body = await response.json();
        expect(body).toHaveProperty('id');
        expect(body.name).toBe(userData.name);
        expect(body.email).toBe(userData.email);
    });

    test('更新用户信息', async () => {
        const userId = 1;
        const updateData = {
            name: '更新后的用户名',
        };

        const response = await userApi.updateUser(userId, updateData);

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.name).toBe(updateData.name);
    });

    test('删除用户', async () => {
        // 先创建一个用户用于删除
        const createResponse = await userApi.createUser({
            name: '待删除用户',
            email: `delete${Date.now()}@example.com`,
        });
        const createdUser = await createResponse.json();
        const userId = createdUser.id;

        // 删除用户
        const deleteResponse = await userApi.deleteUser(userId);
        expect(deleteResponse.status()).toBe(204);

        // 验证用户已被删除
        const getResponse = await userApi.getUserById(userId);
        expect(getResponse.status()).toBe(404);
    });

    test('获取当前登录用户信息', async () => {
        // 先登录
        await userApi.login();

        const response = await userApi.getCurrentUser();

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('email');
    });
});

