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
  queries?: Record<string, HttpRequest>;
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
}

// 类型守卫函数
export function isValidHttpMethod(method: string): boolean {
  return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
} 