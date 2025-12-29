import { test, expect } from '@/fixtures/user-api';

/**
 * 使用 UserApi Fixture 的测试示例
 * 
 * 这个文件展示了如何使用封装好的 UserApi fixture 进行用户相关的 API 测试
 */
test.describe('使用 UserApi Fixture 的测试', () => {
    test('获取用户列表', async ({ userApi }) => {
        const response = await userApi.getUserList({
            page: 1,
            limit: 10,
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('data');
        expect(Array.isArray(body.data)).toBe(true);
    });

    test('根据 ID 获取用户信息', async ({ userApi }) => {
        const userId = 1;
        const response = await userApi.getUserById(userId);

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('id', userId);
    });

    test('创建用户', async ({ userApi }) => {
        const userData = {
            name: '测试用户',
            email: `test${Date.now()}@example.com`,
            password: 'password123',
        };

        const response = await userApi.createUser(userData);
        expect(response.status()).toBe(201);
    });

    test('获取当前登录用户信息', async ({ userApi }) => {
        // 先登录
        await userApi.login();

        const response = await userApi.getCurrentUser();
        expect(response.status()).toBe(200);
        
        const body = await response.json();
        expect(body).toHaveProperty('email');
    });
});

