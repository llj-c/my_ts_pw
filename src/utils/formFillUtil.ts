import { Locator, Page } from '@playwright/test';

/**
 * 表单填充配置选项
 */
export interface FillOptions<T = string> {
  /** 最大重试次数，默认 3 */
  maxRetries?: number;

  /** 每次重试之间的延迟（毫秒），默认 500 */
  retryDelay?: number;

  /** blur 后等待时间（毫秒），用于等待请求发出，默认 300 */
  waitAfterBlur?: number;

  /** 值验证前的等待时间（毫秒），默认 200 */
  waitBeforeVerify?: number;

  /** 是否等待网络请求完成，默认 true */
  waitForRequests?: boolean;

  /** 等待请求完成的最大时间（毫秒），默认 3000 */
  requestTimeout?: number;

  /** 是否在失败时清空字段后重试，默认 true */
  clearOnRetry?: boolean;

  /** 
   * 自定义填充函数，用于执行实际的填充操作
   * @param locator - 元素定位器
   * @param value - 要填充的值
   * @returns Promise<void>
   * 
   * @example
   * // 下拉框
   * fillAction: async (locator, value) => await locator.selectOption(value)
   * 
   * // 复选框
   * fillAction: async (locator, value) => await locator.setChecked(value)
   * 
   * // 富文本编辑器
   * fillAction: async (locator, value) => {
   *   await locator.click();
   *   await locator.fill(value);
   * }
   */
  fillAction?: (locator: Locator, value: T) => Promise<void>;

  /** 
   * 自定义验证函数，返回 true 表示验证通过
   * @param locator - 元素定位器
   * @param expectedValue - 期望的值
   * @returns Promise<boolean>
   * 
   * @example
   * // 验证下拉框选中的值
   * verifyAction: async (locator, value) => {
   *   const selected = await locator.inputValue();
   *   return selected === value;
   * }
   * 
   * // 验证复选框状态
   * verifyAction: async (locator, value) => {
   *   const isChecked = await locator.isChecked();
   *   return isChecked === value;
   * }
   */
  verifyAction?: (locator: Locator, expectedValue: T) => Promise<boolean>;

  /** 是否启用调试日志，默认 false */
  debug?: boolean;
}

/**
 * 填充结果
 */
export interface FillResult<T = string> {
  /** 是否成功 */
  success: boolean;

  /** 实际尝试次数 */
  attempts: number;

  /** 最终的值 */
  finalValue: T | string;

  /** 错误信息（如果失败） */
  error?: string;
}

/**
 * 表单填充工具类
 */
export class FormFillUtil {
  /**
   * 安全填充表单字段，支持重试和等待
   * 
   * @param locator - Playwright 定位器
   * @param value - 要填充的值
   * @param options - 配置选项
   * @returns 填充结果
   * 
   * @example
   * ```typescript
   * // 基础使用 - 文本输入框
   * await FormFillUtil.fillWithRetry(page.locator('#username'), 'testuser');
   * 
   * // 下拉框
   * await FormFillUtil.fillWithRetry(page.locator('#country'), 'China', {
   *   fillAction: async (locator, value) => await locator.selectOption(value),
   *   verifyAction: async (locator, value) => {
   *     const selected = await locator.inputValue();
   *     return selected === value;
   *   }
   * });
   * 
   * // 复选框
   * await FormFillUtil.fillWithRetry(page.locator('#agree'), true, {
   *   fillAction: async (locator, value) => await locator.setChecked(value),
   *   verifyAction: async (locator, value) => {
   *     const isChecked = await locator.isChecked();
   *     return isChecked === value;
   *   }
   * });
   * ```
   */
  static async fillWithRetry<T = string>(
    locator: Locator,
    value: T,
    options: FillOptions<T> = {}
  ): Promise<FillResult<T>> {
    // 合并默认配置
    const config = {
      maxRetries: options.maxRetries ?? 3,
      retryDelay: options.retryDelay ?? 500,
      waitAfterBlur: options.waitAfterBlur ?? 300,
      waitBeforeVerify: options.waitBeforeVerify ?? 200,
      waitForRequests: options.waitForRequests ?? true,
      requestTimeout: options.requestTimeout ?? 3000,
      clearOnRetry: options.clearOnRetry ?? true,
      fillAction: options.fillAction ?? null,
      verifyAction: options.verifyAction ?? null,
      debug: options.debug ?? false
    };

    const page = locator.page();
    let lastError: string = '';

    // 日志函数
    const log = (...args: any[]) => {
      if (config.debug) {
        console.log('[FormFillUtil]', ...args);
      }
    };

    // 执行填充尝试
    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        log(`尝试 ${attempt}/${config.maxRetries + 1}: 填充值 "${value}"`);

        // 请求追踪器
        let activeRequests = 0;
        const trackRequest = () => activeRequests++;
        const trackFinish = () => activeRequests--;

        if (config.waitForRequests) {
          page.on('request', trackRequest);
          page.on('requestfinished', trackFinish);
          page.on('requestfailed', trackFinish);
        }

        try {
          // 1. 清空字段（重试时）
          if (attempt > 1 && config.clearOnRetry) {
            log('  - 清空字段');
            // 只有在没有自定义填充函数且值是字符串时才清空
            if (!config.fillAction && typeof value === 'string') {
              await locator.clear();
              await page.waitForTimeout(100);
            }
          }

          // 2. 填充值
          log('  - 填充值');
          if (config.fillAction) {
            // 使用自定义填充函数
            await config.fillAction(locator, value);
          }

          // 4. 等待 blur 后的处理
          log(`  - 等待 ${config.waitAfterBlur}ms`);
          await page.waitForTimeout(config.waitAfterBlur);

          // 5. 等待网络请求完成
          if (config.waitForRequests && activeRequests > 0) {
            log(`  - 等待 ${activeRequests} 个请求完成`);
            const startTime = Date.now();

            while (activeRequests > 0) {
              if (Date.now() - startTime > config.requestTimeout) {
                log(`  - 请求等待超时，剩余 ${activeRequests} 个请求`);
                break;
              }
              await page.waitForTimeout(50);
            }

            log('  - 所有请求已完成');
          }

          // 6. 等待一段时间让 DOM 更新
          log(`  - 等待 DOM 更新 ${config.waitBeforeVerify}ms`);
          await page.waitForTimeout(config.waitBeforeVerify);

          // 7. 验证值
          log('  - 验证填充结果');
          const isValid = await this.verifyFill(
            locator,
            value,
            config.verifyAction
          );

          if (isValid) {
            // 获取最终值
            let finalValue: T | string;
            try {
              if (config.verifyAction) {
                // 如果有自定义验证，尝试获取实际值（可能失败，使用期望值）
                finalValue = value;
              } else {
                finalValue = await locator.inputValue();
              }
            } catch {
              finalValue = value;
            }

            log(`✓ 填充成功（尝试 ${attempt} 次）`);

            return {
              success: true,
              attempts: attempt,
              finalValue: finalValue
            };
          }

          // 验证失败
          let actualValue: any;
          try {
            actualValue = await locator.inputValue();
          } catch {
            actualValue = '(无法获取)';
          }
          lastError = `值不匹配: 期望 "${String(value)}", 实际 "${String(actualValue)}"`;
          log(`  × ${lastError}`);

        } finally {
          // 清理事件监听
          if (config.waitForRequests) {
            page.off('request', trackRequest);
            page.off('requestfinished', trackFinish);
            page.off('requestfailed', trackFinish);
          }
        }

        // 如果还有重试机会，等待后重试
        if (attempt <= config.maxRetries) {
          log(`  - ${config.retryDelay}ms 后重试...`);
          await page.waitForTimeout(config.retryDelay);
        }

      } catch (error: any) {
        lastError = error.message || String(error);
        log(`  × 填充出错: ${lastError}`);

        if (attempt <= config.maxRetries) {
          log(`  - ${config.retryDelay}ms 后重试...`);
          await page.waitForTimeout(config.retryDelay);
        }
      }
    }

    // 所有尝试都失败了
    log(`× 填充失败，已尝试 ${config.maxRetries + 1} 次`);
    const finalValue = await locator.inputValue().catch(() => '');

    return {
      success: false,
      attempts: config.maxRetries + 1,
      finalValue: finalValue,
      error: lastError || '未知错误'
    };
  }

  /**
   * 验证填充是否成功
   */
  private static async verifyFill<T>(
    locator: Locator,
    expectedValue: T,
    verifyAction?: ((locator: Locator, expectedValue: T) => Promise<boolean>) | null
  ): Promise<boolean> {
    // 使用自定义验证器
    if (verifyAction) {
      return await verifyAction(locator, expectedValue);
    }

    // 默认验证：检查输入框的值（仅适用于字符串）
    if (typeof expectedValue === 'string') {
      const actualValue = await locator.inputValue();
      if (actualValue !== expectedValue) {
        return false;
      }

      // 额外检查：字段是否可用（不在 loading 状态）
      const isDisabled = await locator.isDisabled().catch(() => false);
      if (isDisabled) {
        return false;
      }

      return true;
    }

    // 非字符串值必须提供自定义验证函数
    throw new Error('非字符串值必须提供 verifyAction 函数');
  }

  /**
   * 批量填充多个字段（顺序执行）
   * 
   * @example
   * ```typescript
   * const results = await FormFillUtil.fillMultiple([
   *   { locator: page.locator('#username'), value: 'test' },
   *   { locator: page.locator('#email'), value: 'test@example.com' },
   *   { 
   *     locator: page.locator('#country'), 
   *     value: 'China',
   *     options: {
   *       fillAction: async (locator, value) => await locator.selectOption(value)
   *     }
   *   }
   * ], { maxRetries: 2 });
   * 
   * const allSuccess = results.every(r => r.success);
   * ```
   */
  static async fillMultiple<T = string>(
    fields: Array<{ locator: Locator; value: T; options?: FillOptions<T> }>,
    globalOptions?: FillOptions<T>
  ): Promise<FillResult<T>[]> {
    const results: FillResult[] = [];

    for (const field of fields) {
      // 合并全局选项和字段特定选项
      const options = { ...globalOptions, ...field.options };

      const result = await this.fillWithRetry(
        field.locator,
        field.value,
        options
      );

      results.push(result);

      // 如果某个字段填充失败，可以选择中断或继续
      if (!result.success && globalOptions?.debug) {
        console.warn(`字段填充失败: ${result.error}`);
      }
    }

    return results;
  }

  /**
   * 断言式填充（失败会抛出错误）
   * 
   * @example
   * ```typescript
   * // 文本输入框
   * await FormFillUtil.fillAndAssert(page.locator('#username'), 'test');
   * 
   * // 复选框
   * await FormFillUtil.fillAndAssert(page.locator('#agree'), true, {
   *   fillAction: async (locator, value) => await locator.setChecked(value),
   *   verifyAction: async (locator, value) => await locator.isChecked() === value
   * });
   * ```
   */
  static async fillAndAssert<T = string>(
    locator: Locator,
    value: T,
    options?: FillOptions<T>
  ): Promise<void> {
    const result = await this.fillWithRetry(locator, value, options);

    if (!result.success) {
      throw new Error(
        `表单填充失败: ${result.error}\n` +
        `尝试次数: ${result.attempts}\n` +
        `期望值: "${value}"\n` +
        `实际值: "${result.finalValue}"`
      );
    }
  }
}
