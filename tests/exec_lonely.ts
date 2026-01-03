import { PrismaClient, Prisma } from '@prisma/client';
import { SqliteUtils } from '@/utils/db/sqliteUtils';
import { initEnv, getEnvConfig } from '@/common/config/env';
import path from 'path';

// 初始化环境变量（如果 env 目录有配置文件）
// 如果没有配置文件，设置默认的 DATABASE_URL
if (!process.env.DATABASE_URL) {
    try {
        initEnv();
    } catch (error) {
        throw new Error('初始化环境变量失败');
    }
}

console.log('DATABASE_URL:', process.env.DATABASE_URL);

async function exampleWithGenerics() {
    // PrismaClient 会自动从 process.env.DATABASE_URL 读取配置
    // 不需要也不能在构造函数中传递 datasources
    const prisma = new PrismaClient();
    const db = new SqliteUtils({ prisma });

    await db.connect();

    try {
        // 在事务中准备测试数据
        await db.transaction(async (tx) => {
            // 在事务中使用事务客户端创建 SqliteUtils 实例
            const txDb = new SqliteUtils({ prisma: tx, enableLogging: false });
            await txDb.create('testDataUrlCapture', {
                apiUrl: 'api/users',
                apiMethod: 'GET',
                apiParams: JSON.stringify({ page: 1, limit: 10 }),
                apiRequestHeaders: JSON.stringify({ 'Content-Type': 'application/json' }),
                apiResponseHeaders: JSON.stringify({ 'Content-Type': 'application/json' }),
                apiResponseBody: JSON.stringify({ data: [{ id: 1, name: 'test', email: 'test@example.com' }] }),
                apiStatusCode: 200,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            const capture = await txDb.findOne<Prisma.TestDataUrlCaptureGetPayload<{}>>('testDataUrlCapture', { apiUrl: 'api/users' });
            console.log('capture:', capture);
            if (capture) {
                await txDb.update('testDataUrlCapture', { id: capture.id }, { apiUrl: 'api/users/1' });
                // await txDb.delete('testDataUrlCapture', { id: capture.id });
            }

            // 执行测试...
            // 如果测试失败，事务会自动回滚
        });
    } finally {
        // 不需要手动清理，事务已回滚
        await db.disconnect();
    }
}
// 使用立即执行的异步函数替代顶层 await
(async () => {
    await exampleWithGenerics();
})().catch((error) => {
    console.error('执行失败:', error);
    process.exit(1);
});