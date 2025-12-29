import { test as base } from '@playwright/test';
import { UserApi } from '@/common/api/userApi';

/**
 * 用户 API Fixture 类型定义
 */
export type UserApiFixtures = {
    userApi: UserApi;
};

/**
 * 扩展 Playwright test，添加 UserApi fixture
 * 
 * 使用方式：
 * ```typescript
 * import { test } from '@/fixtures/user-api';
 * 
 * test('用户 API 测试', async ({ userApi }) => {
 *     const response = await userApi.getUserList();
 * });
 * ```
 */
export const test = base.extend<UserApiFixtures>({
    /**
     * 用户 API 客户端 fixture
     * 使用环境变量中的 OPS_BASE_URL 作为基础 URL
     */
    userApi: async ({ request }, use) => {
        const userApi = new UserApi(request);
        await use(userApi);
    },
});

export { expect } from '@playwright/test';

