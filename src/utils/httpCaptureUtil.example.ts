/**
 * HTTP 请求捕获工具使用示例
 * 
 * 本文件展示了如何使用 httpCaptureUtil 来捕获页面点击按钮后发送的 HTTP 请求和响应
 */

import { test, expect, type Page } from '@playwright/test';
import { setupHttpCapture, waitForHttpCapture, HttpCapture } from './httpCaptureUtil';

/**
 * 示例 1: 使用 waitForHttpCapture 快速捕获单个请求
 * 
 * 这是最简单的方式，适合只需要捕获一次请求的场景
 */
async function example1_simpleCapture(page: Page) {
    // 点击按钮
    const clickPromise = page.click('button#submit');

    // 等待并捕获请求 (URL path 包含 '/api/submit')
    const captured = await waitForHttpCapture(page, '/api/submit');

    // 输出捕获的信息
    console.log('完整 URL:', captured.request.url);
    console.log('请求方法:', captured.request.method);
    console.log('URL 查询参数:', captured.request.queryParams);
    console.log('请求体:', captured.request.postData);
    console.log('响应状态:', captured.response.status);
    console.log('响应数据:', captured.response.body);

    // 验证响应
    expect(captured.response.status).toBe(200);
    expect(captured.response.body).toHaveProperty('success', true);
}

/**
 * 示例 2: 使用 setupHttpCapture 捕获多个请求
 * 
 * 适合需要捕获多个请求，或者需要在点击前设置监听的场景
 */
async function example2_multipleCaptures(page: Page) {
    // 先设置捕获器
    const capture = await setupHttpCapture(page, '/api/data');

    try {
        // 执行多个操作，可能会触发多个请求
        await page.click('button#loadData1');
        const data1 = await capture.waitForNextCapture();

        await page.click('button#loadData2');
        const data2 = await capture.waitForNextCapture();

        // 获取所有捕获的数据
        const allData = capture.getAllCapturedData();
        console.log(`共捕获 ${allData.length} 个请求`);

    } finally {
        // 记得停止捕获
        capture.stopCapture();
    }
}

/**
 * 示例 3: 使用正则表达式匹配 URL
 * 
 * 适合需要匹配更复杂 URL 模式的场景
 */
async function example3_regexPattern(page: Page) {
    // 使用正则表达式匹配所有以 /api/user/ 开头的请求
    const capture = await setupHttpCapture(page, /^https?:\/\/.*\/api\/user\/.*/);

    try {
        await page.click('button#getUserInfo');
        const data = await capture.waitForNextCapture();

        console.log('捕获到的用户相关请求:', data.request.url);
    } finally {
        capture.stopCapture();
    }
}

/**
 * 示例 4: 在测试中使用
 */
test('测试提交表单并验证请求响应', async ({ page }) => {
    await page.goto('https://example.com/form');

    // 填写表单
    await page.fill('input#name', '测试用户');
    await page.fill('input#email', 'test@example.com');

    // 点击提交按钮并捕获请求
    const clickPromise = page.click('button[type="submit"]');
    const captured = await waitForHttpCapture(page, '/api/submit', 10000);

    // 验证请求参数
    expect(captured.request.method).toBe('POST');
    expect(captured.request.postData).toMatchObject({
        name: '测试用户',
        email: 'test@example.com',
    });

    // 验证响应
    expect(captured.response.status).toBe(200);
    expect(captured.response.body).toHaveProperty('success', true);
});

/**
 * 示例 5: 捕获带查询参数的 GET 请求
 */
async function example5_getRequest(page: Page) {
    const clickPromise = page.click('button#search');
    const captured = await waitForHttpCapture(page, '/api/search');

    // GET 请求的参数在 queryParams 中
    console.log('搜索关键词:', captured.request.queryParams.keyword);
    console.log('页码:', captured.request.queryParams.page);

    // 响应数据
    console.log('搜索结果:', captured.response.body);
}

/**
 * 示例 6: 处理请求体为 FormData 的情况
 */
async function example6_formData(page: Page) {
    const clickPromise = page.click('button#upload');
    const captured = await waitForHttpCapture(page, '/api/upload');

    // FormData 的请求体会是字符串格式
    console.log('请求体类型:', typeof captured.request.postData);
    console.log('请求体内容:', captured.request.postData);

    // 如果需要解析 FormData，可能需要额外的处理
}

/**
 * 示例 7: 错误处理和超时
 */
async function example7_errorHandling(page: Page) {
    try {
        const clickPromise = page.click('button#submit');
        // 设置较短的超时时间
        const captured = await waitForHttpCapture(page, '/api/submit', 5000);

        console.log('捕获成功:', captured.request.url);
    } catch (error) {
        if (error instanceof Error && error.message.includes('超时')) {
            console.error('请求超时，可能按钮点击没有触发请求');
        } else {
            throw error;
        }
    }
}

