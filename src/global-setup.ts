import { request } from '@playwright/test';
import type { FullConfig } from '@playwright/test';
import { AuthApi } from './common/api/authApi';
import fs from 'fs';
import path from 'path';

/**
 * Global Setup
 * 在所有测试运行之前执行
 * 
 * 用途：
 * - 全局登录并保存 token
 * - 启动测试服务器
 * - 准备测试数据
 * - 初始化测试环境
 */
async function globalSetup(config: FullConfig) {
    console.log('开始执行全局设置...');

    // 创建 APIRequestContext
    // 在 globalSetup 中，request 是一个函数，直接调用即可创建 context
    const apiRequestContext = await request.newContext();

    try {
        // 示例：全局登录并保存 token
        const authApi = new AuthApi(apiRequestContext);
        
        try {
            // 执行全局登录
            const token = await authApi.login();
            console.log('全局登录成功，token:', token.substring(0, 20) + '...');
            
            // 将 token 保存到环境变量，供后续测试使用
            process.env.GLOBAL_AUTH_TOKEN = token;
            
            // 也可以保存到文件（可选）
            // 使用 process.cwd() 获取项目根目录，更可靠
            const tokenFilePath = path.resolve(process.cwd(), '.auth-token');
            fs.writeFileSync(tokenFilePath, token, 'utf-8');
            console.log('Token 已保存到:', tokenFilePath);
        } catch (error) {
            console.warn('全局登录失败:', error);
            // 根据需求决定是否抛出错误
            // 如果全局登录是必需的，可以取消下面的注释
            // throw error;
        }
    } catch (error) {
        console.error('全局设置执行失败:', error);
        // 根据需求决定是否抛出错误
        // throw error;
    } finally {
        // 清理资源
        await apiRequestContext.dispose();
    }

    console.log('全局设置完成');
}

export default globalSetup;

