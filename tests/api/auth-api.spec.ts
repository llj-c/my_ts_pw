import { test, expect } from '@playwright/test';
import { AuthApi } from '@/common/api/authApi';

/**
 * 带认证的 API 测试示例
 */
test.describe('认证 API 测试示例', () => {
    let authApi: AuthApi;

    test.beforeEach(async ({ request }) => {
        authApi = new AuthApi(request);
    });

    test('登录并获取 token', async () => {
        // 登录
        const token = await authApi.login();

        // 验证 token 已设置
        expect(token).toBeTruthy();
        expect(token.length).toBeGreaterThan(0);
    });

    test('使用 token 访问受保护的资源', async () => {
        // 先登录获取 token
        await authApi.login();

        // 使用已认证的客户端访问受保护的资源
        const response = await authApi.get('/api/user/profile');

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('email');
    });

    test('手动设置 token', async () => {
        // 手动设置 token
        authApi.setAuthToken('your-custom-token');

        // 使用自定义 token 访问资源
        const response = await authApi.get('/api/user/profile');
        
        // 验证请求头中包含 Authorization
        // 注意：Playwright 的 request 不直接暴露请求头，但可以通过响应验证
        expect(response.status()).toBe(200);
    });

    test('登出功能', async () => {
        // 先登录
        await authApi.login();

        // 登出
        await authApi.logout();

        // 验证 token 已清除（尝试访问受保护资源应该失败）
        const response = await authApi.get('/api/user/profile');
        expect(response.status()).toBe(401);
    });
});

