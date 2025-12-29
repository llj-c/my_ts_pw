import type { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global Teardown
 * 在所有测试运行之后执行
 * 
 * 用途：
 * - 清理测试数据
 * - 关闭测试服务器
 * - 清理临时文件
 * - 登出操作
 */
async function globalTeardown(config: FullConfig) {
    console.log('开始执行全局清理...');

    try {
        // 清理保存的 token 文件（如果存在）
        // 使用 process.cwd() 获取项目根目录，更可靠
        const tokenFilePath = path.resolve(process.cwd(), '.auth-token');
        if (fs.existsSync(tokenFilePath)) {
            fs.unlinkSync(tokenFilePath);
            console.log('已清理 token 文件');
        }

        // 清理环境变量
        delete process.env.GLOBAL_AUTH_TOKEN;

        // 可以在这里添加其他清理逻辑
        // 例如：清理测试数据、关闭服务器等
    } catch (error) {
        console.error('全局清理执行失败:', error);
    }

    console.log('全局清理完成');
}

export default globalTeardown;

