import { test, expect } from '@playwright/test';
import { ApiClient } from '@/common/api/apiClient';

/**
 * API 测试示例
 * 
 * 这个文件展示了如何使用 Playwright 进行 API 接口测试
 */
test.describe('API 测试示例', () => {
    let apiClient: ReturnType<typeof ApiClient.create>;

    test.beforeEach(async ({ request }) => {
        // 在每个测试前创建 API 客户端
        // 可以设置不同的 baseURL，例如：'https://api.example.com'
        apiClient = ApiClient.create(request);
    });

    test('GET 请求示例 - 获取用户信息', async () => {
        // 示例：获取用户信息
        const response = await apiClient.get('/api/users/1', {
            headers: {
                'Authorization': 'Bearer your-token-here',
            },
        });

        // 验证状态码
        expect(response.status()).toBe(200);

        // 验证响应体
        const body = await response.json();
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('name');
    });

    test('POST 请求示例 - 创建用户', async () => {
        const userData = {
            name: '测试用户',
            email: 'test@example.com',
        };

        const response = await apiClient.post('/api/users', userData, {
            headers: {
                'Authorization': 'Bearer your-token-here',
            },
        });

        // 验证状态码
        expect(response.status()).toBe(201);

        // 验证响应体
        const body = await response.json();
        expect(body).toHaveProperty('id');
        expect(body.name).toBe(userData.name);
        expect(body.email).toBe(userData.email);
    });

    test('PUT 请求示例 - 更新用户信息', async () => {
        const updateData = {
            name: '更新后的用户名',
        };

        const response = await apiClient.put('/api/users/1', updateData, {
            headers: {
                'Authorization': 'Bearer your-token-here',
            },
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.name).toBe(updateData.name);
    });

    test('DELETE 请求示例 - 删除用户', async () => {
        const response = await apiClient.delete('/api/users/1', {
            headers: {
                'Authorization': 'Bearer your-token-here',
            },
        });

        expect(response.status()).toBe(204);
    });

    test('带查询参数的 GET 请求', async () => {
        const response = await apiClient.get('/api/users', {
            params: {
                page: 1,
                limit: 10,
                status: 'active',
            },
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('total');
    });

    test('错误处理示例 - 404 Not Found', async () => {
        const response = await apiClient.get('/api/users/99999');

        expect(response.status()).toBe(404);
    });

    test('错误处理示例 - 401 Unauthorized', async () => {
        const response = await apiClient.get('/api/protected-resource');

        expect(response.status()).toBe(401);
    });
});

/**
 * 使用原生 Playwright request 的示例
 * 如果不需要封装，也可以直接使用 request fixture
 */
test.describe('原生 Playwright API 测试', () => {
    test('直接使用 request fixture', async ({ request }) => {
        const response = await request.get('https://api.github.com/users/octocat', {
            headers: {
                'Accept': 'application/json',
            },
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('login');
        expect(body.login).toBe('octocat');
    });

    test('POST 请求示例', async ({ request }) => {
        const response = await request.post('https://httpbin.org/post', {
            data: {
                key: 'value',
            },
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.json).toHaveProperty('key', 'value');
    });
});

