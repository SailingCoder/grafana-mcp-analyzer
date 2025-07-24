import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import path from 'path';
import os from 'os';
import { executeQuery, extractData, checkHealth } from '../datasources/grafana-client.js';
import { buildAnalysisGuidance, generateDataOverview } from '../services/monitoring-analyzer.js';
import { chunkAndSave, loadChunks, getMaxChunkSize } from '../services/chunk-manager.js';
import { 
  generateRequestId,
  storeRequestMetadata,
  getResponseData,
  safeStoreAnalysis,
  getAnalysis,
  listAllRequests,
  listRequestsBySession,
  getRequestStats,
  
} from '../services/data-store.js';
import {
  createSession,
  getSessionInfo,
  listSessions,
  deleteSession
} from '../services/session-manager.js';
import type { 
  QueryConfig, 
  HttpRequest, 
  ExtractedData,
  HealthStatus 
  } from '../types/index.js';

/**
 * 检测客户端是否支持Resources
 */
function detectResourcesSupport(): boolean {
  // 通过环境变量检测
  const forceResourcesSupport = process.env.FORCE_RESOURCES_SUPPORT;
  if (forceResourcesSupport === 'true') {
    return true;
  }
  if (forceResourcesSupport === 'false') {
    return false;
  }
  
  // 默认禁用Resources支持，使用tool-based模式
  return false;
}

/**
 * 强制存储为full.json文件（避免分块）
 */
async function forceStoreAsFull(requestId: string, data: any) {
  const requestDir = path.join(process.env.DATA_STORE_ROOT || path.join(os.homedir(), '.grafana-mcp-analyzer', 'data-store'), requestId);
  const dataDir = path.join(requestDir, 'data');
  
  // 确保目录存在
  const fs = await import('fs/promises');
  await fs.mkdir(dataDir, { recursive: true });
  
  const dataStr = JSON.stringify(data, null, 2);
  const dataSize = Buffer.byteLength(dataStr, 'utf8');
  
  // 强制存储为full.json
  const fullPath = path.join(dataDir, 'full.json');
  await fs.writeFile(fullPath, dataStr);
  
  return { 
    type: 'full', 
    size: dataSize,
    chunks: 1,
    resourceUri: `monitoring-data://${requestId}/data`
  };
}

/**
 * 严格分块策略 - 确保每个分块不超过配置的大小限制
 */
async function processDataWithStrictChunking(requestId: string, data: any) {
  const dataStr = JSON.stringify(data);
  const dataSize = Buffer.byteLength(dataStr, 'utf8');
  const maxChunkSize = getMaxChunkSize();
  
  console.error(`📊 数据大小: ${Math.round(dataSize / 1024)}KB, 使用严格${Math.round(maxChunkSize / 1024)}KB分块策略`);
  
  // 如果数据小于配置的大小，直接存储
  if (dataSize <= maxChunkSize) {
    console.log(`✅ 数据较小，直接存储`);
    return await forceStoreAsFull(requestId, data);
  }
  
  // 使用严格分块器
  console.log(`📦 数据较大，使用严格${Math.round(maxChunkSize / 1024)}KB分块`);
  const chunkingResult = await chunkAndSave(data, requestId, maxChunkSize);
  
  return {
    type: 'chunked',
    size: dataSize,
    chunks: chunkingResult.chunks.length,
    chunkingStrategy: `strict-${Math.round(maxChunkSize / 1024)}kb`,
    metadata: chunkingResult.metadata,
    resourceUri: `monitoring-data://${requestId}/chunks`
  };
}

/**
 * 根据数据大小决定处理策略
 */
async function processDataWithStrategy(requestId: string, data: any) {
  const dataStr = JSON.stringify(data);
  const dataSize = Buffer.byteLength(dataStr, 'utf8');
  
  console.error(`📊 数据大小: ${Math.round(dataSize / 1024)}KB, 使用严格分块策略`);
  
  // 统一使用严格分块策略
  return await processDataWithStrictChunking(requestId, data);
}

/**
 * 创建配置好的MCP服务器
 */
export function createMcpServer(packageJson: any, config: QueryConfig): McpServer {
  const SERVER_INFO = {
    name: 'grafana-mcp-analyzer',
    version: packageJson.version,
    description: `🚫 重要警告：禁止使用curl或其他外部方法获取数据！

Grafana MCP分析器 - 监控数据查询和分析工具

核心功能：预定义查询、数据存储、AI分析指引、会话管理
数据处理：支持任意大小数据，提供完整数据分析 
使用方式：list_queries查看可用查询，analyze_query进行分析

⚠️ 必须使用提供的MCP工具，任何其他方法都会导致错误！`
  } as const;

  // 工具函数
  function createResponse(data: any, isError = false) {
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
      ...(isError && { isError: true })
    };
  }

  function createErrorResponse(error: string | Error) {
    const errorMessage = error instanceof Error ? error.message : error;
    return createResponse({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, true);
  }



  // 验证查询配置是否存在
  function validateQueryConfig(queryName: string) {
    const queries = getQueries();
    if (!queries[queryName]) {
      throw new Error(`查询配置不存在: ${queryName}`);
    }
    return queries[queryName];
  }

  // 构建ResourceLinks（使用monitoring-data协议）
  function buildResourceLinks(storageResult: any, requestId: string): string[] {
    if (detectResourcesSupport()) {
      return storageResult.type === 'chunked' 
        ? storageResult.resourceUris || []
        : [storageResult.resourceUri || `monitoring-data://${requestId}/data`];
    } else {
      // 不支持Resources时返回空数组
      return [];
    }
  }

  // 执行查询并存储数据的通用流程
  async function executeAndStoreQuery(
    queryConfig: any, 
    requestId: string, 
    metadata: any
  ): Promise<{ result: ExtractedData, storageResult: any, resourceLinks: string[] }> {
    // 存储请求元数据
    await storeRequestMetadata(requestId, {
      timestamp: new Date().toISOString(),
      url: queryConfig.url,
      method: queryConfig.method || 'POST',
      params: queryConfig.params,
      data: queryConfig.data,
      ...metadata
    });
    
    // 执行查询
    const result = await executeGrafanaQuery(queryConfig);
    
    // 使用新的数据处理策略
    const storageResult = await processDataWithStrategy(requestId, result);
    
    // 构建ResourceLinks
    const resourceLinks = buildResourceLinks(storageResult, requestId);
    
    return { result, storageResult, resourceLinks };
  }

  // 执行查询
  async function executeGrafanaQuery(request: HttpRequest | any): Promise<ExtractedData> {
    // 如果查询配置包含curl属性，直接传递给executeQuery函数处理
    const queryResponse = await executeQuery(request, config.baseUrl || '');
    
    if (!queryResponse.success) {
      throw new Error(`查询执行失败: ${queryResponse.error}`);
    }
    
    return extractData(queryResponse);
  }

  // 获取配置中的查询
  function getQueries() {
    return config.queries || {};
  }

  // 创建MCP服务器实例
  const server = new McpServer(SERVER_INFO);
  
  // 只有在支持Resources时才注册资源
  if (detectResourcesSupport()) {
    // 注册监控数据资源模板（使用monitoring-data协议）
    server.registerResource(
    "monitoring-data",
    new ResourceTemplate("monitoring-data://{requestId}/{dataType}", { list: undefined }),
    {
      title: "监控数据",
      description: "Grafana监控数据资源查看器"
    },
    async (uri, { requestId, dataType }) => {
      try {
        // 确保参数是字符串类型
        const reqId = Array.isArray(requestId) ? requestId[0] : requestId;
        const dType = Array.isArray(dataType) ? dataType[0] : dataType;
        
        let data;
        if (dType === 'analysis') {
          data = await getAnalysis(reqId);
        } else if (dType?.startsWith('chunk-')) {
          data = await getResponseData(reqId, dType);
        } else {
          data = await getResponseData(reqId);
        }
        
        if (typeof data === 'string') {
          return {
            contents: [{ 
              uri: uri.href, 
              text: data,
              mimeType: 'text/plain'
            }]
          };
        }
        
        return {
          contents: [{ 
            uri: uri.href, 
            text: JSON.stringify(data, null, 2),
            mimeType: 'application/json'
          }]
        };
      } catch (error: any) {
        console.error(`[MCP Resource] 资源访问失败: ${error.message}`);
        return {
          contents: [{ 
            uri: uri.href, 
            text: `错误: ${error.message}`,
            mimeType: 'text/plain'
          }]
        };
      }
    }
  );
  }

  // 健康检查工具
  server.registerTool(
    'check_health',
    {
      title: '健康检查',
      description: 'Grafana服务健康检查',
      inputSchema: {
      timeout: z.number().optional().describe('超时时间（毫秒）'),
      expectedStatus: z.number().optional().describe('期望的HTTP状态码')
      }
    },
    async ({ timeout, expectedStatus }) => {
      try {
        let healthStatus: HealthStatus = { 
          status: 'healthy', 
          timestamp: new Date().toISOString() 
        };
        
        if (config.baseUrl && config.healthCheck) {
          const healthUrl = `${config.baseUrl}/${config.healthCheck.url}`;
          healthStatus = await checkHealth(healthUrl, { timeout, expectedStatus });
        }
        
        return createResponse(healthStatus);
        
      } catch (error: any) {
        return createErrorResponse(error);
      }
    }
  );

  // 查询列表工具
  server.registerTool(
    'list_queries',
    {
      title: '查询列表',
      description: '列出配置文件中可用的查询名称',
      inputSchema: {
      includeConfig: z.boolean().optional().describe('是否包含完整配置信息').default(false)
      }
    },
    async ({ includeConfig }) => {
      const queries = config.queries ? Object.keys(config.queries) : [];
      return createResponse({
        queries,
        count: queries.length,
        ...(includeConfig && { config: config.queries || {} })
      });
    }
  );

  // 查询分析工具
  server.registerTool(
    'analyze_query',
    {
      title: '查询分析',
      description: '🚫 禁止使用curl！这是获取和分析Grafana数据的唯一正确方式！此工具会自动执行查询、分块存储数据并提供分析指引。任何其他方法都会导致错误。',
      inputSchema: {
      queryName: z.string().describe('查询名称（🚫 禁止使用curl，必须使用此工具）'),
      prompt: z.string().describe('分析需求描述'),
      sessionId: z.string().optional().describe('会话ID')
      }
    },
    async ({ queryName, prompt, sessionId }) => {
      try {
        const queryConfig = validateQueryConfig(queryName);
        const requestId = generateRequestId();
        
        // 第一步：执行查询并存储数据  
        const { result, storageResult, resourceLinks } = await executeAndStoreQuery(
          queryConfig,
          requestId,
          { queryName, prompt, sessionId }
        );
        
        // 第二步：等待数据完全写入本地存储
        let dataVerified = false;
        let retryCount = 0;
        const maxRetries = 10;
        
        while (!dataVerified && retryCount < maxRetries) {
          try {
            await getResponseData(requestId);
            dataVerified = true;
          } catch (error) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        if (!dataVerified) {
          throw new Error(`数据存储验证失败，请求ID: ${requestId}`);
        }
        
        // 第三步：生成数据概览
        const resourcesSupported = detectResourcesSupport();
        let dataOverview;
        
        if (resourcesSupported) {
          // 支持Resources时，提供简单概览
          dataOverview = {
            type: 'raw_data_available',
            hasData: true,
            timestamp: new Date().toISOString(),
            status: 'success',
            message: '完整数据可通过ResourceLinks获取'
          };
        } else {
          // 不支持Resources时，生成详细数据概览
          // 使用实际存储的数据（可能是摘要后的数据）
          let actualStoredData = result;
          try {
            const storedData = await getResponseData(requestId);
            if (storedData && storedData.data) {
              actualStoredData = storedData;
            }
          } catch (error) {
            console.log('获取存储数据失败，使用原始数据生成概览');
          }
          
          dataOverview = generateDataOverview(actualStoredData);
          dataOverview.message = '数据已智能处理，包含概览和摘要信息';
          dataOverview.processingStrategy = 'smart_summary';
        }
        
        // 第四步：构建分析指引（基于数据处理策略）
        const analysisGuidance = buildAnalysisGuidance(
          prompt,
          requestId,
          dataOverview,
          storageResult,
          queryConfig,
          resourcesSupported
        );
        
        // 第五步：存储查询元信息（不存储分析指引本身）
        await safeStoreAnalysis(requestId, {
          prompt,
          timestamp: new Date().toISOString(),
          queryName,
          dataOverview,
          resourceLinks,
          status: 'ready_for_analysis', // 标记数据已准备就绪
          type: 'query_metadata'
        });
        
        // 第六步：返回基于Resources机制的完整分析指引
        // 重要：这里返回的message就是AI需要执行的分析任务
        return createResponse({
          success: true,
          requestId,
          queryName,
          dataSize: storageResult.size,
          storageType: storageResult.type,
          resourceLinks,
          message: analysisGuidance, // 这是给AI的分析指引
          analysisMode: resourcesSupported ? 'resources-based' : 'tool-based', // 标记分析模式
          dataReady: true, // 标记数据已准备完成
          analysisInstructions: resourcesSupported 
            ? "请按照message中的指引，通过resourceLinks获取实际数据并进行一次性完整分析"
            : "请按照message中的指引，使用get_monitoring_data工具获取数据并进行一次性完整分析。数据已完整，无需重复执行analyze_query"
        });
        
      } catch (error: any) {
        return createErrorResponse(error);
      }
    }
  );

  // 聚合分析工具
  server.registerTool(
    'aggregate_analyze',
    {
      title: '聚合分析',
      description: '🚫 禁止使用curl！这是聚合分析多个Grafana查询的唯一正确方式！此工具会自动执行多个查询、分块存储数据并提供聚合分析指引。任何其他方法都会导致错误。',
      inputSchema: {
      queryNames: z.array(z.string()).describe('查询名称列表（🚫 禁止使用curl，必须使用此工具）'),
      prompt: z.string().describe('聚合分析需求描述'),
      sessionId: z.string().optional().describe('会话ID')
      }
    },
    async ({ queryNames, prompt, sessionId }) => {
      try {
        // 如果只有一个查询名称，建议使用analyze_query
        if (queryNames.length === 1) {
          return createErrorResponse(`只有一个查询时请使用analyze_query工具。当前查询: ${queryNames[0]}`);
        }
        
        const allResults = [];
        const allResourceLinks = [];
        const allDataOverviews = [];
        let totalDataSize = 0;
        
        // 第一阶段：收集所有查询数据并确保存储完成
        for (const queryName of queryNames) {
          const queryConfig = validateQueryConfig(queryName);
          const requestId = generateRequestId();
          
          const { storageResult, resourceLinks } = await executeAndStoreQuery(
            queryConfig,
            requestId,
            { queryName, prompt, sessionId, aggregateAnalysis: true }
          );
          
          // 验证数据是否已经完全存储
          let dataVerified = false;
          let retryCount = 0;
          const maxRetries = 10;
          
          while (!dataVerified && retryCount < maxRetries) {
            try {
              await getResponseData(requestId);
              dataVerified = true;
            } catch (error) {
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          
          if (!dataVerified) {
            throw new Error(`数据存储验证失败，查询: ${queryName}, 请求ID: ${requestId}`);
          }
          
          // 生成数据概览
          // 聚合分析使用简化的数据概览
          const dataOverview = {
            type: 'raw_data_available',
            hasData: true,
            timestamp: new Date().toISOString(),
            status: 'success',
            message: '完整数据可通过ResourceLinks获取'
          };
          
          allResults.push({
            queryName,
            requestId,
            dataSize: storageResult.size,
            storageType: storageResult.type,
            dataOverview,
            resourceLinks
          });
          
          allResourceLinks.push(...resourceLinks);
          allDataOverviews.push({ queryName, ...dataOverview });
          totalDataSize += storageResult.size;
        }
        
        // 第二阶段：生成聚合分析指引
        const aggregateRequestId = generateRequestId();
        const aggregateDataOverview = {
          totalQueries: queryNames.length,
          totalDataSize,
          queryDetails: allDataOverviews,
          summary: `包含 ${queryNames.length} 个查询的聚合数据：${queryNames.join(', ')}`,
          type: 'aggregate-analysis',
          queryNames
        };
        
        // 构建聚合分析指引
        const supportsResources = detectResourcesSupport();
        // 创建聚合存储结果
        const aggregateStorageResult = {
          type: 'aggregate',
          resourceUris: allResourceLinks,
          totalQueries: queryNames.length,
          totalDataSize
        };
        const aggregateAnalysisGuidance = buildAnalysisGuidance(
          prompt,
          aggregateRequestId,
          aggregateDataOverview,
          aggregateStorageResult,
          { 
            type: 'aggregate', 
            queries: queryNames,
            description: '多查询聚合分析'
          },
          supportsResources
        );
        
        // 存储聚合分析元信息
        await safeStoreAnalysis(aggregateRequestId, {
          prompt,
          timestamp: new Date().toISOString(),
          queryNames,
          dataOverview: aggregateDataOverview,
          resourceLinks: allResourceLinks,
          type: 'aggregate_metadata',
          status: 'ready_for_analysis'
        });
        
        // 构建查询详情
        const queryDetails = allResults.map(result => ({
          queryName: result.queryName,
          requestId: result.requestId,
          dataSize: result.dataSize,
          storageType: result.storageType,
          resourceLinks: result.resourceLinks
        }));
        
        // 返回基于Resources机制的聚合分析指引
        return createResponse({
          success: true,
          aggregateRequestId,
          queryNames,
          totalDataSize,
          queryDetails,
          resourceLinks: allResourceLinks,
          message: aggregateAnalysisGuidance, // 这是给AI的分析指引
          type: 'aggregate_analysis',
          analysisMode: supportsResources ? 'resources-based' : 'tool-based', // 标记分析模式
          dataReady: true, // 标记数据已准备完成
          analysisInstructions: supportsResources
            ? "请按照message中的指引，通过resourceLinks获取实际数据并进行一次性完整聚合分析"
            : "请按照message中的指引，使用get_monitoring_data工具获取数据并进行一次性完整聚合分析。数据已完整，无需重复执行analyze_query"
        });
        
      } catch (error: any) {
        return createErrorResponse(error);
      }
    }
  );

  // 简化的会话管理工具
  server.registerTool(
    'manage_sessions',
    {
      title: '会话管理',
      description: '管理MCP会话，支持创建、查看、删除会话',
      inputSchema: {
      action: z.enum(['list', 'create', 'get', 'delete']).describe('操作类型'),
      sessionId: z.string().optional().describe('会话ID'),
      metadata: z.record(z.any()).optional().describe('会话元数据')
      }
    },
    async ({ action, sessionId, metadata }) => {
      try {
        switch (action) {
          case 'list':
            const sessions = await listSessions();
            return createResponse(sessions);
            
          case 'create':
            const newSessionId = await createSession(metadata || {});
            return createResponse({ 
              success: true, 
              sessionId: newSessionId,
              message: '会话创建成功' 
            });
            
          case 'get':
            if (!sessionId) {
              return createErrorResponse('缺少会话ID');
            }
            const sessionInfo = await getSessionInfo(sessionId);
            return createResponse(sessionInfo);
            
          case 'delete':
            if (!sessionId) {
              return createErrorResponse('缺少会话ID');
            }
            const result = await deleteSession(sessionId);
            return createResponse({ 
              success: result, 
              message: result ? '会话删除成功' : '会话删除失败' 
            });
            
          default:
            return createErrorResponse('不支持的操作');
        }
      } catch (error: any) {
        return createErrorResponse(error);
      }
    }
  );

  // 列出数据工具
  server.registerTool(
    'list_data',
    {
      title: '数据列表',
      description: '列出历史数据和分析结果',
      inputSchema: {
      sessionId: z.string().optional().describe('会话ID，不提供则列出所有数据'),
      requestId: z.string().optional().describe('请求ID，如果提供则只返回该请求的数据'),
      limit: z.number().optional().default(10).describe('返回数量限制'),
      includeAnalysis: z.boolean().optional().default(false).describe('是否包含分析结果')
      }
    },
    async ({ sessionId, requestId, limit, includeAnalysis }) => {
      try {
        let requests = [];
        let errorMessage = null;
        let analysisResults: Record<string, any> = {};
        let hasAnalysisResults = false;
        
        // 优先处理requestId参数
        if (requestId) {
          try {
            // 不需要单独获取metadata，直接使用getRequestStats
            const stats = await getRequestStats(requestId);
            requests = [stats];
            
            // 如果需要包含分析结果
            if (includeAnalysis && stats.hasAnalysis) {
              try {
                const analysis = await getAnalysis(requestId);
                analysisResults[requestId] = analysis;
                hasAnalysisResults = true;
              } catch (error) {
                console.error(`获取分析结果失败: ${requestId}`, error);
              }
            }
          } catch (error: any) {
            errorMessage = `请求ID不存在: ${requestId}`;
            requests = [];
          }
        } 
        // 处理sessionId参数
        else if (sessionId) {
          // 智能识别：如果传入的是requestId格式，尝试获取该请求
          if (sessionId.startsWith('request-')) {
            try {
              // 不需要单独获取metadata，直接使用getRequestStats
              const stats = await getRequestStats(sessionId);
              requests = [stats];
              errorMessage = `警告: 您提供的似乎是请求ID而不是会话ID。已尝试返回该请求的数据。`;
              
              // 如果需要包含分析结果
              if (includeAnalysis && stats.hasAnalysis) {
                try {
                  const analysis = await getAnalysis(sessionId);
                  analysisResults[sessionId] = analysis;
                  hasAnalysisResults = true;
                } catch (error) {
                  console.error(`获取分析结果失败: ${sessionId}`, error);
                }
              }
            } catch (error) {
              errorMessage = `无效的ID: ${sessionId} (看起来像请求ID但未找到)`;
              requests = [];
            }
          } 
          // 正常会话ID处理
          else {
            requests = await listRequestsBySession(sessionId);
            if (requests.length === 0) {
              errorMessage = `未找到会话相关的请求: ${sessionId}`;
            } else if (includeAnalysis) {
              // 获取会话中所有请求的分析结果
              for (const req of requests) {
                if (req.hasAnalysis) {
                  try {
                    const analysis = await getAnalysis(req.id);
                    analysisResults[req.id] = analysis;
                    hasAnalysisResults = true;
                  } catch (error) {
                    console.error(`获取分析结果失败: ${req.id}`, error);
                  }
                }
              }
            }
          }
        } 
        // 不提供任何ID，返回所有请求
        else {
          requests = await listAllRequests();
        }
        
        // 限制返回数量
        const limitedRequests = requests.slice(0, limit);
        
        // 获取每个请求的统计信息
        const requestsWithStats = await Promise.all(
          limitedRequests.map(async (req) => {
            try {
              // 如果已经是统计信息，直接返回
              if (req.requestId && req.dataType) {
                return req;
              }
              // 否则获取统计信息
              const stats = await getRequestStats(req.id);
              return stats;
            } catch (error) {
              return {
                requestId: req.id,
                timestamp: req.timestamp,
                prompt: req.prompt,
                sessionId: req.sessionId,
                error: 'Failed to get stats'
              };
            }
          })
        );

        // 检查是否有分析结果
        const hasAnalysisCompleted = requestsWithStats.some(req => req.hasAnalysis);
        
        // 构建引导信息
        let guidanceMessage = "";
        if (hasAnalysisCompleted) {
          guidanceMessage = "\n\n【提示】已发现完成的分析结果。如果您需要查看分析结果，请注意：\n1. 使用 analyze_query 工具的返回结果已包含完整分析，无需再次查询\n2. 不要重复调用工具获取相同的数据\n3. 直接基于已有的分析结果回答用户问题";
        } else {
          guidanceMessage = "\n\n【提示】尚未发现完成的分析结果。请使用 analyze_query 工具进行分析。";
        }
        
        return createResponse({
          data: requestsWithStats,
          total: requests.length,
          returned: limitedRequests.length,
          sessionId: sessionId || 'all',
          requestId: requestId || undefined,
          ...(hasAnalysisResults && includeAnalysis && { analysisResults }),
          ...(errorMessage && { warning: errorMessage }),
          guidance: guidanceMessage
        });
        
      } catch (error: any) {
        return createErrorResponse(error);
      }
    }
  );

  // 服务器状态工具
  server.registerTool(
    'server_status',
    {
      title: '服务器状态',
      description: '查看服务器信息和配置状态',
      inputSchema: {}
    },
    async () => {
      return createResponse({
        server: SERVER_INFO,
        config: {
          hasBaseUrl: !!config.baseUrl,
          hasHealthCheck: !!config.healthCheck,
          queryCount: Object.keys(config.queries || {}).length
        },
        timestamp: new Date().toISOString()
      });
    }
  );

  // 获取监控数据工具（支持严格分块）
  server.registerTool(
    'get_monitoring_data',
    {
      title: '获取监控数据',
      description: `🚫 禁止使用curl！这是获取已存储Grafana数据的唯一正确方式！支持严格${Math.round(getMaxChunkSize() / 1024)}KB分块。必须先使用analyze_query工具存储数据。**必须按顺序获取所有分块，不能跳过任何分块！**`,
      inputSchema: {
        requestId: z.string().describe('请求ID（必须先使用analyze_query工具获取）'),
        dataType: z.string().default('data').describe('数据类型：metadata（分块元数据）/chunk-1,chunk-2等（分块数据，必须按顺序获取所有分块）')
      }
    },
    async ({ requestId, dataType }) => {
      try {
        let data;
        let response: any = {
          success: true,
          requestId,
          dataType,
          message: '数据获取成功'
        };

        if (dataType === 'analysis') {
          // 获取分析结果
          data = await getAnalysis(requestId);
          response.data = data;
          response.dataSize = JSON.stringify(data).length;
        } else if (dataType?.startsWith('chunk-')) {
          // 获取特定分块
          try {
            const chunkingResult = await loadChunks(requestId);
            const chunkIndex = parseInt(dataType.replace('chunk-', ''));
            const chunk = chunkingResult.chunks.find(c => c.index === chunkIndex);
            
            if (chunk) {
              data = chunk;
              response.data = chunk;
              response.dataSize = chunk.size;
              response.chunkInfo = {
                index: chunk.index,
                totalChunks: chunk.totalChunks,
                type: chunk.type,
                contentType: chunk.contentType,
                size: chunk.size
              };
              // 如果不是最后一个分块，强制要求继续获取
              if (chunk.index < chunk.totalChunks) {
                response.message = `分块${chunk.index}/${chunk.totalChunks}获取成功。**必须继续获取下一个分块（chunk-${chunk.index + 1}）！还有${chunk.totalChunks - chunk.index}个分块未获取，分析不完整！**`;
                response.warning = `⚠️ 警告：您只获取了${chunk.index}/${chunk.totalChunks}个分块，数据不完整！必须获取所有分块才能进行准确分析！`;
              } else {
                response.message = `分块${chunk.index}/${chunk.totalChunks}获取成功。**所有分块已获取完成，现在可以进行完整分析了！**`;
                response.complete = true;
              }
            } else {
              throw new Error(`分块${chunkIndex}不存在`);
            }
          } catch (error) {
            // 如果分块不存在，尝试获取完整数据
            data = await getResponseData(requestId);
            response.data = data;
            response.dataSize = JSON.stringify(data).length;
            response.message = '分块不存在，已返回完整数据';
          }
        } else {
          // 获取完整数据或分块信息
          try {
            // 首先尝试加载分块信息
            const chunkingResult = await loadChunks(requestId);
            response.chunkingInfo = {
              totalChunks: chunkingResult.chunks.length,
              metadata: chunkingResult.metadata,
              chunkingStrategy: `strict-${Math.round(getMaxChunkSize() / 1024)}kb`
            };
            response.message = `数据已分块存储，共${chunkingResult.chunks.length}个分块。**必须按顺序获取所有分块（chunk-1到chunk-${chunkingResult.chunks.length}），不能跳过任何分块！**`;
            
            // 返回第一个分块作为示例
            if (chunkingResult.chunks.length > 0) {
              response.sampleChunk = chunkingResult.chunks[0];
            }
          } catch (error) {
            // 如果没有分块，获取完整数据
            data = await getResponseData(requestId);
            response.data = data;
            response.dataSize = JSON.stringify(data).length;
            response.message = '数据获取成功（完整数据）';
          }
        }
        
        return createResponse(response);
        
      } catch (error: any) {
        console.error(`[Get Data Tool] 数据获取失败: ${error.message}`);
        return createErrorResponse(`无法获取数据: ${error.message}`);
      }
    }
  );



  return server;
} 