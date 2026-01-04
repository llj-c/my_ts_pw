# Prisma 初始化命令说明

## 命令概述

在使用 Prisma 进行数据库操作之前，需要执行两个关键命令来设置和生成必要的文件。

---

## 1. `npx prisma init`

### 目的
**初始化 Prisma 项目，创建基础配置文件**

### 执行后创建的文件

#### 1.1 `prisma/schema.prisma` - Prisma Schema 文件
这是 Prisma 的核心配置文件，用于定义：
- **数据源（Datasource）**：数据库连接信息
- **生成器（Generator）**：指定生成 Prisma Client 的配置
- **数据模型（Models）**：定义数据库表结构和关系

**示例内容：**
```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### 1.2 `.env` - 环境变量文件（如果不存在）
创建或更新 `.env` 文件，添加数据库连接字符串：

```env
# .env
DATABASE_URL="file:./dev.db"
```

对于 SQLite，连接字符串格式为：`file:./数据库文件路径`

### 为什么需要这个命令？
- 创建 Prisma 项目的基础结构
- 生成标准的配置文件模板
- 设置数据库连接配置

---

## 2. `npx prisma generate`

### 目的
**根据 `schema.prisma` 文件生成 Prisma Client 代码**

### 执行后生成的内容

#### 2.1 `node_modules/.prisma/client/` - Prisma Client 代码
生成类型安全的数据库客户端，包括：
- **类型定义**：基于 schema 自动生成的 TypeScript 类型
- **查询方法**：`findMany`、`findUnique`、`create`、`update`、`delete` 等
- **关系方法**：处理模型间关系的辅助方法

#### 2.2 类型安全
生成的代码提供完整的 TypeScript 类型支持，例如：

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 类型安全：TypeScript 知道 User 模型有哪些字段
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    name: 'Test User',
    // TypeScript 会提示可用的字段，并检查类型
  }
});

// 类型安全：返回类型是自动推断的
// user 的类型是: { id: number, email: string, name: string | null, ... }
```

### 为什么需要这个命令？

1. **生成类型安全的客户端**
   - 根据 schema 自动生成 TypeScript 类型
   - 提供智能代码补全和类型检查

2. **同步数据库结构**
   - 当修改 `schema.prisma` 后，需要重新生成 Client
   - 确保代码与数据库结构保持一致

3. **性能优化**
   - 生成的代码针对特定数据库进行了优化
   - 提供高效的查询方法

### 什么时候需要重新执行？

每次修改 `schema.prisma` 文件后，都需要重新执行 `npx prisma generate`：
- 添加新的模型（Model）
- 修改现有模型的字段
- 更改字段类型或约束
- 添加或修改关系（Relations）

---

## 完整工作流程

### 首次设置

```bash
# 1. 安装 Prisma
npm install @prisma/client prisma

# 2. 初始化 Prisma 项目（创建 schema.prisma 和 .env）
npx prisma init

# 3. 编辑 prisma/schema.prisma，定义你的数据模型
# 例如：添加 User、Order 等模型

# 4. 生成 Prisma Client
npx prisma generate

# 5. （可选）如果数据库已存在，同步 schema
npx prisma db pull

# 6. （可选）如果数据库不存在，创建数据库和表
npx prisma db push
# 或者使用迁移
npx prisma migrate dev
```

### 日常开发流程

```bash
# 1. 修改 prisma/schema.prisma（添加字段、模型等）

# 2. 重新生成 Prisma Client
npx prisma generate

# 3. 更新数据库结构（选择其一）
npx prisma db push        # 快速同步（开发环境）
# 或
npx prisma migrate dev    # 创建迁移（生产环境推荐）
```

---

## 在你的项目中的使用

### 步骤 1: 初始化

```bash
npx prisma init
```

这会创建：
- `prisma/schema.prisma` - 定义你的数据库模型
- `.env` - 数据库连接字符串（如果不存在）

### 步骤 2: 配置 SQLite

编辑 `prisma/schema.prisma`：
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

编辑 `.env`：
```env
DATABASE_URL="file:./test.db"
```

### 步骤 3: 定义数据模型

编辑 `prisma/schema.prisma`，添加你的模型：
```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
```

### 步骤 4: 生成 Client

```bash
npx prisma generate
```

现在可以在代码中使用 `PrismaClient` 了：

```typescript
import { PrismaClient } from '@prisma/client';
import { SqliteUtils } from '@/utils/db/sqliteUtils';

const prisma = new PrismaClient();
const db = new SqliteUtils({ prisma });
```

---

## 常见问题

### Q: 为什么需要两个命令？
- `prisma init`：创建配置文件（一次性设置）
- `prisma generate`：生成代码（每次修改 schema 后都需要）

### Q: 可以只执行一个吗？
- 如果已有 `schema.prisma`，可以跳过 `init`，直接执行 `generate`
- 但首次使用必须执行 `init` 来创建配置文件

### Q: `generate` 命令很慢吗？
- 通常很快（几秒到几十秒）
- 只在修改 schema 后需要执行
- 可以添加到 `package.json` 的脚本中：

```json
{
  "scripts": {
    "prisma:generate": "prisma generate",
    "postinstall": "prisma generate"
  }
}
```

### Q: 生成的代码在哪里？
- 在 `node_modules/.prisma/client/` 目录
- 通过 `@prisma/client` 包导入使用
- 不需要手动编辑，由 Prisma 自动管理

---

## 总结

| 命令 | 目的 | 执行频率 | 创建/生成的内容 |
|------|------|---------|----------------|
| `npx prisma init` | 初始化项目 | **一次**（首次设置） | `prisma/schema.prisma`、`.env` |
| `npx prisma generate` | 生成客户端代码 | **每次修改 schema 后** | `node_modules/.prisma/client/` |

这两个命令是使用 Prisma 的基础，确保你的代码能够类型安全地访问数据库。

