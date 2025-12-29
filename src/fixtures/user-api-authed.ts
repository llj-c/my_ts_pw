import { test as base } from '@playwright/test';
import { UserApi } from '@/common/api/userApi';

/**
 * 自动登录的 UserApi Fixture 类型定义
 */
export type UserApiAuthedFixtures = {
    userApi: UserApi;
};

/**
 * 扩展 Playwright test，添加自动登录的 UserApi fixture
 * 
 * 使用方式：
 * ```typescript
 * import { test } from '@/fixtures/user-api-authed';
 * 
 * test.describe('用户 API 测试', () => {
 *     test('获取用户列表', async ({ userApi }) => {
 *         // userApi 已经自动登录（如果需要）
 *         const response = await userApi.getUserList();
 *     });
 * 
 *     test('获取当前登录用户信息', async ({ userApi }) => {
 *         // 已经自动登录，直接使用
 *         const response = await userApi.getCurrentUser();
 *     });
 * });
 * ```
 */
export const test = base.extend<UserApiAuthedFixtures>({
    /**
     * 自动登录的 UserApi 客户端 fixture
     * 优先使用全局 token（如果 globalSetup 已登录），否则自动登录
     */
    userApi: async ({ request }, use) => {
        const userApi = new UserApi(request);
        
        // 优先使用全局 token（如果 globalSetup 已登录）
        const globalToken = process.env.GLOBAL_AUTH_TOKEN;
        if (globalToken) {
            userApi.setAuthToken(globalToken);
        } else {
            // 如果没有全局 token，则自动登录
            try {
                await userApi.login();
            } catch (error) {
                console.warn('UserApi 自动登录失败:', error);
                // 如果需要登录失败时测试也失败，取消下面的注释
                // throw new Error(`UserApi 自动登录失败: ${error}`);
            }
        }
        
        await use(userApi);
    },
});

export { expect } from '@playwright/test';

