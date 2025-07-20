import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { executeQuery, extractData, checkHealth } from '../datasources/grafana-client.js';
import { buildAnalysisGuidance, generateDataOverview } from '../services/monitoring-analyzer.js';
import { 
  generateRequestId,
  storeRequestMetadata,
  storeResponseData,
  getResponseData,
  safeStoreAnalysis,
  getAnalysis,
  listAllRequests,
  listRequestsBySession,
  getRequestStats
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
 * 创建配置好的MCP服务器
 */
export function createMcpServer(packageJson: any, config: QueryConfig): McpServer {
  const SERVER_INFO = {
    name: 'grafana-mcp-analyzer',
    version: packageJson.version,
    description: `Grafana MCP分析器 - 监控数据查询和分析工具

🎯 核心功能：预定义查询、数据存储、AI分析指引、会话管理
📊 数据处理：支持任意大小数据，提供完整数据分析 
🔧 使用方式：list_queries查看可用查询，analyze_query进行分析`
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

  // 构建ResourceLinks
  function buildResourceLinks(storageResult: any, requestId: string): string[] {
    return storageResult.type === 'chunked' 
      ? storageResult.resourceUris || []
      : [storageResult.resourceUri || `monitoring-data://${requestId}/data`];
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
    
    // 存储响应数据
    const storageResult = await storeResponseData(requestId, result);
    
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

  // 创建资源处理器
  function createResourceHandler(dataGetter: (parts: string[]) => Promise<any>) {
    return async (uri: URL) => {
      try {
        const parts = uri.pathname.split('/');
        const data = await dataGetter(parts);
        
        if (typeof data === 'string') {
          return {
            contents: [{ 
              uri: uri.toString(), 
              text: data,
              mimeType: 'text/plain'
            }]
          };
        }
        
        return {
          contents: [{ 
            uri: uri.toString(), 
            text: JSON.stringify(data, null, 2),
            mimeType: 'application/json'
          }]
        };
      } catch (error: any) {
        return {
          contents: [{ 
            uri: uri.toString(), 
            text: `错误: ${error.message}`,
            mimeType: 'text/plain'
          }]
        };
      }
    };
  }

  // 创建MCP服务器实例
  const server = new McpServer(SERVER_INFO);

  // 注册监控数据资源
  server.resource(
    "monitoring-data",
    "monitoring-data://{requestId}/{dataType}",
    {
      name: "监控数据",
      description: "Grafana监控数据资源查看器"
    },
    createResourceHandler(async (parts) => {
      const requestId = parts[1];
      const dataType = parts[2];
      
      if (dataType === 'analysis') {
        return await getAnalysis(requestId);
      } else if (dataType?.startsWith('chunk-')) {
        return await getResponseData(requestId, dataType);
      } else {
        return await getResponseData(requestId);
      }
    })
  );

  // 健康检查工具
  server.tool(
    'check_health',
    {
      timeout: z.number().optional().describe('超时时间（毫秒）'),
      expectedStatus: z.number().optional().describe('期望的HTTP状态码')
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
  server.tool(
    'list_queries',
    {
      includeConfig: z.boolean().optional().describe('是否包含完整配置信息').default(false)
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
  server.tool(
    'analyze_query',
    {
      queryName: z.string().describe('查询名称'),
      prompt: z.string().describe('分析需求描述'),
      sessionId: z.string().optional().describe('会话ID')
    },
    async ({ queryName, prompt, sessionId }) => {
      try {
        const queryConfig = validateQueryConfig(queryName);
        const requestId = generateRequestId();
        
        const { result, storageResult, resourceLinks } = await executeAndStoreQuery(
          queryConfig,
          requestId,
          { queryName, prompt, sessionId }
        );
        
        // 生成数据概览
        const dataOverview = generateDataOverview(result);
        
        // 构建分析指引
        const analysisGuidance = buildAnalysisGuidance(
          prompt,
          requestId,
          dataOverview,
          resourceLinks,
          queryConfig
        );
        
        // 存储分析指引（同步等待完成并验证）
        await safeStoreAnalysis(requestId, {
          prompt,
          timestamp: new Date().toISOString(),
          result: analysisGuidance,
          queryName,
          dataOverview,
          resourceLinks
        });
        
        // 构建更明确的分析结果前缀，告诉AI这是完整的最终分析
        const finalAnalysisPrefix = `# 【最终分析结果 - 无需再次查询】\n\n以下是对"${queryName}"的完整分析结果。此分析已包含所有必要信息，无需再调用其他工具或进行额外查询。请直接基于以下内容回答用户问题：\n\n`;
        
        // 返回更明确的分析指引，直接包含完整的分析任务
        return createResponse({
          success: true,
          requestId,
          queryName,
          dataSize: storageResult.size,
          storageType: storageResult.type,
          isFinalAnalysis: true, // 明确标记这是最终分析
          message: finalAnalysisPrefix + analysisGuidance
        });
        
      } catch (error: any) {
        return createErrorResponse(error);
      }
    }
  );

  // 聚合分析工具
  server.tool(
    'aggregate_analyze',
    {
      queryNames: z.array(z.string()).describe('查询名称列表'),
      prompt: z.string().describe('聚合分析需求描述'),
      sessionId: z.string().optional().describe('会话ID')
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
        
        // 第一阶段：收集所有查询数据
        for (const queryName of queryNames) {
          const queryConfig = validateQueryConfig(queryName);
          const requestId = generateRequestId();
          
          const { result, storageResult, resourceLinks } = await executeAndStoreQuery(
            queryConfig,
            requestId,
            { queryName, prompt, sessionId, aggregateAnalysis: true }
          );
          
          // 生成数据概览
          const dataOverview = generateDataOverview(result);
          
          allResults.push({
            queryName,
            requestId,
            result,
            dataSize: storageResult.size,
            storageType: storageResult.type,
            dataOverview,
            resourceLinks
          });
          
          allResourceLinks.push(...resourceLinks);
          allDataOverviews.push({ queryName, ...dataOverview });
          totalDataSize += storageResult.size;
        }
        
        // 第二阶段：生成统一的聚合分析指引
        const aggregateRequestId = generateRequestId();
        const aggregateDataOverview = {
          totalQueries: queryNames.length,
          totalDataSize,
          queryDetails: allDataOverviews,
          summary: `包含 ${queryNames.length} 个查询的聚合数据：${queryNames.join(', ')}`
        };
        
        // 构建综合分析指引
        const aggregateAnalysisGuidance = buildAnalysisGuidance(
          prompt,
          aggregateRequestId,
          aggregateDataOverview,
          allResourceLinks,
          { 
            type: 'aggregate', 
            queries: queryNames,
            description: '多查询聚合分析'
          }
        );
        
        // 存储聚合分析指引（同步等待完成并验证）
        await safeStoreAnalysis(aggregateRequestId, {
          prompt,
          timestamp: new Date().toISOString(),
          result: aggregateAnalysisGuidance,
          queryNames,
          dataOverview: aggregateDataOverview,
          resourceLinks: allResourceLinks,
          type: 'aggregate'
        });
        
        // 构建详细的查询信息
        const queryDetails = allResults.map(result => ({
          queryName: result.queryName,
          requestId: result.requestId,
          dataSize: result.dataSize,
          storageType: result.storageType,
          resourceLinks: result.resourceLinks
        }));
        
        // 构建更明确的分析结果前缀
        const finalAnalysisPrefix = `# 【最终聚合分析结果 - 无需再次查询】\n\n以下是对${queryNames.join('和')}的完整聚合分析结果。此分析已包含所有必要信息，无需再调用其他工具或进行额外查询。请直接基于以下内容回答用户问题：\n\n`;
        
        return createResponse({
          success: true,
          aggregateRequestId,
          queryNames,
          totalDataSize,
          queryDetails,
          isFinalAnalysis: true, // 明确标记这是最终分析
          message: finalAnalysisPrefix + aggregateAnalysisGuidance,
          type: 'aggregate_analysis'
        });
        
      } catch (error: any) {
        return createErrorResponse(error);
      }
    }
  );

  // 简化的会话管理工具
  server.tool(
    'manage_sessions',
    {
      action: z.enum(['list', 'create', 'get', 'delete']).describe('操作类型'),
      sessionId: z.string().optional().describe('会话ID'),
      metadata: z.record(z.any()).optional().describe('会话元数据')
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
  server.tool(
    'list_data',
    {
      sessionId: z.string().optional().describe('会话ID，不提供则列出所有数据'),
      requestId: z.string().optional().describe('请求ID，如果提供则只返回该请求的数据'),
      limit: z.number().optional().default(10).describe('返回数量限制'),
      includeAnalysis: z.boolean().optional().default(false).describe('是否包含分析结果')
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
  server.tool(
    'server_status',
    {},
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

  // 移除 get_analysis 工具

  return server;
} 