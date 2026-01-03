/**
 * SqliteUtils 使用示例
 * 
 * 使用前需要先安装和初始化 Prisma：
 * ```bash
 * npm install @prisma/client prisma
 * npx prisma init
 * npx prisma generate
 * ```
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { SqliteUtils, createDbUtil } from './sqliteUtils';

// ========== 基本使用 ==========

/**
 * 示例 1: 创建数据库工具实例
 */
async function example1() {
  // 创建 Prisma Client 实例
  const prisma = new PrismaClient();
  
  // 创建数据库工具实例
  const db = new SqliteUtils({ prisma });
  
  // 连接数据库
  await db.connect();
  
  try {
    // 使用工具类进行操作（不指定泛型，返回 unknown 类型）
    const user = await db.findOne('user', { id: 1 });
    console.log('用户:', user);
    
    // 推荐：指定泛型类型以获得类型安全
    // 使用 Prisma 生成的类型（根据你的 schema 中的模型名称）
    const capture = await db.findOne<Prisma.TestDataUrlCaptureGetPayload<{}>>(
      'testDataUrlCapture',
      { id: 1 }
    );
    if (capture) {
      // 现在有完整的类型提示
      console.log('API URL:', capture.apiUrl);
      console.log('Method:', capture.apiMethod);
    }
  } finally {
    // 断开连接
    await db.disconnect();
  }
}

/**
 * 示例 2: 使用便捷函数创建实例
 */
async function example2() {
  const prisma = new PrismaClient();
  const db = createDbUtil({ prisma });
  
  await db.connect();
  // ... 使用 db
  await db.disconnect();
}

// ========== CRUD 操作 ==========

/**
 * 示例 3: 创建记录
 */
async function example3(db: SqliteUtils) {
  const newUser = await db.create('user', {
    name: '张三',
    email: 'zhangsan@example.com',
    age: 25,
  });
  console.log('创建的用户:', newUser);
}

/**
 * 示例 4: 查找记录（带类型注解）
 */
async function example4(db: SqliteUtils) {
  // 方式 1: 不指定泛型类型（返回 unknown 类型，需要类型断言）
  const user1 = await db.findOne('user', { email: 'zhangsan@example.com' });
  // user1 的类型是 unknown | null
  
  // 方式 2: 指定泛型类型（推荐）- 使用 Prisma 生成的类型
  // 对于 schema 中的模型，使用 Prisma.ModelNameGetPayload<{}> 格式
  // 例如：TestDataUrlCapture 模型
  const capture = await db.findOne<Prisma.TestDataUrlCaptureGetPayload<{}>>(
    'testDataUrlCapture',
    { id: 1 }
  );
  // capture 的类型是 TestDataUrlCapture | null
  if (capture) {
    console.log('API URL:', capture.apiUrl); // 有完整的类型提示
    console.log('Method:', capture.apiMethod);
  }
  
  // 方式 3: 使用自定义接口（如果不想依赖 Prisma 类型）
  interface User {
    id: number;
    name: string;
    email: string;
    age?: number;
  }
  const user = await db.findOne<User>('user', { email: 'zhangsan@example.com' });
  // user 的类型是 User | null
  if (user) {
    console.log('用户名:', user.name); // 有完整的类型提示
  }
  
  // 查找多条记录（同样可以指定泛型）
  const users = await db.findMany<User>('user', {
    age: { gte: 18 },
  }, {
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  // users 的类型是 User[]
  console.log('用户列表:', users);
}

/**
 * 示例 5: 更新记录
 */
async function example5(db: SqliteUtils) {
  // 更新单条记录
  const updated = await db.update(
    'user',
    { id: 1 },
    { age: 26 }
  );
  
  // 批量更新
  const count = await db.updateMany(
    'user',
    { age: { lt: 18 } },
    { status: 'inactive' }
  );
  console.log(`更新了 ${count} 条记录`);
}

/**
 * 示例 6: 删除记录
 */
async function example6(db: SqliteUtils) {
  // 删除单条记录
  await db.delete('user', { id: 1 });
  
  // 批量删除
  const count = await db.deleteMany('user', {
    status: 'deleted',
  });
  console.log(`删除了 ${count} 条记录`);
}

// ========== 批量操作 ==========

/**
 * 示例 7: 批量创建记录
 */
async function example7(db: SqliteUtils) {
  const users = Array.from({ length: 1000 }, (_, i) => ({
    name: `用户${i}`,
    email: `user${i}@example.com`,
    age: 20 + (i % 50),
  }));
  
  // 批量创建（使用事务）
  const count = await db.createMany('user', users, {
    batchSize: 100,
    useTransaction: true,
  });
  console.log(`批量创建了 ${count} 条记录`);
}

// ========== 事务操作 ==========

/**
 * 示例 8: 使用事务
 */
async function example8(db: SqliteUtils) {
  await db.transaction(async (tx) => {
    // 在事务中创建用户
    const user = await db.create('user', {
      name: '李四',
      email: 'lisi@example.com',
    });
    
    // 在事务中创建订单
    await db.create('order', {
      userId: (user as any).id,
      amount: 100.00,
    });
    
    // 如果任何操作失败，整个事务会回滚
  });
}

// ========== 数据清理 ==========

/**
 * 示例 9: 测试数据清理
 */
async function example9(db: SqliteUtils) {
  // 清空单个表
  await db.truncate('user');
  
  // 清空多个表（按依赖关系顺序）
  await db.truncateMany(['order', 'user']);
  
  // 重置整个数据库
  await db.reset(['order', 'user', 'product']);
}

// ========== 高级操作 ==========

/**
 * 示例 10: 查找或创建
 */
async function example10(db: SqliteUtils) {
  const user = await db.findOrCreate(
    'user',
    { email: 'test@example.com' },
    {
      name: '测试用户',
      email: 'test@example.com',
      age: 20,
    }
  );
  console.log('用户:', user);
}

/**
 * 示例 11: 更新或创建（upsert）
 */
async function example11(db: SqliteUtils) {
  const user = await db.upsert(
    'user',
    { email: 'test@example.com' },
    { age: 21 }, // 更新数据
    { name: '测试用户', email: 'test@example.com', age: 20 } // 创建数据
  );
  console.log('用户:', user);
}

/**
 * 示例 12: 执行原始 SQL
 */
async function example12(db: SqliteUtils) {
  const results = await db.executeRaw<{ id: number; name: string }>(
    'SELECT id, name FROM user WHERE age > ?',
    [18]
  );
  console.log('查询结果:', results);
}

/**
 * 示例 13: 统计记录数
 */
async function example13(db: SqliteUtils) {
  const total = await db.count('user');
  const activeCount = await db.count('user', { status: 'active' });
  console.log(`总用户数: ${total}, 活跃用户数: ${activeCount}`);
}

/**
 * 示例 14: 检查记录是否存在
 */
async function example14(db: SqliteUtils) {
  const exists = await db.exists('user', { email: 'test@example.com' });
  if (exists) {
    console.log('用户已存在');
  } else {
    console.log('用户不存在');
  }
}

/**
 * 示例 15: 健康检查
 */
async function example15(db: SqliteUtils) {
  const isHealthy = await db.healthCheck();
  if (isHealthy) {
    console.log('数据库连接正常');
  } else {
    console.log('数据库连接异常');
  }
}

// ========== 在 Playwright 测试中使用 ==========

/**
 * 示例 16: 在测试中使用（setup/teardown）
 */
export async function testExample() {
  const prisma = new PrismaClient();
  const db = new SqliteUtils({ prisma });
  
  // 测试前准备数据
  await db.connect();
  await db.create('user', {
    name: '测试用户',
    email: 'test@example.com',
  });
  
  try {
    // 执行测试...
    // 验证数据库中的数据
    const user = await db.findOne('user', { email: 'test@example.com' });
    console.assert(user !== null, '用户应该存在');
  } finally {
    // 测试后清理数据
    await db.truncate('user');
    await db.disconnect();
  }
}

/**
 * 示例 17: 在测试中使用（使用事务回滚）
 */
export async function testWithTransaction() {
  const prisma = new PrismaClient();
  const db = new SqliteUtils({ prisma });
  
  await db.connect();
  
  try {
    // 在事务中准备测试数据
    await db.transaction(async (tx) => {
      await db.create('user', { name: '测试用户', email: 'test@example.com' });
      // 执行测试...
      // 如果测试失败，事务会自动回滚
    });
  } finally {
    // 不需要手动清理，事务已回滚
    await db.disconnect();
  }
}

// ========== 泛型类型使用指南 ==========

/**
 * 示例 18: 如何正确使用泛型类型 T
 * 
 * 在使用 findOne、findMany、create、update 等方法时，
 * 可以通过泛型参数 T 来指定返回值的类型，以获得完整的类型安全。
 */
export async function exampleWithGenerics() {
  const prisma = new PrismaClient();
  const db = new SqliteUtils({ prisma });
  
  await db.connect();
  
  try {
    // ===== 方式 1: 使用 Prisma 生成的类型（推荐） =====
    // 对于 schema.prisma 中的模型，使用 Prisma.ModelNameGetPayload<{}> 格式
    // 例如：TestDataUrlCapture 模型
    
    // findOne 示例
    const capture = await db.findOne<Prisma.TestDataUrlCaptureGetPayload<{}>>(
      'testDataUrlCapture',
      { id: 1 }
    );
    // capture 的类型是: TestDataUrlCapture | null
    if (capture) {
      // ✅ 有完整的类型提示和自动补全
      console.log(capture.id);           // number
      console.log(capture.apiUrl);        // string
      console.log(capture.apiMethod);     // string
      console.log(capture.apiPostData);   // string | null
      console.log(capture.createdAt);     // Date
    }
    
    // findMany 示例
    const captures = await db.findMany<Prisma.TestDataUrlCaptureGetPayload<{}>>(
      'testDataUrlCapture',
      { apiStatusCode: 200 }
    );
    // captures 的类型是: TestDataUrlCapture[]
    captures.forEach(c => {
      console.log(c.apiUrl); // 有类型提示
    });
    
    // create 示例
    const newCapture = await db.create<Prisma.TestDataUrlCaptureGetPayload<{}>>(
      'testDataUrlCapture',
      {
        apiUrl: 'https://api.example.com',
        apiMethod: 'POST',
        apiPostData: '{"key": "value"}',
      }
    );
    // newCapture 的类型是: TestDataUrlCapture
    console.log(newCapture.id); // 有类型提示
    
    // ===== 方式 2: 使用自定义接口（如果不想依赖 Prisma 类型） =====
    interface CustomUser {
      id: number;
      name: string;
      email: string;
      age?: number;
    }
    
    const user = await db.findOne<CustomUser>('user', { id: 1 });
    // user 的类型是: CustomUser | null
    if (user) {
      console.log(user.name);  // 有类型提示
      console.log(user.email);  // 有类型提示
    }
    
    // ===== 方式 3: 不指定泛型（不推荐，失去类型安全） =====
    const unknownUser = await db.findOne('user', { id: 1 });
    // unknownUser 的类型是: unknown | null
    // ❌ 没有类型提示，需要手动类型断言
    if (unknownUser) {
      const typedUser = unknownUser as CustomUser;
      console.log(typedUser.name);
    }
    
    // ===== 方式 4: 使用 Prisma 的简化类型（如果可用） =====
    // 某些情况下，可以直接使用模型名称（需要 Prisma 版本支持）
    // 但最安全的方式还是使用 Prisma.ModelNameGetPayload<{}>
    
  } finally {
    await db.disconnect();
  }
}

/**
 * 类型使用总结：
 * 
 * 1. 推荐方式：使用 Prisma.ModelNameGetPayload<{}>
 *    - 完全类型安全
 *    - 自动同步 schema 变更
 *    - 有完整的 IDE 提示
 * 
 * 2. 自定义接口：适合需要简化类型或添加额外字段的场景
 * 
 * 3. 不指定泛型：不推荐，会失去类型安全
 * 
 * 示例：
 * ```typescript
 * // ✅ 推荐
 * const data = await db.findOne<Prisma.TestDataUrlCaptureGetPayload<{}>>(
 *   'testDataUrlCapture',
 *   { id: 1 }
 * );
 * 
 * // ❌ 不推荐
 * const data = await db.findOne('testDataUrlCapture', { id: 1 });
 * ```
 */

