/**
 * Grafana MCP 分析器类型定义
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
export interface HttpRequest {
    url: string;
    method?: HttpMethod;
    headers?: Record<string, string>;
    data?: any;
    params?: Record<string, string>;
    timeout?: number;
    axiosConfig?: Record<string, any>;
}
export interface HttpResponse {
    success: boolean;
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    data?: any;
    error?: string;
}
export interface ExtractedData {
    type: string;
    hasData: boolean;
    status: string;
    timestamp: string;
    data: any;
    metadata?: Record<string, any>;
}
export interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'warning';
    timestamp: string;
    message?: string;
    details?: Record<string, any>;
}
export interface QueryConfig {
    baseUrl?: string;
    defaultHeaders?: Record<string, string>;
    healthCheck?: {
        url: string;
        expectedStatus?: number;
    };
    queries?: Record<string, HttpRequest>;
}
export interface SessionInfo {
    id: string;
    created: string;
    lastUpdated: string;
    description?: string;
    createdBy?: string;
    requestCount: number;
    lastPrompt?: string;
    lastResponseId?: string;
}
export declare function isValidHttpMethod(method: string): boolean;
