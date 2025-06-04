/**
 * curl命令解析器
 * 将curl命令转换为HttpRequest对象
 */
import type { HttpRequest } from '../types/index.js';
/**
 * 解析curl命令并转换为HttpRequest对象
 *
 * @param curlCommand curl命令字符串
 * @returns 解析后的HttpRequest对象
 */
export declare function parseCurlCommand(curlCommand: string): HttpRequest;
/**
 * 将HttpRequest对象转换为curl命令（用于调试和日志）
 *
 * @param request HttpRequest对象
 * @param baseUrl 基础URL（可选）
 * @returns curl命令字符串
 */
export declare function httpRequestToCurl(request: HttpRequest, baseUrl?: string): string;
