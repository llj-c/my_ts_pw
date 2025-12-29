import { test as base } from '@playwright/test';
import { BaseApi } from '@/common/api/baseApi';
import { AuthApi } from '@/common/api/authApi';
import type { APIRequestContext } from '@playwright/test';

/**
 * 测试套件级别自动登录的 API 客户端 Fixture 类型定义
 * 
 * 注意：这个 fixture 在测试套件（test.describe）级别只登录一次，
 * 所有测试共享同一个已登录的客户端实例
 */
export type SuiteAuthedApiFixtures = {
    suiteAuthedApi: AuthApi;
    apiClient: BaseApi;
};

/**
 * 扩展 Playwright test，添加测试套件级别自动登录的 API 客户端 fixtures
 * 
 * 使用方式：
 * ```typescript
 * import { test } from '@/fixtures/api-client-suite-authed';
 * 
 * test.describe('API 测试套件', () => {
 *     // 整个测试套件只登录一次
 *     test('测试1', async ({ suiteAuthedApi }) => {
 *         const response = await suiteAuthedApi.get('/api/user/profile');
 *     });
 *     
 *     test('测试2', async ({ suiteAuthedApi }) => {
 *         // 无需再次登录，使用同一个已登录的客户端
 *         const response = await suiteAuthedApi.get('/api/user/settings');
 *     });
 * });
 * ```
 */
export const test = base.extend<SuiteAuthedApiFixtures>({
    /**
     * 基础 API 客户端 fixture（不需要认证）
     */
    apiClient: async ({ request }, use) => {
        const apiClient = new BaseApi(request);
        await use(apiClient);
    },

    /**
     * 测试套件级别自动登录的认证 API 客户端 fixture
     * 在测试套件开始时自动登录一次，所有测试共享同一个客户端实例
     * 
     * 注意：这个 fixture 使用 worker scope，确保同一 worker 内的测试共享登录状态
     * 优先使用全局 token（如果 globalSetup 已登录），否则自动登录
     */
    suiteAuthedApi: async ({ request }, use, testInfo) => {
        // 创建客户端
        const authApi = new AuthApi(request);
        
        // 优先使用全局 token（如果 globalSetup 已登录）
        const globalToken = process.env.GLOBAL_AUTH_TOKEN;
        if (globalToken) {
            console.log('使用全局 token（测试套件级别）');
            authApi.setAuthToken(globalToken);
        } else {
            // 如果没有全局 token，则自动登录
            try {
                await authApi.login();
            } catch (error) {
                console.warn('测试套件自动登录失败:', error);
                // 如果需要登录失败时测试也失败，取消下面的注释
                // throw new Error(`测试套件自动登录失败: ${error}`);
            }
        }
        
        // 使用已登录的客户端
        await use(authApi);
    },
});

export { expect } from '@playwright/test';

