import { test, expect } from '@/fixtures/api-client-with-config';

/**
 * 使用可配置的自动登录 Fixture 的测试示例
 */
test.describe('可配置的自动登录 API 测试', () => {
    test('使用默认配置的自动登录客户端', async ({ authedApi }) => {
        // 使用默认 baseURL，已自动登录
        const response = await authedApi.get('/api/user/profile');
        expect(response.status()).toBe(200);
    });

    test('创建自定义 baseURL 的自动登录客户端', async ({ createAuthedApi }) => {
        // 创建使用自定义 baseURL 的自动登录客户端
        const customAuthedApi = await createAuthedApi('https://api.example.com');
        
        // 已经自动登录，直接使用
        const response = await customAuthedApi.get('/api/user/profile');
        expect(response.status()).toBe(200);
    });

    test('对比手动登录和自动登录', async ({ authApi, authedApi }) => {
        // authApi 需要手动登录
        await authApi.login();
        const response1 = await authApi.get('/api/user/profile');

        // authedApi 已经自动登录
        const response2 = await authedApi.get('/api/user/profile');

        expect(response1.status()).toBe(200);
        expect(response2.status()).toBe(200);
    });

    test('在同一个测试中使用多个自动登录的客户端', async ({ 
        authedApi, 
        createAuthedApi 
    }) => {
        // 使用默认配置的自动登录客户端
        const response1 = await authedApi.get('/api/user/profile');

        // 创建自定义配置的自动登录客户端
        const customAuthedApi = await createAuthedApi('https://api.example.com');
        const response2 = await customAuthedApi.get('/api/user/profile');

        expect(response1.status()).toBe(200);
        expect(response2.status()).toBe(200);
    });
});

