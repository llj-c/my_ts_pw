import dotenv from 'dotenv';
import type { EnvConfig } from './type';
import path from 'path';
import fs from 'fs';
import { PROJECT_ROOT } from '../../../utils/pathUtil';

/**
 * 初始化环境变量
 * 从环境变量文件加载配置到 process.env
 * @param envName 环境名称，默认为 'uat' 或 process.env.TEST_ENV
 * @returns 环境文件路径
 */

// 标记环境变量是否已初始化
let envInitialized = false;

export function initEnv(envName?: string): string {
    const name = envName || process.env.TEST_ENV || 'uat';
    const envFileName = name ? `.env.${name}` : '.env.local';
    const envFilePath = path.resolve(PROJECT_ROOT, `env/${envFileName}`);
    dotenv.config({ path: envFilePath, quiet: true });
    envInitialized = true;
    console.log('环境变量已加载:', envFilePath);
    return envFilePath;
}

// 校验必需的环境变量
function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`缺少必需的环境变量: ${key}`);
    }
    return value;
}

// 获取环境配置（延迟初始化，确保环境变量已加载）
function getEnvConfig(): EnvConfig {
    // 如果环境变量尚未初始化，则自动初始化
    if (!envInitialized) {
        initEnv();
    }
    return {
        OPS_BASE_URL: requireEnv('OPS_BASE_URL'),
        OPS_USER_EMAIL: requireEnv('OPS_USER_EMAIL'),
        OPS_USER_PASSWD: requireEnv('OPS_USER_PASSWD'),
        LOG_LEVEL: requireEnv('LOG_LEVEL'),
        DATABASE_URL: requireEnv('DATABASE_URL'),
    };
}

// 校验配置并导出（模块加载时初始化，用于大多数场景）
const envConfig: EnvConfig = getEnvConfig();
export default envConfig;

// 导出获取配置的函数，用于需要延迟初始化的场景（如 Playwright worker）
export { getEnvConfig };