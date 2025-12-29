import type { APIRequestContext } from '@playwright/test';
import { BaseApi } from './baseApi';
import { AuthApi } from './authApi';

/**
 * API 客户端工厂类
 * 用于创建配置好的 API 请求实例
 */
export class ApiClient {
    /**
     * 创建基础 API 客户端
     */
    static create(request: APIRequestContext, baseURL?: string): BaseApi {
        return new BaseApi(request, baseURL);
    }

    /**
     * 创建带认证的 API 客户端
     */
    static createWithAuth(
        request: APIRequestContext,
        baseURL?: string
    ): AuthApi {
        return new AuthApi(request, baseURL);
    }
}

