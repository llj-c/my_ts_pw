import { test, expect } from '@/fixtures/api-client-suite-authed';

/**
 * 使用测试套件级别自动登录 Fixture 的测试示例
 * 
 * 这个 fixture 在整个测试套件开始时只登录一次，
 * 所有测试共享同一个已登录的客户端实例
 */
test.describe('测试套件级别自动登录的 API 测试', () => {
    test('第一个测试 - 使用已登录的客户端', async ({ suiteAuthedApi }) => {
        // suiteAuthedApi 已经在测试套件开始时自动登录
        const response = await suiteAuthedApi.get('/api/user/profile');

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('email');
    });

    test('第二个测试 - 无需再次登录', async ({ suiteAuthedApi }) => {
        // 使用同一个已登录的客户端，无需再次登录
        const response = await suiteAuthedApi.get('/api/user/settings');

        expect(response.status()).toBe(200);
    });

    test('第三个测试 - 继续使用已登录的客户端', async ({ suiteAuthedApi }) => {
        // 所有测试共享同一个登录状态
        const response = await suiteAuthedApi.post('/api/posts', {
            title: '测试标题',
            content: '测试内容',
        });

        expect(response.status()).toBe(201);
    });

    test('第四个测试 - 验证登录状态持续有效', async ({ suiteAuthedApi }) => {
        // 验证 token 仍然有效
        const response = await suiteAuthedApi.get('/api/user/profile');
        expect(response.status()).toBe(200);
    });
});

