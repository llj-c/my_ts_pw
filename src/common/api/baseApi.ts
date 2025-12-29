import type { APIRequestContext, APIResponse } from '@playwright/test';
import envConfig from '../config/env';

/**
 * API 请求基础类
 * 封装常用的 HTTP 请求方法，提供统一的请求接口
 */
export class BaseApi {
    protected request: APIRequestContext;
    protected baseURL: string;

    constructor(request: APIRequestContext, baseURL?: string) {
        this.request = request;
        // 优先使用传入的 baseURL，否则使用环境配置中的 OPS_BASE_URL
        this.baseURL = baseURL || envConfig.OPS_BASE_URL || '';
    }

    /**
     * 构建完整的 URL
     */
    protected buildUrl(endpoint: string): string {
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
            return endpoint;
        }
        return `${this.baseURL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    }

    /**
     * GET 请求
     */
    async get<T = any>(
        endpoint: string,
        options?: {
            headers?: Record<string, string>;
            params?: Record<string, string | number | boolean>;
        }
    ): Promise<APIResponse> {
        const url = this.buildUrl(endpoint);
        const urlObj = new URL(url);
        
        // 添加查询参数
        if (options?.params) {
            Object.entries(options.params).forEach(([key, value]) => {
                urlObj.searchParams.append(key, String(value));
            });
        }

        return await this.request.get(urlObj.toString(), {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });
    }

    /**
     * POST 请求
     */
    async post<T = any>(
        endpoint: string,
        data?: any,
        options?: {
            headers?: Record<string, string>;
        }
    ): Promise<APIResponse> {
        const url = this.buildUrl(endpoint);
        return await this.request.post(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            data: data,
        });
    }

    /**
     * PUT 请求
     */
    async put<T = any>(
        endpoint: string,
        data?: any,
        options?: {
            headers?: Record<string, string>;
        }
    ): Promise<APIResponse> {
        const url = this.buildUrl(endpoint);
        return await this.request.put(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            data: data,
        });
    }

    /**
     * PATCH 请求
     */
    async patch<T = any>(
        endpoint: string,
        data?: any,
        options?: {
            headers?: Record<string, string>;
        }
    ): Promise<APIResponse> {
        const url = this.buildUrl(endpoint);
        return await this.request.patch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            data: data,
        });
    }

    /**
     * DELETE 请求
     */
    async delete<T = any>(
        endpoint: string,
        options?: {
            headers?: Record<string, string>;
        }
    ): Promise<APIResponse> {
        const url = this.buildUrl(endpoint);
        return await this.request.delete(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });
    }

    /**
     * 设置认证 token
     */
    setAuthToken(token: string): void {
        // 这个方法可以用于设置全局的认证 token
        // 实际使用时可以通过继承或组合的方式来实现
    }
}

