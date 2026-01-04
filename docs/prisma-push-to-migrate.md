# 从 db push 切换到 migrate 工作流程

## 问题场景

在开发阶段，你可能使用了 `prisma db push` 来快速同步数据库结构。现在开发完成了，需要上生产环境，但生产环境需要迁移文件（migration files）。

**问题**：`db push` 不会创建迁移文件，如何生成迁移文件用于生产部署？

---

## 解决方案

### 方案 1: 使用 `prisma migrate dev`（推荐）

即使之前使用了 `db push`，你仍然可以使用 `migrate dev` 来创建迁移文件。

#### 步骤

```bash
# 1. 确保 schema.prisma 与当前数据库结构一致
# （如果之前用 db push，schema 应该已经是最新的）

# 2. 创建迁移文件
npx prisma migrate dev --name initial_migration

# 或者，如果你想创建一个"空"迁移（因为数据库已经是最新的）
npx prisma migrate dev --name sync_existing_db --create-only
```

#### 工作原理

`prisma migrate dev` 会：
1. 比较 `schema.prisma` 和当前数据库状态
2. 如果数据库已经是最新的（因为之前用了 `db push`），会创建一个"空"迁移或提示数据库已同步
3. 创建迁移文件记录当前状态

#### 示例

```bash
$ npx prisma migrate dev --name sync_to_migration

Environment variables loaded from .env
Prisma schema loaded from src/utils/db/schema.prisma
Datasource "db": SQLite database "test.db"

Database schema is up to date, no migrations needed.

Creating migration...
The following migration(s) have been created and applied from the new schema:

  prisma/migrations/20240101000000_sync_to_migration/

You can now edit the migration and will be prompted to create a new one.
```

---

### 方案 2: 使用 `prisma migrate diff`（手动创建）

如果你想更精确地控制迁移内容：

```bash
# 1. 生成迁移 SQL（从空数据库到当前状态）
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel src/utils/db/schema.prisma \
  --script > migration.sql

# 2. 创建迁移目录
mkdir -p prisma/migrations/20240101000000_initial

# 3. 将 SQL 文件放入迁移目录
mv migration.sql prisma/migrations/20240101000000_initial/migration.sql

# 4. 标记迁移为已应用（因为数据库已经是这个状态）
npx prisma migrate resolve --applied 20240101000000_initial
```

---

### 方案 3: 从数据库拉取并创建迁移（如果 schema 不一致）

如果你的 `schema.prisma` 和数据库结构不一致：

```bash
# 1. 从数据库拉取当前结构到 schema
npx prisma db pull

# 2. 检查并调整 schema.prisma（如果需要）

# 3. 创建迁移
npx prisma migrate dev --name initial_migration
```

---

## 完整工作流程示例

### 场景：开发阶段用 push，现在要上生产

```
开发阶段（快速迭代）：
┌─────────────────────────────────────┐
│ 1. 修改 schema.prisma               │
│ 2. prisma db push                   │ ← 快速同步，无迁移文件
│ 3. 测试                              │
│ 4. 重复步骤 1-3                      │
└─────────────────────────────────────┘

准备上生产（创建迁移）：
┌─────────────────────────────────────┐
│ 1. 确保 schema.prisma 是最新的     │
│ 2. prisma migrate dev --name init  │ ← 创建迁移文件
│ 3. 检查迁移文件是否正确             │
│ 4. git commit & push                │ ← 提交迁移文件
└─────────────────────────────────────┘

生产环境：
┌─────────────────────────────────────┐
│ 1. git pull                         │
│ 2. npm install                     │
│ 3. prisma migrate deploy           │ ← 应用迁移
└─────────────────────────────────────┘
```

---

## 详细步骤

### 步骤 1: 检查当前状态

```bash
# 检查迁移状态
npx prisma migrate status

# 如果显示 "Database schema is up to date"，说明数据库已同步
# 如果显示 "No migrations found"，说明还没有迁移文件
```

### 步骤 2: 创建初始迁移

```bash
# 方式 A: 创建迁移（Prisma 会检测到数据库已是最新）
npx prisma migrate dev --name initial_migration

# 如果数据库已是最新，Prisma 会创建"空"迁移或提示已同步
```

### 步骤 3: 验证迁移文件

```bash
# 查看创建的迁移文件
ls -la prisma/migrations/

# 应该看到类似：
# prisma/migrations/
#   └── 20240101000000_initial_migration/
#       └── migration.sql
```

### 步骤 4: 测试迁移（可选）

如果你想测试迁移是否能在新数据库上正常工作：

```bash
# 1. 备份当前数据库
cp test.db test.db.backup

# 2. 删除数据库（模拟新环境）
rm test.db

# 3. 应用迁移
npx prisma migrate deploy

# 4. 验证数据库结构
npx prisma studio
```

### 步骤 5: 提交到版本控制

```bash
git add prisma/migrations/
git commit -m "Add initial migration"
git push
```

---

## 常见情况处理

### 情况 1: Prisma 提示数据库已是最新

```
Database schema is up to date, no migrations needed.
```

**处理**：使用 `--create-only` 标志创建空迁移：

```bash
npx prisma migrate dev --name initial_migration --create-only
```

这会创建一个迁移文件，标记当前数据库状态。

### 情况 2: 有多个开发环境，需要统一迁移

如果多个开发者都用 `db push`，现在要统一：

```bash
# 1. 确保所有人的 schema.prisma 一致
# 2. 在其中一个环境创建迁移
npx prisma migrate dev --name initial_migration

# 3. 其他人拉取代码后，标记迁移为已应用
npx prisma migrate resolve --applied 20240101000000_initial_migration
```

### 情况 3: Schema 和数据库不一致

如果 `schema.prisma` 和数据库结构有差异：

```bash
# 1. 从数据库拉取当前结构
npx prisma db pull

# 2. 检查 schema.prisma，确认是否需要调整

# 3. 创建迁移
npx prisma migrate dev --name sync_migration
```

---

## 最佳实践

### 开发阶段

**快速迭代时**：
```bash
# 使用 db push 快速同步
npx prisma db push
```

**准备提交前**：
```bash
# 创建迁移文件
npx prisma migrate dev --name feature_name
```

### 生产准备

**统一迁移策略**：
```bash
# 1. 确保所有开发环境都使用迁移
# 2. 创建统一的迁移文件
npx prisma migrate dev --name production_ready

# 3. 测试迁移
# 4. 提交到版本控制
```

---

## 命令对比

| 命令 | 创建迁移文件 | 应用迁移 | 适用场景 |
|------|------------|---------|---------|
| `db push` | ❌ 否 | ✅ 是 | 开发快速迭代 |
| `migrate dev` | ✅ 是 | ✅ 是 | 开发（需要迁移历史） |
| `migrate deploy` | ❌ 否 | ✅ 是 | 生产环境 |

---

## 迁移策略建议

### 策略 1: 始终使用 migrate（推荐用于团队项目）

```bash
# 开发阶段也使用 migrate
npx prisma migrate dev --name feature_name

# 优点：
# - 始终有迁移历史
# - 便于团队协作
# - 生产部署更顺畅
```

### 策略 2: 混合使用（适合个人项目）

```bash
# 快速迭代时用 push
npx prisma db push

# 准备提交时创建迁移
npx prisma migrate dev --name feature_name

# 优点：
# - 开发更快
# - 仍有迁移历史
```

### 策略 3: 开发用 push，生产用 migrate

```bash
# 开发：快速迭代
npx prisma db push

# 准备上生产：创建迁移
npx prisma migrate dev --name initial_migration

# 生产：应用迁移
npx prisma migrate deploy
```

---

## 总结

### 回答你的问题

**Q: 开发环境 push 之后还能 migrate 吗？**

**A: 可以！** 即使之前用了 `db push`，你仍然可以：

1. ✅ 使用 `prisma migrate dev` 创建迁移文件
2. ✅ Prisma 会检测到数据库已是最新状态
3. ✅ 创建迁移文件记录当前数据库结构
4. ✅ 之后就可以用 `migrate deploy` 在生产环境应用

### 推荐流程

```
开发阶段（快速迭代）：
→ prisma db push

准备上生产：
→ prisma migrate dev --name initial_migration
→ git commit & push

生产环境：
→ prisma migrate deploy
```

### 关键点

- ✅ `db push` 和 `migrate` 可以混合使用
- ✅ 从 `push` 切换到 `migrate` 很简单
- ✅ 使用 `migrate dev` 会自动处理已同步的数据库
- ✅ 之后就可以正常使用 `migrate deploy` 了

