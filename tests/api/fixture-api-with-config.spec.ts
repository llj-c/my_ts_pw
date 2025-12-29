import { test, expect } from '@/fixtures/api-client-with-config';

/**
 * 使用带配置的 API Client Fixture 的测试示例
 * 
 * 这个文件展示了如何使用可配置的 fixture 进行 API 测试
 */
test.describe('使用可配置 Fixture 的 API 测试', () => {
    test('使用默认 apiClient', async ({ apiClient }) => {
        // 使用默认配置（环境变量中的 OPS_BASE_URL）
        const response = await apiClient.get('/api/users');
        expect(response.status()).toBe(200);
    });

    test('使用 createApiClient 创建自定义客户端', async ({ createApiClient }) => {
        // 创建使用自定义 baseURL 的客户端
        const customClient = createApiClient('https://api.github.com');
        
        const response = await customClient.get('/users/octocat');
        expect(response.status()).toBe(200);
        
        const body = await response.json();
        expect(body).toHaveProperty('login', 'octocat');
    });

    test('使用 createAuthApi 创建自定义认证客户端', async ({ createAuthApi }) => {
        // 创建使用自定义 baseURL 的认证客户端
        const customAuthApi = createAuthApi('https://api.example.com');
        
        // 登录
        await customAuthApi.login();
        
        // 访问受保护的资源
        const response = await customAuthApi.get('/api/user/profile');
        expect(response.status()).toBe(200);
    });

    test('在同一个测试中使用多个不同配置的客户端', async ({ 
        apiClient, 
        createApiClient, 
        createAuthApi 
    }) => {
        // 使用默认配置的客户端
        const defaultResponse = await apiClient.get('/api/users');
        
        // 使用自定义配置的客户端
        const githubClient = createApiClient('https://api.github.com');
        const githubResponse = await githubClient.get('/users/octocat');
        
        // 使用自定义配置的认证客户端
        const customAuthApi = createAuthApi('https://api.example.com');
        await customAuthApi.login();
        const profileResponse = await customAuthApi.get('/api/user/profile');
        
        expect(defaultResponse.status()).toBe(200);
        expect(githubResponse.status()).toBe(200);
        expect(profileResponse.status()).toBe(200);
    });
});

