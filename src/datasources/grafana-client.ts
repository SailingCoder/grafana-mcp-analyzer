import axios from 'axios';
import { parseCurlCommand } from './curl-parser.js';
import type { HttpRequest, HttpResponse, ExtractedData, HealthStatus } from '../types/index.js';
import { cacheManager } from '../services/cache-manager.js';

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
    
    // 尝试从缓存获取结果
    const cacheKey = {
      action: 'executeQuery',
      url,
      method: actualRequest.method || 'POST',
      data: actualRequest.data,
      params: actualRequest.params
    };
    
    try {
      const cachedResult = await cacheManager.getCachedResult(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    } catch (error) {
      // 忽略缓存错误，继续执行查询
    }
    
    const response = await axios({
      url,
      method: actualRequest.method || 'POST',
      headers: actualRequest.headers || { 'Content-Type': 'application/json' },
      data: actualRequest.data,
      params: actualRequest.params,
      timeout: actualRequest.timeout || DEFAULT_TIMEOUT,
      ...actualRequest.axiosConfig
    });
    
    const result = {
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(
        Object.entries(response.headers).map(([k, v]) => [k, String(v)])
      ),
      data: response.data
    };
    
    // 异步缓存结果
    try {
      // 缓存有效期：5分钟
      await cacheManager.setCachedResult(cacheKey, result, 5 * 60 * 1000);
    } catch (error) {
      // 忽略缓存错误
    }
    
    return result;
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

/**
 * 延迟函数
 * @param ms 毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 带重试机制的查询执行器
 * 增强错误处理，支持自动重试
 */
export class ResilientQueryExecutor {
  private maxRetries: number;
  private baseDelay: number;
  private debug: boolean;

  constructor(maxRetries: number = 3, baseDelay: number = 1000, debug: boolean = false) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.debug = debug;
  }

  /**
   * 执行查询，支持自动重试
   * @param request HTTP请求配置
   * @param baseUrl 基础URL
   * @returns 提取的数据
   */
  async executeWithRetry(request: any, baseUrl: string): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
      try {
        // 执行原始查询
        const result = await executeQuery(request, baseUrl);
        
        if (this.debug && attempt > 1) {
          console.log(`✅ 重试成功 (尝试 ${attempt}/${this.maxRetries + 1})`);
        }
        
        return result;
      } catch (error: any) {
        lastError = error;
        
        // 如果已经达到最大重试次数，则抛出错误
        if (attempt > this.maxRetries) {
          if (this.debug) {
            console.error(`❌ 达到最大重试次数 (${this.maxRetries})，放弃重试`);
          }
          throw new Error(`查询失败，已重试 ${this.maxRetries} 次: ${error.message}`);
        }
        
        // 计算指数退避延迟时间
        const delayTime = this.calculateBackoff(attempt);
        
        if (this.debug) {
          console.warn(`⚠️ 查询失败，重试 ${attempt}/${this.maxRetries} (延迟 ${delayTime}ms): ${error.message}`);
        }
        
        // 等待一段时间后重试
        await delay(delayTime);
      }
    }
    
    // 这行代码应该永远不会执行，因为循环内部会处理所有情况
    throw lastError || new Error('未知错误');
  }

  /**
   * 计算指数退避延迟时间
   * @param attempt 当前尝试次数
   * @returns 延迟毫秒数
   */
  private calculateBackoff(attempt: number): number {
    // 指数退避算法: baseDelay * 2^(attempt-1) + 随机抖动
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * this.baseDelay;
    return Math.min(exponentialDelay + jitter, 30000); // 最大延迟30秒
  }
}

// 创建默认的重试执行器实例
export const resilientExecutor = new ResilientQueryExecutor(
  parseInt(process.env.MAX_RETRIES || '3'),
  parseInt(process.env.BASE_DELAY || '1000'),
  process.env.DEBUG_RETRIES === 'true'
); 