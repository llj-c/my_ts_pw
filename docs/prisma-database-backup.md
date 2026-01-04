# 生产环境数据库备份指南

## 概述

在生产环境中，数据库备份是至关重要的。本指南涵盖了使用 Prisma 时各种数据库类型的备份方法。

---

## 一、SQLite 数据库备份

### 方法 1: 直接复制文件（最简单）

SQLite 数据库是单个文件，可以直接复制。

#### 手动备份

```bash
# 备份到当前目录
cp src/utils/db/data/test_attest.db src/utils/db/data/test_attest.db.backup

# 备份到指定目录（带时间戳）
BACKUP_DIR="/backup/databases"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp src/utils/db/data/test_attest.db "$BACKUP_DIR/test_attest_$TIMESTAMP.db"
```

#### 自动化备份脚本

创建 `scripts/backup-db.sh`：

```bash
#!/bin/bash

# 配置
DB_PATH="src/utils/db/data/test_attest.db"
BACKUP_DIR="backups/database"
RETENTION_DAYS=7  # 保留 7 天的备份

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名（带时间戳）
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/test_attest_$TIMESTAMP.db"

# 执行备份
echo "开始备份数据库..."
cp "$DB_PATH" "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✓ 备份成功: $BACKUP_FILE"
    
    # 压缩备份（可选）
    gzip "$BACKUP_FILE"
    echo "✓ 备份已压缩: $BACKUP_FILE.gz"
    
    # 清理旧备份
    find "$BACKUP_DIR" -name "test_attest_*.db.gz" -mtime +$RETENTION_DAYS -delete
    echo "✓ 已清理 $RETENTION_DAYS 天前的备份"
else
    echo "✗ 备份失败"
    exit 1
fi
```

**使用**：
```bash
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh
```

### 方法 2: 使用 SQLite 的 `.backup` 命令

SQLite 提供了专门的备份命令，可以在数据库运行时安全备份。

#### 使用 sqlite3 命令行工具

```bash
# 基本备份
sqlite3 src/utils/db/data/test_attest.db ".backup backups/test_attest_backup.db"

# 备份并压缩
sqlite3 src/utils/db/data/test_attest.db ".backup backups/test_attest_backup.db" && \
gzip backups/test_attest_backup.db
```

#### 使用 Node.js 脚本备份

创建 `scripts/backup-sqlite.ts`：

```typescript
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { PROJECT_ROOT } from '@/utils/pathUtil';

const DB_PATH = join(PROJECT_ROOT, 'src/utils/db/data/test_attest.db');
const BACKUP_DIR = join(PROJECT_ROOT, 'backups/database');

// 创建备份目录
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
}

// 生成备份文件名
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = join(BACKUP_DIR, `test_attest_${timestamp}.db`);

try {
  console.log('开始备份数据库...');
  
  // 使用 sqlite3 的 .backup 命令
  execSync(`sqlite3 "${DB_PATH}" ".backup '${backupFile}'"`, {
    stdio: 'inherit',
  });
  
  console.log(`✓ 备份成功: ${backupFile}`);
} catch (error) {
  console.error('✗ 备份失败:', error);
  process.exit(1);
}
```

### 方法 3: 使用 Prisma 的 SQL 转储

```bash
# 导出 SQL 格式
sqlite3 src/utils/db/data/test_attest.db .dump > backups/test_attest_dump.sql

# 恢复时
sqlite3 src/utils/db/data/test_attest_restored.db < backups/test_attest_dump.sql
```

### 方法 4: 在线备份（数据库运行时）

如果数据库正在被使用，使用 VACUUM INTO 命令：

```bash
sqlite3 src/utils/db/data/test_attest.db "VACUUM INTO 'backups/test_attest_backup.db'"
```

---

## 二、PostgreSQL 数据库备份

如果将来切换到 PostgreSQL，可以使用以下方法：

### 方法 1: 使用 pg_dump

```bash
# 基本备份
pg_dump $DATABASE_URL > backup.sql

# 压缩备份
pg_dump $DATABASE_URL | gzip > backup.sql.gz

# 自定义格式（可选择性恢复）
pg_dump -Fc $DATABASE_URL > backup.dump

# 只备份结构
pg_dump --schema-only $DATABASE_URL > schema.sql

# 只备份数据
pg_dump --data-only $DATABASE_URL > data.sql
```

### 方法 2: 使用 Prisma 迁移 + pg_dump

```bash
# 1. 备份数据库
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. 应用迁移
npx prisma migrate deploy

# 3. 如果迁移失败，恢复备份
psql $DATABASE_URL < backup_*.sql
```

### 自动化脚本

```bash
#!/bin/bash
# backup-postgres.sh

DATABASE_URL="${DATABASE_URL}"
BACKUP_DIR="backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# 备份
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

echo "✓ 备份完成: $BACKUP_DIR/backup_$TIMESTAMP.sql.gz"
```

---

## 三、MySQL 数据库备份

### 使用 mysqldump

```bash
# 基本备份
mysqldump -u username -p database_name > backup.sql

# 压缩备份
mysqldump -u username -p database_name | gzip > backup.sql.gz

# 从环境变量读取连接信息
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > backup.sql
```

---

## 四、通用备份脚本（支持多种数据库）

创建 `scripts/backup-database.ts`：

```typescript
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import { PROJECT_ROOT } from '@/utils/pathUtil';

// 加载环境变量
const envPath = join(PROJECT_ROOT, 'src/utils/db/.env.database');
config({ path: envPath });

const DATABASE_URL = process.env.DATABASE_URL || '';
const BACKUP_DIR = join(PROJECT_ROOT, 'backups/database');

// 创建备份目录
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

function backupSQLite() {
  const dbPath = DATABASE_URL.replace('file:', '');
  const backupFile = join(BACKUP_DIR, `sqlite_${timestamp}.db`);
  
  console.log('备份 SQLite 数据库...');
  execSync(`sqlite3 "${dbPath}" ".backup '${backupFile}'"`, { stdio: 'inherit' });
  console.log(`✓ 备份完成: ${backupFile}`);
}

function backupPostgreSQL() {
  const backupFile = join(BACKUP_DIR, `postgres_${timestamp}.sql.gz`);
  
  console.log('备份 PostgreSQL 数据库...');
  execSync(`pg_dump "${DATABASE_URL}" | gzip > "${backupFile}"`, { stdio: 'inherit' });
  console.log(`✓ 备份完成: ${backupFile}`);
}

function backupMySQL() {
  const backupFile = join(BACKUP_DIR, `mysql_${timestamp}.sql.gz`);
  
  console.log('备份 MySQL 数据库...');
  execSync(`mysqldump "${DATABASE_URL}" | gzip > "${backupFile}"`, { stdio: 'inherit' });
  console.log(`✓ 备份完成: ${backupFile}`);
}

// 根据数据库类型选择备份方法
if (DATABASE_URL.startsWith('file:')) {
  backupSQLite();
} else if (DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://')) {
  backupPostgreSQL();
} else if (DATABASE_URL.startsWith('mysql://')) {
  backupMySQL();
} else {
  console.error('不支持的数据库类型');
  process.exit(1);
}
```

---

## 五、部署前备份工作流

### 在迁移前自动备份

修改 `src/utils/db/prisma-cli.ts`，添加备份功能：

```typescript
// 在 runPrismaCommand 函数中添加备份逻辑
function runPrismaCommand(command: PrismaCommand): void {
  // 如果是 migrate 命令，先备份
  if (command === 'migrate') {
    backupDatabase();
  }
  
  // ... 原有代码
}

function backupDatabase(): void {
  const dbPath = process.env.DATABASE_URL?.replace('file:', '');
  if (!dbPath || !existsSync(dbPath)) {
    console.warn('警告: 数据库文件不存在，跳过备份');
    return;
  }
  
  const backupDir = path.resolve(PROJECT_ROOT, 'backups/database');
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `pre_migrate_${timestamp}.db`);
  
  try {
    console.log('正在备份数据库...');
    execSync(`sqlite3 "${dbPath}" ".backup '${backupFile}'"`, {
      stdio: 'inherit',
      cwd: PROJECT_ROOT,
    });
    console.log(`✓ 备份完成: ${backupFile}`);
  } catch (error) {
    console.error('✗ 备份失败:', error);
    console.error('是否继续执行迁移？(y/N)');
    // 可以添加交互式确认
  }
}
```

### 使用 package.json 脚本

在 `package.json` 中添加备份脚本：

```json
{
  "scripts": {
    "db:backup": "tsx scripts/backup-database.ts",
    "db:backup:sqlite": "bash scripts/backup-db.sh",
    "prisma:migrate:safe": "npm run db:backup && npm run prisma:migrate"
  }
}
```

---

## 六、备份策略

### 1. 备份频率

| 环境 | 频率 | 保留时间 |
|------|------|---------|
| **生产环境** | 每天 | 30 天 |
| **预发布环境** | 每天 | 7 天 |
| **开发环境** | 手动 | 3 天 |

### 2. 备份类型

- **完整备份**：每天一次
- **增量备份**：每小时一次（如果支持）
- **迁移前备份**：每次执行迁移前

### 3. 备份存储

- **本地存储**：快速恢复
- **远程存储**：防止本地灾难（S3、云存储等）
- **异地备份**：重要数据需要异地备份

### 4. 自动化备份（使用 cron）

#### Linux/macOS

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 2 点备份
0 2 * * * /path/to/scripts/backup-db.sh

# 每小时备份（如果支持增量）
0 * * * * /path/to/scripts/backup-db.sh --incremental
```

#### Windows (使用任务计划程序)

创建 `scripts/backup-db.bat`：

```batch
@echo off
cd /d D:\code\html\attest_ts
call npm run db:backup
```

然后在任务计划程序中设置定时执行。

---

## 七、恢复数据库

### SQLite 恢复

```bash
# 方法 1: 直接替换文件
cp backups/test_attest_20240101_020000.db src/utils/db/data/test_attest.db

# 方法 2: 从 SQL 转储恢复
sqlite3 src/utils/db/data/test_attest.db < backups/test_attest_dump.sql

# 方法 3: 使用 .restore 命令
sqlite3 src/utils/db/data/test_attest.db ".restore 'backups/test_attest_backup.db'"
```

### PostgreSQL 恢复

```bash
# 从 SQL 文件恢复
psql $DATABASE_URL < backup.sql

# 从压缩文件恢复
gunzip < backup.sql.gz | psql $DATABASE_URL

# 从自定义格式恢复
pg_restore -d $DATABASE_URL backup.dump
```

### MySQL 恢复

```bash
# 从 SQL 文件恢复
mysql -u username -p database_name < backup.sql

# 从压缩文件恢复
gunzip < backup.sql.gz | mysql -u username -p database_name
```

---

## 八、验证备份

### 检查备份文件

```bash
# SQLite: 检查文件大小和完整性
ls -lh backups/*.db
sqlite3 backups/test_attest_backup.db "PRAGMA integrity_check;"

# PostgreSQL: 检查备份文件
pg_restore --list backup.dump

# MySQL: 检查备份文件
head -n 20 backup.sql
```

### 测试恢复

定期测试备份恢复流程：

```bash
# 1. 创建测试数据库
sqlite3 test_restore.db < backups/test_attest_dump.sql

# 2. 验证数据
sqlite3 test_restore.db "SELECT COUNT(*) FROM test_data_url_capture;"

# 3. 清理测试数据库
rm test_restore.db
```

---

## 九、最佳实践

### 1. 迁移前备份

**始终在应用迁移前备份**：

```bash
# 推荐流程
npm run db:backup          # 1. 备份
npm run prisma:migrate      # 2. 迁移
npm test                    # 3. 测试
# 如果失败，恢复备份
```

### 2. 版本化备份

使用时间戳命名备份文件：

```bash
backups/
  ├── test_attest_20240101_020000.db
  ├── test_attest_20240102_020000.db
  └── test_attest_20240103_020000.db
```

### 3. 压缩备份

对于大数据库，压缩备份文件：

```bash
gzip backups/test_attest_20240101_020000.db
# 生成: test_attest_20240101_020000.db.gz
```

### 4. 监控备份

记录备份日志：

```bash
# 在备份脚本中添加日志
echo "$(date): 备份成功 - $BACKUP_FILE" >> backups/backup.log
```

### 5. 备份加密（敏感数据）

```bash
# 使用 GPG 加密备份
gpg --encrypt --recipient your@email.com backups/test_attest.db
```

### 6. 远程备份

```bash
# 上传到 S3
aws s3 cp backups/test_attest.db s3://my-backup-bucket/databases/

# 上传到其他云存储
rsync -avz backups/ user@remote-server:/backups/
```

---

## 十、CI/CD 集成

### GitHub Actions 示例

```yaml
# .github/workflows/backup.yml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨 2 点
  workflow_dispatch:  # 手动触发

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Backup database
        run: npm run db:backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Upload backup to S3
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Upload to S3
        run: |
          aws s3 cp backups/ s3://my-backup-bucket/databases/ --recursive
```

---

## 十一、故障恢复流程

### 场景 1: 迁移失败

```bash
# 1. 停止应用
# 2. 恢复备份
cp backups/pre_migrate_20240101_120000.db src/utils/db/data/test_attest.db

# 3. 检查数据库状态
npx prisma migrate status

# 4. 修复迁移文件
# 5. 重新尝试迁移
npm run prisma:migrate
```

### 场景 2: 数据损坏

```bash
# 1. 检查数据库完整性
sqlite3 src/utils/db/data/test_attest.db "PRAGMA integrity_check;"

# 2. 如果损坏，恢复最新备份
cp backups/test_attest_20240101_020000.db src/utils/db/data/test_attest.db

# 3. 验证数据
sqlite3 src/utils/db/data/test_attest.db "SELECT COUNT(*) FROM test_data_url_capture;"
```

### 场景 3: 误删除数据

```bash
# 1. 停止应用
# 2. 恢复备份
cp backups/test_attest_20240101_020000.db src/utils/db/data/test_attest.db

# 3. 导出需要的数据
sqlite3 src/utils/db/data/test_attest.db "SELECT * FROM test_data_url_capture WHERE id = 123;" > recovered_data.sql

# 4. 恢复到当前数据库（如果当前数据库还有其他新数据）
```

---

## 十二、总结

### 关键要点

1. ✅ **迁移前必须备份**：每次执行 `prisma migrate` 前都要备份
2. ✅ **定期自动备份**：设置定时任务自动备份
3. ✅ **验证备份**：定期测试备份文件是否可恢复
4. ✅ **多地点存储**：本地 + 远程备份
5. ✅ **保留策略**：根据需求设置备份保留时间

### 快速参考

| 操作 | SQLite | PostgreSQL | MySQL |
|------|--------|------------|-------|
| **备份** | `cp db.db backup.db` | `pg_dump > backup.sql` | `mysqldump > backup.sql` |
| **恢复** | `cp backup.db db.db` | `psql < backup.sql` | `mysql < backup.sql` |
| **在线备份** | `VACUUM INTO` | `pg_dump` | `mysqldump` |

### 推荐工作流

```bash
# 1. 开发环境修改 schema
# 2. 创建迁移
npm run prisma:migrate

# 3. 生产环境部署前
npm run db:backup          # 备份
npm run prisma:deploy      # 应用迁移
npm test                   # 测试

# 4. 如果失败
# 恢复备份并修复问题
```

---

记住：**没有备份的迁移是危险的！** 始终在重要操作前备份数据库。

