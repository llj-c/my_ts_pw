import dotenv from 'dotenv';
import type { EnvConfig } from './type';
import path from 'path';
import fs from 'fs';

// 从环境变量获取当前运行环境（默认test）
const envName = process.env.TEST_ENV || '';
const envFileName = envName ? `.env.${envName}` : '.env';
const envFilePath = path.resolve(__dirname, `./env/${envFileName}`);
dotenv.config({ path: envFilePath });


// 可选：加载本地私有配置（.env.local，优先级更高，会覆盖上面的配置）
const localEnvFilePath = path.resolve(__dirname, './env/.env.local');
if (fs.existsSync(localEnvFilePath)) {
    dotenv.config({ path: localEnvFilePath, override: true });
}

// 校验必需的环境变量
function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`缺少必需的环境变量: ${key}`);
    }
    return value;
}

// 校验配置并导出
const envConfig: EnvConfig = {
    OPS_BASE_URL: requireEnv('OPS_BASE_URL'),
    OPS_USER_EMAIL: requireEnv('OPS_USER_EMAIL'),
    OPS_USER_PASSWD: requireEnv('OPS_USER_PASSWD'),
    LOG_LEVEL: requireEnv('LOG_LEVEL'),
};
export default envConfig;