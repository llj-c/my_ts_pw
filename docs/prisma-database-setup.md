# Prisma 数据库表创建指南

## 两种工作流程

### 方式 1: 让 Prisma 自动创建表（推荐）

如果你还没有创建数据库和表，让 Prisma 根据 `schema.prisma` 自动创建：

#### 步骤 1: 配置数据库连接

**方式 A: 在 schema 同目录创建 .env（推荐，最简单）**

在 `src/utils/db/` 目录创建 `.env` 文件：

```env
# src/utils/db/.env
DATABASE_URL="file:../../test.db"
```

Prisma 会自动找到与 schema 文件同目录的 `.env` 文件。

**方式 B: 使用项目现有的环境变量系统**

在 `src/common/config/env/.env.test` 中添加：

```env
# src/common/config/env/.env.test
DATABASE_URL="file:../../../test.db"
```

然后使用 `dotenv-cli` 加载（需要先安装：`npm install -D dotenv-cli`）：

```json
{
  "scripts": {
    "prisma:generate": "dotenv -e src/common/config/env/.env.test -- prisma generate",
    "prisma:push": "dotenv -e src/common/config/env/.env.test -- prisma db push"
  }
}
```

**方式 C: 在项目根目录创建 .env**

```env
# .env (项目根目录)
DATABASE_URL="file:./test.db"
```

> 💡 **提示**：更多自定义 .env 文件位置的方法，请查看 [prisma-env-file-config.md](./prisma-env-file-config.md)

#### 步骤 2: 生成 Prisma Client

```bash
npm run prisma:generate
```

#### 步骤 3: 创建数据库和表

有两种方式：

**方式 A: 快速同步（开发环境推荐）**
```bash
npm run prisma:push
```

这会：
- 创建数据库文件（如果不存在）
- 根据 schema 创建所有表
- 如果表已存在，会更新表结构以匹配 schema

**方式 B: 使用迁移（生产环境推荐）**
```bash
npm run prisma:migrate
```

这会：
- 创建迁移文件
- 应用迁移到数据库
- 记录迁移历史

---

### 方式 2: 从现有数据库同步（如果表已存在）

如果你已经用 SQL 手动创建了表，可以反向同步：

#### 步骤 1: 从数据库拉取结构

```bash
npx prisma db pull
```

这会：
- 读取现有数据库结构
- 自动生成或更新 `schema.prisma` 文件
- 保持现有数据不变

#### 步骤 2: 生成 Prisma Client

```bash
npm run prisma:generate
```

---

## 推荐流程（你的情况）

由于你已经有 SQL 文件，但可能还没有创建数据库，推荐流程：

### 方案 A: 完全使用 Prisma（推荐）

1. **配置环境变量**
   ```env
   DATABASE_URL="file:./test.db"
   ```

2. **生成 Client**
   ```bash
   npm run prisma:generate
   ```

3. **创建数据库和表**
   ```bash
   npm run prisma:push
   ```

Prisma 会根据 `schema.prisma` 自动创建表，不需要手动执行 SQL。

### 方案 B: 先执行 SQL，再同步

如果你更习惯先用 SQL 创建表：

1. **创建数据库并执行 SQL**
   ```bash
   sqlite3 test.db < src/utils/db/sql/http_capture.sql
   ```

2. **从数据库同步到 schema**
   ```bash
   npx prisma db pull
   ```

3. **生成 Client**
   ```bash
   npm run prisma:generate
   ```

---

## 验证表是否创建成功

### 方法 1: 使用 Prisma Studio（可视化工具）

```bash
npx prisma studio
```

这会打开浏览器，可以可视化查看和编辑数据库数据。

### 方法 2: 使用 SQLite 命令行

```bash
sqlite3 test.db
.tables                    # 查看所有表
.schema test_data_url_capture  # 查看表结构
```

### 方法 3: 在代码中测试

```typescript
import { PrismaClient } from '@prisma/client';
import { SqliteUtils } from '@/utils/db/sqliteUtils';

const prisma = new PrismaClient();
const db = new SqliteUtils({ prisma });

async function test() {
  await db.connect();
  
  // 测试创建
  const record = await db.create('testDataUrlCapture', {
    apiUrl: 'https://api.example.com/test',
    apiMethod: 'POST',
    apiStatusCode: 200,
  });
  console.log('创建成功:', record);
  
  // 测试查询
  const count = await db.count('testDataUrlCapture');
  console.log('记录数:', count);
  
  await db.disconnect();
}

test();
```

---

## 常见问题

### Q: `prisma db push` 和 `prisma migrate` 有什么区别？

- **`db push`**: 
  - 快速同步，适合开发环境
  - 不创建迁移文件
  - 直接修改数据库结构
  - 如果表已存在，会尝试更新结构

- **`migrate`**:
  - 创建迁移文件，记录变更历史
  - 适合生产环境
  - 可以回滚迁移
  - 团队协作时更安全

### Q: 如果表已经存在，执行 `db push` 会怎样？

Prisma 会：
- 比较 schema 和现有表结构
- 如果结构一致，不做任何操作
- 如果有差异，会尝试更新表结构（添加/删除字段）
- **注意**: 可能会丢失数据（如果删除字段）

### Q: 可以同时使用 SQL 和 Prisma 吗？

可以，但需要注意：
- 如果手动修改了数据库结构，需要运行 `prisma db pull` 同步
- 或者保持 schema 和数据库结构一致
- 推荐：统一使用 Prisma 管理数据库结构

### Q: 如何重置数据库？

```bash
# 删除数据库文件
rm test.db

# 重新创建
npm run prisma:push
```

---

## 总结

**推荐做法**：
1. ✅ 使用 `schema.prisma` 定义表结构（已完成）
2. ✅ 配置 `DATABASE_URL` 环境变量
3. ✅ 运行 `npm run prisma:generate` 生成 Client
4. ✅ 运行 `npm run prisma:push` 创建数据库和表

**不需要**：
- ❌ 手动执行 SQL 创建表
- ❌ 手动创建数据库文件

Prisma 会帮你完成所有工作！

