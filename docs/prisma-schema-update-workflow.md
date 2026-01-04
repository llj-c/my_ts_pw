# Prisma Schema 更新工作流程

## 概述

当你修改了 `schema.prisma` 文件后，需要执行以下步骤来同步代码和数据库。

---

## 完整工作流程

### 步骤 1: 修改 schema.prisma

编辑 `src/utils/db/schema.prisma`，例如添加新字段、新模型等：

```prisma
model TestDataUrlCapture {
  id                  Int       @id @default(autoincrement())
  apiUrl              String
  apiMethod           String
  // 新增字段
  apiVersion          String?   // 新增的字段
  // ... 其他字段
}
```

### 步骤 2: 重新生成 Prisma Client

**必须执行**：每次修改 schema 后都要重新生成 Client

```bash
npm run prisma:generate
```

或者：

```bash
npx prisma generate
```

**作用**：
- 根据新的 schema 重新生成 TypeScript 类型
- 更新 Prisma Client 的 API
- 确保代码中的类型与数据库结构一致

### 步骤 3: 更新数据库结构

有两种方式，选择其一：

#### 方式 A: 快速同步（开发环境推荐）

```bash
npm run prisma:push
```

或者：

```bash
npx prisma db push
```

**特点**：
- ✅ 快速，直接更新数据库结构
- ✅ 不创建迁移文件
- ✅ 适合开发环境快速迭代
- ❌ 不记录变更历史
- ❌ 不适合生产环境

**适用场景**：
- 开发阶段频繁修改 schema
- 测试环境
- 个人项目

#### 方式 B: 使用迁移（生产环境推荐）

```bash
npm run prisma:migrate
```

或者：

```bash
npx prisma migrate dev --name add_api_version
```

**特点**：
- ✅ 创建迁移文件，记录变更历史
- ✅ 可以回滚迁移
- ✅ 适合团队协作
- ✅ 生产环境推荐
- ❌ 需要命名迁移
- ❌ 稍微复杂一些

**适用场景**：
- 生产环境
- 团队协作项目
- 需要版本控制的场景

---

## 工作流程对比

| 操作 | `prisma generate` | `prisma db push` | `prisma migrate dev` |
|------|------------------|------------------|---------------------|
| **何时使用** | 每次修改 schema 后 | 开发环境快速同步 | 生产环境，需要迁移历史 |
| **更新代码** | ✅ 是 | ❌ 否 | ❌ 否 |
| **更新数据库** | ❌ 否 | ✅ 是 | ✅ 是 |
| **创建迁移文件** | ❌ 否 | ❌ 否 | ✅ 是 |
| **执行速度** | 快 | 很快 | 中等 |

---

## 完整示例

### 场景 1: 添加新字段

```prisma
// schema.prisma
model TestDataUrlCapture {
  id                  Int       @id @default(autoincrement())
  apiUrl              String
  apiMethod           String
  apiVersion          String?   // 新增字段
  // ... 其他字段
}
```

**执行命令**：

```bash
# 1. 重新生成 Client（必须）
npm run prisma:generate

# 2. 更新数据库（选择其一）
npm run prisma:push        # 快速同步
# 或
npm run prisma:migrate     # 创建迁移
```

### 场景 2: 添加新模型

```prisma
// schema.prisma
model TestDataUrlCapture {
  // ... 现有字段
}

// 新增模型
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
```

**执行命令**：

```bash
# 1. 重新生成 Client
npm run prisma:generate

# 2. 更新数据库
npm run prisma:push
```

### 场景 3: 修改字段类型

```prisma
// schema.prisma
model TestDataUrlCapture {
  // 将 String 改为 Int
  apiStatusCode Int?  // 原来是 String?
}
```

**执行命令**：

```bash
# 1. 重新生成 Client
npm run prisma:generate

# 2. 更新数据库（注意：可能丢失数据）
npm run prisma:push
```

**⚠️ 警告**：修改字段类型可能导致数据丢失，建议先备份数据。

---

## 常见更新场景

### 1. 添加字段

```prisma
model TestDataUrlCapture {
  // 现有字段...
  newField String?  // 新增
}
```

→ `prisma generate` + `prisma db push`

### 2. 删除字段

```prisma
model TestDataUrlCapture {
  // oldField String?  // 删除这行
}
```

→ `prisma generate` + `prisma db push`（会丢失该字段的数据）

### 3. 修改字段类型

```prisma
model TestDataUrlCapture {
  apiStatusCode Int?  // 从 String? 改为 Int?
}
```

→ `prisma generate` + `prisma db push`（可能丢失数据）

### 4. 添加关系

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id     Int  @id @default(autoincrement())
  userId Int
  user   User @relation(fields: [userId], references: [id])
}
```

→ `prisma generate` + `prisma migrate dev --name add_user_post_relation`

### 5. 添加索引

```prisma
model TestDataUrlCapture {
  apiUrl String
  // ...
  @@index([apiUrl])  // 新增索引
}
```

→ `prisma generate` + `prisma db push`

---

## 验证更新

### 方法 1: 验证 Schema

```bash
npx prisma validate
```

检查 schema 文件是否有语法错误。

### 方法 2: 格式化 Schema

```bash
npx prisma format
```

自动格式化 schema 文件。

### 方法 3: 查看数据库结构

```bash
npx prisma studio
```

打开可视化界面，查看数据库结构和数据。

### 方法 4: 查看迁移状态

如果使用迁移：

```bash
npx prisma migrate status
```

查看迁移历史和应用状态。

---

## 最佳实践

### 开发环境工作流程

```bash
# 1. 修改 schema.prisma
# 2. 验证 schema
npx prisma validate

# 3. 格式化（可选）
npx prisma format

# 4. 重新生成 Client
npm run prisma:generate

# 5. 快速同步数据库
npm run prisma:push

# 6. 测试代码
npm test
```

### 生产环境工作流程

```bash
# 1. 修改 schema.prisma
# 2. 验证 schema
npx prisma validate

# 3. 重新生成 Client
npm run prisma:generate

# 4. 创建迁移
npm run prisma:migrate
# 或指定名称
npx prisma migrate dev --name descriptive_name

# 5. 测试迁移
# 6. 部署到生产环境
npx prisma migrate deploy
```

---

## 常见问题

### Q: 只修改了 schema，忘记运行 generate，会怎样？

**A**: 代码中的类型会过时，TypeScript 可能报错，运行时可能出错。

**解决**：立即运行 `prisma generate`。

### Q: 运行了 generate，但忘记 push/migrate，会怎样？

**A**: 代码类型已更新，但数据库结构还是旧的，可能导致运行时错误。

**解决**：运行 `prisma db push` 或 `prisma migrate dev`。

### Q: 可以只运行 push，不运行 generate 吗？

**A**: 不推荐。数据库结构更新了，但代码中的类型还是旧的，可能导致类型错误。

**推荐顺序**：先 `generate`，再 `push`/`migrate`。

### Q: 修改 schema 后，需要重启应用吗？

**A**: 
- 如果只是修改了 schema 并运行了 `generate`，通常需要重启应用
- 如果使用热重载（如 Next.js），可能不需要重启

### Q: 如何回滚迁移？

**A**: 如果使用 `prisma migrate`：

```bash
# 查看迁移历史
npx prisma migrate status

# 回滚到上一个迁移（需要手动编辑数据库）
# 或创建新的迁移来撤销更改
npx prisma migrate dev --name revert_changes
```

---

## 快速参考

| 操作 | 命令 | 说明 |
|------|------|------|
| **修改 schema 后** | `prisma generate` | 重新生成 Client（必须） |
| **开发环境同步** | `prisma db push` | 快速更新数据库 |
| **生产环境同步** | `prisma migrate dev` | 创建迁移并应用 |
| **验证 schema** | `prisma validate` | 检查语法 |
| **格式化 schema** | `prisma format` | 自动格式化 |
| **查看数据库** | `prisma studio` | 可视化界面 |

---

## 总结

**每次修改 schema.prisma 后，必须执行**：

1. ✅ `prisma generate` - 更新代码类型（必须）
2. ✅ `prisma db push` 或 `prisma migrate dev` - 更新数据库结构（必须）

**推荐顺序**：
```
修改 schema → validate → generate → push/migrate → 测试
```

记住：**generate 和 push/migrate 都要执行**，缺一不可！

---

## 开发 vs 生产环境工作流程

### 开发环境

```bash
# 1. 修改 schema.prisma
# 2. 创建并应用迁移
npx prisma migrate dev --name descriptive_name

# 这会：
# - 创建迁移文件（prisma/migrations/）
# - 应用迁移到开发数据库
# - 自动生成 Prisma Client
```

### 生产环境

```bash
# 1. 拉取代码（包含迁移文件）
git pull

# 2. 安装依赖
npm install

# 3. 生成 Prisma Client（如果需要）
npm run prisma:generate

# 4. 只应用迁移（不创建新迁移）
npx prisma migrate deploy

# 这会：
# - 只应用 prisma/migrations/ 中待执行的迁移
# - 不创建新迁移文件
# - 不生成 Prisma Client（需要单独运行）
```

### 关键区别

| 环境 | 命令 | 创建迁移 | 应用迁移 | 生成 Client |
|------|------|---------|---------|------------|
| **开发** | `migrate dev` | ✅ 是 | ✅ 是 | ✅ 是 |
| **生产** | `migrate deploy` | ❌ 否 | ✅ 是 | ❌ 否 |

### 完整流程示例

```
开发环境：
┌─────────────────────────────────────┐
│ 1. 修改 schema.prisma               │
│ 2. prisma migrate dev --name xxx    │ ← 创建迁移
│ 3. 测试迁移                          │
│ 4. git commit & push                │ ← 提交迁移文件
└─────────────────────────────────────┘
              ↓
生产环境：
┌─────────────────────────────────────┐
│ 1. git pull                        │ ← 拉取迁移文件
│ 2. npm install                     │
│ 3. prisma generate                  │ ← 生成 Client
│ 4. prisma migrate deploy           │ ← 只应用迁移
│ 5. 启动应用                         │
└─────────────────────────────────────┘
```

**记住**：
- 开发环境：`migrate dev` = 创建迁移 + 应用迁移 + 生成 Client
- 生产环境：`migrate deploy` = 只应用迁移（迁移文件已通过 Git 传递）

