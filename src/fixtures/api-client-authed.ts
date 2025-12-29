import { test as base } from '@playwright/test';
import { BaseApi } from '@/common/api/baseApi';
import { AuthApi } from '@/common/api/authApi';
import type { APIRequestContext } from '@playwright/test';

/**
 * 自动登录的 API 客户端 Fixture 类型定义
 */
export type AuthedApiFixtures = {
    authedApi: AuthApi;
    apiClient: BaseApi;
};

/**
 * 扩展 Playwright test，添加自动登录的 API 客户端 fixtures
 * 
 * 使用方式：
 * ```typescript
 * import { test } from '@/fixtures/api-client-authed';
 * 
 * test('API 测试', async ({ authedApi }) => {
 *     // authedApi 已经自动登录，可以直接使用
 *     const response = await authedApi.get('/api/user/profile');
 * });
 * ```
 */
export const test = base.extend<AuthedApiFixtures>({
    /**
     * 基础 API 客户端 fixture（不需要认证）
     */
    apiClient: async ({ request }, use) => {
        const apiClient = new BaseApi(request);
        await use(apiClient);
    },

    /**
     * 自动登录的认证 API 客户端 fixture
     * 优先使用全局 token（如果 globalSetup 已登录），否则自动登录
     */
    authedApi: async ({ request }, use) => {
        const authApi = new AuthApi(request);
        
        // 优先使用全局 token（如果 globalSetup 已登录）
        const globalToken = process.env.GLOBAL_AUTH_TOKEN;
        if (globalToken) {
            console.log('使用全局 token');
            authApi.setAuthToken(globalToken);
        } else {
            // 如果没有全局 token，则自动登录
            try {
                await authApi.login();
            } catch (error) {
                // 如果登录失败，可以选择抛出错误或继续（根据需求调整）
                console.warn('自动登录失败:', error);
                // 如果希望登录失败时测试也失败，可以取消下面的注释
                // throw new Error(`自动登录失败: ${error}`);
            }
        }
        
        // 使用 fixture
        await use(authApi);
        
        // 可选：测试结束后登出（如果需要）
        // await authApi.logout();
    },
});

export { expect } from '@playwright/test';

