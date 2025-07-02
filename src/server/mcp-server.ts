#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeQuery, extractData, checkHealth } from '../datasources/grafana-client.js';
import { analyzeWithAI, formatDataForClientAI } from '../services/monitoring-analyzer.js';
import { parseCurlCommand, httpRequestToCurl } from '../datasources/curl-parser.js';
import { isValidHttpMethod } from '../types/index.js';
import { 
  storeMonitoringData, 
  getMonitoringData, 
  splitDataIntoChunks,
  getMostRecentDataId,
  listAvailableDataIds,
  describeDataStructure,
  storeMonitoringDataInSession,
  getMonitoringDataFromSession,
  listSessionResponses
} from '../services/data-store.js';
import {
  createSession,
  updateSessionInfo,
  getSessionInfo,
  listSessions,
  deleteSession
} from '../services/session-manager.js';
import {
  storeRequestInfo,
  getRequestInfo,
  listSessionRequests
} from '../services/request-store.js';
import { loadConfig } from '../services/config-manager.js';
import type { 
  QueryConfig, 
  HttpRequest, 
  HttpMethod, 
  ExtractedData,
  AnalysisResult,
  HealthStatus 
} from '../types/index.js';

// 基本配置
const DEFAULT_CONFIG_PATH = './config/query-config.simple.js';
const MAX_DATA_LENGTH = 100000; // 100KB，超过此大小使用ResourceLinks

// 读取版本号
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.resolve(__dirname, '../../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const SERVER_INFO = {
  name: 'grafana-mcp-analyzer',
  version: packageJson.version,
  description: 'Grafana MCP分析器'
} as const;

// 全局配置
let config: QueryConfig = {};

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

// 执行查询
async function executeGrafanaQuery(request?: any, queryName?: string, curl?: string): Promise<ExtractedData> {
  let queryConfig: HttpRequest;
  
  if (queryName && config.queries?.[queryName]) {
    queryConfig = config.queries[queryName];
    // 如果预定义查询中有curl命令，使用curl命令
    if (queryConfig.curl) {
      const parsedCurl = parseCurlCommand(queryConfig.curl);
      // 合并curl解析结果和配置中的其他设置
      // 注意：curl中的headers应该优先级更高，因为是用户明确指定的
      queryConfig = {
        ...parsedCurl,
        ...queryConfig,
        url: parsedCurl.url || queryConfig.url,
        method: parsedCurl.method || queryConfig.method,
        headers: { ...config.defaultHeaders, ...queryConfig.headers, ...parsedCurl.headers },
        data: parsedCurl.data !== undefined ? parsedCurl.data : queryConfig.data
      };
    }
  } else if (curl) {
    // 直接解析curl命令
    queryConfig = parseCurlCommand(curl);
    // 应用默认headers，但curl中的headers优先级更高
    queryConfig.headers = { ...config.defaultHeaders, ...queryConfig.headers };
  } else if (request) {
    const method = request.method || 'POST';
    queryConfig = {
      url: request.url,
      method: isValidHttpMethod(method) ? method as HttpMethod : 'POST',
      headers: { ...config.defaultHeaders, ...request.headers },
      data: request.data,
      ...(request.params && { params: request.params }),
      ...(request.timeout && { timeout: request.timeout }),
      ...(request.axiosConfig && { axiosConfig: request.axiosConfig })
    };
  } else {
    throw new Error('必须提供request配置、curl命令或queryName');
  }
  
  const queryResponse = await executeQuery(queryConfig, config.baseUrl || '');
  
  if (!queryResponse.success) {
    throw new Error(`查询执行失败: ${queryResponse.error}`);
  }
  
  return extractData(queryResponse);
}

// MCP服务器
const server = new McpServer(SERVER_INFO);

// 注册监控数据资源 - 会话模式
server.resource(
  "monitoring-data",
  "monitoring-data://{sessionId}/{responseId}/{dataType}",
  {
    title: "会话监控数据",
    description: "Grafana监控数据资源查看器（会话模式）"
  },
  async (uri) => {
    try {
      // 从URI中提取参数
      const parts = uri.href.split('/');
      const sessionId = parts[2];
      const responseId = parts[3];
      const dataType = parts[4];
      
      // 获取数据
      const data = await getMonitoringDataFromSession(sessionId, responseId, dataType);
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(data, null, 2),
          mimeType: "application/json"
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          mimeType: "text/plain"
        }]
      };
    }
  }
);

// 兼容旧版监控数据资源
server.resource(
  "monitoring-data-legacy",
  "monitoring-data://{dataId}",
  {
    title: "监控数据资源",
    description: "Grafana监控数据资源查看器（旧版）"
  },
  async (uri) => {
    try {
      // 从URI中提取dataId
      const dataId = uri.href.split('/').pop() || '';
      
      // 特殊ID处理
      let actualDataId = dataId;
      if (dataId === 'recent' || dataId === 'latest') {
        // 获取最近的数据ID
        actualDataId = await getMostRecentDataId();
      }
      
      const data = await getMonitoringData(actualDataId);
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(data, null, 2),
          mimeType: "application/json"
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          mimeType: "text/plain"
        }]
      };
    }
  }
);

// 会话列表资源
server.resource(
  "monitoring-data-index",
  "monitoring-data-index://sessions",
  {
    title: "监控会话索引",
    description: "可用的监控会话列表"
  },
  async (uri) => {
    try {
      const sessions = await listSessions();
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(sessions, null, 2),
          mimeType: "application/json"
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          mimeType: "text/plain"
        }]
      };
    }
  }
);

// 会话详情资源
server.resource(
  "monitoring-data-index",
  "monitoring-data-index://session/{sessionId}",
  {
    title: "监控会话详情",
    description: "会话详细信息"
  },
  async (uri) => {
    try {
      const sessionId = uri.href.split('/').pop() || '';
      const sessionInfo = await getSessionInfo(sessionId);
      
      // 获取会话的请求和响应
      const requests = await listSessionRequests(sessionId);
      const responses = await listSessionResponses(sessionId);
      
      const result = {
        ...sessionInfo,
        requests,
        responses
      };
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(result, null, 2),
          mimeType: "application/json"
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          mimeType: "text/plain"
        }]
      };
    }
  }
);

// 兼容旧版索引资源
server.resource(
  "monitoring-data-index-legacy",
  "monitoring-data-index://list",
  {
    title: "监控数据索引（旧版）",
    description: "可用的监控数据列表（旧版）"
  },
  async (uri) => {
    try {
      const dataIds = await listAvailableDataIds();
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(dataIds, null, 2),
          mimeType: "application/json"
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          mimeType: "text/plain"
        }]
      };
    }
  }
);

// 分析查询工具
server.tool(
  'analyze_query',
  {
    prompt: z.string().describe('分析需求描述'),
    request: z.object({
      url: z.string().describe('查询URL'),
      method: z.string().optional().describe('请求方法').default('POST'),
      headers: z.record(z.string()).optional().describe('请求头'),
      data: z.any().optional().describe('请求数据'),
      params: z.record(z.string()).optional().describe('URL参数'),
      timeout: z.number().optional().describe('超时时间（毫秒）'),
      axiosConfig: z.record(z.any()).optional().describe('自定义Axios配置'),
      sessionId: z.string().optional().describe('会话ID')
    }).optional().describe('查询请求配置'),
    queryName: z.string().optional().describe('预定义查询名称'),
    curl: z.string().optional().describe('curl命令字符串')
  },
  async ({ prompt, request, queryName, curl }) => {
    try {
      // 创建或使用现有会话
      let sessionId = request?.sessionId;
      let requestId = `request-${Date.now()}`;
      
      if (!sessionId) {
        // 创建新会话
        sessionId = await createSession({
          description: prompt?.substring(0, 100) || '未命名会话',
          createdBy: 'user'
        });
      }
      
      // 存储请求信息
      await storeRequestInfo(sessionId, requestId, {
        timestamp: new Date().toISOString(),
        prompt,
        request,
        queryName,
        curl
      });
      
      // 更新会话信息
      await updateSessionInfo(sessionId, {
        requestCount: (await getSessionInfo(sessionId)).requestCount + 1,
        lastPrompt: prompt?.substring(0, 100)
      });
      
      // 执行查询
      const extractedData = await executeGrafanaQuery(request, queryName, curl);
      
      // 检查数据大小
      const dataSize = JSON.stringify(extractedData.data).length;
      const responseId = `response-${Date.now()}`;
      
      // 存储响应摘要
      await storeMonitoringDataInSession(
        sessionId,
        responseId,
        'summary',
        {
          type: extractedData.type,
          hasData: extractedData.hasData,
          status: extractedData.status,
          timestamp: extractedData.timestamp,
          metadata: extractedData.metadata,
          dataSize: dataSize,
          dataStructure: describeDataStructure(extractedData.data)
        }
      );
      
      // 如果数据较小，直接存储
      if (dataSize <= MAX_DATA_LENGTH) {
        await storeMonitoringDataInSession(
          sessionId,
          responseId,
          'data',
          extractedData.data
        );
        
        // 获取查询级别的AI配置
        const queryLevelConfig = queryName && config.queries?.[queryName] ? {
          systemPrompt: config.queries[queryName].systemPrompt,
          aiService: config.queries[queryName].aiService
        } : undefined;
        
        // AI分析
        const aiAnalysis = await analyzeWithAI(prompt, extractedData, config, queryLevelConfig);
        
        if (aiAnalysis) {
          await storeMonitoringDataInSession(
            sessionId,
            responseId,
            'analysis',
            aiAnalysis
          );
        }
        
        const result: AnalysisResult = {
          success: true,
          sessionId,
          requestId,
          responseId,
          extractedData,
          analysis: aiAnalysis ? {
            source: 'external_ai',
            content: aiAnalysis
          } : {
            source: 'client_ai',
            context: formatDataForClientAI(prompt, extractedData)
          },
          metadata: {
            timestamp: new Date().toISOString(),
            queryType: extractedData.type,
            hasData: extractedData.hasData,
            aiServiceConfigured: !!config?.aiService?.url
          }
        };
        
        return createResponse(result);
      }
      
      // 处理大型数据
      // 1. 分割数据并存储
      const chunks = splitDataIntoChunks(extractedData.data);
      const resourceLinks = [];
      
      // 存储数据块
      for (let i = 0; i < chunks.length; i++) {
        await storeMonitoringDataInSession(
          sessionId,
          responseId,
          `chunk-${i}`,
          chunks[i]
        );
        
        let chunkName = `数据块 ${i+1}`;
        
        // 如果是时间序列数据，使用更有意义的名称
        if (chunks[i]._meta?.seriesName) {
          chunkName = chunks[i]._meta.seriesName;
        } else if (chunks[i]._meta?.responseName) {
          chunkName = chunks[i]._meta.responseName;
        }
        
        resourceLinks.push({
          type: "resource" as const,
          resource: {
            uri: `monitoring-data://${sessionId}/${responseId}/chunk-${i}`,
            text: chunkName,
            mimeType: "application/json"
          }
        });
      }
      
      // 2. 更新会话索引
      await updateSessionInfo(sessionId, {
        lastResponseId: responseId,
        dataChunks: chunks.length
      });
      
      // 3. 构建响应
      return {
        content: [
          { 
            type: "text" as const, 
            text: `## Grafana监控数据分析\n\n**分析需求:** ${prompt}\n\n**数据概览:**\n- 类型: ${extractedData.type}\n- 时间戳: ${extractedData.timestamp}\n- 数据大小: ${(dataSize/1024).toFixed(2)} KB\n\n由于数据较大，已将其分成${chunks.length}个部分。请查看以下资源链接获取详细数据:`
          },
          {
            type: "resource" as const,
            resource: {
              uri: `monitoring-data-index://sessions`,
              text: "所有会话",
              mimeType: "application/json"
            }
          },
          {
            type: "resource" as const,
            resource: {
              uri: `monitoring-data-index://session/${sessionId}`,
              text: "当前会话",
              mimeType: "application/json"
            }
          },
          ...resourceLinks
        ]
      };
      
    } catch (error: any) {
      return createErrorResponse(error);
    }
  }
);

// 执行查询工具
server.tool(
  'execute_query',
  {
    request: z.object({
      url: z.string().describe('查询URL'),
      method: z.string().optional().describe('请求方法').default('POST'),
      headers: z.record(z.string()).optional().describe('请求头'),
      data: z.any().optional().describe('请求数据'),
      params: z.record(z.string()).optional().describe('URL参数'),
      timeout: z.number().optional().describe('超时时间（毫秒）'),
      axiosConfig: z.record(z.any()).optional().describe('自定义Axios配置'),
      sessionId: z.string().optional().describe('会话ID')
    }).optional().describe('查询请求配置'),
    queryName: z.string().optional().describe('预定义查询名称'),
    curl: z.string().optional().describe('curl命令字符串')
  },
  async ({ request, queryName, curl }) => {
    try {
      const extractedData = await executeGrafanaQuery(request, queryName, curl);
      
      return createResponse({
        success: true,
        data: extractedData,
        metadata: {
          timestamp: new Date().toISOString(),
          queryType: extractedData.type,
          hasData: extractedData.hasData
        }
      });
      
    } catch (error: any) {
      return createErrorResponse(error);
    }
  }
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

// 会话管理工具
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

// 聚合分析工具
server.tool(
  'analyze_session',
  {
    sessionId: z.string().describe('会话ID'),
    requestIds: z.array(z.string()).optional().describe('要分析的请求ID列表，不提供则分析所有请求'),
    prompt: z.string().describe('聚合分析的需求描述')
  },
  async ({ sessionId, requestIds, prompt }) => {
    try {
      // 获取会话信息
      const sessionInfo = await getSessionInfo(sessionId);
      
      // 获取请求列表
      let requests = await listSessionRequests(sessionId);
      
      // 如果指定了请求ID，则过滤
      if (requestIds && requestIds.length > 0) {
        requests = requests.filter(req => requestIds.includes(req.id));
      }
      
      if (requests.length === 0) {
        return createErrorResponse('没有找到可分析的请求');
      }
      
      // 获取每个请求对应的响应数据
      const responsesData = await Promise.all(
        requests.map(async (req) => {
          // 查找与请求关联的响应
          const responses = await listSessionResponses(sessionId);
          // 根据时间戳找到最接近请求时间的响应
          const reqTime = new Date(req.timestamp).getTime();
          let closestResponse = null;
          let minTimeDiff = Infinity;
          
          for (const resp of responses) {
            const respTime = new Date(resp.timestamp).getTime();
            const timeDiff = Math.abs(respTime - reqTime);
            if (timeDiff < minTimeDiff) {
              minTimeDiff = timeDiff;
              closestResponse = resp;
            }
          }
          
          if (!closestResponse) return null;
          
          try {
            // 获取响应数据
            let data;
            try {
              // 先尝试获取完整数据
              data = await getMonitoringDataFromSession(
                sessionId,
                closestResponse.id,
                'data'
              );
            } catch (e) {
              // 如果数据被分块，则尝试获取摘要和第一个块
              const summary = await getMonitoringDataFromSession(
                sessionId,
                closestResponse.id,
                'summary'
              );
              
              try {
                const chunk = await getMonitoringDataFromSession(
                  sessionId,
                  closestResponse.id,
                  'chunk-0'
                );
                
                data = {
                  ...summary,
                  sampleData: chunk,
                  isPartial: true
                };
              } catch (chunkError) {
                data = {
                  ...summary,
                  isPartial: true,
                  noDataAvailable: true
                };
              }
            }
            
            return {
              requestId: req.id,
              responseId: closestResponse.id,
              prompt: req.prompt,
              timestamp: req.timestamp,
              data
            };
          } catch (e) {
            console.error(`获取响应数据失败: ${e}`);
            return null;
          }
        })
      );
      
      // 过滤掉获取失败的响应
      const validResponses = responsesData.filter(Boolean);
      
      if (validResponses.length === 0) {
        return createErrorResponse('没有找到有效的响应数据');
      }
      
      // 生成聚合分析的上下文
      const context = {
        sessionInfo,
        prompt,
        responses: validResponses,
        timestamp: new Date().toISOString()
      };
      
      // 使用AI进行聚合分析
      const analysisResult = await analyzeWithAI(
        `请对以下多个监控数据进行聚合分析。用户需求：${prompt}`,
        {
          type: 'session-aggregate',
          hasData: validResponses.length > 0,
          status: 'ok',
          timestamp: new Date().toISOString(),
          data: context
        },
        config
      );
      
      // 存储聚合分析结果
      const aggregateId = `aggregate-${Date.now()}`;
      await storeMonitoringDataInSession(
        sessionId,
        aggregateId,
        'analysis',
        {
          prompt,
          timestamp: new Date().toISOString(),
          result: analysisResult,
          requests: requests.map(req => req.id)
        }
      );
      
      // 更新会话信息
      await updateSessionInfo(sessionId, {
        lastAggregateId: aggregateId,
        lastAggregateTimestamp: new Date().toISOString()
      });
      
      // 构建响应
      if (analysisResult) {
        return {
          content: [
            {
              type: "text" as const,
              text: `## 会话聚合分析\n\n**分析需求:** ${prompt}\n\n**分析结果:**\n\n${analysisResult}`
            },
            {
              type: "resource" as const,
              resource: {
                uri: `monitoring-data://${sessionId}/${aggregateId}/analysis`,
                text: "完整分析结果",
                mimeType: "application/json"
              }
            }
          ]
        };
      } else {
        // 如果外部AI分析失败，返回基本信息供客户端AI处理
        const formattedContext = formatDataForClientAI(
          prompt,
          {
            type: 'session-aggregate',
            hasData: true,
            status: 'ok',
            timestamp: new Date().toISOString(),
            data: {
              sessionInfo: {
                id: sessionInfo.id,
                created: sessionInfo.created,
                requestCount: sessionInfo.requestCount
              },
              responseCount: validResponses.length,
              responseSummaries: validResponses.map(r => {
                if (!r) return null;
                return {
                  requestId: r.requestId,
                  prompt: r.prompt,
                  dataType: r.data?.type || 'unknown',
                  timestamp: r.timestamp
                };
              }).filter(Boolean)
            }
          }
        );
        
        return createResponse({
          success: true,
          sessionId,
          aggregateId,
          requestCount: requests.length,
          validResponseCount: validResponses.length,
          context: formattedContext
        });
      }
      
    } catch (error: any) {
      return createErrorResponse(error);
    }
  }
);

// 报告生成工具
server.tool(
  'generate_report',
  {
    sessionId: z.string().describe('会话ID'),
    aggregateId: z.string().optional().describe('聚合分析ID，不提供则使用最新的'),
    format: z.enum(['markdown', 'html']).optional().default('markdown').describe('报告格式')
  },
  async ({ sessionId, aggregateId, format }) => {
    try {
      // 获取会话信息
      const sessionInfo = await getSessionInfo(sessionId);
      
      // 如果没有提供聚合ID，则使用最新的
      let actualAggregateId = aggregateId;
      if (!actualAggregateId) {
        if (!sessionInfo.lastAggregateId) {
          throw new Error('会话没有聚合分析结果');
        }
        actualAggregateId = sessionInfo.lastAggregateId;
      }
      
      // 获取聚合分析结果
      const analysis = await getMonitoringDataFromSession(
        sessionId,
        actualAggregateId,
        'analysis'
      );
      
      // 获取会话中的请求和响应
      const requests = await listSessionRequests(sessionId);
      const responses = await listSessionResponses(sessionId);
      
      // 生成报告
      const reportId = `report-${Date.now()}`;
      const reportData = {
        sessionInfo,
        analysis,
        requests,
        responses,
        format,
        timestamp: new Date().toISOString()
      };
      
      // 存储报告数据
      await storeMonitoringDataInSession(
        sessionId,
        reportId,
        'report',
        reportData
      );
      
      // 生成报告内容
      let reportContent = '';
      
      if (format === 'markdown') {
        reportContent = `# 监控数据分析报告

## 会话信息
- ID: ${sessionInfo.id}
- 创建时间: ${new Date(sessionInfo.created).toLocaleString()}
- 请求数量: ${sessionInfo.requestCount}

## 分析概要
${analysis.result || '无分析结果'}

## 请求列表
${requests.map((req, i) => `${i+1}. ${req.prompt || '无描述'} (${new Date(req.timestamp).toLocaleString()})`).join('\n')}

## 详细分析
请查看完整JSON报告获取更多详细信息。

## 生成时间
${new Date().toLocaleString()}
`;
      } else {
        // HTML格式
        reportContent = `<!DOCTYPE html>
<html>
<head>
  <title>监控数据分析报告 - ${sessionInfo.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #333; }
    .section { margin-bottom: 30px; }
    .request-item { margin-bottom: 10px; }
    .timestamp { color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>监控数据分析报告</h1>
  
  <div class="section">
    <h2>会话信息</h2>
    <p><strong>ID:</strong> ${sessionInfo.id}</p>
    <p><strong>创建时间:</strong> ${new Date(sessionInfo.created).toLocaleString()}</p>
    <p><strong>请求数量:</strong> ${sessionInfo.requestCount}</p>
  </div>
  
  <div class="section">
    <h2>分析概要</h2>
    <div>${analysis.result ? analysis.result.replace(/\n/g, '<br>') : '无分析结果'}</div>
  </div>
  
  <div class="section">
    <h2>请求列表</h2>
    <ul>
      ${requests.map(req => `<li class="request-item">
        <div>${req.prompt || '无描述'}</div>
        <div class="timestamp">${new Date(req.timestamp).toLocaleString()}</div>
      </li>`).join('')}
    </ul>
  </div>
  
  <div class="section">
    <h2>详细分析</h2>
    <p>请查看完整JSON报告获取更多详细信息。</p>
  </div>
  
  <div class="timestamp">
    生成时间: ${new Date().toLocaleString()}
  </div>
</body>
</html>`;
      }
      
      // 存储报告内容
      await storeMonitoringDataInSession(
        sessionId,
        reportId,
        'content',
        reportContent
      );
      
      // 更新会话信息
      await updateSessionInfo(sessionId, {
        lastReportId: reportId,
        lastReportTimestamp: new Date().toISOString()
      });
      
      return {
        content: [
          {
            type: "text" as const,
            text: format === 'markdown' ? reportContent : '报告已生成，请查看资源链接'
          },
          {
            type: "resource" as const,
            resource: {
              uri: `monitoring-data://${sessionId}/${reportId}/content`,
              text: "完整报告",
              mimeType: format === 'markdown' ? "text/markdown" : "text/html"
            }
          },
          {
            type: "resource" as const,
            resource: {
              uri: `monitoring-data://${sessionId}/${reportId}/report`,
              text: "报告数据",
              mimeType: "application/json"
            }
          }
        ]
      };
      
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
        hasAIService: !!config.aiService?.url,
        hasHealthCheck: !!config.healthCheck,
        queryCount: Object.keys(config.queries || {}).length
      },
      timestamp: new Date().toISOString()
    });
  }
);

// 启动服务器
async function main(): Promise<void> {
  try {
    config = await loadConfig(process.env.CONFIG_PATH);
    
    // 记录数据过期时间配置
    const dataExpiryHours = parseInt(process.env.MCP_DATA_EXPIRY_HOURS || '24', 10);
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('✅ Grafana查询分析MCP服务器已启动');
    console.error(`📊 服务器信息: ${SERVER_INFO.name} v${SERVER_INFO.version}`);
    console.error(`🔧 配置状态: ${Object.keys(config.queries || {}).length} 个查询`);
    console.error(`🗑️ 数据清理: ${dataExpiryHours}小时后自动清理`);
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ 未处理的错误:', error);
  process.exit(1);
}); 