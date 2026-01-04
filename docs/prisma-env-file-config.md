# Prisma 环境变量文件配置

## Prisma 默认查找 .env 的顺序

Prisma CLI 会按以下顺序查找 `.env` 文件：

1. **项目根目录**：`./.env`
2. **与 schema 文件同目录**：如果 schema 在 `src/utils/db/schema.prisma`，会查找 `src/utils/db/.env`
3. **prisma 目录**：`./prisma/.env`
4. **系统环境变量**

---

## 方法 1: 在 schema 同目录创建 .env（推荐）

由于你的 schema 在 `src/utils/db/schema.prisma`，可以在同目录创建 `.env`：

```
src/utils/db/
├── schema.prisma
├── .env              ← 放在这里
├── sqliteUtils.ts
└── ...
```

**优点**：
- ✅ Prisma 会自动找到
- ✅ 与 schema 文件放在一起，便于管理
- ✅ 不需要额外配置

**内容**：
```env
# src/utils/db/.env
DATABASE_URL="file:../../test.db"
```

注意：路径是相对于 `.env` 文件的位置。

---

## 方法 2: 使用 dotenv-cli（灵活）

安装 `dotenv-cli`：

```bash
npm install -D dotenv-cli
```

然后在命令中指定 `.env` 文件：

```bash
# 使用自定义位置的 .env 文件
dotenv -e src/common/config/env/.env.test -- npx prisma generate
dotenv -e src/common/config/env/.env.test -- npx prisma db push
```

**更新 package.json**：
```json
{
  "scripts": {
    "prisma:generate": "dotenv -e src/common/config/env/.env.test -- prisma generate",
    "prisma:push": "dotenv -e src/common/config/env/.env.test -- prisma db push",
    "prisma:migrate": "dotenv -e src/common/config/env/.env.test -- prisma migrate dev"
  }
}
```

---

## 方法 3: 在代码中加载（运行时）

在应用启动时加载自定义 `.env` 文件：

```typescript
// src/utils/db/prismaClient.ts
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import path from 'path';

// 加载自定义位置的 .env 文件
config({ path: path.resolve(__dirname, '../../common/config/env/.env.test') });

const prisma = new PrismaClient();
export default prisma;
```

**注意**：这种方式只影响运行时，Prisma CLI 命令（如 `prisma generate`）仍然需要其他方法。

---

## 方法 4: 使用环境变量（命令行）

直接在命令行设置环境变量：

```bash
# Windows PowerShell
$env:DATABASE_URL="file:./test.db"; npx prisma generate

# Windows CMD
set DATABASE_URL=file:./test.db && npx prisma generate

# Linux/Mac
DATABASE_URL="file:./test.db" npx prisma generate
```

**更新 package.json**：
```json
{
  "scripts": {
    "prisma:generate": "cross-env DATABASE_URL=file:./test.db prisma generate",
    "prisma:push": "cross-env DATABASE_URL=file:./test.db prisma db push"
  }
}
```

需要安装 `cross-env`（跨平台环境变量设置）：
```bash
npm install -D cross-env
```

---

## 方法 5: 整合到项目现有的环境变量系统

你的项目已经有环境变量管理系统（`src/common/config/env/`），可以这样整合：

### 步骤 1: 在环境变量配置中添加 DATABASE_URL

编辑 `src/common/config/env/type.ts`：

```typescript
export interface EnvConfig {
    OPS_BASE_URL: string
    OPS_USER_EMAIL: string
    OPS_USER_PASSWD: string
    LOG_LEVEL: string
    DATABASE_URL?: string  // 添加数据库 URL（可选）
}
```

### 步骤 2: 在环境变量文件中添加配置

在 `src/common/config/env/.env` 或 `src/common/config/env/.env.test` 中添加：

```env
# src/common/config/env/.env.test
DATABASE_URL="file:../../../test.db"
```

### 步骤 3: 确保 Prisma 能找到环境变量

由于 Prisma CLI 不会自动加载 `src/common/config/env/.env`，有两种方案：

**方案 A: 创建符号链接或复制到项目根目录**

```bash
# 在项目根目录创建 .env，引用环境变量目录的文件
# Windows (PowerShell)
New-Item -ItemType SymbolicLink -Path .env -Target src/common/config/env/.env.test

# Linux/Mac
ln -s src/common/config/env/.env.test .env
```

**方案 B: 使用 dotenv-cli（推荐）**

```json
{
  "scripts": {
    "prisma:generate": "dotenv -e src/common/config/env/.env.test -- prisma generate",
    "prisma:push": "dotenv -e src/common/config/env/.env.test -- prisma db push"
  }
}
```

---

## 推荐方案（针对你的项目）

考虑到你的项目结构，推荐以下方案：

### 方案 1: 在 schema 同目录创建 .env（最简单）

```
src/utils/db/
├── schema.prisma
├── .env              ← 创建这个文件
└── ...
```

`.env` 内容：
```env
DATABASE_URL="file:../../test.db"
```

**优点**：Prisma 自动识别，无需额外配置

### 方案 2: 整合到现有环境变量系统（统一管理）

1. 在 `src/common/config/env/.env.test` 中添加：
   ```env
   DATABASE_URL="file:../../../test.db"
   ```

2. 使用 `dotenv-cli` 加载：
   ```json
   {
     "scripts": {
       "prisma:generate": "dotenv -e src/common/config/env/.env.test -- prisma generate",
       "prisma:push": "dotenv -e src/common/config/env/.env.test -- prisma db push"
     }
   }
   ```

3. 安装依赖：
   ```bash
   npm install -D dotenv-cli
   ```

**优点**：统一管理所有环境变量，包括数据库配置

---

## 多环境配置示例

如果你的项目需要支持多个环境（test、dev、prod）：

```
src/common/config/env/
├── .env              # 默认配置
├── .env.test         # 测试环境
├── .env.dev          # 开发环境
└── .env.prod         # 生产环境
```

每个文件包含对应的 `DATABASE_URL`：

```env
# .env.test
DATABASE_URL="file:../../../test.db"

# .env.dev
DATABASE_URL="file:../../../dev.db"

# .env.prod
DATABASE_URL="file:../../../prod.db"
```

在 `package.json` 中创建不同环境的脚本：

```json
{
  "scripts": {
    "prisma:generate:test": "dotenv -e src/common/config/env/.env.test -- prisma generate",
    "prisma:generate:dev": "dotenv -e src/common/config/env/.env.dev -- prisma generate",
    "prisma:push:test": "dotenv -e src/common/config/env/.env.test -- prisma db push",
    "prisma:push:dev": "dotenv -e src/common/config/env/.env.dev -- prisma db push"
  }
}
```

---

## 验证配置

执行以下命令验证 Prisma 是否能正确读取环境变量：

```bash
# 检查 Prisma 配置
npx prisma validate

# 查看 Prisma 使用的数据库 URL（需要先设置环境变量）
npx prisma db pull --print
```

---

## 常见问题

### Q: Prisma 能找到多个 .env 文件吗？

可以，但如果有冲突的环境变量，Prisma 会报错。建议只使用一个 `.env` 文件，或确保变量不冲突。

### Q: 可以在 schema.prisma 中直接写路径吗？

可以，但不推荐：

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./test.db"  // 直接写路径（不推荐）
}
```

**推荐**：使用环境变量 `env("DATABASE_URL")`，便于不同环境使用不同配置。

### Q: 如何在不同环境使用不同的数据库？

使用不同的 `.env` 文件，并通过 `dotenv-cli` 或环境变量来指定：

```bash
# 测试环境
dotenv -e .env.test -- npx prisma db push

# 生产环境
dotenv -e .env.prod -- npx prisma db push
```

---

## 总结

| 方法 | 适用场景 | 推荐度 |
|------|---------|--------|
| Schema 同目录 `.env` | 简单项目，单一环境 | ⭐⭐⭐⭐⭐ |
| dotenv-cli | 多环境，需要灵活配置 | ⭐⭐⭐⭐⭐ |
| 整合现有系统 | 已有环境变量管理系统 | ⭐⭐⭐⭐ |
| 命令行环境变量 | 临时使用 | ⭐⭐⭐ |
| 代码中加载 | 运行时使用 | ⭐⭐⭐ |

**推荐**：对于你的项目，建议使用 **方案 2（整合到现有环境变量系统）**，这样可以统一管理所有配置。

