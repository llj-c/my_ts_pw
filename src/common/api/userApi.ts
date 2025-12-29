import type { APIRequestContext, APIResponse } from '@playwright/test';
import { AuthApi } from './authApi';

/**
 * 用户 API 客户端
 * 继承 AuthApi，提供用户相关的 API 方法
 */
export class UserApi extends AuthApi {
    constructor(request: APIRequestContext, baseURL?: string) {
        super(request, baseURL);
    }

    /**
     * 根据 ID 获取用户信息
     */
    async getUserById(userId: number): Promise<APIResponse> {
        return await this.get(`/api/users/${userId}`);
    }

    /**
     * 获取用户列表
     */
    async getUserList(params?: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<APIResponse> {
        return await this.get('/api/users', { params });
    }

    /**
     * 创建用户
     */
    async createUser(userData: {
        name: string;
        email: string;
        password?: string;
    }): Promise<APIResponse> {
        return await this.post('/api/users', userData);
    }

    /**
     * 更新用户信息
     */
    async updateUser(
        userId: number,
        userData: Partial<{
            name: string;
            email: string;
        }>
    ): Promise<APIResponse> {
        return await this.put(`/api/users/${userId}`, userData);
    }

    /**
     * 删除用户
     */
    async deleteUser(userId: number): Promise<APIResponse> {
        return await this.delete(`/api/users/${userId}`);
    }

    /**
     * 获取当前登录用户信息
     */
    async getCurrentUser(): Promise<APIResponse> {
        return await this.get('/api/user/profile');
    }
}

