# FormFillUtil 使用指南

## 概述

`FormFillUtil` 是一个强大的表单填充工具类，专门解决 Playwright 自动化测试中的表单填充稳定性问题。

### 核心特性

- ✅ **自动重试机制** - 可配置重试次数和延迟
- ✅ **智能等待** - 自动追踪网络请求完成
- ✅ **自动验证** - 确保值真正填充成功
- ✅ **自定义填充方法** - 支持各种类型的表单元素
- ✅ **自定义验证方法** - 灵活的验证逻辑
- ✅ **类型安全** - 完整的 TypeScript 泛型支持

## 适用场景

### 问题场景

在 Playwright 自动化测试中，经常遇到以下问题：

1. **表单字段 blur 触发后端验证**：填充一个字段后，blur 事件会触发 API 请求保存数据
2. **网络延迟或设备性能问题**：如果立即填充下一个字段，上一个字段的值可能还没保存成功
3. **值没有真正填充上去**：由于异步更新，fill() 方法执行完成不代表 DOM 已更新

### 解决方案

`FormFillUtil` 通过以下方式解决：

- 追踪网络请求，等待请求完成
- 验证值是否真正填充成功
- 自动重试失败的操作
- 支持自定义填充和验证逻辑

## 基础使用

### 1. 文本输入框（最简单）

```typescript
import { FormFillUtil } from '@/utils/formFillUtil';

test('填充用户名', async ({ page }) => {
  await page.goto('/form');
  
  // 默认配置：重试 3 次，自动等待网络请求
  await FormFillUtil.fillAndAssert(
    page.locator('#username'),
    'testuser'
  );
});
```

### 2. 自定义重试配置

```typescript
// 慢网络环境：增加重试次数和延迟
await FormFillUtil.fillAndAssert(
  page.locator('#email'),
  'test@example.com',
  {
    maxRetries: 5,        // 重试 5 次
    retryDelay: 1000,     // 每次间隔 1 秒
    waitAfterBlur: 500    // blur 后等待 500ms
  }
);
```

### 3. 获取填充结果（不抛出错误）

```typescript
// 使用 fillWithRetry 获取详细结果
const result = await FormFillUtil.fillWithRetry(
  page.locator('#optional-field'),
  'some value',
  { maxRetries: 2 }
);

if (result.success) {
  console.log(`✓ 成功，尝试了 ${result.attempts} 次`);
} else {
  console.warn(`× 失败: ${result.error}`);
  // 继续执行其他逻辑
}
```

## 高级用法：自定义填充和验证

### 4. 下拉框（Select）

```typescript
await FormFillUtil.fillAndAssert(
  page.locator('#country'),
  'China',
  {
    // 自定义填充：使用 selectOption
    fillAction: async (locator, value) => {
      await locator.selectOption(value);
    },
    
    // 自定义验证：检查选中的值
    verifyAction: async (locator, expectedValue) => {
      const selectedValue = await locator.inputValue();
      return selectedValue === expectedValue;
    },
    
    maxRetries: 3
  }
);
```

### 5. 复选框（Checkbox）

```typescript
// 勾选复选框
await FormFillUtil.fillAndAssert(
  page.locator('#agree'),
  true,  // 注意：这里传布尔值
  {
    fillAction: async (locator, value) => {
      await locator.setChecked(value);
    },
    
    verifyAction: async (locator, expectedValue) => {
      const isChecked = await locator.isChecked();
      return isChecked === expectedValue;
    }
  }
);

// 取消勾选
await FormFillUtil.fillAndAssert(
  page.locator('#newsletter'),
  false,
  {
    fillAction: async (locator, value) => {
      await locator.setChecked(value);
    },
    verifyAction: async (locator, expectedValue) => {
      return await locator.isChecked() === expectedValue;
    }
  }
);
```

### 6. 单选框（Radio）

```typescript
await FormFillUtil.fillAndAssert(
  page.locator('input[name="gender"][value="male"]'),
  true,
  {
    fillAction: async (locator, value) => {
      if (value) {
        await locator.check();
      }
    },
    
    verifyAction: async (locator, expectedValue) => {
      return await locator.isChecked() === expectedValue;
    }
  }
);
```

### 7. 富文本编辑器

```typescript
const content = '这是富文本内容';

await FormFillUtil.fillAndAssert(
  page.locator('[contenteditable="true"]'),
  content,
  {
    fillAction: async (locator, value) => {
      await locator.click();
      await locator.evaluate(el => el.textContent = '');
      await locator.fill(value);
    },
    
    verifyAction: async (locator, expectedValue) => {
      const text = await locator.textContent();
      return text?.trim() === expectedValue;
    },
    
    maxRetries: 5,
    waitAfterBlur: 500
  }
);
```

### 8. 文件上传

```typescript
await FormFillUtil.fillAndAssert(
  page.locator('#file-upload'),
  './test-file.txt',
  {
    fillAction: async (locator, value) => {
      await locator.setInputFiles(value);
    },
    
    verifyAction: async (locator, expectedValue) => {
      const hasFiles = await locator.evaluate((el: HTMLInputElement) => {
        return el.files ? el.files.length > 0 : false;
      });
      return hasFiles;
    },
    
    waitForRequests: true,
    maxRetries: 3
  }
);
```

### 9. 自定义组件（React Select 等）

```typescript
await FormFillUtil.fillAndAssert(
  page.locator('.react-select__control'),
  'Option 1',
  {
    fillAction: async (locator, value) => {
      // 点击打开下拉框
      await locator.click();
      // 等待选项出现
      await page.waitForSelector('.react-select__menu');
      // 点击对应选项
      await page.locator(`.react-select__option:has-text("${value}")`).click();
    },
    
    verifyAction: async (locator, expectedValue) => {
      const selectedText = await locator
        .locator('.react-select__single-value')
        .textContent();
      return selectedText?.trim() === expectedValue;
    },
    
    maxRetries: 5,
    waitAfterBlur: 500
  }
);
```

## 批量填充

### 10. 批量填充多个字段

```typescript
const results = await FormFillUtil.fillMultiple([
  { 
    locator: page.locator('#username'), 
    value: 'testuser' 
  },
  { 
    locator: page.locator('#email'), 
    value: 'test@example.com' 
  },
  { 
    locator: page.locator('#phone'), 
    value: '13800138000' 
  }
], {
  maxRetries: 3,  // 全局配置
  debug: true     // 启用调试日志
});

// 检查是否全部成功
const allSuccess = results.every(r => r.success);
expect(allSuccess).toBe(true);
```

### 11. 混合表单（不同类型的字段）

```typescript
const results = await FormFillUtil.fillMultiple([
  // 文本输入
  { 
    locator: page.locator('#username'), 
    value: 'testuser'
  },
  
  // 下拉框
  { 
    locator: page.locator('#country'),
    value: 'China',
    options: {
      fillAction: async (locator, value) => await locator.selectOption(value),
      verifyAction: async (locator, value) => {
        return await locator.inputValue() === value;
      }
    }
  },
  
  // 复选框
  { 
    locator: page.locator('#agree'),
    value: true,
    options: {
      fillAction: async (locator, value) => await locator.setChecked(value),
      verifyAction: async (locator, value) => {
        return await locator.isChecked() === value;
      }
    }
  }
], {
  maxRetries: 3,
  debug: true
});
```

## 配置选项详解

### FillOptions 接口

```typescript
interface FillOptions<T = string> {
  /** 最大重试次数，默认 3 */
  maxRetries?: number;
  
  /** 每次重试之间的延迟（毫秒），默认 500 */
  retryDelay?: number;
  
  /** blur 后等待时间（毫秒），默认 300 */
  waitAfterBlur?: number;
  
  /** 值验证前的等待时间（毫秒），默认 200 */
  waitBeforeVerify?: number;
  
  /** 是否等待网络请求完成，默认 true */
  waitForRequests?: boolean;
  
  /** 等待请求完成的最大时间（毫秒），默认 3000 */
  requestTimeout?: number;
  
  /** 是否在失败时清空字段后重试，默认 true */
  clearOnRetry?: boolean;
  
  /** 自定义填充函数 */
  fillAction?: (locator: Locator, value: T) => Promise<void>;
  
  /** 自定义验证函数 */
  verifyAction?: (locator: Locator, expectedValue: T) => Promise<boolean>;
  
  /** 是否启用调试日志，默认 false */
  debug?: boolean;
}
```

### 配置建议

#### 快速填充（不触发 API 的字段）

```typescript
{
  waitForRequests: false,
  waitAfterBlur: 0,
  maxRetries: 1
}
```

#### 慢网络环境

```typescript
{
  maxRetries: 5,
  retryDelay: 1000,
  waitAfterBlur: 500,
  requestTimeout: 5000
}
```

#### 复杂验证场景

```typescript
{
  maxRetries: 5,
  waitAfterBlur: 500,
  waitBeforeVerify: 300,
  debug: true  // 启用日志排查问题
}
```

## 调试技巧

### 启用调试日志

```typescript
await FormFillUtil.fillAndAssert(
  page.locator('#field'),
  'value',
  { debug: true }
);

// 输出类似：
// [FormFillUtil] 尝试 1/4: 填充值 "value"
// [FormFillUtil]   - 填充值
// [FormFillUtil]   - 触发 blur
// [FormFillUtil]   - 等待 300ms
// [FormFillUtil]   - 等待 2 个请求完成
// [FormFillUtil]   - 所有请求已完成
// [FormFillUtil]   - 验证填充结果
// [FormFillUtil] ✓ 填充成功（尝试 1 次）
```

### 错误处理

```typescript
try {
  await FormFillUtil.fillAndAssert(
    page.locator('#field'),
    'value',
    { maxRetries: 3 }
  );
} catch (error: any) {
  console.error('填充失败:', error.message);
  // 错误信息包含：
  // - 错误原因
  // - 尝试次数
  // - 期望值
  // - 实际值
}
```

## 最佳实践

### 1. 为不同场景选择合适的方法

- **简单场景** → `fillAndAssert()` - 失败抛出错误
- **需要容错** → `fillWithRetry()` - 返回结果对象
- **多个字段** → `fillMultiple()` - 批量处理

### 2. 合理设置重试次数

- 稳定环境：1-3 次
- 测试环境：3-5 次
- 慢网络：5-10 次

### 3. 使用调试模式排查问题

开发时启用 `debug: true`，生产环境关闭。

### 4. 自定义填充和验证

对于非标准输入框（自定义组件、富文本等），务必提供 `fillAction` 和 `verifyAction`。

### 5. 批量操作时注意顺序

`fillMultiple()` 是顺序执行的，确保字段填充顺序符合业务逻辑。

## API 参考

### FormFillUtil.fillWithRetry()

返回填充结果对象，不抛出错误。

```typescript
static async fillWithRetry<T = string>(
  locator: Locator,
  value: T,
  options?: FillOptions<T>
): Promise<FillResult<T>>
```

### FormFillUtil.fillAndAssert()

失败时抛出错误，适合测试断言。

```typescript
static async fillAndAssert<T = string>(
  locator: Locator,
  value: T,
  options?: FillOptions<T>
): Promise<void>
```

### FormFillUtil.fillMultiple()

批量填充多个字段。

```typescript
static async fillMultiple<T = string>(
  fields: Array<{ locator: Locator; value: T; options?: FillOptions<T> }>,
  globalOptions?: FillOptions<T>
): Promise<FillResult<T>[]>
```

## 常见问题

### Q: 为什么需要自定义 fillAction？

A: 不同类型的表单元素有不同的操作方法：
- 文本框：`fill()`
- 下拉框：`selectOption()`
- 复选框：`setChecked()`
- 文件上传：`setInputFiles()`

### Q: verifyAction 什么时候必须提供？

A: 当值不是字符串类型（如 boolean、number、对象）时，必须提供自定义验证方法。

### Q: 如何处理动态加载的字段？

A: 先等待字段出现，再使用工具填充：

```typescript
await page.waitForSelector('#dynamic-field');
await FormFillUtil.fillAndAssert(
  page.locator('#dynamic-field'),
  'value'
);
```

### Q: 能否禁用网络等待以提高速度？

A: 可以，但仅适用于不触发 API 的字段：

```typescript
{
  waitForRequests: false,
  waitAfterBlur: 0
}
```

## 总结

`FormFillUtil` 通过以下核心功能解决表单填充稳定性问题：

1. ✅ **自动重试** - 处理网络波动和性能问题
2. ✅ **智能等待** - 追踪网络请求，确保操作完成
3. ✅ **自动验证** - 确保值真正填充成功
4. ✅ **灵活扩展** - 支持各种类型的表单元素

使用此工具可以显著提高 Playwright 自动化测试的稳定性和可维护性。
