import { test, expect } from '@/fixtures/user-api-authed';

/**
 * 使用自动登录的 UserApi Fixture 的测试示例
 * 
 * 这是推荐的组织方式：
 * - 自动登录，无需手动调用 login()
 * - 优先使用全局 token（如果 globalSetup 已登录）
 * - 代码简洁，易于维护
 */
test.describe('用户 API 测试', () => {
    // 公开接口测试（不需要登录）
    test.describe('公开接口', () => {
        test('获取用户列表', async ({ userApi }) => {
            const response = await userApi.getUserList({
                page: 1,
                limit: 10,
            });

            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body).toHaveProperty('data');
            expect(Array.isArray(body.data)).toBe(true);
        });

        test('根据 ID 获取用户信息', async ({ userApi }) => {
            const userId = 1;
            const response = await userApi.getUserById(userId);

            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body).toHaveProperty('id', userId);
        });
    });

    // 需要认证的接口测试
    test.describe('需要认证的接口', () => {
        test('获取当前登录用户信息', async ({ userApi }) => {
            // userApi 已经自动登录，直接使用
            const response = await userApi.getCurrentUser();
            expect(response.status()).toBe(200);
            
            const body = await response.json();
            expect(body).toHaveProperty('email');
        });

        test('更新用户信息', async ({ userApi }) => {
            const updateData = {
                name: '更新后的用户名',
            };

            // 注意：这里需要先获取用户 ID，或者使用当前用户接口
            // 示例中使用 userId = 1，实际应该从 getCurrentUser 获取
            const response = await userApi.updateUser(1, updateData);
            expect(response.status()).toBe(200);
        });
    });

    // CRUD 完整流程测试
    test.describe('用户 CRUD 流程', () => {
        test('创建、更新、删除用户', async ({ userApi }) => {
            // 创建用户
            const userData = {
                name: '测试用户',
                email: `test${Date.now()}@example.com`,
                password: 'password123',
            };

            const createResponse = await userApi.createUser(userData);
            expect(createResponse.status()).toBe(201);
            const createdUser = await createResponse.json();
            const userId = createdUser.id;

            // 更新用户
            const updateResponse = await userApi.updateUser(userId, {
                name: '更新后的名称',
            });
            expect(updateResponse.status()).toBe(200);

            // 删除用户
            const deleteResponse = await userApi.deleteUser(userId);
            expect(deleteResponse.status()).toBe(204);

            // 验证用户已被删除
            const getResponse = await userApi.getUserById(userId);
            expect(getResponse.status()).toBe(404);
        });
    });
});

