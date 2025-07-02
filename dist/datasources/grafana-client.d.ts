import type { HttpRequest, HttpResponse, ExtractedData, HealthStatus } from '../types/index.js';
/**
 * 执行Grafana查询
 */
export declare function executeQuery(request: HttpRequest, baseUrl: string): Promise<HttpResponse>;
/**
 * 从HTTP响应中提取数据
 */
export declare function extractData(response: HttpResponse): ExtractedData;
/**
 * 检查健康状态
 */
export declare function checkHealth(url: string, options?: {
    timeout?: number;
    expectedStatus?: number;
}): Promise<HealthStatus>;
/**
 * 批量执行查询（并发执行多个查询）
 *
 * @param requests 查询请求数组
 * @param baseUrl 基础URL
 * @param options 选项配置
 * @returns 批量查询结果
 */
export declare function executeBatchQueries(requests: HttpRequest[], baseUrl?: string, options?: {
    concurrency?: number;
    failFast?: boolean;
}): Promise<HttpResponse[]>;
