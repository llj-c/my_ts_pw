import { Logger } from '@/common/logger';

/**
 * Prisma Client 类型（兼容 Prisma Client 接口）
 */
export type PrismaClientLike = {
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
  $queryRawUnsafe: <T = unknown>(query: string, ...values: unknown[]) => Promise<T>;
  $transaction: <T>(callback: (tx: PrismaClientLike) => Promise<T>) => Promise<T>;
  $queryRaw: <T = unknown>(query: TemplateStringsArray, ...values: unknown[]) => Promise<T>;
  [key: string]: any;
};

/**
 * 数据库工具类配置选项
 */
export interface DbUtilConfig {
  /** Prisma Client 实例，如果不提供则需要在外部创建 */
  prisma?: PrismaClientLike | any;
  /** 是否启用日志（默认 true） */
  enableLogging?: boolean;
  /** 是否在操作失败时抛出错误（默认 true） */
  throwOnError?: boolean;
}

/**
 * 查询选项
 */
export interface QueryOptions {
  /** 是否启用日志 */
  logQuery?: boolean;
  /** 超时时间（毫秒） */
  timeout?: number;
}

/**
 * 批量操作选项
 */
export interface BatchOptions {
  /** 批量大小（默认 100） */
  batchSize?: number;
  /** 是否在事务中执行 */
  useTransaction?: boolean;
}

/**
 * 基于 Prisma 的数据库工具类
 * 用于自动化测试过程中的数据库操作
 * 
 * 使用前需要先安装 Prisma 并初始化：
 * ```bash
 * npm install @prisma/client
 * npx prisma init
 * npx prisma generate
 * ```
 * 
 * 使用示例：
 * ```typescript
 * import { PrismaClient } from '@prisma/client';
 * import { SqliteUtils } from '@/utils/db/sqliteUtils';
 * 
 * const prisma = new PrismaClient();
 * const db = new SqliteUtils({ prisma });
 * 
 * // 使用
 * await db.connect();
 * const user = await db.findOne('user', { id: 1 });
 * await db.disconnect();
 * ```
 */
export class SqliteUtils {
  private prisma: PrismaClientLike;
  private enableLogging: boolean;
  private throwOnError: boolean;

  /**
   * 构造函数
   * @param config 配置选项
   * @throws 如果未提供 prisma 实例且无法创建默认实例
   */
  constructor(config: DbUtilConfig = {}) {
    if (!config.prisma) {
      throw new Error(
        '请提供 Prisma Client 实例。示例：\n' +
        "import { PrismaClient } from '@prisma/client';\n" +
        'const prisma = new PrismaClient();\n' +
        'const db = new SqliteUtils({ prisma });'
      );
    }
    // 使用类型断言以兼容 PrismaClient 的实际类型
    this.prisma = config.prisma as PrismaClientLike;
    this.enableLogging = config.enableLogging ?? true;
    this.throwOnError = config.throwOnError ?? true;
  }

  /**
   * 获取 Prisma Client 实例
   */
  getClient(): PrismaClientLike {
    return this.prisma;
  }

  /**
   * 连接数据库
   */
  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.log('数据库连接成功');
    } catch (error) {
      const message = `数据库连接失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      if (this.throwOnError) {
        throw new Error(message);
      }
    }
  }

  /**
   * 断开数据库连接
   */
  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.log('数据库连接已断开');
    } catch (error) {
      const message = `断开数据库连接失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      if (this.throwOnError) {
        throw new Error(message);
      }
    }
  }

  /**
   * 执行原始 SQL 查询
   * @param sql SQL 语句
   * @param params 参数
   * @param options 查询选项
   */
  async executeRaw<T = unknown>(
    sql: string,
    params: unknown[] = [],
    options: QueryOptions = {}
  ): Promise<T[]> {
    try {
      if (options.logQuery ?? this.enableLogging) {
        this.log(`执行 SQL: ${sql}`, 'debug');
      }

      const result = await this.prisma.$queryRawUnsafe<T>(sql, ...params);
      return Array.isArray(result) ? result : [result];
    } catch (error) {
      const message = `SQL 执行失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      if (this.throwOnError) {
        throw new Error(message);
      }
      return [];
    }
  }

  /**
   * 查找单条记录
   * @param model 模型名称（如 'user', 'order'）
   * @param where 查询条件
   */
  async findOne<T = unknown>(model: string, where: Record<string, unknown>): Promise<T | null> {
    try {
      this.log(`查找 ${model} 记录: ${JSON.stringify(where)}`, 'debug');
      // 使用 findFirst 而不是 findUnique，因为 where 条件可能不是唯一字段
      const result = await (this.prisma[model as string] as any).findFirst({
        where,
      });
      return result as T | null;
    } catch (error) {
      const message = `查找记录失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      if (this.throwOnError) {
        throw new Error(message);
      }
      return null;
    }
  }

  /**
   * 查找多条记录
   * @param model 模型名称
   * @param where 查询条件
   * @param options 查询选项（如 orderBy, take, skip）
   */
  async findMany<T = unknown>(
    model: string,
    where: Record<string, unknown> = {},
    options: {
      orderBy?: Record<string, 'asc' | 'desc'>;
      take?: number;
      skip?: number;
      include?: Record<string, boolean>;
    } = {}
  ): Promise<T[]> {
    try {
      this.log(`查找 ${model} 记录列表: ${JSON.stringify(where)}`, 'debug');
      const result = await (this.prisma[model as string] as any).findMany({
        where,
        ...options,
      });
      return result as T[];
    } catch (error) {
      const message = `查找记录列表失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      if (this.throwOnError) {
        throw new Error(message);
      }
      return [];
    }
  }

  /**
   * 创建记录
   * @param model 模型名称
   * @param data 数据
   */
  async create<T = unknown>(model: string, data: Record<string, unknown>): Promise<T> {
    try {
      this.log(`创建 ${model} 记录: ${JSON.stringify(data)}`, 'debug');
      const result = await (this.prisma[model as string] as any).create({
        data,
      });
      this.log(`创建成功，ID: ${(result as any).id || 'N/A'}`);
      return result as T;
    } catch (error) {
      const message = `创建记录失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      if (this.throwOnError) {
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * 批量创建记录
   * @param model 模型名称
   * @param dataList 数据列表
   * @param options 批量操作选项
   */
  async createMany<T = unknown>(
    model: string,
    dataList: Record<string, unknown>[],
    options: BatchOptions = {}
  ): Promise<number> {
    try {
      const batchSize = options.batchSize || 100;
      let totalCreated = 0;

      this.log(`批量创建 ${model} 记录，共 ${dataList.length} 条`, 'debug');

      if (options.useTransaction) {
        // 在事务中执行
        await this.prisma.$transaction(async (tx: PrismaClientLike) => {
          for (let i = 0; i < dataList.length; i += batchSize) {
            const batch = dataList.slice(i, i + batchSize);
            await (tx[model as string] as any).createMany({
              data: batch,
              skipDuplicates: true,
            });
            totalCreated += batch.length;
          }
        });
      } else {
        // 分批执行
        for (let i = 0; i < dataList.length; i += batchSize) {
          const batch = dataList.slice(i, i + batchSize);
          await (this.prisma[model as string] as any).createMany({
            data: batch,
            skipDuplicates: true,
          });
          totalCreated += batch.length;
        }
      }

      this.log(`批量创建成功，共创建 ${totalCreated} 条记录`);
      return totalCreated;
    } catch (error) {
      const message = `批量创建记录失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      if (this.throwOnError) {
        throw new Error(message);
      }
      return 0;
    }
  }

  /**
   * 更新记录
   * @param model 模型名称
   * @param where 查询条件
   * @param data 更新数据
   */
  async update<T = unknown>(
    model: string,
    where: Record<string, unknown>,
    data: Record<string, unknown>
  ): Promise<T> {
    try {
      this.log(`更新 ${model} 记录: ${JSON.stringify(where)}`, 'debug');
      const result = await (this.prisma[model as string] as any).update({
        where,
        data,
      });
      this.log(`更新成功`);
      return result as T;
    } catch (error) {
      const message = `更新记录失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      if (this.throwOnError) {
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * 批量更新记录
   * @param model 模型名称
   * @param where 查询条件
   * @param data 更新数据
   */
  async updateMany(
    model: string,
    where: Record<string, unknown>,
    data: Record<string, unknown>
  ): Promise<number> {
    try {
      this.log(`批量更新 ${model} 记录: ${JSON.stringify(where)}`, 'debug');
      const result = await (this.prisma[model as string] as any).updateMany({
        where,
        data,
      });
      this.log(`批量更新成功，共更新 ${result.count} 条记录`);
      return result.count;
    } catch (error) {
      const message = `批量更新记录失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      if (this.throwOnError) {
        throw new Error(message);
      }
      return 0;
    }
  }

  /**
   * 删除记录
   * @param model 模型名称
   * @param where 查询条件
   */
  async delete<T = unknown>(model: string, where: Record<string, unknown>): Promise<T> {
    try {
      this.log(`删除 ${model} 记录: ${JSON.stringify(where)}`, 'debug');
      const result = await (this.prisma[model as string] as any).delete({
        where,
      });
      this.log(`删除成功`);
      return result as T;
    } catch (error) {
      const message = `删除记录失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      if (this.throwOnError) {
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * 批量删除记录
   * @param model 模型名称
   * @param where 查询条件
   */
  async deleteMany(model: string, where: Record<string, unknown> = {}): Promise<number> {
    try {
      this.log(`批量删除 ${model} 记录: ${JSON.stringify(where)}`, 'debug');
      const result = await (this.prisma[model as string] as any).deleteMany({
        where,
      });
      this.log(`批量删除成功，共删除 ${result.count} 条记录`);
      return result.count;
    } catch (error) {
      const message = `批量删除记录失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      if (this.throwOnError) {
        throw new Error(message);
      }
      return 0;
    }
  }

  /**
   * 统计记录数量
   * @param model 模型名称
   * @param where 查询条件
   */
  async count(model: string, where: Record<string, unknown> = {}): Promise<number> {
    try {
      const result = await (this.prisma[model as string] as any).count({
        where,
      });
      return result;
    } catch (error) {
      const message = `统计记录数量失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      if (this.throwOnError) {
        throw new Error(message);
      }
      return 0;
    }
  }

  /**
   * 执行事务
   * @param callback 事务回调函数
   */
  async transaction<T>(callback: (tx: PrismaClientLike) => Promise<T>): Promise<T> {
    try {
      this.log('开始事务', 'debug');
      const result = await this.prisma.$transaction(callback);
      this.log('事务提交成功');
      return result;
    } catch (error) {
      const message = `事务执行失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      if (this.throwOnError) {
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * 清空表数据（用于测试数据清理）
   * @param model 模型名称
   */
  async truncate(model: string): Promise<void> {
    try {
      this.log(`清空表 ${model} 的数据`, 'debug');
      await this.deleteMany(model, {});
      this.log(`表 ${model} 已清空`);
    } catch (error) {
      const message = `清空表失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      if (this.throwOnError) {
        throw new Error(message);
      }
    }
  }

  /**
   * 清空多个表的数据
   * @param models 模型名称列表
   */
  async truncateMany(models: string[]): Promise<void> {
    try {
      this.log(`清空多个表的数据: ${models.join(', ')}`, 'debug');
      await this.transaction(async (tx: PrismaClientLike) => {
        for (const model of models) {
          await (tx[model as string] as any).deleteMany({});
        }
      });
      this.log(`已清空 ${models.length} 个表的数据`);
    } catch (error) {
      const message = `清空多个表失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      if (this.throwOnError) {
        throw new Error(message);
      }
    }
  }

  /**
   * 重置数据库（删除所有数据，按依赖关系顺序）
   * @param models 模型名称列表（按依赖关系排序，先删除依赖表）
   */
  async reset(models: string[] = []): Promise<void> {
    try {
      this.log('重置数据库', 'debug');
      if (models.length > 0) {
        await this.truncateMany(models);
      } else {
        // 如果没有指定模型，尝试清空所有表
        // 注意：这需要根据实际的 Prisma schema 来调整
        this.log('警告: 未指定要清空的表，请手动指定 models 参数', 'warn');
      }
      this.log('数据库重置完成');
    } catch (error) {
      const message = `重置数据库失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      if (this.throwOnError) {
        throw new Error(message);
      }
    }
  }

  /**
   * 检查记录是否存在
   * @param model 模型名称
   * @param where 查询条件
   */
  async exists(model: string, where: Record<string, unknown>): Promise<boolean> {
    try {
      const count = await this.count(model, where);
      return count > 0;
    } catch (error) {
      const message = `检查记录是否存在失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      if (this.throwOnError) {
        throw new Error(message);
      }
      return false;
    }
  }

  /**
   * 查找或创建记录（如果不存在则创建）
   * @param model 模型名称
   * @param where 查询条件
   * @param createData 创建数据
   */
  async findOrCreate<T = unknown>(
    model: string,
    where: Record<string, unknown>,
    createData: Record<string, unknown>
  ): Promise<T> {
    try {
      this.log(`查找或创建 ${model} 记录`, 'debug');
      const existing = await this.findOne<T>(model, where);
      if (existing) {
        this.log('记录已存在，返回现有记录');
        return existing;
      }
      this.log('记录不存在，创建新记录');
      return await this.create<T>(model, createData);
    } catch (error) {
      const message = `查找或创建记录失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      if (this.throwOnError) {
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * 更新或创建记录（如果不存在则创建，存在则更新）
   * @param model 模型名称
   * @param where 查询条件
   * @param updateData 更新数据
   * @param createData 创建数据（如果不提供，使用 updateData）
   */
  async upsert<T = unknown>(
    model: string,
    where: Record<string, unknown>,
    updateData: Record<string, unknown>,
    createData?: Record<string, unknown>
  ): Promise<T> {
    try {
      this.log(`更新或创建 ${model} 记录`, 'debug');
      const result = await (this.prisma[model as string] as any).upsert({
        where,
        update: updateData,
        create: createData || updateData,
      });
      this.log('更新或创建成功');
      return result as T;
    } catch (error) {
      const message = `更新或创建记录失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      if (this.throwOnError) {
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * 执行数据库健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.log('数据库健康检查通过');
      return true;
    } catch (error) {
      const message = `数据库健康检查失败: ${error instanceof Error ? error.message : String(error)}`;
      this.log(message, 'error');
      return false;
    }
  }

  /**
   * 记录日志
   */
  private log(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.enableLogging) {
      return;
    }

    const prefix = '[SqliteUtils]';
    switch (level) {
      case 'debug':
        Logger.debug(`${prefix} ${message}`);
        break;
      case 'info':
        Logger.info(`${prefix} ${message}`);
        break;
      case 'warn':
        Logger.warn(`${prefix} ${message}`);
        break;
      case 'error':
        Logger.error(`${prefix} ${message}`);
        break;
    }
  }
}

/**
 * 创建数据库工具类实例的便捷函数
 * @param config 配置选项
 */
export function createDbUtil(config: DbUtilConfig = {}): SqliteUtils {
  return new SqliteUtils(config);
}

/**
 * 默认导出的单例实例（延迟初始化）
 */
let defaultInstance: SqliteUtils | null = null;

/**
 * 获取默认的数据库工具类实例
 * @param config 配置选项（仅在首次调用时生效）
 */
export function getDefaultDbUtil(config: DbUtilConfig = {}): SqliteUtils {
  if (!defaultInstance) {
    defaultInstance = new SqliteUtils(config);
  }
  return defaultInstance;
}
