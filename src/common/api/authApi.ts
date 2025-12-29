import type { APIRequestContext } from '@playwright/test';
import { BaseApi } from './baseApi';
import envConfig from '../config/env';

/**
 * 带认证功能的 API 客户端
 * 继承 BaseApi 并添加认证相关功能
 */
export class AuthApi extends BaseApi {
    private token: string | null = null;

    constructor(request: APIRequestContext, baseURL?: string) {
        super(request, baseURL);
    }

    /**
     * 设置认证 token
     */
    setAuthToken(token: string): void {
        this.token = token;
    }

    /**
     * 获取认证 headers
     */
    protected getAuthHeaders(): Record<string, string> {
        if (this.token) {
            return {
                'Authorization': `Bearer ${this.token}`,
            };
        }
        return {};
    }

    /**
     * 重写 GET 方法，自动添加认证头
     */
    async get<T = any>(
        endpoint: string,
        options?: {
            headers?: Record<string, string>;
            params?: Record<string, string | number | boolean>;
        }
    ) {
        return await super.get(endpoint, {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options?.headers,
            },
        });
    }

    /**
     * 重写 POST 方法，自动添加认证头
     */
    async post<T = any>(
        endpoint: string,
        data?: any,
        options?: {
            headers?: Record<string, string>;
        }
    ) {
        return await super.post(endpoint, data, {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options?.headers,
            },
        });
    }

    /**
     * 重写 PUT 方法，自动添加认证头
     */
    async put<T = any>(
        endpoint: string,
        data?: any,
        options?: {
            headers?: Record<string, string>;
        }
    ) {
        return await super.put(endpoint, data, {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options?.headers,
            },
        });
    }

    /**
     * 重写 PATCH 方法，自动添加认证头
     */
    async patch<T = any>(
        endpoint: string,
        data?: any,
        options?: {
            headers?: Record<string, string>;
        }
    ) {
        return await super.patch(endpoint, data, {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options?.headers,
            },
        });
    }

    /**
     * 重写 DELETE 方法，自动添加认证头
     */
    async delete<T = any>(
        endpoint: string,
        options?: {
            headers?: Record<string, string>;
        }
    ) {
        return await super.delete(endpoint, {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options?.headers,
            },
        });
    }

    /**
     * 登录并获取 token
     * 这是一个示例方法，需要根据实际的登录接口进行调整
     */
    async login(email?: string, password?: string): Promise<string> {
        const loginEmail = email || envConfig.OPS_USER_EMAIL;
        const loginPassword = password || envConfig.OPS_USER_PASSWD;

        const response = await super.post('/api/auth/login', {
            email: loginEmail,
            password: loginPassword,
        });

        if (response.status() !== 200) {
            throw new Error(`登录失败: ${response.status()}`);
        }

        const body = await response.json();
        const token = body.token || body.data?.token;
        
        if (!token) {
            throw new Error('登录响应中未找到 token');
        }

        this.setAuthToken(token);
        return token;
    }

    /**
     * 登出
     */
    async logout(): Promise<void> {
        if (this.token) {
            await super.post('/api/auth/logout');
            this.token = null;
        }
    }
}

