import { test as base } from '@playwright/test';
import { BaseApi } from '@/common/api/baseApi';
import { AuthApi } from '@/common/api/authApi';
import type { APIRequestContext } from '@playwright/test';

/**
 * 带配置的 API 客户端 Fixture 类型定义
 */
export type ApiFixturesWithConfig = {
    apiClient: BaseApi;
    authApi: AuthApi;
    authedApi: AuthApi;
    createApiClient: (baseURL?: string) => BaseApi;
    createAuthApi: (baseURL?: string) => AuthApi;
    createAuthedApi: (baseURL?: string) => Promise<AuthApi>;
};

/**
 * 扩展 Playwright test，添加可配置的 API 客户端 fixtures
 * 
 * 使用方式：
 * ```typescript
 * import { test } from '@/fixtures/api-client-with-config';
 * 
 * test('API 测试', async ({ authedApi, createApiClient }) => {
 *     // 使用自动登录的客户端
 *     const response1 = await authedApi.get('/api/user/profile');
 *     
 *     // 使用自定义 baseURL 的客户端
 *     const customClient = createApiClient('https://api.example.com');
 *     const response2 = await customClient.get('/api/users');
 * });
 * ```
 */
export const test = base.extend<ApiFixturesWithConfig>({
    /**
     * 基础 API 客户端 fixture（使用默认配置）
     */
    apiClient: async ({ request }, use) => {
        const apiClient = new BaseApi(request);
        await use(apiClient);
    },

    /**
     * 带认证的 API 客户端 fixture（使用默认配置，需要手动登录）
     */
    authApi: async ({ request }, use) => {
        const authApi = new AuthApi(request);
        await use(authApi);
    },

    /**
     * 自动登录的认证 API 客户端 fixture（使用默认配置）
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
                console.warn('自动登录失败:', error);
                // 如果需要登录失败时测试也失败，取消下面的注释
                // throw new Error(`自动登录失败: ${error}`);
            }
        }
        
        await use(authApi);
    },

    /**
     * 创建自定义 baseURL 的基础 API 客户端
     */
    createApiClient: async ({ request }, use) => {
        const factory = (baseURL?: string) => {
            return new BaseApi(request, baseURL);
        };
        await use(factory);
    },

    /**
     * 创建自定义 baseURL 的认证 API 客户端（需要手动登录）
     */
    createAuthApi: async ({ request }, use) => {
        const factory = (baseURL?: string) => {
            return new AuthApi(request, baseURL);
        };
        await use(factory);
    },

    /**
     * 创建自定义 baseURL 的自动登录认证 API 客户端
     * 优先使用全局 token（如果 globalSetup 已登录），否则自动登录
     */
    createAuthedApi: async ({ request }, use) => {
        const factory = async (baseURL?: string) => {
            const authApi = new AuthApi(request, baseURL);
            
            // 优先使用全局 token（如果 globalSetup 已登录）
            const globalToken = process.env.GLOBAL_AUTH_TOKEN;
            if (globalToken) {
                authApi.setAuthToken(globalToken);
            } else {
                // 如果没有全局 token，则自动登录
                try {
                    await authApi.login();
                } catch (error) {
                    console.warn('自动登录失败:', error);
                    // throw new Error(`自动登录失败: ${error}`);
                }
            }
            return authApi;
        };
        await use(factory);
    },
});

export { expect } from '@playwright/test';
