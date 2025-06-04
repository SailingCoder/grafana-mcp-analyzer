#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeQuery, extractData, checkHealth } from '../datasources/grafana-client.js';
import { analyzeWithAI, formatDataForClientAI } from '../services/monitoring-analyzer.js';
import { parseCurlCommand } from '../datasources/curl-parser.js';
import { isValidHttpMethod } from '../types/index.js';
// 基本配置
const DEFAULT_CONFIG_PATH = './config/query-config.simple.js';
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
// 配置加载
async function loadConfig() {
    try {
        const configPath = process.env['CONFIG_PATH'] || DEFAULT_CONFIG_PATH;
        const resolvedPath = path.resolve(process.cwd(), configPath);
        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`配置文件不存在: ${resolvedPath}`);
        }
        const fileUrl = `file://${resolvedPath}`;
        const configModule = await import(fileUrl);
        const loadedConfig = configModule.default || configModule;
        if (!loadedConfig || typeof loadedConfig !== 'object') {
            throw new Error('配置文件格式无效');
        }
        console.error('✅ 配置加载成功，包含查询:', Object.keys(loadedConfig.queries || {}).length, '个');
        return loadedConfig;
    }
    catch (error) {
        console.warn('⚠️ 配置文件加载失败，使用默认配置:', error.message);
        return {
            baseUrl: 'https://your-grafana-instance.com',
            defaultHeaders: { 'Content-Type': 'application/json' },
            queries: {}
        };
    }
}
// 执行查询
async function executeGrafanaQuery(request, queryName, curl) {
    let queryConfig;
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
    }
    else if (curl) {
        // 直接解析curl命令
        queryConfig = parseCurlCommand(curl);
        // 应用默认headers，但curl中的headers优先级更高
        queryConfig.headers = { ...config.defaultHeaders, ...queryConfig.headers };
    }
    else if (request) {
        const method = request.method || 'POST';
        queryConfig = {
            url: request.url,
            method: isValidHttpMethod(method) ? method : 'POST',
            headers: { ...config.defaultHeaders, ...request.headers },
            data: request.data,
            ...(request.params && { params: request.params }),
            ...(request.timeout && { timeout: request.timeout }),
            ...(request.axiosConfig && { axiosConfig: request.axiosConfig })
        };
    }
    else {
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
// 分析查询工具
server.tool('analyze_query', {
    prompt: z.string().describe('分析需求描述'),
    request: z.object({
        url: z.string().describe('查询URL'),
        method: z.string().optional().describe('请求方法').default('POST'),
        headers: z.record(z.string()).optional().describe('请求头'),
        data: z.any().optional().describe('请求数据'),
        params: z.record(z.string()).optional().describe('URL参数'),
        timeout: z.number().optional().describe('超时时间（毫秒）'),
        axiosConfig: z.record(z.any()).optional().describe('自定义Axios配置')
    }).optional().describe('查询请求配置'),
    queryName: z.string().optional().describe('预定义查询名称'),
    curl: z.string().optional().describe('curl命令字符串')
}, async ({ prompt, request, queryName, curl }) => {
    try {
        const extractedData = await executeGrafanaQuery(request, queryName, curl);
        // 获取查询级别的AI配置
        const queryLevelConfig = queryName && config.queries?.[queryName] ? {
            systemPrompt: config.queries[queryName].systemPrompt,
            aiService: config.queries[queryName].aiService
        } : undefined;
        // AI分析
        const aiAnalysis = await analyzeWithAI(prompt, extractedData, config, queryLevelConfig);
        const result = {
            success: true,
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
    catch (error) {
        return createErrorResponse(error);
    }
});
// 执行查询工具
server.tool('execute_query', {
    request: z.object({
        url: z.string().describe('查询URL'),
        method: z.string().optional().describe('请求方法').default('POST'),
        headers: z.record(z.string()).optional().describe('请求头'),
        data: z.any().optional().describe('请求数据'),
        params: z.record(z.string()).optional().describe('URL参数'),
        timeout: z.number().optional().describe('超时时间（毫秒）'),
        axiosConfig: z.record(z.any()).optional().describe('自定义Axios配置')
    }).optional().describe('查询请求配置'),
    queryName: z.string().optional().describe('预定义查询名称'),
    curl: z.string().optional().describe('curl命令字符串')
}, async ({ request, queryName, curl }) => {
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
    }
    catch (error) {
        return createErrorResponse(error);
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
        config = await loadConfig();
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error('✅ Grafana查询分析MCP服务器已启动');
        console.error(`📊 服务器信息: ${SERVER_INFO.name} v${SERVER_INFO.version}`);
        console.error(`🔧 配置状态: ${Object.keys(config.queries || {}).length} 个查询`);
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