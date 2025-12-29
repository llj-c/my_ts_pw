import { test, expect } from '@/fixtures/api-client';

/**
 * 使用 API Client Fixture 的测试示例
 * 
 * 这个文件展示了如何使用封装好的 fixture 进行 API 测试
 */
test.describe('使用 Fixture 的 API 测试', () => {
    test('使用 apiClient fixture - GET 请求', async ({ apiClient }) => {
        // apiClient 已经自动创建，直接使用即可
        const response = await apiClient.get('/api/users/1', {
            headers: {
                'Authorization': 'Bearer your-token-here',
            },
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('id');
    });

    test('使用 apiClient fixture - POST 请求', async ({ apiClient }) => {
        const userData = {
            name: '测试用户',
            email: 'test@example.com',
        };

        const response = await apiClient.post('/api/users', userData);
        expect(response.status()).toBe(201);
    });

    test('使用 authApi fixture - 自动认证', async ({ authApi }) => {
        // 先登录（使用环境变量中的凭据）
        await authApi.login();

        // 使用已认证的客户端访问受保护的资源
        const response = await authApi.get('/api/user/profile');
        expect(response.status()).toBe(200);
    });

    test('使用 authApi fixture - 手动设置 token', async ({ authApi }) => {
        authApi.setAuthToken('custom-token-here');

        const response = await authApi.get('/api/user/profile');
        // 根据实际情况验证响应
        expect([200, 401]).toContain(response.status());
    });

    test('同时使用多个 fixtures', async ({ apiClient, authApi }) => {
        // 使用基础客户端进行公开 API 调用
        const publicResponse = await apiClient.get('/api/public/info');
        expect(publicResponse.status()).toBe(200);

        // 使用认证客户端进行受保护 API 调用
        await authApi.login();
        const privateResponse = await authApi.get('/api/user/profile');
        expect(privateResponse.status()).toBe(200);
    });
});

