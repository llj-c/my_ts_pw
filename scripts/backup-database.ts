#!/usr/bin/env tsx
/**
 * 数据库备份脚本
 * 支持 SQLite、PostgreSQL、MySQL
 * 
 * 使用方法:
 *   tsx scripts/backup-database.ts
 *   tsx scripts/backup-database.ts --compress
 *   tsx scripts/backup-database.ts --output=backups/custom.db
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { config } from 'dotenv';

// 获取项目根目录（从 scripts 目录向上查找 package.json）
function getProjectRoot(): string {
  // 在 tsx 环境中，__dirname 可能不可用，使用 process.cwd() 作为备选
  let currentPath = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  
  // 如果当前在 scripts 目录，向上两级到项目根
  if (currentPath.endsWith('scripts')) {
    return dirname(currentPath);
  }
  
  // 否则向上查找 package.json
  while (true) {
    const packageJsonPath = join(currentPath, 'package.json');
    if (existsSync(packageJsonPath)) {
      return currentPath;
    }
    const parentPath = dirname(currentPath);
    if (parentPath === currentPath) {
      return process.cwd();
    }
    currentPath = parentPath;
  }
}

const PROJECT_ROOT = getProjectRoot();

// 解析命令行参数
const args = process.argv.slice(2);
const shouldCompress = args.includes('--compress') || args.includes('-c');
const outputArg = args.find(arg => arg.startsWith('--output=') || arg.startsWith('-o='));
const outputPath = outputArg ? outputArg.split('=')[1] : null;

// 加载环境变量
const envPath = join(PROJECT_ROOT, 'src/utils/db/.env.database');
const envResult = config({ path: envPath });

if (envResult.error) {
  console.warn(`警告: 无法加载环境变量文件 ${envPath}`);
}

const DATABASE_URL = process.env.DATABASE_URL || '';

if (!DATABASE_URL) {
  console.error('错误: 未找到 DATABASE_URL 环境变量');
  console.error('请确保在 src/utils/db/.env.database 中设置了 DATABASE_URL');
  process.exit(1);
}

// 备份目录
const BACKUP_DIR = join(PROJECT_ROOT, 'backups/database');

// 创建备份目录
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`创建备份目录: ${BACKUP_DIR}`);
}

// 生成时间戳
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);

/**
 * 备份 SQLite 数据库
 */
function backupSQLite(): void {
  const dbPath = DATABASE_URL.replace(/^file:/, '');
  const absoluteDbPath = join(PROJECT_ROOT, dbPath);

  if (!existsSync(absoluteDbPath)) {
    console.error(`错误: 数据库文件不存在: ${absoluteDbPath}`);
    process.exit(1);
  }

  const backupFile = outputPath 
    ? join(PROJECT_ROOT, outputPath)
    : join(BACKUP_DIR, `sqlite_${timestamp}.db`);

  // 确保输出目录存在
  const backupDir = dirname(backupFile);
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  try {
    console.log('正在备份 SQLite 数据库...');
    console.log(`源: ${absoluteDbPath}`);
    console.log(`目标: ${backupFile}`);

    // 使用 sqlite3 的 .backup 命令（在线备份）
    execSync(`sqlite3 "${absoluteDbPath}" ".backup '${backupFile}'"`, {
      stdio: 'inherit',
      cwd: PROJECT_ROOT,
    });

    // 验证备份文件
    if (existsSync(backupFile)) {
      const stats = statSync(backupFile);
      console.log(`✓ 备份成功: ${backupFile}`);
      console.log(`  大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      // 压缩备份（如果指定）
      if (shouldCompress) {
        console.log('正在压缩备份文件...');
        execSync(`gzip "${backupFile}"`, { stdio: 'inherit' });
        const compressedFile = `${backupFile}.gz`;
        if (existsSync(compressedFile)) {
          const compressedStats = statSync(compressedFile);
          console.log(`✓ 压缩完成: ${compressedFile}`);
          console.log(`  压缩后大小: ${(compressedStats.size / 1024 / 1024).toFixed(2)} MB`);
        }
      }

      // 验证数据库完整性
      console.log('验证备份文件完整性...');
      try {
        const integrityCheck = execSync(
          `sqlite3 "${backupFile}" "PRAGMA integrity_check;"`,
          { encoding: 'utf-8', cwd: PROJECT_ROOT }
        );
        if (integrityCheck.trim() === 'ok') {
          console.log('✓ 备份文件完整性验证通过');
        } else {
          console.warn('警告: 备份文件完整性检查未通过');
        }
      } catch (error) {
        console.warn('警告: 无法验证备份文件完整性');
      }
    } else {
      throw new Error('备份文件未创建');
    }
  } catch (error) {
    console.error('✗ 备份失败:', error);
    process.exit(1);
  }
}

/**
 * 备份 PostgreSQL 数据库
 */
function backupPostgreSQL(): void {
  const backupFile = outputPath
    ? join(PROJECT_ROOT, outputPath)
    : join(BACKUP_DIR, `postgres_${timestamp}.sql`);

  const backupDir = dirname(backupFile);
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  try {
    console.log('正在备份 PostgreSQL 数据库...');
    console.log(`目标: ${backupFile}`);

    if (shouldCompress) {
      execSync(`pg_dump "${DATABASE_URL}" | gzip > "${backupFile}.gz"`, {
        stdio: 'inherit',
        cwd: PROJECT_ROOT,
      });
      console.log(`✓ 备份完成: ${backupFile}.gz`);
    } else {
      execSync(`pg_dump "${DATABASE_URL}" > "${backupFile}"`, {
        stdio: 'inherit',
        cwd: PROJECT_ROOT,
      });
      console.log(`✓ 备份完成: ${backupFile}`);
    }
  } catch (error) {
    console.error('✗ 备份失败:', error);
    console.error('请确保已安装 pg_dump 工具');
    process.exit(1);
  }
}

/**
 * 备份 MySQL 数据库
 */
function backupMySQL(): void {
  const backupFile = outputPath
    ? join(PROJECT_ROOT, outputPath)
    : join(BACKUP_DIR, `mysql_${timestamp}.sql`);

  const backupDir = dirname(backupFile);
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  try {
    console.log('正在备份 MySQL 数据库...');
    console.log(`目标: ${backupFile}`);

    if (shouldCompress) {
      execSync(`mysqldump "${DATABASE_URL}" | gzip > "${backupFile}.gz"`, {
        stdio: 'inherit',
        cwd: PROJECT_ROOT,
      });
      console.log(`✓ 备份完成: ${backupFile}.gz`);
    } else {
      execSync(`mysqldump "${DATABASE_URL}" > "${backupFile}"`, {
        stdio: 'inherit',
        cwd: PROJECT_ROOT,
      });
      console.log(`✓ 备份完成: ${backupFile}`);
    }
  } catch (error) {
    console.error('✗ 备份失败:', error);
    console.error('请确保已安装 mysqldump 工具');
    process.exit(1);
  }
}

// 主函数
function main(): void {
  console.log('=== 数据库备份工具 ===\n');

  // 根据数据库类型选择备份方法
  if (DATABASE_URL.startsWith('file:')) {
    backupSQLite();
  } else if (DATABASE_URL.startsWith('postgresql://') || DATABASE_URL.startsWith('postgres://')) {
    backupPostgreSQL();
  } else if (DATABASE_URL.startsWith('mysql://') || DATABASE_URL.startsWith('mysql2://')) {
    backupMySQL();
  } else {
    console.error('错误: 不支持的数据库类型');
    console.error(`DATABASE_URL: ${DATABASE_URL.substring(0, 20)}...`);
    console.error('支持的格式:');
    console.error('  - SQLite: file:./path/to/db.db');
    console.error('  - PostgreSQL: postgresql://user:pass@host:port/db');
    console.error('  - MySQL: mysql://user:pass@host:port/db');
    process.exit(1);
  }

  console.log('\n=== 备份完成 ===');
}

// 执行主函数
main();

