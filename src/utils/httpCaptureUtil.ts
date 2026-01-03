import type { Page, Response, Request } from '@playwright/test';

/**
 * 捕获的请求信息
 */
export type CapturedRequest = {
    /** 完整的请求 URL */
    url: string;
    /** 请求方法 (GET, POST, PUT, DELETE 等) */
    method: string;
    /** 请求头 */
    headers: Record<string, string>;
    /** URL 查询参数 */
    queryParams: Record<string, string>;
    /** 请求体 (如果是 JSON, 会自动解析) */
    postData: string | object | null;
    /** 原始请求对象 */
    request: Request;
};

/**
 * 捕获的响应信息
 */
export type CapturedResponse = {
    /** 响应状态码 */
    status: number;
    /** 响应状态文本 */
    statusText: string;
    /** 响应头 */
    headers: Record<string, string>;
    /** 响应体 (如果是 JSON, 会自动解析) */
    body: string | object | null;
    /** 原始响应对象 */
    response: Response;
};

/**
 * 完整的请求-响应信息
 */
export type CapturedHttpData = {
    /** 请求信息 */
    request: CapturedRequest;
    /** 响应信息 */
    response: CapturedResponse;
};

/**
 * HTTP 请求捕获器
 */
export class HttpCapture {
    private page: Page;
    private urlPattern: string | RegExp;
    private capturedData: CapturedHttpData[] = [];
    private requestHandler: ((request: Request) => void) | null = null;
    private responseHandler: ((response: Response) => Promise<void>) | null = null;
    private isCapturing: boolean = false;

    constructor(page: Page, urlPattern: string | RegExp) {
        this.page = page;
        this.urlPattern = urlPattern;
    }

    /**
     * 开始捕获请求和响应
     */
    async startCapture(): Promise<void> {
        if (this.isCapturing) {
            return;
        }

        this.isCapturing = true;
        this.capturedData = [];

        // 存储请求对象，以便在响应时匹配
        const requestMap = new Map<string, Request>();

        // 监听请求
        this.requestHandler = (request: Request) => {
            const url = request.url();
            const matches = this.matchesPattern(url);

            if (matches) {
                requestMap.set(request.url(), request);
            }
        };

        // 监听响应
        this.responseHandler = async (response: Response) => {
            const url = response.url();
            const matches = this.matchesPattern(url);

            if (matches) {
                const request = response.request();
                const capturedRequest = await this.captureRequest(request);
                const capturedResponse = await this.captureResponse(response);

                this.capturedData.push({
                    request: capturedRequest,
                    response: capturedResponse,
                });
            }
        };

        this.page.on('request', this.requestHandler);
        this.page.on('response', this.responseHandler);
    }

    /**
     * 停止捕获
     */
    stopCapture(): void {
        if (!this.isCapturing) {
            return;
        }

        this.isCapturing = false;

        if (this.requestHandler) {
            this.page.off('request', this.requestHandler);
            this.requestHandler = null;
        }

        if (this.responseHandler) {
            this.page.off('response', this.responseHandler);
            this.responseHandler = null;
        }
    }

    /**
     * 等待并捕获下一个匹配的请求-响应
     * 
     * @param timeout 超时时间 (毫秒), 默认 30000
     * @returns 捕获的请求-响应数据
     */
    async waitForNextCapture(timeout: number = 30000): Promise<CapturedHttpData> {
        const startTime = Date.now();

        // 如果已经有捕获的数据，返回最新的
        if (this.capturedData.length > 0) {
            return this.capturedData[this.capturedData.length - 1]!;
        }

        // 等待新的捕获数据
        while (Date.now() - startTime < timeout) {
            if (this.capturedData.length > 0) {
                return this.capturedData[this.capturedData.length - 1]!;
            }
            await this.page.waitForTimeout(100);
        }

        throw new Error(`等待请求超时 (${timeout}ms), 未捕获到匹配的请求`);
    }

    /**
     * 获取所有捕获的数据
     */
    getAllCapturedData(): CapturedHttpData[] {
        return [...this.capturedData];
    }

    /**
     * 清空捕获的数据
     */
    clear(): void {
        this.capturedData = [];
    }

    /**
     * 检查 URL 是否匹配模式
     */
    private matchesPattern(url: string): boolean {
        if (typeof this.urlPattern === 'string') {
            return url.includes(this.urlPattern);
        } else {
            return this.urlPattern.test(url);
        }
    }

    /**
     * 捕获请求信息
     */
    private async captureRequest(request: Request): Promise<CapturedRequest> {
        const url = request.url();
        const method = request.method();
        const headers = request.headers();

        // 解析 URL 查询参数
        const urlObj = new URL(url);
        const queryParams: Record<string, string> = {};
        urlObj.searchParams.forEach((value, key) => {
            queryParams[key] = value;
        });

        // 获取请求体
        let postData: string | object | null = null;
        const postDataBuffer = request.postDataBuffer();
        if (postDataBuffer) {
            const postDataStr = postDataBuffer.toString('utf-8');
            try {
                postData = JSON.parse(postDataStr);
            } catch {
                postData = postDataStr;
            }
        }

        return {
            url,
            method,
            headers,
            queryParams,
            postData,
            request,
        };
    }

    /**
     * 捕获响应信息
     */
    private async captureResponse(response: Response): Promise<CapturedResponse> {
        const status = response.status();
        const statusText = response.statusText();
        const headers = response.headers();

        // 获取响应体
        let body: string | object | null = null;
        try {
            const contentType = headers['content-type'] || '';
            const bodyText = await response.text();

            if (contentType.includes('application/json')) {
                try {
                    body = JSON.parse(bodyText);
                } catch {
                    body = bodyText;
                }
            } else {
                body = bodyText;
            }
        } catch (error) {
            // 如果响应体已经被读取过，可能会失败
            body = null;
        }

        return {
            status,
            statusText,
            headers,
            body,
            response,
        };
    }
}

/**
 * 快速捕获单个请求-响应的便捷函数
 * 
 * 使用示例:
 * ```typescript
 * // 方式 1: 先设置监听，再点击按钮
 * const capture = await setupHttpCapture(page, '/api/submit');
 * await page.click('button#submit');
 * const data = await capture.waitForNextCapture();
 * 
 * // 方式 2: 使用 Promise 方式
 * const clickPromise = page.click('button#submit');
 * const capture = await setupHttpCapture(page, '/api/submit');
 * await clickPromise;
 * const data = await capture.waitForNextCapture();
 * ```
 * 
 * @param page Playwright 页面实例
 * @param urlPattern URL 路径模式 (字符串或正则表达式)
 * @returns HTTP 捕获器实例
 */
export async function setupHttpCapture(
    page: Page,
    urlPattern: string | RegExp
): Promise<HttpCapture> {
    const capture = new HttpCapture(page, urlPattern);
    await capture.startCapture();
    return capture;
}

/**
 * 等待并捕获单个请求-响应的便捷函数
 * 
 * 使用示例:
 * ```typescript
 * const clickPromise = page.click('button#submit');
 * const data = await waitForHttpCapture(page, '/api/submit');
 * console.log('请求 URL:', data.request.url);
 * console.log('请求参数:', data.request.postData);
 * console.log('响应状态:', data.response.status);
 * console.log('响应数据:', data.response.body);
 * ```
 * 
 * @param page Playwright 页面实例
 * @param urlPattern URL 路径模式 (字符串或正则表达式)
 * @param timeout 超时时间 (毫秒), 默认 30000
 * @returns 捕获的请求-响应数据
 */
export async function waitForHttpCapture(
    page: Page,
    urlPattern: string | RegExp,
    timeout: number = 30000
): Promise<CapturedHttpData> {
    const capture = await setupHttpCapture(page, urlPattern);
    try {
        return await capture.waitForNextCapture(timeout);
    } finally {
        capture.stopCapture();
    }
}

