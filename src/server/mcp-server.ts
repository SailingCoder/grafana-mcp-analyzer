import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { executeQuery, extractData, checkHealth } from '../datasources/grafana-client.js';
import { buildAnalysisGuidance, generateDataOverview } from '../services/monitoring-analyzer.js';
import { 
  generateRequestId,
  storeRequestMetadata,
  storeResponseData,
  getResponseData,
  storeAnalysis,
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
        
        // 存储分析指引
        await storeAnalysis(requestId, {
          prompt,
          timestamp: new Date().toISOString(),
          result: analysisGuidance,
          queryName,
          dataOverview,
          resourceLinks
        });
        
        return createResponse({
          success: true,
          requestId,
          queryName,
          dataSize: storageResult.size,
          storageType: storageResult.type,
          message: analysisGuidance
        });
        
      } catch (error: any) {
        return createErrorResponse(error);
      }
    }
  );

  // 批量分析工具（优化版：并行处理 + 错误容错）
  server.tool(
    'batch_analyze',
    {
      queryNames: z.array(z.string()).describe('查询名称列表'),
      prompt: z.string().describe('批量分析需求描述'),
      sessionId: z.string().optional().describe('会话ID')
    },
    async ({ queryNames, prompt, sessionId }) => {
      try {
        // 预先验证所有查询配置，收集有效的查询
        const validQueries: Array<{ name: string; config: any }> = [];
        const invalidQueries: Array<{ name: string; error: string }> = [];
        
        for (const queryName of queryNames) {
          try {
            const queryConfig = validateQueryConfig(queryName);
            validQueries.push({ name: queryName, config: queryConfig });
          } catch (error: any) {
            invalidQueries.push({ name: queryName, error: error.message });
          }
        }
        
        // 如果没有有效查询，直接返回错误
        if (validQueries.length === 0) {
          return createErrorResponse(`所有查询配置都无效: ${invalidQueries.map(q => `${q.name} (${q.error})`).join(', ')}`);
        }
        
        // 并行处理所有有效查询
        const analysisPromises = validQueries.map(async ({ name, config }) => {
          try {
            const requestId = generateRequestId();
            
            const { result, storageResult, resourceLinks } = await executeAndStoreQuery(
              config,
              requestId,
              { queryName: name, prompt: `${prompt} - 针对 ${name}`, sessionId }
            );
            
            // 生成数据概览
            const dataOverview = generateDataOverview(result);
            
            // 构建分析指引
            const analysisGuidance = buildAnalysisGuidance(
              `${prompt} - 针对 ${name}`,
              requestId,
              dataOverview,
              resourceLinks,
              config
            );
            
            // 存储分析指引
            await storeAnalysis(requestId, {
              prompt: `${prompt} - 针对 ${name}`,
              timestamp: new Date().toISOString(),
              result: analysisGuidance,
              queryName: name,
              dataOverview,
              resourceLinks
            });
            
            return {
              status: 'success' as const,
              queryName: name,
              requestId,
              dataSize: storageResult.size,
              storageType: storageResult.type,
              formattedData: analysisGuidance
            };
          } catch (error: any) {
            return {
              status: 'failed' as const,
              queryName: name,
              error: error.message
            };
          }
        });
        
        // 等待所有分析完成
        const analysisResults = await Promise.all(analysisPromises);
        
        // 分离成功和失败的结果
        const successResults = analysisResults.filter(r => r.status === 'success');
        const failedResults = [
          ...invalidQueries.map(q => ({ queryName: q.name, error: q.error })),
          ...analysisResults.filter(r => r.status === 'failed').map(r => ({ queryName: r.queryName, error: r.error }))
        ];
        
        // 返回结果（即使有部分失败也返回成功，只要有至少一个成功）
        return createResponse({
          success: successResults.length > 0,
          type: 'batch_analysis',
          results: successResults.map(result => ({
            queryName: result.queryName,
            requestId: result.requestId,
            dataSize: result.dataSize,
            storageType: result.storageType,
            analysis: result.formattedData,
            success: true
          })),
          failedQueries: failedResults.length > 0 ? failedResults : undefined,
          summary: {
            total: queryNames.length,
            successful: successResults.length,
            failed: failedResults.length,
            prompt: prompt
          },
          message: `批量分析完成 - 总计 ${queryNames.length} 个查询，成功 ${successResults.length} 个，失败 ${failedResults.length} 个。每个查询的分析结果在 results 数组中独立返回。`
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
        
        // 存储聚合分析指引
        await storeAnalysis(aggregateRequestId, {
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
        
        return createResponse({
          success: true,
          aggregateRequestId,
          queryNames,
          totalDataSize,
          queryDetails,
          message: aggregateAnalysisGuidance,
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
      limit: z.number().optional().default(10).describe('返回数量限制')
    },
    async ({ sessionId, limit }) => {
      try {
        let requests;
        if (sessionId) {
          requests = await listRequestsBySession(sessionId);
        } else {
          requests = await listAllRequests();
        }
        
        // 限制返回数量
        const limitedRequests = requests.slice(0, limit);
        
        // 获取每个请求的统计信息
        const requestsWithStats = await Promise.all(
          limitedRequests.map(async (req) => {
            try {
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
        
        return createResponse({
          data: requestsWithStats,
          total: requests.length,
          returned: limitedRequests.length,
          sessionId: sessionId || 'all'
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

  return server;
} 