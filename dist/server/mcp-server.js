#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeQuery, extractData, checkHealth } from '../datasources/grafana-client.js';
import { buildAnalysisGuidance, generateDataOverview } from '../services/monitoring-analyzer.js';
import { generateRequestId, storeRequestMetadata, storeResponseData, getResponseData, storeAnalysis, getAnalysis, listAllRequests, listRequestsBySession, getRequestStats, cleanupExpiredData } from '../services/data-store.js';
import { createSession, getSessionInfo, listSessions, deleteSession } from '../services/session-manager.js';
import { loadConfig } from '../services/config-manager.js';
// 读取版本号
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.resolve(__dirname, '../../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const SERVER_INFO = {
    name: 'grafana-mcp-analyzer',
    version: packageJson.version,
    description: `Grafana MCP分析器 - 监控数据查询和分析工具

🎯 核心功能：预定义查询、数据存储、AI分析指引、会话管理
📊 数据处理：支持任意大小数据，提供完整数据分析 
🔧 使用方式：list_queries查看可用查询，analyze_query进行分析`
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
// 验证查询配置是否存在
function validateQueryConfig(queryName) {
    const queries = getQueries();
    if (!queries[queryName]) {
        throw new Error(`查询配置不存在: ${queryName}`);
    }
    return queries[queryName];
}
// 构建ResourceLinks
function buildResourceLinks(storageResult, requestId) {
    return storageResult.type === 'chunked'
        ? storageResult.resourceUris || []
        : [storageResult.resourceUri || `monitoring-data://${requestId}/data`];
}
// 执行查询并存储数据的通用流程
async function executeAndStoreQuery(queryConfig, requestId, metadata) {
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
async function executeGrafanaQuery(request) {
    // 如果查询配置包含curl属性，直接传递给executeQuery函数处理
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
// 通用Resource处理器
function createResourceHandler(dataGetter) {
    return async (uri) => {
        try {
            const parts = uri.href.split('/');
            const data = await dataGetter(parts);
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
    };
}
// 注册监控数据资源
server.resource("monitoring-data", "monitoring-data://{requestId}/{dataType}", {
    title: "监控数据",
    description: "Grafana监控数据资源查看器"
}, createResourceHandler(async (parts) => {
    const requestId = parts[2];
    const dataType = parts[3];
    if (dataType === 'analysis') {
        return await getAnalysis(requestId);
    }
    else if (dataType?.startsWith('chunk-')) {
        return await getResponseData(requestId, dataType);
    }
    else {
        return await getResponseData(requestId);
    }
}));
// 请求列表资源
server.resource("monitoring-data-index", "monitoring-data-index://requests", {
    title: "所有请求",
    description: "查看所有可用的监控请求"
}, createResourceHandler(async () => await listAllRequests()));
// 会话请求列表资源
server.resource("monitoring-data-index", "monitoring-data-index://session/{sessionId}", {
    title: "会话请求",
    description: "查看指定会话中的所有请求"
}, createResourceHandler(async (parts) => {
    const sessionId = parts.pop() || '';
    return await listRequestsBySession(sessionId);
}));
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
// 分析单个查询工具
server.tool('analyze_query', {
    queryName: z.string().describe('查询名称（从配置文件获取）'),
    prompt: z.string().describe('分析需求描述'),
    sessionId: z.string().optional().describe('会话ID（可选）')
}, async ({ queryName, prompt, sessionId }) => {
    try {
        const queryConfig = validateQueryConfig(queryName);
        const requestId = generateRequestId();
        const { result, storageResult, resourceLinks } = await executeAndStoreQuery(queryConfig, requestId, { prompt, sessionId });
        // 生成数据概览和分析指引
        const dataOverview = generateDataOverview(result);
        const analysisGuidance = buildAnalysisGuidance(prompt, requestId, dataOverview, resourceLinks, queryConfig);
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
            resourceLinks,
            analysisGuidance,
            message: `## 查询分析完成\n\n**查询:** ${queryName}\n**请求ID:** ${requestId}\n**数据大小:** ${(storageResult.size / 1024).toFixed(2)} KB\n**存储类型:** ${storageResult.type}\n\n${analysisGuidance}`
        });
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
// 仅查询数据工具
server.tool('query_data', {
    queryName: z.string().describe('查询名称（从配置文件获取）'),
    description: z.string().optional().describe('查询描述'),
    sessionId: z.string().optional().describe('会话ID（可选）')
}, async ({ queryName, description, sessionId }) => {
    try {
        const queryConfig = validateQueryConfig(queryName);
        const requestId = generateRequestId();
        const prompt = description || `查询 ${queryName} 数据`;
        const { storageResult } = await executeAndStoreQuery(queryConfig, requestId, { prompt, sessionId });
        const responseText = `## 查询完成\n\n**查询:** ${queryName}\n**请求ID:** ${requestId}\n**数据大小:** ${(storageResult.size / 1024).toFixed(2)} KB\n**存储类型:** ${storageResult.type}\n**时间戳:** ${new Date().toISOString()}\n\n数据已存储，可用于后续分析。`;
        return createResponse({
            requestId,
            queryName,
            dataSize: storageResult.size,
            storageType: storageResult.type,
            message: responseText,
            hasData: storageResult.size > 0
        });
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
// 聚合分析工具
server.tool('aggregate_analyze', {
    queryNames: z.array(z.string()).describe('查询名称列表（从配置文件获取）'),
    prompt: z.string().describe('聚合分析需求描述'),
    sessionId: z.string().optional().describe('会话ID（可选）')
}, async ({ queryNames, prompt, sessionId }) => {
    try {
        const queries = getQueries();
        const allResults = [];
        const requestIds = [];
        let totalSize = 0;
        // 逐个执行查询
        for (const queryName of queryNames) {
            if (!queries[queryName]) {
                return createErrorResponse(`查询配置不存在: ${queryName}`);
            }
            const queryConfig = queries[queryName];
            const requestId = generateRequestId();
            requestIds.push(requestId);
            // 存储请求元数据
            await storeRequestMetadata(requestId, {
                timestamp: new Date().toISOString(),
                url: queryConfig.url,
                method: queryConfig.method || 'POST',
                params: queryConfig.params,
                data: queryConfig.data,
                prompt: `聚合分析的一部分: ${queryName}`,
                sessionId
            });
            // 执行查询
            const result = await executeGrafanaQuery(queryConfig);
            // 存储响应数据
            const storageResult = await storeResponseData(requestId, result);
            totalSize += storageResult.size;
            allResults.push({
                queryName,
                requestId,
                data: result,
                size: storageResult.size,
                storageType: storageResult.type,
                resourceUris: storageResult.resourceUris,
                resourceUri: storageResult.resourceUri
            });
        }
        // 构建聚合分析的数据概览
        const aggregateOverview = {
            type: 'aggregate-analysis',
            hasData: true,
            status: 'ok',
            timestamp: new Date().toISOString(),
            queryNames,
            totalSize,
            requestIds,
            stats: {
                queryCount: queryNames.length,
                totalDataSize: totalSize,
                averageDataSize: totalSize / queryNames.length
            }
        };
        // 构建所有ResourceLinks
        const allResourceLinks = allResults.flatMap(result => {
            return result.storageType === 'chunked'
                ? result.resourceUris || []
                : [result.resourceUri || `monitoring-data://${result.requestId}/data`];
        });
        // 构建聚合分析指引
        const aggregateGuidance = buildAnalysisGuidance(`聚合分析需求: ${prompt}`, requestIds[0], // 主要请求ID
        aggregateOverview, allResourceLinks, { systemPrompt: `您是一个专业的聚合数据分析专家。请对多个查询的聚合数据进行综合分析：
1. 跨查询的关联性分析和整体趋势识别
2. 多维度数据对比和异常模式检测
3. 系统性能瓶颈和资源利用率分析
4. 业务影响的全局评估和风险预警
5. 综合优化建议和系统改进方案

请提供全面的聚合分析报告，包含跨查询的关联分析和整体优化建议。` });
        // 存储聚合分析指引到第一个请求
        await storeAnalysis(requestIds[0], {
            prompt,
            timestamp: new Date().toISOString(),
            result: aggregateGuidance,
            type: 'aggregate',
            queryNames,
            requestIds,
            dataOverview: aggregateOverview,
            resourceLinks: allResourceLinks
        });
        return createResponse({
            success: true,
            requestIds,
            queryNames,
            totalSize,
            resourceLinks: allResourceLinks,
            aggregateGuidance,
            message: `## 聚合分析完成\n\n**查询:** ${queryNames.join(', ')}\n**分析需求:** ${prompt}\n**数据总大小:** ${(totalSize / 1024).toFixed(2)} KB\n**请求数量:** ${requestIds.length}\n\n${aggregateGuidance}`
        });
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
// 批量分析工具
server.tool('batch_analyze', {
    queryNames: z.array(z.string()).describe('查询名称列表（从配置文件获取）'),
    prompt: z.string().describe('批量分析需求描述'),
    sessionId: z.string().optional().describe('会话ID（可选）')
}, async ({ queryNames, prompt, sessionId }) => {
    try {
        const queries = getQueries();
        const allResults = [];
        // 逐个执行查询和分析
        for (const queryName of queryNames) {
            if (!queries[queryName]) {
                return createErrorResponse(`查询配置不存在: ${queryName}`);
            }
            const queryConfig = queries[queryName];
            const requestId = generateRequestId();
            // 存储请求元数据
            await storeRequestMetadata(requestId, {
                timestamp: new Date().toISOString(),
                url: queryConfig.url,
                method: queryConfig.method || 'POST',
                params: queryConfig.params,
                data: queryConfig.data,
                prompt: `批量分析: ${queryName} - ${prompt}`,
                sessionId
            });
            // 执行查询
            const result = await executeGrafanaQuery(queryConfig);
            // 存储响应数据
            const storageResult = await storeResponseData(requestId, result);
            // 为每个查询生成分析指引
            const dataOverview = generateDataOverview(result);
            const resourceLinks = storageResult.type === 'chunked'
                ? storageResult.resourceUris || []
                : [storageResult.resourceUri || `monitoring-data://${requestId}/data`];
            const analysisGuidance = buildAnalysisGuidance(`${prompt} - 针对 ${queryName}`, requestId, dataOverview, resourceLinks, queryConfig);
            // 存储分析指引
            await storeAnalysis(requestId, {
                prompt: `${prompt} - 针对 ${queryName}`,
                timestamp: new Date().toISOString(),
                result: analysisGuidance,
                queryName,
                dataOverview,
                resourceLinks
            });
            allResults.push({
                queryName,
                requestId,
                dataSize: storageResult.size,
                storageType: storageResult.type,
                analysisGuidance,
                resourceLinks
            });
        }
        // 构建批量分析响应
        const summary = `## 批量分析完成\n\n**查询数量:** ${queryNames.length}\n**分析需求:** ${prompt}\n\n`;
        const details = allResults.map(result => {
            const resultText = `### ${result.queryName}\n**数据大小:** ${(result.dataSize / 1024).toFixed(2)} KB\n**存储类型:** ${result.storageType}\n**分析指引:**\n${result.analysisGuidance}`;
            return resultText;
        }).join('\n\n');
        return createResponse({
            success: true,
            results: allResults,
            message: summary + details
        });
    }
    catch (error) {
        return createErrorResponse(error);
    }
});
// 简化的会话管理工具
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
// 列出数据工具
server.tool('list_data', {
    sessionId: z.string().optional().describe('会话ID，不提供则列出所有数据'),
    limit: z.number().optional().default(10).describe('返回数量限制')
}, async ({ sessionId, limit }) => {
    try {
        let requests;
        if (sessionId) {
            requests = await listRequestsBySession(sessionId);
        }
        else {
            requests = await listAllRequests();
        }
        // 限制返回数量
        const limitedRequests = requests.slice(0, limit);
        // 获取每个请求的统计信息
        const requestsWithStats = await Promise.all(limitedRequests.map(async (req) => {
            try {
                const stats = await getRequestStats(req.id);
                return stats;
            }
            catch (error) {
                return {
                    requestId: req.id,
                    timestamp: req.timestamp,
                    prompt: req.prompt,
                    sessionId: req.sessionId,
                    error: 'Failed to get stats'
                };
            }
        }));
        return createResponse({
            data: requestsWithStats,
            total: requests.length,
            returned: limitedRequests.length,
            sessionId: sessionId || 'all'
        });
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
        const dataExpiryHours = parseInt(process.env.DATA_EXPIRY_HOURS || '24', 10);
        // 启动时立即执行一次清理
        try {
            const initialCleanup = await cleanupExpiredData(false, dataExpiryHours);
            if (initialCleanup > 0) {
                console.error(`🗑️ 服务启动清理完成，删除了 ${initialCleanup} 个过期请求`);
            }
        }
        catch (error) {
            console.error('❌ 启动时数据清理失败:', error);
        }
        // 设置定时清理任务，每小时执行一次
        setInterval(async () => {
            try {
                const deletedCount = await cleanupExpiredData(false, dataExpiryHours);
                if (deletedCount > 0) {
                    console.error(`🗑️ 定时清理完成，删除了 ${deletedCount} 个过期请求`);
                }
            }
            catch (error) {
                console.error('❌ 定时数据清理失败:', error);
            }
        }, 60 * 60 * 1000); // 1小时 = 60 * 60 * 1000毫秒
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error('✅ Grafana查询分析MCP服务器已启动');
        console.error(`📊 服务器信息: ${SERVER_INFO.name} v${SERVER_INFO.version}`);
        console.error(`🔧 配置状态: ${Object.keys(config.queries || {}).length} 个查询`);
        console.error(`🗑️ 数据清理: ${dataExpiryHours}小时后自动清理，每小时检查一次`);
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