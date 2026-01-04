# Prisma Migrate Deploy 命令详解

## 概述

`npx prisma migrate deploy` 是 Prisma 迁移系统中的一个**生产环境专用命令**，用于在生产环境中应用待执行的迁移，而不会创建新的迁移文件。

---

## 命令作用

### `prisma migrate deploy` 做什么？

1. **读取迁移历史**：检查 `prisma/migrations/` 目录中的迁移文件
2. **检查数据库状态**：查看数据库中已应用的迁移
3. **应用待执行迁移**：只执行那些还未应用到数据库的迁移
4. **不创建新迁移**：不会创建新的迁移文件，只应用现有的

### 与 `prisma migrate dev` 的区别

| 特性 | `prisma migrate dev` | `prisma migrate deploy` |
|------|---------------------|------------------------|
| **使用环境** | 开发环境 | 生产环境 |
| **创建迁移文件** | ✅ 是 | ❌ 否 |
| **应用迁移** | ✅ 是 | ✅ 是 |
| **生成 Client** | ✅ 是 | ❌ 否 |
| **交互式** | ✅ 是（会提示） | ❌ 否（静默执行） |
| **安全性** | 较低（可能丢失数据） | 较高（只应用已验证的迁移） |

---

## 使用场景

### 场景 1: 部署到生产环境

**工作流程**：

1. **开发环境**：创建并测试迁移
   ```bash
   # 在开发环境
   npx prisma migrate dev --name add_new_field
   ```

2. **提交代码**：将迁移文件提交到版本控制
   ```bash
   git add prisma/migrations/
   git commit -m "Add migration: add_new_field"
   git push
   ```

3. **生产环境**：应用迁移
   ```bash
   # 在生产环境
   npx prisma migrate deploy
   ```

### 场景 2: CI/CD 流程

在 CI/CD 流水线中使用：

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Deploy application
        run: npm run deploy
```

### 场景 3: 多环境部署

```bash
# 测试环境
DATABASE_URL=$TEST_DB_URL npx prisma migrate deploy

# 预发布环境
DATABASE_URL=$STAGING_DB_URL npx prisma migrate deploy

# 生产环境
DATABASE_URL=$PROD_DB_URL npx prisma migrate deploy
```

---

## 执行过程

### 步骤详解

1. **连接数据库**
   ```
   Prisma Migrate 连接到数据库...
   ```

2. **检查迁移状态**
   ```
   检查迁移状态...
   发现 3 个待执行的迁移
   ```

3. **应用迁移**
   ```
   应用迁移: 20240101000000_add_new_field
   应用迁移: 20240102000000_update_schema
   应用迁移: 20240103000000_add_index
   ```

4. **完成**
   ```
   所有迁移已成功应用
   ```

### 执行示例

```bash
$ npx prisma migrate deploy

Environment variables loaded from .env
Prisma schema loaded from src/utils/db/schema.prisma
Datasource "db": SQLite database "test.db" at "file:./test.db"

3 migrations found in prisma/migrations

Applying migration `20240101000000_add_new_field`
Applying migration `20240102000000_update_schema`
Applying migration `20240103000000_add_index`

All migrations have been successfully applied.
```

---

## 重要特性

### 1. 幂等性（Idempotent）

`migrate deploy` 是**幂等的**，意味着：
- 如果迁移已经应用过，不会重复执行
- 可以安全地多次运行
- 只会应用新的、未执行的迁移

### 2. 不会创建新迁移

与 `migrate dev` 不同，`migrate deploy` **不会**：
- 创建新的迁移文件
- 修改 schema.prisma
- 生成 Prisma Client
- 提示你创建迁移

### 3. 静默执行

在生产环境中，`migrate deploy` 会：
- 静默执行，不提示确认
- 适合自动化脚本
- 适合 CI/CD 流程

### 4. 只应用已验证的迁移

只应用已经存在于 `prisma/migrations/` 目录中的迁移文件，这些迁移应该已经在开发/测试环境中验证过。

---

## 完整工作流程

### 开发到生产的完整流程

```
┌─────────────────────────────────────────────────────────┐
│ 1. 开发环境：修改 schema.prisma                        │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 2. 创建迁移：prisma migrate dev --name add_field         │
│    - 创建迁移文件                                        │
│    - 应用迁移到开发数据库                                │
│    - 生成 Prisma Client                                 │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 3. 测试迁移：在开发环境测试                              │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 4. 提交代码：git commit & push                          │
│    - 迁移文件提交到版本控制                              │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 5. 生产环境：拉取代码                                    │
│    - git pull                                            │
│    - npm install                                         │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 6. 应用迁移：prisma migrate deploy                       │
│    - 只应用待执行的迁移                                   │
│    - 不创建新迁移                                        │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 7. 部署应用：启动应用服务                                │
└─────────────────────────────────────────────────────────┘
```

---

## 命令选项

### 基本用法

```bash
npx prisma migrate deploy
```

### 常用选项

```bash
# 指定 schema 文件位置
npx prisma migrate deploy --schema=./src/utils/db/schema.prisma

# 跳过生成步骤（如果已经生成过）
npx prisma migrate deploy --skip-generate

# 查看帮助
npx prisma migrate deploy --help
```

---

## 错误处理

### 常见错误

#### 1. 迁移冲突

```
Error: Migration `20240101000000_add_field` failed to apply.
```

**原因**：迁移文件与数据库状态不匹配

**解决**：
- 检查迁移文件是否正确
- 检查数据库是否处于正确状态
- 可能需要手动修复数据库

#### 2. 数据库连接失败

```
Error: Can't reach database server
```

**解决**：
- 检查 `DATABASE_URL` 环境变量
- 检查数据库服务是否运行
- 检查网络连接

#### 3. 迁移文件缺失

```
Error: Migration files not found
```

**解决**：
- 确保 `prisma/migrations/` 目录存在
- 确保迁移文件已提交到版本控制
- 检查迁移文件路径

---

## 最佳实践

### 1. 始终在部署前备份数据库

```bash
# 备份数据库
cp production.db production.db.backup

# 应用迁移
npx prisma migrate deploy
```

### 2. 在 CI/CD 中使用

```yaml
- name: Deploy migrations
  run: npx prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 3. 使用环境变量

```bash
# 不同环境使用不同的数据库
DATABASE_URL=$PROD_DB_URL npx prisma migrate deploy
```

### 4. 监控迁移状态

```bash
# 检查迁移状态
npx prisma migrate status
```

### 5. 回滚策略

如果迁移失败，需要手动回滚：

```bash
# 1. 恢复数据库备份
# 2. 修复迁移文件
# 3. 重新部署
npx prisma migrate deploy
```

---

## 与 migrate dev 的对比

### 开发环境 vs 生产环境

| 操作 | 开发环境 | 生产环境 |
|------|---------|---------|
| **创建迁移** | `migrate dev` | ❌ 不创建 |
| **应用迁移** | `migrate dev` | `migrate deploy` |
| **生成 Client** | `migrate dev` | 单独运行 `generate` |
| **交互式** | ✅ 是 | ❌ 否 |

### 推荐流程

```bash
# 开发环境
npx prisma migrate dev --name add_field
# → 创建迁移 + 应用迁移 + 生成 Client

# 生产环境
npx prisma generate        # 生成 Client（如果需要）
npx prisma migrate deploy  # 只应用迁移
```

---

## 实际示例

### 示例 1: 标准部署流程

```bash
# 1. 开发环境创建迁移
npx prisma migrate dev --name add_user_table

# 2. 提交到 Git
git add prisma/migrations/
git commit -m "Add user table migration"
git push

# 3. 生产环境部署
git pull
npm install
npx prisma migrate deploy
npm run start
```

### 示例 2: 使用 Docker

```dockerfile
# Dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 应用迁移（在容器启动时）
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

### 示例 3: 使用 package.json 脚本

```json
{
  "scripts": {
    "deploy:migrate": "prisma migrate deploy",
    "deploy:full": "npm run prisma:generate && npm run deploy:migrate && npm start"
  }
}
```

---

## 总结

### `prisma migrate deploy` 的核心要点

1. ✅ **生产环境专用**：只在生产环境使用
2. ✅ **只应用迁移**：不创建新迁移文件
3. ✅ **幂等性**：可以安全地多次运行
4. ✅ **静默执行**：适合自动化脚本
5. ✅ **安全性**：只应用已验证的迁移

### 使用时机

- ✅ 部署到生产环境时
- ✅ CI/CD 流水线中
- ✅ 多环境部署时
- ❌ 开发环境（使用 `migrate dev`）
- ❌ 创建新迁移时（使用 `migrate dev`）

### 记住

**开发环境** → `prisma migrate dev`  
**生产环境** → `prisma migrate deploy`

