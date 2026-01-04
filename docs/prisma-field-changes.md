# Prisma 字段变更处理指南

## 概述

当需要修改数据库表的字段（新增、删除、修改）时，Prisma 提供了两种主要方式：
1. **`prisma db push`** - 快速同步（开发环境）
2. **`prisma migrate dev`** - 创建迁移文件（生产环境）

---

## 一、新增字段

### 场景：在现有模型中添加新字段

#### 步骤 1: 修改 schema.prisma

```prisma
model TestDataUrlCapture {
  id                 Int      @id @default(autoincrement())
  apiUrl             String
  apiMethod          String
  // 新增字段
  apiVersion         String?  // 新增的可选字段
  apiTimeout         Int?     // 新增的可选整数字段
  isActive           Boolean  @default(true)  // 新增的必填字段（带默认值）
  // ... 其他现有字段
}
```

#### 步骤 2: 重新生成 Prisma Client

```bash
npm run prisma:generate
# 或
npx prisma generate --schema=src/utils/db/schema.prisma
```

**作用**：更新 TypeScript 类型，使代码能够使用新字段。

#### 步骤 3: 更新数据库结构

**方式 A: 使用 `db push`（开发环境）**

```bash
npm run prisma:push
# 或
npx prisma db push --schema=src/utils/db/schema.prisma
```

**生成的 SQL**（自动执行）：
```sql
-- 对于可选字段（String?）
ALTER TABLE "test_data_url_capture" ADD COLUMN "apiVersion" TEXT;

-- 对于必填字段（String，带默认值）
ALTER TABLE "test_data_url_capture" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
```

**方式 B: 使用 `migrate dev`（生产环境）**

```bash
npm run prisma:migrate
# 或指定迁移名称
npx prisma migrate dev --name add_api_version_timeout --schema=src/utils/db/schema.prisma
```

**生成的迁移文件**：
```sql
-- migrations/20240101000000_add_api_version_timeout/migration.sql
ALTER TABLE "test_data_url_capture" ADD COLUMN "apiVersion" TEXT;
ALTER TABLE "test_data_url_capture" ADD COLUMN "apiTimeout" INTEGER;
ALTER TABLE "test_data_url_capture" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
```

### 注意事项

1. **可选字段 vs 必填字段**：
   - `String?` - 可选字段，可以直接添加，现有记录该字段为 `NULL`
   - `String` - 必填字段，必须提供默认值（`@default(...)`），否则会报错

2. **添加必填字段的两种方式**：
   ```prisma
   // 方式 1: 使用默认值
   isActive Boolean @default(true)
   
   // 方式 2: 先添加为可选，再改为必填（两步迁移）
   // 第一步：添加为可选
   isActive Boolean?
   // 第二步：填充数据后改为必填
   isActive Boolean @default(true)
   ```

---

## 二、删除字段

### 场景：从模型中移除字段

#### 步骤 1: 修改 schema.prisma

```prisma
model TestDataUrlCapture {
  id                 Int      @id @default(autoincrement())
  apiUrl             String
  apiMethod          String
  // apiVersion       String?  // 删除这行
  // apiTimeout       Int?     // 删除这行
  // ... 其他字段
}
```

#### 步骤 2: 重新生成 Prisma Client

```bash
npm run prisma:generate
```

#### 步骤 3: 更新数据库结构

**方式 A: 使用 `db push`**

```bash
npm run prisma:push
```

**生成的 SQL**（自动执行）：
```sql
-- SQLite 不支持直接删除列，Prisma 会：
-- 1. 创建新表（不包含要删除的列）
-- 2. 复制数据
-- 3. 删除旧表
-- 4. 重命名新表
```

**方式 B: 使用 `migrate dev`**

```bash
npx prisma migrate dev --name remove_api_version_timeout --schema=src/utils/db/schema.prisma
```

**生成的迁移文件**：
```sql
-- migrations/20240101000001_remove_api_version_timeout/migration.sql
-- SQLite 需要重建表来删除列
CREATE TABLE "test_data_url_capture_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "apiUrl" TEXT NOT NULL,
    "apiMethod" TEXT NOT NULL,
    -- 注意：apiVersion 和 apiTimeout 不在这里
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- 复制数据（只复制保留的列）
INSERT INTO "test_data_url_capture_new" 
    ("id", "apiUrl", "apiMethod", "createdAt", "updatedAt")
SELECT 
    "id", "apiUrl", "apiMethod", "createdAt", "updatedAt"
FROM "test_data_url_capture";

-- 删除旧表
DROP TABLE "test_data_url_capture";

-- 重命名新表
ALTER TABLE "test_data_url_capture_new" RENAME TO "test_data_url_capture";
```

### ⚠️ 重要警告

1. **数据丢失**：删除字段会永久丢失该字段的所有数据，无法恢复！
2. **SQLite 限制**：SQLite 不支持直接删除列，需要重建表，对于大表可能很慢。
3. **生产环境建议**：
   - 先备份数据库
   - 在开发环境测试迁移
   - 考虑分步删除（先标记为废弃，后续再删除）

---

## 三、修改字段

### 场景 1: 修改字段类型

#### 示例：将 String 改为 Int

```prisma
model TestDataUrlCapture {
  // 修改前
  // apiStatusCode String?
  
  // 修改后
  apiStatusCode Int?
}
```

**执行命令**：
```bash
npm run prisma:generate
npm run prisma:push  # 或 prisma:migrate
```

**⚠️ 警告**：
- 如果现有数据无法转换，会丢失数据
- 例如：`"200"` 字符串无法自动转换为整数
- 建议：先备份数据，或手动迁移数据

### 场景 2: 修改字段约束

#### 示例 1: 将可选字段改为必填

```prisma
model TestDataUrlCapture {
  // 修改前
  // apiVersion String?
  
  // 修改后（必须提供默认值）
  apiVersion String @default("v1")
}
```

**两步迁移方式**（推荐）：
```prisma
// 第一步迁移：先填充数据
// 1. 保持为可选字段
apiVersion String?

// 2. 运行迁移后，手动更新所有 NULL 值
// UPDATE test_data_url_capture SET apiVersion = 'v1' WHERE apiVersion IS NULL;

// 第二步迁移：改为必填
apiVersion String @default("v1")
```

#### 示例 2: 将必填字段改为可选

```prisma
model TestDataUrlCapture {
  // 修改前
  // apiMethod String
  
  // 修改后
  apiMethod String?
}
```

**执行**：直接修改即可，不会丢失数据。

### 场景 3: 修改字段名称（重命名）

```prisma
model TestDataUrlCapture {
  // 修改前
  // apiUrl String
  
  // 修改后
  url String @map("apiUrl")  // 使用 @map 保持数据库列名不变
}
```

**或者完全重命名**：
```prisma
model TestDataUrlCapture {
  url String  // 新名称，会创建新列
}
```

**⚠️ 注意**：完全重命名会创建新列，旧列数据会丢失。建议使用 `@map` 保持数据库列名。

---

## 四、完整工作流程对比

### 开发环境（快速迭代）

```bash
# 1. 修改 schema.prisma
# 2. 生成 Client
npm run prisma:generate

# 3. 快速同步数据库
npm run prisma:push
```

**特点**：
- ✅ 快速，无需命名迁移
- ✅ 自动处理所有变更
- ❌ 不创建迁移文件
- ❌ 不记录变更历史

### 生产环境（版本控制）

```bash
# 1. 修改 schema.prisma
# 2. 生成 Client
npm run prisma:generate

# 3. 创建迁移
npx prisma migrate dev --name descriptive_name --schema=src/utils/db/schema.prisma

# 4. 检查迁移文件
# 5. 测试迁移
# 6. 提交到版本控制
git add src/utils/db/migrations/
git commit -m "Add migration: descriptive_name"
```

**特点**：
- ✅ 创建迁移文件，记录变更
- ✅ 可以版本控制
- ✅ 可以回滚（手动）
- ✅ 适合团队协作

---

## 五、实际示例

### 示例 1: 添加多个字段

```prisma
model TestRunner {
  id              Int      @id @default(autoincrement())
  testName        String
  testDescription String
  testStatus      String
  result          String
  startTime       DateTime
  endTime         DateTime
  
  // 新增字段
  duration        Int?     // 执行时长（毫秒）
  errorMessage    String?  // 错误信息
  retryCount      Int      @default(0)  // 重试次数
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**执行**：
```bash
npm run prisma:generate
npx prisma migrate dev --name add_test_runner_fields --schema=src/utils/db/schema.prisma
```

### 示例 2: 删除字段并添加新字段

```prisma
model TestRunner {
  id              Int      @id @default(autoincrement())
  testName        String
  // testDescription String  // 删除
  testStatus      String
  // result          String  // 删除
  
  // 新增字段
  description     String?  // 替代 testDescription
  success         Boolean  @default(false)  // 替代 result
  errorDetails    String?  // 新增
  
  startTime       DateTime
  endTime         DateTime
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**执行**：
```bash
npm run prisma:generate
npx prisma migrate dev --name refactor_test_runner_fields --schema=src/utils/db/schema.prisma
```

---

## 六、最佳实践

### 1. 开发环境
- 使用 `prisma db push` 快速迭代
- 频繁修改 schema 时不需要创建迁移

### 2. 生产环境
- 始终使用 `prisma migrate dev` 创建迁移
- 为每个迁移使用描述性名称
- 提交迁移文件到版本控制

### 3. 数据安全
- **删除字段前**：备份数据库
- **修改字段类型前**：检查数据兼容性
- **添加必填字段**：使用默认值或分步迁移

### 4. 迁移命名规范

```bash
# 好的命名
npx prisma migrate dev --name add_user_email_field
npx prisma migrate dev --name remove_deprecated_columns
npx prisma migrate dev --name change_status_to_enum

# 不好的命名
npx prisma migrate dev --name update
npx prisma migrate dev --name fix
npx prisma migrate dev --name migration1
```

---

## 七、常见问题

### Q1: 添加必填字段时出错？

**错误**：
```
Error: You are trying to create a required field `newField` on model `TestRunner` without a default value.
```

**解决**：添加默认值
```prisma
newField String @default("default_value")
// 或
newField Int @default(0)
```

### Q2: 删除字段后如何恢复数据？

**答案**：无法自动恢复。必须：
1. 从备份恢复数据库
2. 或手动重新添加字段并填充数据

### Q3: SQLite 删除字段很慢？

**原因**：SQLite 需要重建表来删除列。

**解决**：
- 对于大表，考虑在维护窗口期执行
- 或使用 PostgreSQL/MySQL 等支持直接删除列的数据库

### Q4: 如何查看迁移历史？

```bash
npx prisma migrate status --schema=src/utils/db/schema.prisma
```

### Q5: 如何回滚迁移？

Prisma 不提供自动回滚。需要：
1. 创建新的迁移来撤销更改
2. 或手动编辑数据库

---

## 八、总结

| 操作 | 命令 | 数据影响 | 推荐场景 |
|------|------|---------|---------|
| **新增字段** | `generate` + `push`/`migrate` | 无影响 | 开发/生产 |
| **删除字段** | `generate` + `push`/`migrate` | ⚠️ 丢失数据 | 需备份 |
| **修改类型** | `generate` + `push`/`migrate` | ⚠️ 可能丢失 | 需检查兼容性 |
| **修改约束** | `generate` + `push`/`migrate` | 可能影响 | 需分步迁移 |

**记住**：
1. ✅ 每次修改 schema 后必须运行 `prisma generate`
2. ✅ 开发环境用 `db push`，生产环境用 `migrate dev`
3. ✅ 删除或修改字段前备份数据库
4. ✅ 使用描述性的迁移名称

