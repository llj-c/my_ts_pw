import * as fs from 'fs';
import * as path from 'path';
import { PROJECT_ROOT } from '../pathUtil';

/**
 * 测试数据管理工具
 * 
 * 功能：
 * - 从 JSON/CSV/YAML 文件加载测试数据
 * - 数据模板化：支持变量替换和参数化
 * - 数据验证：检查测试数据的完整性和有效性
 * - 数据缓存：避免重复读取文件
 * 
 * 使用场景：
 * - 数据驱动测试：从外部文件读取测试用例数据
 * - 批量测试：使用同一套数据模板测试多个场景
 * - 环境隔离：不同环境使用不同的测试数据文件
 */

/**
 * 数据验证规则
 */
export interface ValidationRule {
    /** 字段名 */
    field: string;
    /** 验证类型：required(必填), type(类型), range(范围), pattern(正则) */
    type: 'required' | 'type' | 'range' | 'pattern' | 'custom';
    /** 验证参数 */
    params?: any;
    /** 自定义验证函数 */
    validator?: (value: any, data: any) => boolean | string;
    /** 错误消息 */
    message?: string;
}

/**
 * 数据加载选项
 */
export interface LoadOptions {
    /** 是否启用缓存，默认true */
    useCache?: boolean;
    /** 数据文件编码，默认'utf-8' */
    encoding?: BufferEncoding;
    /** 变量替换映射 */
    variables?: Record<string, any>;
    /** 验证规则 */
    validationRules?: ValidationRule[];
}

/**
 * 测试数据管理工具类
 */
export class TestDataUtil {
    private static cache: Map<string, { data: any; timestamp: number }> = new Map();
    private static readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

    /**
     * 清除缓存
     * @param filePath 文件路径，如果不提供则清除所有缓存
     */
    static clearCache(filePath?: string): void {
        if (filePath) {
            const normalizedPath = this.normalizePath(filePath);
            this.cache.delete(normalizedPath);
        } else {
            this.cache.clear();
        }
    }

    /**
     * 规范化文件路径
     */
    private static normalizePath(filePath: string): string {
        if (path.isAbsolute(filePath)) {
            return path.normalize(filePath);
        }
        return path.normalize(path.join(PROJECT_ROOT, filePath));
    }

    /**
     * 检查文件是否存在
     */
    private static fileExists(filePath: string): boolean {
        try {
            return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
        } catch {
            return false;
        }
    }

    /**
     * 从缓存获取数据
     */
    private static getFromCache(filePath: string): any | null {
        const normalizedPath = this.normalizePath(filePath);
        const cached = this.cache.get(normalizedPath);
        
        if (!cached) {
            return null;
        }

        // 检查缓存是否过期
        const now = Date.now();
        if (now - cached.timestamp > this.DEFAULT_CACHE_TTL) {
            this.cache.delete(normalizedPath);
            return null;
        }

        // 检查文件是否被修改
        try {
            const stats = fs.statSync(normalizedPath);
            if (stats.mtimeMs > cached.timestamp) {
                this.cache.delete(normalizedPath);
                return null;
            }
        } catch {
            this.cache.delete(normalizedPath);
            return null;
        }

        return cached.data;
    }

    /**
     * 保存到缓存
     */
    private static saveToCache(filePath: string, data: any): void {
        const normalizedPath = this.normalizePath(filePath);
        this.cache.set(normalizedPath, {
            data: JSON.parse(JSON.stringify(data)), // 深拷贝
            timestamp: Date.now(),
        });
    }

    /**
     * 加载JSON文件
     */
    private static loadJSON(filePath: string, encoding: BufferEncoding = 'utf-8'): any {
        const normalizedPath = this.normalizePath(filePath);
        
        if (!this.fileExists(normalizedPath)) {
            throw new Error(`文件不存在: ${normalizedPath}`);
        }

        try {
            const content = fs.readFileSync(normalizedPath, encoding);
            return JSON.parse(content);
        } catch (error) {
            throw new Error(`读取JSON文件失败: ${normalizedPath}, 错误: ${error}`);
        }
    }

    /**
     * 加载CSV文件
     */
    private static loadCSV(filePath: string, encoding: BufferEncoding = 'utf-8'): any[] {
        const normalizedPath = this.normalizePath(filePath);
        
        if (!this.fileExists(normalizedPath)) {
            throw new Error(`文件不存在: ${normalizedPath}`);
        }

        try {
            const content = fs.readFileSync(normalizedPath, encoding);
            const lines = content.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) {
                return [];
            }

            // 解析表头
            const headers = lines[0].split(',').map(h => h.trim());
            
            // 解析数据行
            const data: any[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                const row: any = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }

            return data;
        } catch (error) {
            throw new Error(`读取CSV文件失败: ${normalizedPath}, 错误: ${error}`);
        }
    }

    /**
     * 加载YAML文件（需要安装 yaml 包）
     */
    private static loadYAML(filePath: string, encoding: BufferEncoding = 'utf-8'): any {
        const normalizedPath = this.normalizePath(filePath);
        
        if (!this.fileExists(normalizedPath)) {
            throw new Error(`文件不存在: ${normalizedPath}`);
        }

        try {
            // 尝试动态导入 yaml 包
            const yaml = require('yaml');
            const content = fs.readFileSync(normalizedPath, encoding);
            return yaml.parse(content);
        } catch (error) {
            throw new Error(
                `读取YAML文件失败: ${normalizedPath}, 错误: ${error}. ` +
                `提示: 如果使用YAML文件，请先安装 yaml 包: npm install yaml`
            );
        }
    }

    /**
     * 替换模板变量
     */
    private static replaceVariables(data: any, variables: Record<string, any>): any {
        if (!variables || Object.keys(variables).length === 0) {
            return data;
        }

        const jsonString = JSON.stringify(data);
        let result = jsonString;

        // 替换变量，支持 ${variable} 格式
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
            result = result.replace(regex, JSON.stringify(value).replace(/^"|"$/g, ''));
        }

        // 处理未替换的变量，保持原样
        result = result.replace(/\$\{[^}]+\}/g, (match) => {
            // 尝试从环境变量获取
            const varName = match.slice(2, -1);
            const envValue = process.env[varName];
            return envValue !== undefined ? envValue : match;
        });

        try {
            return JSON.parse(result);
        } catch {
            // 如果解析失败，尝试递归处理对象
            return this.replaceVariablesRecursive(data, variables);
        }
    }

    /**
     * 递归替换变量
     */
    private static replaceVariablesRecursive(data: any, variables: Record<string, any>): any {
        if (typeof data === 'string') {
            let result = data;
            for (const [key, value] of Object.entries(variables)) {
                const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
                result = result.replace(regex, String(value));
            }
            // 处理环境变量
            result = result.replace(/\$\{([^}]+)\}/g, (match, varName) => {
                return process.env[varName] !== undefined ? process.env[varName]! : match;
            });
            return result;
        }

        if (Array.isArray(data)) {
            return data.map(item => this.replaceVariablesRecursive(item, variables));
        }

        if (data && typeof data === 'object') {
            const result: any = {};
            for (const [key, value] of Object.entries(data)) {
                result[key] = this.replaceVariablesRecursive(value, variables);
            }
            return result;
        }

        return data;
    }

    /**
     * 验证数据
     */
    private static validateData(data: any, rules: ValidationRule[]): void {
        if (!rules || rules.length === 0) {
            return;
        }

        const errors: string[] = [];

        for (const rule of rules) {
            const value = this.getNestedValue(data, rule.field);
            let isValid = true;
            let errorMessage = rule.message || `字段 ${rule.field} 验证失败`;

            switch (rule.type) {
                case 'required':
                    isValid = value !== undefined && value !== null && value !== '';
                    break;

                case 'type':
                    const expectedType = rule.params;
                    if (expectedType === 'string') {
                        isValid = typeof value === 'string';
                    } else if (expectedType === 'number') {
                        isValid = typeof value === 'number' && !isNaN(value);
                    } else if (expectedType === 'boolean') {
                        isValid = typeof value === 'boolean';
                    } else if (expectedType === 'array') {
                        isValid = Array.isArray(value);
                    } else if (expectedType === 'object') {
                        isValid = value !== null && typeof value === 'object' && !Array.isArray(value);
                    }
                    break;

                case 'range':
                    if (typeof value === 'number') {
                        const { min, max } = rule.params || {};
                        if (min !== undefined) isValid = value >= min;
                        if (max !== undefined) isValid = isValid && value <= max;
                    } else if (typeof value === 'string') {
                        const { minLength, maxLength } = rule.params || {};
                        if (minLength !== undefined) isValid = value.length >= minLength;
                        if (maxLength !== undefined) isValid = isValid && value.length <= maxLength;
                    }
                    break;

                case 'pattern':
                    if (typeof value === 'string') {
                        const pattern = rule.params instanceof RegExp ? rule.params : new RegExp(rule.params);
                        isValid = pattern.test(value);
                    }
                    break;

                case 'custom':
                    if (rule.validator) {
                        const result = rule.validator(value, data);
                        if (typeof result === 'boolean') {
                            isValid = result;
                        } else {
                            isValid = false;
                            errorMessage = result;
                        }
                    }
                    break;
            }

            if (!isValid) {
                errors.push(errorMessage);
            }
        }

        if (errors.length > 0) {
            throw new Error(`数据验证失败:\n${errors.join('\n')}`);
        }
    }

    /**
     * 获取嵌套对象的值
     */
    private static getNestedValue(obj: any, path: string): any {
        const keys = path.split('.');
        let value = obj;
        for (const key of keys) {
            if (value === null || value === undefined) {
                return undefined;
            }
            value = value[key];
        }
        return value;
    }

    /**
     * 加载测试数据
     * @param filePath 文件路径（支持相对路径和绝对路径）
     * @param options 加载选项
     * @returns 测试数据
     */
    static load(
        filePath: string,
        options: LoadOptions = {}
    ): any {
        const {
            useCache = true,
            encoding = 'utf-8',
            variables,
            validationRules,
        } = options;

        const normalizedPath = this.normalizePath(filePath);

        // 尝试从缓存获取
        if (useCache) {
            const cached = this.getFromCache(normalizedPath);
            if (cached !== null) {
                return this.replaceVariables(cached, variables || {});
            }
        }

        // 根据文件扩展名选择加载方法
        const ext = path.extname(normalizedPath).toLowerCase();
        let data: any;

        switch (ext) {
            case '.json':
                data = this.loadJSON(normalizedPath, encoding);
                break;
            case '.csv':
                data = this.loadCSV(normalizedPath, encoding);
                break;
            case '.yaml':
            case '.yml':
                data = this.loadYAML(normalizedPath, encoding);
                break;
            default:
                // 默认尝试JSON
                try {
                    data = this.loadJSON(normalizedPath, encoding);
                } catch {
                    throw new Error(`不支持的文件格式: ${ext}，支持格式: .json, .csv, .yaml, .yml`);
                }
        }

        // 替换变量
        if (variables) {
            data = this.replaceVariables(data, variables);
        }

        // 验证数据
        if (validationRules) {
            this.validateData(data, validationRules);
        }

        // 保存到缓存
        if (useCache) {
            this.saveToCache(normalizedPath, data);
        }

        return data;
    }

    /**
     * 保存测试数据到文件
     * @param filePath 文件路径
     * @param data 要保存的数据
     * @param encoding 文件编码，默认'utf-8'
     */
    static save(filePath: string, data: any, encoding: BufferEncoding = 'utf-8'): void {
        const normalizedPath = this.normalizePath(filePath);
        const ext = path.extname(normalizedPath).toLowerCase();

        // 确保目录存在
        const dir = path.dirname(normalizedPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        let content: string;

        switch (ext) {
            case '.json':
                content = JSON.stringify(data, null, 2);
                break;
            case '.csv':
                // 简单的CSV转换（仅支持对象数组）
                if (Array.isArray(data) && data.length > 0) {
                    const headers = Object.keys(data[0]);
                    const rows = data.map(row =>
                        headers.map(header => {
                            const value = row[header];
                            return typeof value === 'string' && value.includes(',')
                                ? `"${value}"`
                                : String(value || '');
                        }).join(',')
                    );
                    content = [headers.join(','), ...rows].join('\n');
                } else {
                    throw new Error('CSV格式仅支持对象数组');
                }
                break;
            case '.yaml':
            case '.yml':
                try {
                    const yaml = require('yaml');
                    content = yaml.stringify(data);
                } catch {
                    throw new Error('保存YAML文件需要安装 yaml 包: npm install yaml');
                }
                break;
            default:
                // 默认使用JSON
                content = JSON.stringify(data, null, 2);
        }

        fs.writeFileSync(normalizedPath, content, encoding);
        
        // 清除缓存
        this.clearCache(normalizedPath);
    }

    /**
     * 检查数据文件是否存在
     * @param filePath 文件路径
     * @returns 是否存在
     */
    static exists(filePath: string): boolean {
        const normalizedPath = this.normalizePath(filePath);
        return this.fileExists(normalizedPath);
    }
}

// 导出单例实例，方便直接使用
export const testDataUtil = new TestDataUtil();

// 导出所有静态方法作为函数
export const {
    load,
    save,
    exists,
    clearCache,
} = TestDataUtil;