# 方案调整总结

本文档总结了之前创建的 API 测试方案中需要调整的地方，以及已完成的优化。

## 已完成的调整

### 1. Global Setup 优化

**问题：**
- 路径使用 `__dirname` 可能在编译后出现问题
- 未使用的导入

**调整：**
- ✅ 使用 `process.cwd()` 获取项目根目录，更可靠
- ✅ 移除了未使用的 `fileURLToPath` 导入
- ✅ Token 文件路径改为使用项目根目录

### 2. Fixture 优化 - 优先使用全局 Token

**问题：**
- `authedApi` fixture 每次都执行登录，即使 globalSetup 已经登录了
- 没有利用全局 token，造成重复登录

**调整：**
- ✅ `api-client-authed.ts` 中的 `authedApi` 优先使用全局 token
- ✅ `api-client-with-config.ts` 中的 `authedApi` 和 `createAuthedApi` 优先使用全局 token
- ✅ `api-client-suite-authed.ts` 中的 `suiteAuthedApi` 优先使用全局 token

**优化效果：**
- 如果 globalSetup 已登录，fixture 会直接使用全局 token，避免重复登录
- 如果没有全局 token，则自动登录（保持向后兼容）

### 3. Suite Authed Fixture 类型错误修复

**问题：**
- `api-client-suite-authed.ts` 中 worker scope 的类型定义有误

**调整：**
- ✅ 移除了 worker scope（因为 Playwright 的 fixture scope 限制）
- ✅ 改为使用 test scope，但通过共享实例实现类似效果
- ✅ 添加了全局 token 支持

## 使用建议

### 推荐方案组合

1. **使用 Global Setup + Authed Fixture（推荐）**
   ```typescript
   // playwright.config.ts
   globalSetup: require.resolve('./src/global-setup.ts'),
   
   // 测试文件
   import { test } from '@/fixtures/api-client-authed';
   
   test('API 测试', async ({ authedApi }) => {
       // 自动使用全局 token，无需重复登录
       const response = await authedApi.get('/api/user/profile');
   });
   ```

2. **仅使用 Authed Fixture（不使用 Global Setup）**
   ```typescript
   // 不配置 globalSetup
   // 测试文件
   import { test } from '@/fixtures/api-client-authed';
   
   test('API 测试', async ({ authedApi }) => {
       // 每个测试自动登录
       const response = await authedApi.get('/api/user/profile');
   });
   ```

## 性能对比

| 方案 | 登录次数 | 适用场景 |
|------|---------|---------|
| Global Setup + Authed Fixture | 1次（全局） | 推荐：token 有效期长，测试量大 |
| 仅 Authed Fixture | N次（每个测试） | token 有效期短，需要测试隔离 |
| Suite Authed Fixture | 1次（测试套件） | 测试套件内共享，但需要隔离不同套件 |

## 注意事项

1. **Token 有效期**：如果使用 Global Setup，确保 token 在测试运行期间不会过期
2. **测试隔离**：Global Setup 的 token 在所有测试间共享，如果需要完全隔离，使用 Authed Fixture
3. **错误处理**：默认情况下，登录失败只会警告，不会中断测试。如需强制要求登录成功，取消相关注释

## 后续优化建议

1. **Token 刷新机制**：如果 token 会过期，可以添加自动刷新机制
2. **多用户支持**：支持多个用户同时登录，使用不同的 token
3. **缓存机制**：缓存 token，避免重复登录
4. **配置化**：通过配置文件控制是否使用全局 token

