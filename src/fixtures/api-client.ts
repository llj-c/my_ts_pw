import { test as base } from '@playwright/test';
import { BaseApi } from '@/common/api/baseApi';
import { AuthApi } from '@/common/api/authApi';
import type { APIRequestContext } from '@playwright/test';

/**
 * API 客户端 Fixture 类型定义
 */
export type ApiFixtures = {
    apiClient: BaseApi;
    authApi: AuthApi;
};

/**
 * 扩展 Playwright test，添加 API 客户端 fixtures
 * 
 * 使用方式：
 * ```typescript
 * import { test } from '@/fixtures/api-client';
 * 
 * test('API 测试', async ({ apiClient, authApi }) => {
 *     const response = await apiClient.get('/api/users');
 * });
 * ```
 */
export const test = base.extend<ApiFixtures>({
    /**
     * 基础 API 客户端 fixture
     * 使用环境变量中的 OPS_BASE_URL 作为基础 URL
     */
    apiClient: async ({ request }, use) => {
        const apiClient = new BaseApi(request);
        await use(apiClient);
    },

    /**
     * 带认证的 API 客户端 fixture
     * 使用环境变量中的 OPS_BASE_URL 作为基础 URL
     */
    authApi: async ({ request }, use) => {
        const authApi = new AuthApi(request);
        await use(authApi);
    },
});

export { expect } from '@playwright/test';

