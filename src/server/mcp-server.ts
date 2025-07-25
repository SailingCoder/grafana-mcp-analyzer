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
  getAnalysis
} from '../services/data-store.js';
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
      description: '检查Grafana服务连接状态（故障排查时使用）',
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
      description: '查看可用的Grafana查询配置（分析前查看可用查询）',
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
      description: '🚫 禁止使用curl！这是获取和分析单个Grafana查询的唯一正确方式！此工具会自动执行查询、分块存储数据并提供分析指引。**🎯 推荐使用chunk_workflow工具自动获取所有分块，按顺序处理，直到complete为止！**',
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
        
        // 第二步：数据已通过processDataWithStrategy处理，无需额外验证
        // 数据存储验证已在内置处理流程中完成
        
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
          // 直接使用原始数据，避免重复读取存储的数据
          dataOverview = generateDataOverview(result);
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
            : "请按照message中的指引，使用chunk_workflow工具获取数据并进行一次性完整分析。数据已完整，无需重复执行analyze_query"
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
      description: '🚫 禁止使用curl！这是聚合分析多个Grafana查询的唯一正确方式！此工具会自动执行多个查询、分块存储数据并提供聚合分析指引。**🎯 推荐使用chunk_workflow工具自动获取所有分块，按顺序处理，直到complete为止！**',
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
          
          // 数据已通过processDataWithStrategy处理，无需额外验证
          // 数据存储验证已在内置处理流程中完成
          
          // 生成数据概览
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
        
        return createResponse({
          success: true,
          aggregateRequestId,
          queryNames,
          totalDataSize,
          queryDetails,
          resourceLinks: allResourceLinks,
          message: aggregateAnalysisGuidance,
          type: 'aggregate_analysis',
          analysisMode: supportsResources ? 'resources-based' : 'tool-based',
          dataReady: true,
          analysisInstructions: supportsResources
            ? "请按照message中的指引，通过resourceLinks获取实际数据并进行一次性完整聚合分析"
            : "请按照message中的指引，使用chunk_workflow工具获取数据并进行一次性完整聚合分析。数据已完整，无需重复执行analyze_query"
        });
        
      } catch (error: any) {
        return createErrorResponse(error);
      }
    }
  );

  // 工作流状态持久化函数
  async function saveWorkflowState(requestId: string, state: any) {
    try {
      const dataStoreRoot = process.env.DATA_STORE_ROOT || path.join(os.homedir(), '.grafana-mcp-analyzer', 'data-store');
      const workflowDir = path.join(dataStoreRoot, requestId);
      const fs = await import('fs/promises');
      await fs.mkdir(workflowDir, { recursive: true });
      await fs.writeFile(
        path.join(workflowDir, 'workflow-state.json'),
        JSON.stringify(state, null, 2)
      );
    } catch (error) {
      console.error(`[Workflow] 保存状态失败: ${error}`);
            }
  }
  
  async function loadWorkflowState(requestId: string) {
    try {
      const dataStoreRoot = process.env.DATA_STORE_ROOT || path.join(os.homedir(), '.grafana-mcp-analyzer', 'data-store');
      const workflowFile = path.join(dataStoreRoot, requestId, 'workflow-state.json');
      const fs = await import('fs/promises');
      const data = await fs.readFile(workflowFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
      }
    }

  // 工作流管理工具
  server.registerTool(
          'chunk_workflow',
      {
        title: '分块数据工作流',
        description: `🎯 **推荐使用此工具！** 这是管理分块数据获取工作流的自动化方式！此工具会自动管理分块获取流程，确保数据完整性。必须先使用analyze_query工具存储数据。**请优先使用此工具自动获取所有分块，按顺序处理，直到complete为止！** 支持自动恢复和连续执行，AI可以自动连续调用next动作直到完成。**重要：获取完所有分块后，必须立即进行完整分析并输出详细报告！**`,
      inputSchema: {
        requestId: z.string().describe('请求ID（必须先使用analyze_query工具获取）'),
        action: z.enum(['start', 'next', 'status', 'complete']).describe('工作流动作：start(开始)/next(下一个分块)/status(状态)/complete(完成)')
      }
    },
    async ({ requestId, action }) => {
      try {
        // 加载数据（支持分块和完整数据）
        const chunkingResult = await loadChunks(requestId);
        const totalChunks = chunkingResult.chunks.length;
        const isChunked = chunkingResult.metadata.chunkingStrategy !== 'full';
        
        // 获取或创建工作流状态
        let workflowState = await loadWorkflowState(requestId);
        
        // 如果没有工作流状态，创建一个新的
        if (!workflowState) {
          workflowState = {
            currentStep: 0,
            retrievedChunks: [],
            status: 'idle',
            totalChunks: 0
          };
        }

        switch (action) {
          case 'start':
            workflowState = {
              currentStep: 1,
              retrievedChunks: [],
              status: 'running',
              totalChunks
            };
            await saveWorkflowState(requestId, workflowState);
            
            return createResponse({
              success: true,
              requestId,
              message: isChunked 
                ? `🚀 工作流已启动！共${totalChunks}个分块需要获取。`
                : `🚀 工作流已启动！数据已完整存储，无需分块。`,
              workflow: {
                step: 1,
                totalSteps: totalChunks + 1,
                action: isChunked ? 'get_metadata' : 'get_full_data',
                nextAction: isChunked ? 'get_chunk_1' : 'get_full_data'
              },
              instruction: isChunked 
                ? `请调用此工具执行'next'动作获取第一个分块。`
                : `请调用此工具执行'next'动作获取完整数据。`
            });

          case 'next':
            // 如果工作流未启动，自动启动
            if (workflowState.status !== 'running') {
              workflowState = {
                currentStep: 1,
                retrievedChunks: [],
                status: 'running',
                totalChunks
              };
              await saveWorkflowState(requestId, workflowState);
                  }

            // 如果当前步骤为0，从1开始
            if (workflowState.currentStep === 0) {
              workflowState.currentStep = 1;
              await saveWorkflowState(requestId, workflowState);
              }

            const currentChunk = workflowState.currentStep;
            if (currentChunk > totalChunks) {
              workflowState.status = 'completed';
              await saveWorkflowState(requestId, workflowState);
        
        return createResponse({
                success: true,
                requestId,
                message: `✅ 工作流完成！已获取所有${totalChunks}个分块。`,
                workflow: {
                  step: totalChunks + 1,
                  totalSteps: totalChunks + 1,
                  status: 'completed',
                  retrievedChunks: workflowState.retrievedChunks
                },
                instruction: `🎯 所有数据已获取完成！现在必须基于获取到的${totalChunks}个分块数据进行完整分析。请立即开始分析并输出详细报告！`,
                analysisRequired: true,
                dataReady: true,
                totalChunksRetrieved: totalChunks
              });
            }

            // 获取当前分块
            const chunk = chunkingResult.chunks.find(c => c.index === currentChunk);
            if (!chunk) {
              return createErrorResponse(`分块${currentChunk}不存在`);
            }

            workflowState.retrievedChunks.push(currentChunk);
            workflowState.currentStep = currentChunk + 1;
            await saveWorkflowState(requestId, workflowState);

      return createResponse({
              success: true,
              requestId,
              message: isChunked 
                ? `📦 分块${currentChunk}/${totalChunks}获取成功！`
                : `📦 完整数据获取成功！`,
              workflow: {
                step: currentChunk + 1,
                totalSteps: totalChunks + 1,
                progress: isChunked ? `${currentChunk}/${totalChunks}` : '1/1',
                retrievedChunks: workflowState.retrievedChunks,
                nextAction: currentChunk < totalChunks ? 'get_chunk_' + (currentChunk + 1) : 'complete'
              },
              chunk: {
                index: chunk.index,
                type: chunk.type,
                contentType: chunk.contentType,
                size: chunk.size,
                content: chunk.content
              },
              instruction: currentChunk < totalChunks 
                ? (isChunked 
                  ? `请继续调用此工具执行'next'动作获取下一个分块。系统会自动继续执行，无需手动干预。`
                  : `请调用此工具执行'complete'动作完成工作流。`)
                : `请调用此工具执行'complete'动作完成工作流。`,
              autoContinue: currentChunk < totalChunks && isChunked,
              nextStep: currentChunk < totalChunks ? 'next' : 'complete'
            });

          case 'status':
            return createResponse({
              success: true,
              requestId,
              message: `📊 工作流状态：${workflowState.status}`,
              workflow: {
                step: workflowState.currentStep,
                totalSteps: totalChunks + 1,
                progress: workflowState.retrievedChunks.length > 0 
                  ? `${workflowState.retrievedChunks.length}/${totalChunks}`
                  : '0/0',
                retrievedChunks: workflowState.retrievedChunks,
                status: workflowState.status
              }
            });

          case 'complete':
            workflowState.status = 'completed';
            await saveWorkflowState(requestId, workflowState);
        
        return createResponse({
          success: true,
          requestId,
              message: `✅ 工作流已完成！共获取了${workflowState.retrievedChunks.length}个分块。`,
              workflow: {
                step: totalChunks + 1,
                totalSteps: totalChunks + 1,
                status: 'completed',
                retrievedChunks: workflowState.retrievedChunks
              },
              instruction: `🎯 所有数据已获取完成！现在必须基于获取到的${workflowState.retrievedChunks.length}个分块数据进行完整分析。请立即开始分析并输出详细报告！`,
              analysisRequired: true,
              dataReady: true,
              totalChunksRetrieved: workflowState.retrievedChunks.length
            });

          default:
            return createErrorResponse('无效的工作流动作');
        }
        
      } catch (error: any) {
        console.error(`[Chunk Workflow Tool] 工作流执行失败: ${error.message}`);
        return createErrorResponse(`工作流执行失败: ${error.message}`);
      }
    }
  );

  return server;
} 