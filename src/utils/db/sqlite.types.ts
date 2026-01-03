/**
 * 数据库工具类相关的类型定义
 */

/**
 * 数据库操作结果
 */
export interface DbOperationResult<T = unknown> {
  /** 是否成功 */
  success: boolean;
  /** 数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** 影响的行数 */
  count?: number;
}

/**
 * 分页查询结果
 */
export interface PaginatedResult<T = unknown> {
  /** 数据列表 */
  data: T[];
  /** 总数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
}

/**
 * 数据库连接配置
 */
export interface DbConnectionConfig {
  /** 数据库 URL */
  url?: string;
  /** 是否启用日志 */
  log?: boolean | Array<'query' | 'info' | 'warn' | 'error'>;
  /** 错误格式 */
  errorFormat?: 'pretty' | 'colorless' | 'minimal';
}

