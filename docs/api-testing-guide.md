# API 接口测试指南

本文档介绍如何在这个项目中进行 API 接口测试。

## 目录结构

```
src/
  ├── common/
  │   └── api/
  │       ├── baseApi.ts      # API 基础类，封装常用 HTTP 方法
  │       ├── authApi.ts      # 带认证功能的 API 客户端
  │       ├── apiClient.ts    # API 客户端工厂类
  │       └── userApi.ts      # 用户 API 客户端示例
  └── fixtures/
      ├── api-client.ts           # API 客户端 Fixture（基础版）
      ├── api-client-with-config.ts  # API 客户端 Fixture（可配置版）
      └── user-api.ts            # UserApi Fixture

tests/
  └── api/
      ├── example-api.spec.ts         # API 测试示例
      ├── auth-api.spec.ts            # 认证 API 测试示例
      ├── fixture-api.spec.ts         # 使用 Fixture 的 API 测试示例
      ├── fixture-api-with-config.spec.ts  # 使用可配置 Fixture 的测试示例
      └── user-api-fixture.spec.ts    # 使用 UserApi Fixture 的测试示例
```

## 快速开始

### 方式一：使用 Fixture（推荐）⭐

使用封装好的 fixture，最简单直接：

```typescript
import { test, expect } from '@/fixtures/api-client';

test('API 测试', async ({ apiClient }) => {
    // apiClient 已经自动创建，直接使用即可
    const response = await apiClient.get('/api/users/1');
    expect(response.status()).toBe(200);
});
```

### 方式二：使用工厂方法

通过 `ApiClient` 工厂类创建实例：

```typescript
import { test } from '@playwright/test';
import { ApiClient } from '@/common/api/apiClient';

test('API 测试', async ({ request }) => {
    const apiClient = ApiClient.create(request, 'https://api.example.com');
    const response = await apiClient.get('/api/users/1');
    expect(response.status()).toBe(200);
});
```

### 方式三：直接使用 Playwright request

如果不需要封装，也可以直接使用 Playwright 的 `request` fixture：

```typescript
import { test, expect } from '@playwright/test';

test('直接使用 request', async ({ request }) => {
    const response = await request.get('https://api.example.com/users/1');
    expect(response.status()).toBe(200);
});
```

## 使用 Fixture（推荐方式）

### 基础 API Client Fixture

最简单的使用方式，适合大多数场景：

```typescript
import { test, expect } from '@/fixtures/api-client';

test.describe('API 测试', () => {
    test('使用 apiClient', async ({ apiClient }) => {
        const response = await apiClient.get('/api/users');
        expect(response.status()).toBe(200);
    });

    test('使用 authApi', async ({ authApi }) => {
        // 先登录
        await authApi.login();
        
        // 访问受保护的资源
        const response = await authApi.get('/api/user/profile');
        expect(response.status()).toBe(200);
    });
});
```

**可用的 fixtures：**
- `apiClient`: 基础 API 客户端（BaseApi 实例）
- `authApi`: 带认证的 API 客户端（AuthApi 实例）

### 可配置的 API Client Fixture

如果需要使用不同的 baseURL，可以使用可配置版本：

```typescript
import { test, expect } from '@/fixtures/api-client-with-config';

test('使用自定义 baseURL', async ({ createApiClient }) => {
    // 创建使用自定义 baseURL 的客户端
    const githubClient = createApiClient('https://api.github.com');
    const response = await githubClient.get('/users/octocat');
    expect(response.status()).toBe(200);
});
```

**可用的 fixtures：**
- `apiClient`: 默认配置的基础 API 客户端
- `authApi`: 默认配置的认证 API 客户端
- `createApiClient(baseURL?)`: 创建自定义 baseURL 的基础客户端
- `createAuthApi(baseURL?)`: 创建自定义 baseURL 的认证客户端

### UserApi Fixture

如果已经创建了特定领域的 API 客户端（如 UserApi），也可以为其创建 fixture：

```typescript
import { test, expect } from '@/fixtures/user-api';

test('用户 API 测试', async ({ userApi }) => {
    const response = await userApi.getUserList();
    expect(response.status()).toBe(200);
});
```

### 自动登录的 API Client Fixture ⭐ 推荐

**如果希望测试前自动登录，后续测试直接使用已登录的客户端**，可以使用自动登录的 fixture：

```typescript
import { test, expect } from '@/fixtures/api-client-authed';

test.describe('API 测试', () => {
    test('直接使用已登录的客户端', async ({ authedApi }) => {
        // authedApi 已经自动登录，无需手动调用 login()
        const response = await authedApi.get('/api/user/profile');
        expect(response.status()).toBe(200);
    });

    test('访问受保护的资源', async ({ authedApi }) => {
        // 无需登录，直接使用
        const response = await authedApi.get('/api/user/settings');
        expect(response.status()).toBe(200);
    });
});
```

**特点：**
- ✅ 每个测试开始时自动登录
- ✅ 测试代码简洁，无需手动调用 `login()`
- ✅ 每个测试使用独立的登录会话（测试隔离）

**可用的 fixtures：**
- `authedApi`: 自动登录的认证 API 客户端（每个测试自动登录）
- `apiClient`: 基础 API 客户端（不需要认证）

### 测试套件级别自动登录 Fixture

如果希望**整个测试套件只登录一次**，所有测试共享同一个登录状态，可以使用测试套件级别的 fixture：

```typescript
import { test, expect } from '@/fixtures/api-client-suite-authed';

test.describe('API 测试套件', () => {
    test('第一个测试', async ({ suiteAuthedApi }) => {
        // 测试套件开始时已自动登录
        const response = await suiteAuthedApi.get('/api/user/profile');
        expect(response.status()).toBe(200);
    });

    test('第二个测试', async ({ suiteAuthedApi }) => {
        // 使用同一个已登录的客户端，无需再次登录
        const response = await suiteAuthedApi.get('/api/user/settings');
        expect(response.status()).toBe(200);
    });
});
```

**特点：**
- ✅ 整个测试套件只登录一次（性能更好）
- ✅ 所有测试共享同一个登录会话
- ⚠️ 注意：如果 token 过期，可能需要重新登录

**可用的 fixtures：**
- `suiteAuthedApi`: 测试套件级别自动登录的认证 API 客户端
- `apiClient`: 基础 API 客户端（不需要认证）

### 可配置的自动登录 Fixture

如果需要使用不同的 baseURL 并自动登录：

```typescript
import { test, expect } from '@/fixtures/api-client-with-config';

test('使用默认配置的自动登录客户端', async ({ authedApi }) => {
    // 使用默认 baseURL，已自动登录
    const response = await authedApi.get('/api/user/profile');
    expect(response.status()).toBe(200);
});

test('创建自定义 baseURL 的自动登录客户端', async ({ createAuthedApi }) => {
    // 创建使用自定义 baseURL 的自动登录客户端
    const customAuthedApi = await createAuthedApi('https://api.example.com');
    
    // 已经自动登录，直接使用
    const response = await customAuthedApi.get('/api/user/profile');
    expect(response.status()).toBe(200);
});
```

**可用的 fixtures：**
- `authedApi`: 默认配置的自动登录客户端
- `createAuthedApi(baseURL?)`: 创建自定义 baseURL 的自动登录客户端
- `apiClient`: 基础 API 客户端
- `authApi`: 需要手动登录的认证客户端
- `createApiClient(baseURL?)`: 创建自定义 baseURL 的基础客户端
- `createAuthApi(baseURL?)`: 创建自定义 baseURL 的认证客户端（需手动登录）

## 快速开始（旧方式）

### 1. 基础 API 测试

使用 `BaseApi` 类进行基础的 HTTP 请求：

```typescript
import { test } from '@playwright/test';
import { ApiClient } from '@/common/api/apiClient';

test('GET 请求示例', async ({ request }) => {
    const apiClient = ApiClient.create(request, 'https://api.example.com');
    
    const response = await apiClient.get('/api/users/1');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('id');
});
```

### 2. 带认证的 API 测试

使用 `AuthApi` 类进行需要认证的 API 请求：

```typescript
import { test } from '@playwright/test';
import { AuthApi } from '@/common/api/authApi';

test('需要认证的 API 测试', async ({ request }) => {
    const authApi = new AuthApi(request, 'https://api.example.com');
    
    // 先登录获取 token
    await authApi.login();
    
    // 使用已认证的客户端访问受保护的资源
    const response = await authApi.get('/api/user/profile');
    expect(response.status()).toBe(200);
});
```

### 3. 直接使用 Playwright request

如果不需要封装，也可以直接使用 Playwright 的 `request` fixture：

```typescript
import { test, expect } from '@playwright/test';

test('直接使用 request', async ({ request }) => {
    const response = await request.get('https://api.example.com/users/1');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('id');
});
```

## API 类说明

### BaseApi

基础 API 类，提供以下方法：

- `get(endpoint, options?)` - GET 请求
- `post(endpoint, data?, options?)` - POST 请求
- `put(endpoint, data?, options?)` - PUT 请求
- `patch(endpoint, data?, options?)` - PATCH 请求
- `delete(endpoint, options?)` - DELETE 请求

**参数说明：**

- `endpoint`: API 端点路径（相对路径或完整 URL）
- `data`: 请求体数据（POST/PUT/PATCH）
- `options`: 可选配置
  - `headers`: 自定义请求头
  - `params`: 查询参数（仅 GET 请求）

**示例：**

```typescript
// GET 请求带查询参数
const response = await apiClient.get('/api/users', {
    params: {
        page: 1,
        limit: 10,
    },
});

// POST 请求
const response = await apiClient.post('/api/users', {
    name: 'John',
    email: 'john@example.com',
});

// 自定义请求头
const response = await apiClient.get('/api/users', {
    headers: {
        'X-Custom-Header': 'value',
    },
});
```

### AuthApi

继承自 `BaseApi`，添加了认证功能：

**额外方法：**

- `login(email?, password?)` - 登录并获取 token
- `logout()` - 登出
- `setAuthToken(token)` - 手动设置 token

**特点：**

- 所有请求自动添加 `Authorization: Bearer {token}` 头
- 支持从环境变量读取登录凭据
- Token 自动管理

**示例：**

```typescript
const authApi = new AuthApi(request);

// 使用环境变量中的凭据登录
await authApi.login();

// 或使用自定义凭据
await authApi.login('user@example.com', 'password');

// 手动设置 token
authApi.setAuthToken('your-token-here');

// 所有请求都会自动包含认证头
const response = await authApi.get('/api/protected-resource');
```

## 环境配置

API 基础 URL 可以通过以下方式配置：

1. **使用环境变量**：在 `.env` 文件中设置 `OPS_BASE_URL`
2. **构造函数参数**：创建 API 客户端时传入 `baseURL`

```typescript
// 使用环境变量中的 OPS_BASE_URL
const apiClient = ApiClient.create(request);

// 使用自定义 baseURL
const apiClient = ApiClient.create(request, 'https://api.example.com');
```

## 响应处理

所有 API 方法返回 `APIResponse` 对象，可以使用以下方法：

```typescript
const response = await apiClient.get('/api/users/1');

// 获取状态码
const status = response.status();

// 获取响应头
const contentType = response.headers()['content-type'];

// 获取响应体（JSON）
const body = await response.json();

// 获取响应体（文本）
const text = await response.text();

// 验证响应状态
expect(response.ok()).toBeTruthy();
expect(response.status()).toBe(200);
```

## 错误处理

### 检查状态码

```typescript
const response = await apiClient.get('/api/users/999');

if (response.status() === 404) {
    console.log('用户不存在');
} else if (response.status() === 401) {
    console.log('未授权');
}
```

### 使用 try-catch

```typescript
try {
    const response = await apiClient.post('/api/users', userData);
    expect(response.status()).toBe(201);
} catch (error) {
    console.error('请求失败:', error);
}
```

## 最佳实践

1. **使用 Page Object 模式**：为不同的 API 模块创建独立的类
2. **统一错误处理**：创建统一的错误处理函数
3. **测试数据管理**：将测试数据放在 `tests/data/` 目录
4. **环境隔离**：使用不同的环境配置文件（`.env.test`, `.env.prod`）
5. **请求拦截**：使用 Playwright 的 `route` 功能进行请求拦截和模拟

## 示例：创建用户 API 类

```typescript
import { AuthApi } from '@/common/api/authApi';
import type { APIRequestContext } from '@playwright/test';

export class UserApi extends AuthApi {
    constructor(request: APIRequestContext, baseURL?: string) {
        super(request, baseURL);
    }

    async getUserById(id: number) {
        return await this.get(`/api/users/${id}`);
    }

    async createUser(userData: { name: string; email: string }) {
        return await this.post('/api/users', userData);
    }

    async updateUser(id: number, userData: Partial<{ name: string; email: string }>) {
        return await this.put(`/api/users/${id}`, userData);
    }

    async deleteUser(id: number) {
        return await this.delete(`/api/users/${id}`);
    }
}
```

## Fixture 详解

### 为什么使用 Fixture？

使用 Fixture 有以下优势：

1. **代码简洁**：不需要在每个测试中手动创建 API 客户端
2. **统一管理**：所有测试使用相同的配置和初始化逻辑
3. **易于维护**：修改配置只需在一个地方修改
4. **类型安全**：TypeScript 自动推断类型
5. **自动登录**：支持自动登录，测试代码更简洁

### 选择哪个 Fixture？

根据不同的使用场景选择合适的 fixture：

| Fixture | 登录方式 | 适用场景 |
|---------|---------|---------|
| `@/fixtures/api-client` | 手动登录 | 需要灵活控制登录时机 |
| `@/fixtures/api-client-authed` | 每个测试自动登录 | **推荐**：大多数需要认证的测试场景 |
| `@/fixtures/api-client-suite-authed` | 测试套件级别登录 | 性能要求高，token 有效期长 |
| `@/fixtures/api-client-with-config` | 支持自动登录 + 自定义配置 | 需要不同 baseURL 的场景 |
| `@/fixtures/user-api` | 手动登录 | 特定领域的 API 测试 |

### 创建自定义 Fixture

如果需要为特定的 API 客户端创建 fixture，可以参考以下示例：

```typescript
// src/fixtures/my-api.ts
import { test as base } from '@playwright/test';
import { MyApi } from '@/common/api/myApi';

export type MyApiFixtures = {
    myApi: MyApi;
};

export const test = base.extend<MyApiFixtures>({
    myApi: async ({ request }, use) => {
        const myApi = new MyApi(request);
        await use(myApi);
    },
});

export { expect } from '@playwright/test';
```

然后在测试中使用：

```typescript
import { test, expect } from '@/fixtures/my-api';

test('我的 API 测试', async ({ myApi }) => {
    const response = await myApi.doSomething();
    expect(response.status()).toBe(200);
});
```

### 组合多个 Fixtures

可以在一个测试文件中组合使用多个 fixtures：

```typescript
import { test as base } from '@playwright/test';
import { test as apiTest } from '@/fixtures/api-client';
import { test as userApiTest } from '@/fixtures/user-api';

// 组合多个 fixtures
const test = base.extend({
    ...apiTest.fixtures,
    ...userApiTest.fixtures,
});

test('组合使用多个 fixtures', async ({ apiClient, userApi }) => {
    // 可以使用 apiClient
    const response1 = await apiClient.get('/api/public');
    
    // 也可以使用 userApi
    const response2 = await userApi.getUserList();
});
```

## 运行测试

```bash
# 运行所有 API 测试
npx playwright test tests/api

# 运行特定测试文件
npx playwright test tests/api/fixture-api.spec.ts

# 运行使用 fixture 的测试
npx playwright test tests/api/fixture-api.spec.ts tests/api/user-api-fixture.spec.ts

# 使用 UI 模式运行
npx playwright test --ui tests/api
```

## 更多资源

- [Playwright API Testing 官方文档](https://playwright.dev/docs/test-api-testing)
- [Playwright Request API](https://playwright.dev/docs/api/class-apirequestcontext)
- [Playwright Fixtures 文档](https://playwright.dev/docs/test-fixtures)

