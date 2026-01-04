#!/usr/bin/env node
/**
 * Prisma CLI 工具脚本
 * 封装 Prisma 相关命令，支持直接通过 node/tsx 调用
 * 
 * 使用方法:
 *   tsx src/utils/db/prisma-cli.ts generate
 *   tsx src/utils/db/prisma-cli.ts migrate
 *   tsx src/utils/db/prisma-cli.ts push
 *   tsx src/utils/db/prisma-cli.ts deploy
 *   tsx src/utils/db/prisma-cli.ts format
 *   tsx src/utils/db/prisma-cli.ts validate
 * 
 * 支持环境参数:
 *   tsx src/utils/db/prisma-cli.ts generate --env=test
 */

import { execSync } from 'child_process';
import { config } from 'dotenv';
import path from 'path';
import { PROJECT_ROOT } from '@/utils/pathUtil';

// Prisma schema 和环境变量文件路径
const SCHEMA_DIR = path.resolve(PROJECT_ROOT, 'src/utils/db');
const PRISMA_ENV_PATH = path.resolve(SCHEMA_DIR, '.env.database');
const SCHEMA_PATH = path.resolve(SCHEMA_DIR, 'schema.prisma');


// 支持的 Prisma 命令
const PRISMA_COMMANDS = {
    generate: 'generate',
    migrate: 'migrate dev',
    push: 'db push',
    deploy: 'migrate deploy',
    format: 'format',
    validate: 'validate',
} as const;

type PrismaCommand = keyof typeof PRISMA_COMMANDS;

/**
 * 加载环境变量
 */
function loadEnv(): void {
    const result = config({ path: PRISMA_ENV_PATH });

    if (result.error) {
        console.warn(`警告: 无法加载环境变量文件 ${PRISMA_ENV_PATH}`);
        console.warn(`错误: ${result.error.message}`);
    } else {
        console.log(`✓ 环境变量已加载: ${PRISMA_ENV_PATH}`);
    }
}

/**
 * 执行 Prisma 命令
 * @param command Prisma 命令名称
 */
function runPrismaCommand(command: PrismaCommand): void {
    // 加载环境变量
    loadEnv();

    // 获取 Prisma 命令
    const prismaCommand = PRISMA_COMMANDS[command];
    if (!prismaCommand) {
        console.error(`错误: 未知的命令 "${command}"`);
        console.error(`支持的命令: ${Object.keys(PRISMA_COMMANDS).join(', ')}`);
        process.exit(1);
    }

    // 构建完整的 Prisma 命令
    const fullCommand = `prisma ${prismaCommand} --schema=${SCHEMA_PATH}`;

    console.log(`\n执行命令: ${fullCommand}`);
    console.log(`环境变量文件: ${PRISMA_ENV_PATH}`);
    console.log(`Schema: ${SCHEMA_PATH}\n`);

    try {
        // 执行命令
        execSync(fullCommand, {
            stdio: 'inherit',
            cwd: PROJECT_ROOT,
            env: process.env,
        });
        console.log(`\n✓ 命令执行成功: ${command}`);
    } catch (error) {
        console.error(`\n✗ 命令执行失败: ${command}`);
        process.exit(1);
    }
}

/**
 * 处理 deploy 命令（需要先执行 validate）
 */
function runDeploy(): void {
    loadEnv();

    try {
        // 先执行 validate
        console.log('步骤 1/2: 验证 schema...');
        execSync(`prisma validate --schema=${SCHEMA_PATH}`, {
            stdio: 'inherit',
            cwd: PROJECT_ROOT,
            env: process.env,
        });

        // 再执行 deploy
        console.log('\n步骤 2/2: 部署迁移...');
        execSync(`prisma migrate deploy --schema=${SCHEMA_PATH}`, {
            stdio: 'inherit',
            cwd: PROJECT_ROOT,
            env: process.env,
        });

        console.log(`\n✓ 部署成功`);
    } catch (error) {
        console.error(`\n✗ 部署失败`);
        process.exit(1);
    }
}

/**
 * 解析命令行参数
 */
function parseArgs(): { command: PrismaCommand | null; envName: string } {
    const args = process.argv.slice(2);
    let command: PrismaCommand | null = null;
    let envName = 'uat';

    for (const arg of args) {
        if (arg.startsWith('--env=')) {
            const value = arg.split('=')[1];
            if (value) envName = value;
        } else if (arg.startsWith('--env:')) {
            const value = arg.split(':')[1];
            if (value) envName = value;
        } else if (!arg.startsWith('--')) {
            command = arg as PrismaCommand;
        }
    }

    return { command, envName };
}

// 主函数
function main(): void {
    const { command } = parseArgs();

    if (!command) {
        console.error('错误: 请指定要执行的命令');
        console.error('\n使用方法:');
        console.error('  tsx src/utils/db/prisma-cli.ts <command>');
        console.error('\n支持的命令:');
        Object.keys(PRISMA_COMMANDS).forEach(cmd => {
            console.error(`  - ${cmd}`);
        });
        console.error('\n示例:');
        console.error('  tsx src/utils/db/prisma-cli.ts generate');
        console.error('  tsx src/utils/db/prisma-cli.ts migrate');
        console.error('  tsx src/utils/db/prisma-cli.ts deploy');
        process.exit(1);
    }

    // 特殊处理 deploy 命令
    if (command === 'deploy') {
        runDeploy();
    } else {
        runPrismaCommand(command);
    }
}

// 执行主函数
main();

