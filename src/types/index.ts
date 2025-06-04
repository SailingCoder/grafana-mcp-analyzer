/**
 * Grafana MCP 分析器类型定义
 */

// HTTP相关类型
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

// 数据提取相关
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

// 健康检查
export type HealthStatusType = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthStatus {
  status: HealthStatusType;
  timestamp: string;
  response?: number;
  data?: any;
  error?: string;
  details?: Record<string, any>;
}

// 配置相关
export interface QueryConfig {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  systemPrompt?: string;
  aiService?: {
    url: string;
    headers?: Record<string, string>;
    bodyTemplate?: any;
    responseParser?: { contentPath: string };
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

// 分析结果
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

// 类型守卫函数
export function isValidHttpMethod(method: string): method is HttpMethod {
  return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
}

export function isValidHealthStatus(status: string): status is HealthStatusType {
  return ['healthy', 'degraded', 'unhealthy'].includes(status);
} 