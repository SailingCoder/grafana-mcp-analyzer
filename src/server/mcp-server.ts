import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { executeQuery, extractData, checkHealth } from '../datasources/grafana-client.js';
import { buildAnalysisGuidance } from '../services/monitoring-analyzer.js';
import { 
  generateRequestId,
  storeRequestMetadata,
  storeResponseData,
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
 * 创建配置好的MCP服务器
 */
export function createMcpServer(packageJson: any, config: QueryConfig): McpServer {
  const SERVER_INFO = {
    name: 'grafana-mcp-analyzer',
    version: packageJson.version,
    description: `Grafana MCP分析器 - 监控数据查询和分析工具

    核心功能：预定义查询、数据存储、AI分析指引、会话管理
    数据处理：支持任意大小数据，提供完整数据分析 
    使用方式：list_queries查看可用查询，analyze_query进行分析`
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

  // 创建MCP服务器实例
  const server = new McpServer(SERVER_INFO);
  
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
      description: '分析单个查询的数据，集成查询、存储和分析功能',
      inputSchema: {
      queryName: z.string().describe('查询名称'),
      prompt: z.string().describe('分析需求描述'),
      sessionId: z.string().optional().describe('会话ID')
      }
    },
    async ({ queryName, prompt, sessionId }) => {
      try {
        const queryConfig = validateQueryConfig(queryName);
        const requestId = generateRequestId();
        
        // 第一步：执行查询并存储数据
        const { storageResult, resourceLinks } = await executeAndStoreQuery(
          queryConfig,
          requestId,
          { queryName, prompt, sessionId }
        );
        
        // 第二步：等待数据完全写入本地存储
        // 验证数据是否已经完全存储
        let dataVerified = false;
        let retryCount = 0;
        const maxRetries = 10;
        
        while (!dataVerified && retryCount < maxRetries) {
          try {
            // 尝试读取存储的数据来验证
            await getResponseData(requestId);
            dataVerified = true;
          } catch (error) {
            retryCount++;
            // 等待500ms后重试
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        if (!dataVerified) {
          throw new Error(`数据存储验证失败，请求ID: ${requestId}`);
        }
        
        // 第三步：生成数据概览（仅用于元信息）
        // TODO: 暂时注释掉dataOverview，测试AI是否会直接通过ResourceLinks获取完整数据
        // const dataOverview = generateDataOverview(result);
        const dataOverview = {
          type: 'raw_data_available',
          hasData: true,
          timestamp: new Date().toISOString(),
          status: 'success',
          message: '完整数据可通过ResourceLinks获取'
        };
        
        // 第四步：构建基于Resources机制的分析指引
        const analysisGuidance = buildAnalysisGuidance(
          prompt,
          requestId,
          dataOverview,
          resourceLinks,
          queryConfig
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
          message: analysisGuidance, // 这是给AI的分析指引，AI应该基于此访问ResourceLinks
          analysisMode: 'resources-based', // 标记这是基于Resources机制的分析
          dataReady: true, // 标记数据已准备完成
          analysisInstructions: "请按照message中的指引，通过resourceLinks获取实际数据并进行分析"
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
      description: '聚合分析多个查询的数据，将数据合并后进行统一分析',
      inputSchema: {
      queryNames: z.array(z.string()).describe('查询名称列表'),
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
          // TODO: 暂时注释掉，让AI直接通过ResourceLinks获取数据
          // const dataOverview = generateDataOverview(result);
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
          analysisMode: 'resources-based', // 标记这是基于Resources机制的分析
          dataReady: true, // 标记数据已准备完成
          analysisInstructions: "请按照message中的指引，通过resourceLinks获取实际数据并进行聚合分析"
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

  // 获取监控数据工具（ResourceLinks替代方案）
  server.registerTool(
    'get_monitoring_data',
    {
      title: '获取监控数据',
      description: '当AI无法直接访问ResourceLinks时的数据获取工具',
      inputSchema: {
        requestId: z.string().describe('请求ID'),
        dataType: z.string().default('data').describe('数据类型：data/analysis/chunk-*')
      }
    },
    async ({ requestId, dataType }) => {
      try {
        // 获取数据
        let data;
        if (dataType === 'analysis') {
          data = await getAnalysis(requestId);
        } else if (dataType?.startsWith('chunk-')) {
          data = await getResponseData(requestId, dataType);
        } else {
          data = await getResponseData(requestId);
        }
        
        const dataSize = JSON.stringify(data).length;
        
        return createResponse({
          success: true,
          requestId,
          dataType,
          data: data,
          dataSize,
          message: '数据获取成功',
          note: '这是通过工具获取的数据，与ResourceLinks包含相同内容'
        });
        
      } catch (error: any) {
        console.error(`[Get Data Tool] 数据获取失败: ${error.message}`);
        return createErrorResponse(`无法获取数据: ${error.message}`);
      }
    }
  );

  return server;
} 