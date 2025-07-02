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
    curl?: string;
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
    aiService?: {
        url: string;
        apiKey?: string;
        model?: string;
        headers?: Record<string, string>;
        systemPrompt?: string;
        temperature?: number;
        maxTokens?: number;
        timeout?: number;
    };
    queries?: Record<string, HttpRequest & {
        systemPrompt?: string;
        aiService?: any;
    }>;
}
export interface AnalysisResult {
    success: boolean;
    extractedData: ExtractedData;
    sessionId?: string;
    requestId?: string;
    responseId?: string;
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
export interface SessionInfo {
    id: string;
    created: string;
    lastUpdated: string;
    description?: string;
    createdBy?: string;
    requestCount: number;
    lastPrompt?: string;
    lastResponseId?: string;
    dataChunks?: number;
    lastAggregateId?: string;
    lastAggregateTimestamp?: string;
    lastReportId?: string;
    lastReportTimestamp?: string;
}
export interface RequestInfo {
    id: string;
    timestamp: string;
    prompt?: string;
    request?: any;
    queryName?: string;
    curl?: string;
}
export interface ResponseInfo {
    id: string;
    timestamp: string;
    type: string;
    dataSize?: number;
    dataStructure?: any;
}
export declare function isValidHttpMethod(method: string): boolean;
export declare function isValidHealthStatus(status: string): boolean;
