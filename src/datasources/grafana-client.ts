import axios from 'axios';
import { parseCurlCommand } from './curl-parser.js';
import type { HttpRequest, HttpResponse, ExtractedData, HealthStatus } from '../types/index.js';

const DEFAULT_TIMEOUT = 30000; // 默认请求超时时间（30秒） - 避免长时间等待

/**
 * 执行Grafana查询
 */
export async function executeQuery(request: HttpRequest | { curl: string }, baseUrl: string): Promise<HttpResponse> {
  try {
    let actualRequest: HttpRequest;
    
    // 检查是否是curl格式的查询
    if ('curl' in request) {
      actualRequest = parseCurlCommand(request.curl);
    } else {
      actualRequest = request;
    }
    
    // 确保URL存在
    if (!actualRequest.url) {
      throw new Error('缺少URL配置');
    }
    
    const url = actualRequest.url.startsWith('http') ? actualRequest.url : `${baseUrl}/${actualRequest.url}`;
    
    const response = await axios({
      url,
      method: actualRequest.method || 'POST',
      headers: actualRequest.headers || { 'Content-Type': 'application/json' },
      data: actualRequest.data,
      params: actualRequest.params,
      timeout: actualRequest.timeout || DEFAULT_TIMEOUT,
      ...actualRequest.axiosConfig
    });
    
    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(
        Object.entries(response.headers).map(([k, v]) => [k, String(v)])
      ),
      data: response.data
    };
  } catch (error: any) {
    if (error.response) {
      // 服务器返回了错误响应
      return {
        success: false,
        status: error.response.status,
        statusText: error.response.statusText,
        headers: Object.fromEntries(
          Object.entries(error.response.headers || {}).map(([k, v]) => [k, String(v)])
        ),
        data: error.response.data,
        error: `HTTP错误: ${error.response.status} ${error.response.statusText}`
      };
    } else if (error.request) {
      // 请求已发送但未收到响应
      return {
        success: false,
        error: `无响应: ${error.message || '请求超时或网络错误'}`
      };
    } else {
      // 请求设置时出现问题
      return {
        success: false,
        error: `请求错误: ${error.message || '未知错误'}`
      };
    }
  }
}

/**
 * 从HTTP响应中提取数据
 */
export function extractData(response: HttpResponse): ExtractedData {
  if (!response.success) {
    return {
      hasData: false,
      type: 'error',
      status: String(response.status || 'error'),
      timestamp: new Date().toISOString(),
      data: { error: response.error },
      metadata: {
        error: response.error,
        status: response.status
      }
    };
  }
  
  // 检测数据类型
  let type = 'unknown';
  let hasData = false;
  
  if (response.data) {
    if (response.data.results) {
      type = 'grafana-query';
      hasData = true;
    } else if (response.data.series) {
      type = 'timeseries';
      hasData = Array.isArray(response.data.series) && response.data.series.length > 0;
    } else if (response.data.tables) {
      type = 'tables';
      hasData = Array.isArray(response.data.tables) && response.data.tables.length > 0;
    } else if (response.data.responses) {
      type = 'elasticsearch';
      hasData = Array.isArray(response.data.responses) && response.data.responses.length > 0;
    } else if (Array.isArray(response.data)) {
      type = 'array';
      hasData = response.data.length > 0;
    } else if (typeof response.data === 'object') {
      type = 'object';
      hasData = Object.keys(response.data).length > 0;
    } else {
      type = typeof response.data;
      hasData = response.data !== null && response.data !== undefined;
    }
  }
  
  return {
    hasData,
    type,
    status: String(response.status || 200),
    timestamp: new Date().toISOString(),
    data: response.data,
    metadata: {
      contentType: response.headers?.['content-type'],
      responseSize: JSON.stringify(response.data).length
    }
  };
}

/**
 * 检查健康状态
 */
export async function checkHealth(
  url: string, 
  options?: { 
    timeout?: number; 
    expectedStatus?: number;
  }
): Promise<HealthStatus> {
  try {
    const response = await axios.get(url, { 
      timeout: options?.timeout || 5000 
    });
    
    const expectedStatus = options?.expectedStatus || 200;
    
    return {
      status: response.status === expectedStatus ? 'healthy' : 'warning',
      timestamp: new Date().toISOString(),
      message: `状态码: ${response.status}`,
      details: {
        status: response.status,
        statusText: response.statusText,
        expectedStatus
      }
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      message: error.code === 'ECONNABORTED' ? '健康检查超时' : error.message,
      details: {
        code: error.code,
        isTimeout: error.code === 'ECONNABORTED'
      }
    };
  }
}

/**
 * 批量执行查询（并发执行多个查询）
 * 
 * @param requests 查询请求数组
 * @param baseUrl 基础URL
 * @param options 选项配置
 * @returns 批量查询结果
 */
export async function executeBatchQueries(
  requests: HttpRequest[],
  baseUrl: string = '',
  options: { concurrency?: number; failFast?: boolean } = {}
): Promise<HttpResponse[]> {
  const { concurrency = 5, failFast = false } = options;
  
  if (requests.length === 0) {
    return [];
  }
  
  // 分批执行以控制并发数
  const results: HttpResponse[] = [];
  
  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    const batchPromises = batch.map(request => executeQuery(request, baseUrl));
    
    try {
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // 如果启用快速失败且有失败的请求，立即停止
      if (failFast && batchResults.some(result => !result.success)) {
        break;
      }
    } catch (error) {
      // 如果整个批次失败，添加错误结果
      const errorResults = batch.map(() => ({
        success: false,
        error: `批量查询失败: ${error}`,
        status: undefined,
        data: undefined
      }));
      results.push(...errorResults);
      
      if (failFast) {
        break;
      }
    }
  }
  
  return results;
} 