import { PrismaClient, Prisma } from '@prisma/client';
import { SqliteUtils, createDbUtil } from '@/utils/db/sqliteUtils';
import { test as base } from '@playwright/test';
import { initEnv } from '@/common/config/env';

// 第一个泛型参数 {} 是 test fixtures（空）
// 第二个泛型参数 { db: SqliteUtils } 是 worker fixtures
export const test = base.extend<{}, { db: SqliteUtils }>({
    // worker scope: 每个 worker 进程只初始化一次，所有测试共享同一个数据库连接
    db: [
        async ({ }, use) => {
            // 在 worker 中初始化环境变量（确保 process.env.DATABASE_URL 已设置）
            // 注意：虽然 globalSetup 中也会初始化，但 worker 进程是独立的
            initEnv();
            const prisma = new PrismaClient();
            const db = createDbUtil({ prisma });
            await db.connect();
            await use(db);
            await db.disconnect();
        },
        { scope: 'worker' }
    ],
});


export { expect } from '@playwright/test';