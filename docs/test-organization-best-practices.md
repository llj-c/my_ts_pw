# API 测试组织最佳实践

## 当前实现分析

### 当前方式：`user-api-fixture.spec.ts`

```typescript
test.describe('使用 UserApi Fixture 的测试', () => {
    test('获取用户列表', async ({ userApi }) => {
        // 不需要登录
    });

    test('获取当前登录用户信息', async ({ userApi }) => {
        await userApi.login(); // 每个测试都要登录
    });
});
```

**优点：**
- ✅ 代码简洁，使用 fixture
- ✅ 每个测试独立，完全隔离

**缺点：**
- ❌ 如果多个测试需要登录，每个测试都要调用 `login()`
- ❌ 效率较低（重复登录）

## 推荐的组织方式

### 方案 1：使用自动登录的 Fixture（推荐）⭐

**最佳实践：使用 `authedApi` fixture，自动处理登录**

```typescript
import { test, expect } from '@/fixtures/api-client-authed';

test.describe('用户 API 测试', () => {
    // 公开接口测试（不需要登录）
    test.describe('公开接口', () => {
        test('获取用户列表', async ({ apiClient }) => {
            const response = await apiClient.get('/api/users');
            expect(response.status()).toBe(200);
        });

        test('根据 ID 获取用户信息', async ({ apiClient }) => {
            const response = await apiClient.get('/api/users/1');
            expect(response.status()).toBe(200);
        });
    });

    // 需要认证的接口测试
    test.describe('需要认证的接口', () => {
        test('获取当前登录用户信息', async ({ authedApi }) => {
            // authedApi 已经自动登录，直接使用
            const response = await authedApi.get('/api/user/profile');
            expect(response.status()).toBe(200);
        });

        test('更新用户信息', async ({ authedApi }) => {
            const response = await authedApi.put('/api/user/profile', {
                name: '新名称',
            });
            expect(response.status()).toBe(200);
        });
    });
});
```

**优点：**
- ✅ 自动登录，无需手动调用 `login()`
- ✅ 代码更简洁
- ✅ 优先使用全局 token（如果 globalSetup 已登录）

### 方案 2：使用 UserApi Fixture + test.beforeAll

**如果坚持使用 UserApi fixture，可以使用 beforeAll 优化：**

```typescript
import { test, expect } from '@/fixtures/user-api';
import type { UserApi } from '@/common/api/userApi';

test.describe('用户 API 测试', () => {
    let userApi: UserApi;

    // 在测试套件开始时初始化一次
    test.beforeAll(async ({ request }) => {
        userApi = new UserApi(request);
        
        // 优先使用全局 token
        const globalToken = process.env.GLOBAL_AUTH_TOKEN;
        if (globalToken) {
            userApi.setAuthToken(globalToken);
        } else {
            // 如果没有全局 token，则登录
            await userApi.login();
        }
    });

    // 公开接口测试
    test.describe('公开接口', () => {
        test('获取用户列表', async () => {
            // 使用套件级别的 userApi
            const response = await userApi.getUserList();
            expect(response.status()).toBe(200);
        });
    });

    // 需要认证的接口测试
    test.describe('需要认证的接口', () => {
        test('获取当前登录用户信息', async () => {
            // 使用已登录的 userApi
            const response = await userApi.getCurrentUser();
            expect(response.status()).toBe(200);
        });
    });
});
```

**优点：**
- ✅ 套件内共享，避免重复登录
- ✅ 使用 UserApi 的专用方法

**缺点：**
- ❌ 需要手动管理 beforeAll
- ❌ 不能使用 fixture 的自动清理

### 方案 3：优化 UserApi Fixture（最佳）⭐⭐

**改进 UserApi fixture，使其支持自动登录：**

```typescript
// src/fixtures/user-api-authed.ts
import { test as base } from '@playwright/test';
import { UserApi } from '@/common/api/userApi';

export const test = base.extend({
    userApi: async ({ request }, use) => {
        const userApi = new UserApi(request);
        
        // 优先使用全局 token
        const globalToken = process.env.GLOBAL_AUTH_TOKEN;
        if (globalToken) {
            userApi.setAuthToken(globalToken);
        } else {
            // 如果没有全局 token，则自动登录
            await userApi.login();
        }
        
        await use(userApi);
    },
});
```

**然后在测试中使用：**

```typescript
import { test, expect } from '@/fixtures/user-api-authed';

test.describe('用户 API 测试', () => {
    test('获取用户列表', async ({ userApi }) => {
        // 不需要登录的接口
        const response = await userApi.getUserList();
        expect(response.status()).toBe(200);
    });

    test('获取当前登录用户信息', async ({ userApi }) => {
        // 已经自动登录，直接使用
        const response = await userApi.getCurrentUser();
        expect(response.status()).toBe(200);
    });
});
```

## 推荐方案对比

| 方案 | 代码简洁度 | 性能 | 灵活性 | 推荐度 |
|------|-----------|------|--------|--------|
| 当前方式（手动登录） | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| 方案1：authedApi fixture | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 方案2：beforeAll | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 方案3：优化 UserApi fixture | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 最终推荐

**最佳实践：方案 3 - 优化 UserApi Fixture**

1. 创建 `user-api-authed.ts` fixture，自动处理登录
2. 测试代码简洁，无需手动登录
3. 优先使用全局 token，性能最优
4. 保持 UserApi 的专用方法优势

