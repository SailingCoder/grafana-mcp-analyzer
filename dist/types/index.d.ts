/**
 * Grafana MCP 分析器类型定义
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export interface HttpRequest {
    url: string;
    method?: HttpMethod;
    headers?: Record<string, string>;
    data?: any;
    params?: Record<string, string>;
    timeout?: number;
    axiosConfig?: any;
    curl?: string;
}
export interface HttpResponse {
    success: boolean;
    data?: any;
    status?: number;
    headers?: Record<string, any>;
    error?: string;
}
export interface ExtractedData {
    hasData: boolean;
    type: string;
    data?: any;
    status?: number;
    timestamp: string;
    error?: string;
    metadata?: {
        responseSize?: number;
        contentType?: string;
    };
}
export type HealthStatusType = 'healthy' | 'degraded' | 'unhealthy';
export interface HealthStatus {
    status: HealthStatusType;
    timestamp: string;
    response?: number;
    data?: any;
    error?: string;
    details?: Record<string, any>;
}
export interface QueryConfig {
    baseUrl?: string;
    defaultHeaders?: Record<string, string>;
    systemPrompt?: string;
    aiService?: {
        url: string;
        headers?: Record<string, string>;
        bodyTemplate?: any;
        responseParser?: {
            contentPath: string;
        };
        timeout?: number;
    };
    queries?: Record<string, HttpRequest & {
        systemPrompt?: string;
        aiService?: any;
    }>;
    healthCheck?: {
        url: string;
    };
}
export interface AnalysisResult {
    success: boolean;
    extractedData: ExtractedData;
    analysis: {
        source: 'external_ai' | 'client_ai';
        content?: string;
        context?: string;
    };
    metadata: {
        timestamp: string;
        queryType: string;
        hasData: boolean;
        aiServiceConfigured: boolean;
    };
}
export declare function isValidHttpMethod(method: string): method is HttpMethod;
export declare function isValidHealthStatus(status: string): status is HealthStatusType;
