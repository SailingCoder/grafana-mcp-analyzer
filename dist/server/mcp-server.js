#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeQuery, extractData, checkHealth } from '../datasources/grafana-client.js';
import { analyzeWithAI, formatDataForClientAI } from '../services/monitoring-analyzer.js';
import { generateRequestId, storeRequestMetadata, storeResponseData, getResponseData, storeAnalysis, getAnalysis, listAllRequests, listRequestsBySession } from '../services/data-store.js';
import { createSession, getSessionInfo, listSessions, deleteSession } from '../services/session-manager.js';
import { loadConfig } from '../services/config-manager.js';
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
};
// 全局配置
let config = {};
// 工具函数
function createResponse(data, isError = false) {
    return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        ...(isError && { isError: true })
    };
}
function createErrorResponse(error) {
    const errorMessage = error instanceof Error ? error.message : error;
    return createResponse({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
    }, true);
}
// 执行查询
async function executeGrafanaQuery(request) {
    const queryResponse = await executeQuery(request, config.baseUrl || '');
    if (!queryResponse.success) {
        throw new Error(`查询执行失败: ${queryResponse.error}`);
    }
    return extractData(queryResponse);
}
// MCP服务器
const server = new McpServer(SERVER_INFO);
// 获取配置中的查询
function getQueries() {
    return config.queries || {};
}
// 注册监控数据资源 - 新的请求模式
server.resource("monitoring-data", "monitoring-data://{requestId}/{dataType}", {
    title: "监控数据",
    description: "Grafana监控数据资源查看器"
}, async (uri) => {
    try {
        // 从URI中提取参数
        const parts = uri.href.split('/');
        const requestId = parts[2];
        const dataType = parts[3];
        let data;
        if (dataType === 'analysis') {
            data = await getAnalysis(requestId);
        }
        else if (dataType.startsWith('chunk-')) {
            data = await getResponseData(requestId, dataType);
        }
        else {
            data = await getResponseData(requestId);
        }
        return {
            contents: [{
                    uri: uri.href,
                    text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
                    mimeType: "application/json"
                }]
        };
    }
    catch (error) {
        return {
            contents: [{
                    uri: uri.href,
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                    mimeType: "text/plain"
                }]
        };
    }
});
// 请求列表资源
server.resource("monitoring-data-index", "monitoring-data-index://requests", {
    title: "所有请求",
    description: "查看所有可用的监控请求"
}, async (uri) => {
    try {
        const requests = await listAllRequests();
        return {
            contents: [{
                    uri: uri.href,
                    text: JSON.stringify(requests, null, 2),
                    mimeType: "application/json"
                }]
        };
    }
    catch (error) {
        return {
            contents: [{
                    uri: uri.href,
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                    mimeType: "text/plain"
                }]
        };
    }
});
// 会话请求列表资源
server.resource("monitoring-data-index", "monitoring-data-index://session/{sessionId}", {
    title: "会话请求",
    description: "查看指定会话中的所有请求"
}, async (uri) => {
    try {
        const sessionId = uri.href.split('/').pop() || '';
        const requests = await listRequestsBySession(sessionId);
        return {
            contents: [{
                    uri: uri.href,
                    text: JSON.stringify(requests, null, 2),
                    mimeType: "application/json"
                }]
        };
    }
    catch (error) {
        return {
            contents: [{
                    uri: uri.href,
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                    mimeType: "text/plain"
                }]
        };
    }
});
// 健康检查工具
server.tool('check_health', {
    timeout: z.number().optional().describe('超时时间（毫秒）'),
    expectedStatus: z.number().optional().describe('期望的HTTP状态码')
}, async ({ timeout, expectedStatus }) => {
    try {
        let healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString()
        };
        if (config.baseUrl && config.healthCheck) {
            const healthUrl = `${config.baseUrl}/${config.healthCheck.url}`;
            healthStatus = await checkHealth(healthUrl, { timeout, expectedStatus });
        }
        return createResponse(healthStatus);
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
// 查询列表工具
server.tool('list_queries', {
    includeConfig: z.boolean().optional().describe('是否包含完整配置信息').default(false)
}, async ({ includeConfig }) => {
    const queries = config.queries ? Object.keys(config.queries) : [];
    return createResponse({
        queries,
        count: queries.length,
        ...(includeConfig && { config: config.queries || {} })
    });
});
// 会话管理工具
server.tool('manage_sessions', {
    action: z.enum(['list', 'create', 'get', 'delete']).describe('操作类型'),
    sessionId: z.string().optional().describe('会话ID'),
    metadata: z.record(z.any()).optional().describe('会话元数据')
}, async ({ action, sessionId, metadata }) => {
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
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
// 聚合分析工具
server.tool('analyze_session', {
    sessionId: z.string().describe('会话ID'),
    requestIds: z.array(z.string()).optional().describe('要分析的请求ID列表，不提供则分析所有请求'),
    prompt: z.string().describe('聚合分析的需求描述')
}, async ({ sessionId, requestIds, prompt }) => {
    try {
        // 获取请求列表
        let requests = await listRequestsBySession(sessionId);
        // 如果指定了请求ID，则过滤
        if (requestIds && requestIds.length > 0) {
            requests = requests.filter(req => requestIds.includes(req.id));
        }
        if (requests.length === 0) {
            return createErrorResponse('没有找到可分析的请求');
        }
        // 获取每个请求对应的响应数据
        const responsesData = await Promise.all(requests.map(async (req) => {
            try {
                const data = await getResponseData(req.id);
                return {
                    requestId: req.id,
                    prompt: req.prompt,
                    timestamp: req.timestamp,
                    data
                };
            }
            catch (e) {
                console.error(`获取请求数据失败: ${req.id}`, e);
                return null;
            }
        }));
        // 过滤掉获取失败的响应
        const validResponses = responsesData.filter(Boolean);
        if (validResponses.length === 0) {
            return createErrorResponse('没有找到有效的响应数据');
        }
        // 生成聚合分析的上下文
        const context = {
            sessionId,
            prompt,
            responses: validResponses,
            timestamp: new Date().toISOString()
        };
        // 使用AI进行聚合分析
        const analysisResult = await analyzeWithAI(`请对以下多个监控数据进行聚合分析。用户需求：${prompt}`, {
            type: 'session-aggregate',
            hasData: validResponses.length > 0,
            status: 'ok',
            timestamp: new Date().toISOString(),
            data: context
        }, config);
        // 生成聚合分析请求ID
        const aggregateId = generateRequestId();
        // 存储聚合分析元数据
        await storeRequestMetadata(aggregateId, {
            timestamp: new Date().toISOString(),
            url: 'internal://aggregate-analysis',
            method: 'POST',
            data: { sessionId, requestIds: requests.map(r => r.id) },
            prompt,
            sessionId
        });
        // 存储聚合分析结果
        await storeAnalysis(aggregateId, {
            prompt,
            timestamp: new Date().toISOString(),
            result: analysisResult,
            requests: requests.map(req => req.id),
            type: 'aggregate'
        });
        // 构建响应
        if (analysisResult) {
            return {
                content: [
                    {
                        type: "text",
                        text: `## 会话聚合分析\n\n**分析需求:** ${prompt}\n\n**分析结果:**\n\n${analysisResult}`
                    },
                    {
                        type: "resource",
                        resource: {
                            uri: `monitoring-data://${aggregateId}/analysis`,
                            text: "完整分析结果",
                            mimeType: "application/json"
                        }
                    }
                ]
            };
        }
        else {
            // 如果外部AI分析失败，返回基本信息供客户端AI处理
            const formattedContext = formatDataForClientAI(prompt, {
                type: 'session-aggregate',
                hasData: true,
                status: 'ok',
                timestamp: new Date().toISOString(),
                data: {
                    sessionId,
                    responseCount: validResponses.length,
                    responseSummaries: validResponses.map(r => {
                        if (!r)
                            return null;
                        return {
                            requestId: r.requestId,
                            prompt: r.prompt,
                            dataType: r.data?.type || 'unknown',
                            timestamp: r.timestamp
                        };
                    }).filter(Boolean)
                }
            });
            return createResponse({
                success: true,
                aggregateId,
                requestCount: requests.length,
                validResponseCount: validResponses.length,
                context: formattedContext
            });
        }
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
// 报告生成工具
server.tool('generate_report', {
    sessionId: z.string().describe('会话ID'),
    aggregateId: z.string().optional().describe('聚合分析ID，不提供则使用最新的'),
    format: z.enum(['markdown', 'html']).optional().default('markdown').describe('报告格式')
}, async ({ sessionId, aggregateId, format }) => {
    try {
        // 获取会话中的请求
        const requests = await listRequestsBySession(sessionId);
        if (requests.length === 0) {
            return createErrorResponse('会话中没有找到请求');
        }
        // 如果没有提供聚合ID，查找最新的聚合分析
        let actualAggregateId = aggregateId;
        if (!actualAggregateId) {
            const aggregateRequests = requests.filter(req => req.url === 'internal://aggregate-analysis');
            if (aggregateRequests.length === 0) {
                return createErrorResponse('会话没有聚合分析结果');
            }
            // 使用最新的聚合分析
            actualAggregateId = aggregateRequests[0].id;
        }
        // 获取聚合分析结果
        const analysis = await getAnalysis(actualAggregateId);
        // 生成报告
        const reportId = generateRequestId();
        // 存储报告元数据
        await storeRequestMetadata(reportId, {
            timestamp: new Date().toISOString(),
            url: 'internal://report-generation',
            method: 'POST',
            data: { sessionId, aggregateId: actualAggregateId, format },
            prompt: `生成${format}格式报告`,
            sessionId
        });
        // 生成报告内容
        let reportContent = '';
        if (format === 'markdown') {
            reportContent = `# 监控数据分析报告

## 会话信息
- 会话ID: ${sessionId}
- 请求数量: ${requests.length}
- 生成时间: ${new Date().toLocaleString()}

## 分析概要
${analysis.result || '无分析结果'}

## 请求列表
${requests.map((req, i) => `${i + 1}. ${req.prompt || '无描述'} (${new Date(req.timestamp).toLocaleString()})`).join('\n')}

## 详细分析
请查看完整JSON报告获取更多详细信息。
`;
        }
        else {
            // HTML格式
            reportContent = `<!DOCTYPE html>
<html>
<head>
  <title>监控数据分析报告 - ${sessionId}</title>
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
    <p><strong>会话ID:</strong> ${sessionId}</p>
    <p><strong>请求数量:</strong> ${requests.length}</p>
    <p><strong>生成时间:</strong> ${new Date().toLocaleString()}</p>
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
</body>
</html>`;
        }
        // 存储报告内容
        await storeResponseData(reportId, reportContent);
        // 存储报告数据
        await storeAnalysis(reportId, {
            sessionId,
            analysis,
            requests,
            format,
            timestamp: new Date().toISOString(),
            type: 'report'
        });
        return {
            content: [
                {
                    type: "text",
                    text: format === 'markdown' ? reportContent : '报告已生成，请查看资源链接'
                },
                {
                    type: "resource",
                    resource: {
                        uri: `monitoring-data://${reportId}/data/full`,
                        text: "完整报告",
                        mimeType: format === 'markdown' ? "text/markdown" : "text/html"
                    }
                },
                {
                    type: "resource",
                    resource: {
                        uri: `monitoring-data://${reportId}/analysis`,
                        text: "报告数据",
                        mimeType: "application/json"
                    }
                }
            ]
        };
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
// 服务器状态工具
server.tool('server_status', {}, async () => {
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
});
// 启动服务器
async function main() {
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
    }
    catch (error) {
        console.error('❌ 服务器启动失败:', error);
        process.exit(1);
    }
}
main().catch((error) => {
    console.error('❌ 未处理的错误:', error);
    process.exit(1);
});
//# sourceMappingURL=mcp-server.js.map