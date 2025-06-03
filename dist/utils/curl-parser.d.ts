import type { HttpRequest } from '../types/index.js';
/**
 * curl命令解析器
 * 将curl命令字符串转换为HttpRequest对象
 */
export declare function parseCurlCommand(curlCommand: string): HttpRequest;
/**
 * 验证curl命令格式
 */
export declare function validateCurlCommand(curlCommand: string): {
    valid: boolean;
    error?: string;
};
