/**
 * Grafana MCP 分析器类型定义
 */

// HTTP相关类型
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

// 数据提取相关
export interface ExtractedData {
  type: string;
  hasData: boolean;
  status: string;
  timestamp: string;
  data: any;
  metadata?: Record<string, any>;
}

// 健康检查
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'warning';
  timestamp: string;
  message?: string;
  details?: Record<string, any>;
}

// 配置相关
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

// 分析结果
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

// 会话信息
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

// 请求信息
export interface RequestInfo {
  id: string;
  timestamp: string;
  prompt?: string;
  request?: any;
  queryName?: string;
  curl?: string;
}

// 响应信息
export interface ResponseInfo {
  id: string;
  timestamp: string;
  type: string;
  dataSize?: number;
  dataStructure?: any;
}

// 类型守卫函数
export function isValidHttpMethod(method: string): boolean {
  return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

export function isValidHealthStatus(status: string): boolean {
  return ['healthy', 'unhealthy', 'warning'].includes(status);
} 