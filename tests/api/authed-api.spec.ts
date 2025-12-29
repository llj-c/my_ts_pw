import { test, expect } from '@/fixtures/api-client-authed';

/**
 * 使用自动登录 Fixture 的测试示例
 * 
 * 这个文件展示了如何使用自动登录的 fixture，测试前自动登录，测试中直接使用
 */
test.describe('自动登录的 API 测试', () => {
    test('直接使用已登录的客户端', async ({ authedApi }) => {
        // authedApi 已经自动登录，无需手动调用 login()
        const response = await authedApi.get('/api/user/profile');

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('email');
    });

    test('访问受保护的资源', async ({ authedApi }) => {
        // 无需登录，直接使用
        const response = await authedApi.get('/api/user/settings');

        expect(response.status()).toBe(200);
    });

    test('创建资源', async ({ authedApi }) => {
        // 所有请求都会自动包含认证头
        const response = await authedApi.post('/api/posts', {
            title: '测试标题',
            content: '测试内容',
        });

        expect(response.status()).toBe(201);
    });

    test('同时使用已登录和未登录的客户端', async ({ authedApi, apiClient }) => {
        // 使用未登录的客户端访问公开接口
        const publicResponse = await apiClient.get('/api/public/info');
        expect(publicResponse.status()).toBe(200);

        // 使用已登录的客户端访问受保护接口
        const privateResponse = await authedApi.get('/api/user/profile');
        expect(privateResponse.status()).toBe(200);
    });

    test('更新用户信息', async ({ authedApi }) => {
        const updateData = {
            name: '更新后的用户名',
        };

        const response = await authedApi.put('/api/user/profile', updateData);
        expect(response.status()).toBe(200);
    });
});

