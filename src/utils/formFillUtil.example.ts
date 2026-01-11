/**
 * FormFillUtil 使用示例
 * 
 * 本文件展示了如何使用 FormFillUtil 工具类来处理表单填充场景
 */

import { test, expect } from '@playwright/test';
import { FormFillUtil } from './formFillUtil';

// ==================== 示例 1: 基础使用 ====================
test('示例1: 基础使用 - 默认配置', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  // 使用默认配置：重试 3 次，每次间隔 500ms
  await FormFillUtil.fillAndAssert(
    page.locator('#username'),
    'testuser'
  );
  
  await FormFillUtil.fillAndAssert(
    page.locator('#email'),
    'test@example.com'
  );
});

// ==================== 示例 2: 自定义重试配置 ====================
test('示例2: 慢网络环境 - 增加重试次数和延迟', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  // 重试 5 次，每次间隔 1 秒，blur 后等待 500ms
  await FormFillUtil.fillAndAssert(
    page.locator('#address'),
    '北京市朝阳区',
    {
      maxRetries: 5,
      retryDelay: 1000,
      waitAfterBlur: 500
    }
  );
});

// ==================== 示例 3: 获取填充结果（不抛出错误） ====================
test('示例3: 容错处理 - 获取填充结果', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  // 使用 fillWithRetry 获取详细结果
  const result = await FormFillUtil.fillWithRetry(
    page.locator('#optional-field'),
    'some value',
    { maxRetries: 2 }
  );
  
  if (result.success) {
    console.log(`✓ 填充成功，尝试了 ${result.attempts} 次`);
    console.log(`最终值: ${result.finalValue}`);
  } else {
    console.warn(`× 填充失败: ${result.error}`);
    console.warn(`尝试了 ${result.attempts} 次`);
    // 继续执行其他逻辑，不中断测试
  }
});

// ==================== 示例 4: 批量填充表单 ====================
test('示例4: 批量填充 - 一次性处理多个字段', async ({ page }) => {
  await page.goto('https://example.com/registration');
  
  // 批量填充多个字段
  const results = await FormFillUtil.fillMultiple([
    { locator: page.locator('#username'), value: 'testuser' },
    { locator: page.locator('#email'), value: 'test@example.com' },
    { locator: page.locator('#phone'), value: '13800138000' },
    { 
      locator: page.locator('#address'), 
      value: '北京市',
      options: { maxRetries: 5 }  // 单独为这个字段配置更多重试次数
    }
  ], {
    maxRetries: 3,  // 全局配置
    debug: true     // 启用调试日志
  });
  
  // 检查是否全部成功
  const allSuccess = results.every(r => r.success);
  
  if (!allSuccess) {
    const failed = results
      .map((r, i) => ({ index: i, result: r }))
      .filter(item => !item.result.success);
    
    console.error('部分字段填充失败:');
    failed.forEach(item => {
      console.error(`  字段 ${item.index}: ${item.result.error}`);
    });
  }
  
  expect(allSuccess).toBe(true);
});

// ==================== 示例 5: 快速填充模式 ====================
test('示例5: 快速填充 - 不等待网络请求', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  // 适用于不触发 API 调用的字段，或者纯前端验证的字段
  await FormFillUtil.fillAndAssert(
    page.locator('#name'),
    'John Doe',
    {
      waitForRequests: false,  // 不等待网络请求
      waitAfterBlur: 0,        // 不等待 blur 处理
      maxRetries: 1            // 只尝试一次
    }
  );
});

// ==================== 示例 6: 自定义验证逻辑 ====================
test('示例6: 自定义验证 - 复杂的验证场景', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  // 自定义验证：确保值正确 + 没有错误提示
  await FormFillUtil.fillAndAssert(
    page.locator('#price'),
    '99.99',
    {
      customValidator: async (locator, expectedValue) => {
        // 检查输入框的值
        const value = await locator.inputValue();
        if (value !== expectedValue) {
          return false;
        }
        
        // 检查是否有错误提示
        const errorLocator = locator.locator('xpath=../span.error');
        const hasError = await errorLocator.count() > 0;
        if (hasError) {
          return false;
        }
        
        // 检查字段是否启用
        const isDisabled = await locator.isDisabled();
        if (isDisabled) {
          return false;
        }
        
        return true;
      }
    }
  );
});

// ==================== 示例 7: 调试模式 ====================
test('示例7: 调试模式 - 查看详细填充过程', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  // 启用 debug 日志，输出详细的填充过程
  await FormFillUtil.fillAndAssert(
    page.locator('#problematic-field'),
    'test value',
    {
      debug: true,
      maxRetries: 3
    }
  );
  
  // 控制台输出类似：
  // [FormFillUtil] 尝试 1/4: 填充值 "test value"
  // [FormFillUtil]   - 填充值
  // [FormFillUtil]   - 触发 blur
  // [FormFillUtil]   - 等待 300ms
  // [FormFillUtil]   - 等待 2 个请求完成
  // [FormFillUtil]   - 所有请求已完成
  // [FormFillUtil]   - 等待 DOM 更新 200ms
  // [FormFillUtil]   - 验证填充结果
  // [FormFillUtil] ✓ 填充成功（尝试 1 次）
});

// ==================== 示例 8: 处理动态表单 ====================
test('示例8: 动态表单 - 结合 Playwright 的其他 API', async ({ page }) => {
  await page.goto('https://example.com/dynamic-form');
  
  // 先点击添加按钮，等待新字段出现
  await page.click('#add-field-button');
  await page.waitForSelector('#new-field');
  
  // 然后安全填充新字段
  await FormFillUtil.fillAndAssert(
    page.locator('#new-field'),
    'dynamic value',
    { maxRetries: 5 }  // 动态字段可能需要更多重试
  );
});

// ==================== 示例 9: 真实场景 - 用户注册表单 ====================
test('示例9: 真实场景 - 完整的用户注册流程', async ({ page }) => {
  await page.goto('https://example.com/register');
  
  // 填充注册表单（每个字段 blur 时都会触发后端验证）
  const results = await FormFillUtil.fillMultiple([
    { 
      locator: page.locator('#username'), 
      value: 'testuser123',
      options: { 
        maxRetries: 5,  // 用户名验证可能较慢
        waitAfterBlur: 500 
      }
    },
    { 
      locator: page.locator('#email'), 
      value: 'test@example.com',
      options: { 
        maxRetries: 5,  // 邮箱验证可能较慢
        waitAfterBlur: 500 
      }
    },
    { 
      locator: page.locator('#password'), 
      value: 'SecurePass123!',
      options: { waitAfterBlur: 200 }  // 密码验证通常较快
    },
    { 
      locator: page.locator('#password-confirm'), 
      value: 'SecurePass123!',
      options: { waitAfterBlur: 200 }
    },
    { 
      locator: page.locator('#phone'), 
      value: '13800138000',
      options: { 
        maxRetries: 5,
        waitAfterBlur: 500 
      }
    }
  ], {
    debug: true  // 开启调试，方便排查问题
  });
  
  // 验证所有字段都填充成功
  const allSuccess = results.every(r => r.success);
  expect(allSuccess).toBe(true);
  
  // 提交表单
  await page.click('#submit-button');
  
  // 等待提交成功
  await expect(page.locator('.success-message')).toBeVisible();
});

// ==================== 示例 10: 错误处理 ====================
test('示例10: 错误处理 - 捕获和处理填充失败', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  try {
    // 尝试填充一个可能失败的字段
    await FormFillUtil.fillAndAssert(
      page.locator('#difficult-field'),
      'test value',
      { maxRetries: 3 }
    );
  } catch (error: any) {
    // 填充失败，进行错误处理
    console.error('填充失败，原因:', error.message);
    
    // 可以尝试其他操作，比如刷新页面重试
    await page.reload();
    
    // 或者使用更宽松的配置再试一次
    await FormFillUtil.fillAndAssert(
      page.locator('#difficult-field'),
      'test value',
      {
        maxRetries: 10,
        retryDelay: 1000,
        waitAfterBlur: 1000,
        waitForRequests: false  // 不等待网络请求
      }
    );
  }
});

// ==================== 示例 11: 下拉框（Select） ====================
test('示例11: 下拉框 - 自定义填充和验证', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  // 填充下拉框
  await FormFillUtil.fillAndAssert(
    page.locator('#country'),
    'China',
    {
      fillAction: async (locator, value) => {
        // 使用 selectOption 方法
        await locator.selectOption(value);
      },
      verifyAction: async (locator, expectedValue) => {
        // 验证选中的值
        const selectedValue = await locator.inputValue();
        return selectedValue === expectedValue;
      },
      maxRetries: 3
    }
  );
});

// ==================== 示例 12: 复选框（Checkbox） ====================
test('示例12: 复选框 - 布尔值填充', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  // 勾选复选框
  await FormFillUtil.fillAndAssert(
    page.locator('#agree'),
    true,
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
        const isChecked = await locator.isChecked();
        return isChecked === expectedValue;
      }
    }
  );
});

// ==================== 示例 13: 单选框（Radio） ====================
test('示例13: 单选框 - 选择特定选项', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  // 选择单选框
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
        const isChecked = await locator.isChecked();
        return isChecked === expectedValue;
      }
    }
  );
});

// ==================== 示例 14: 富文本编辑器 ====================
test('示例14: 富文本编辑器 - contenteditable', async ({ page }) => {
  await page.goto('https://example.com/editor');
  
  const content = '这是富文本内容';
  
  await FormFillUtil.fillAndAssert(
    page.locator('[contenteditable="true"]'),
    content,
    {
      fillAction: async (locator, value) => {
        // 点击编辑器
        await locator.click();
        // 清空内容
        await locator.evaluate(el => el.textContent = '');
        // 输入新内容
        await locator.fill(value);
      },
      verifyAction: async (locator, expectedValue) => {
        // 获取文本内容
        const text = await locator.textContent();
        return text?.trim() === expectedValue;
      },
      maxRetries: 5,
      waitAfterBlur: 500
    }
  );
});

// ==================== 示例 15: 日期选择器 ====================
test('示例15: 日期选择器 - input[type="date"]', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  await FormFillUtil.fillAndAssert(
    page.locator('#birthdate'),
    '2000-01-01',
    {
      fillAction: async (locator, value) => {
        // 日期输入框可以直接 fill
        await locator.fill(value);
      },
      verifyAction: async (locator, expectedValue) => {
        const value = await locator.inputValue();
        return value === expectedValue;
      }
    }
  );
});

// ==================== 示例 16: 文件上传 ====================
test('示例16: 文件上传 - input[type="file"]', async ({ page }) => {
  await page.goto('https://example.com/upload');
  
  const filePath = './test-file.txt';
  
  await FormFillUtil.fillAndAssert(
    page.locator('#file-upload'),
    filePath,
    {
      fillAction: async (locator, value) => {
        await locator.setInputFiles(value);
      },
      verifyAction: async (locator, expectedValue) => {
        // 验证文件是否已选择
        const files = await locator.evaluate((el: HTMLInputElement) => {
          return el.files ? el.files.length > 0 : false;
        });
        return files;
      },
      waitForRequests: true,  // 等待可能的文件上传请求
      maxRetries: 3
    }
  );
});

// ==================== 示例 17: 自定义组件（React Select 等） ====================
test('示例17: 自定义下拉组件 - React Select', async ({ page }) => {
  await page.goto('https://example.com/advanced-form');
  
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
        // 验证选中的值
        const selectedText = await locator
          .locator('.react-select__single-value')
          .textContent();
        return selectedText?.trim() === expectedValue;
      },
      maxRetries: 5,
      waitAfterBlur: 500
    }
  );
});

// ==================== 示例 18: 批量处理不同类型的字段 ====================
test('示例18: 混合表单 - 各种类型的字段', async ({ page }) => {
  await page.goto('https://example.com/mixed-form');
  
  const results = await FormFillUtil.fillMultiple([
    // 文本输入
    { 
      locator: page.locator('#username'), 
      value: 'testuser'
    },
    // 邮箱输入
    { 
      locator: page.locator('#email'), 
      value: 'test@example.com'
    },
    // 下拉框
    { 
      locator: page.locator('#country'),
      value: 'China',
      options: {
        fillAction: async (locator, value) => await locator.selectOption(value),
        verifyAction: async (locator, value) => {
          const selected = await locator.inputValue();
          return selected === value;
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
          const checked = await locator.isChecked();
          return checked === value;
        }
      }
    }
  ], {
    maxRetries: 3,
    debug: true
  });
  
  // 验证所有字段都成功
  const allSuccess = results.every(r => r.success);
  expect(allSuccess).toBe(true);
});
