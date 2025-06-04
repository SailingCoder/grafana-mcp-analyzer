import axios from 'axios';
const DEFAULT_TIMEOUT = 30000; // 默认请求超时时间（30秒） - 避免长时间等待
const HEALTH_CHECK_TIMEOUT = 5000; // 健康检查超时时间（5秒） - 快速检测服务状态
/**
 * 执行Grafana查询
 */
export async function executeQuery(request, baseUrl = '') {
    try {
        // 构建完整URL
        let fullUrl = request.url;
        if (baseUrl && !request.url.startsWith('http')) {
            const cleanBaseUrl = baseUrl.replace(/\/$/, '');
            const cleanUrl = request.url.replace(/^\//, '');
            fullUrl = `${cleanBaseUrl}/${cleanUrl}`;
        }
        // 发送请求
        const response = await axios({
            method: request.method || 'POST',
            url: fullUrl,
            data: request.data,
            params: request.params,
            headers: request.headers || {},
            timeout: request.timeout || DEFAULT_TIMEOUT,
            validateStatus: (status) => status < 500, // 允许4xx状态码
            // 确保原始数据不被转换，特别是对于NDJSON格式
            transformRequest: [(data) => {
                    // 如果是字符串且包含换行符，很可能是NDJSON格式，直接返回
                    if (typeof data === 'string' && data.includes('\n')) {
                        return data;
                    }
                    // 其他情况使用默认转换
                    return data;
                }],
            ...request.axiosConfig
        });
        return {
            success: true,
            data: response.data,
            status: response.status,
            headers: response.headers
        };
    }
    catch (error) {
        // 统一错误处理
        if (error.response) {
            const status = error.response.status;
            let errorMessage = `HTTP ${status}`;
            if (status === 401)
                errorMessage += ': 认证失败，请检查API令牌';
            else if (status === 403)
                errorMessage += ': 权限不足';
            else if (status === 404)
                errorMessage += ': 资源不存在，请检查URL';
            else if (status >= 500)
                errorMessage += ': 服务器错误';
            else
                errorMessage += `: ${error.message}`;
            return {
                success: false,
                error: errorMessage,
                status: error.response.status,
                data: error.response.data
            };
        }
        // 网络错误
        let errorMessage = error.message;
        if (error.code === 'ECONNABORTED')
            errorMessage = '请求超时';
        else if (error.code === 'ENOTFOUND')
            errorMessage = '无法连接到服务器';
        else if (error.code === 'ECONNREFUSED')
            errorMessage = '连接被拒绝';
        return {
            success: false,
            error: errorMessage
        };
    }
}
/**
 * 从查询响应中提取数据
 */
export function extractData(response) {
    if (!response.success) {
        return {
            hasData: false,
            type: 'error',
            error: response.error || '查询失败',
            status: response.status,
            timestamp: new Date().toISOString()
        };
    }
    // 简单判断是否有数据
    const hasData = response.data != null &&
        (typeof response.data === 'object' ? Object.keys(response.data).length > 0 : true);
    return {
        hasData,
        type: 'grafana',
        data: response.data,
        status: response.status,
        timestamp: new Date().toISOString(),
        metadata: {
            responseSize: JSON.stringify(response.data || {}).length,
            contentType: response.headers?.['content-type']
        }
    };
}
/**
 * 健康检查
 */
export async function checkHealth(healthUrl, options = {}) {
    const { timeout = HEALTH_CHECK_TIMEOUT, expectedStatus = 200 } = options;
    try {
        const response = await axios.get(healthUrl, {
            timeout,
            validateStatus: (status) => status < 500
        });
        return {
            status: response.status === expectedStatus ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            response: response.status,
            data: response.data,
            details: {
                responseTime: response.headers['x-response-time'],
                server: response.headers['server']
            }
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.code === 'ECONNABORTED' ? '健康检查超时' : error.message
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
export async function executeBatchQueries(requests, baseUrl = '', options = {}) {
    const { concurrency = 5, failFast = false } = options;
    if (requests.length === 0) {
        return [];
    }
    // 分批执行以控制并发数
    const results = [];
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
        }
        catch (error) {
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
//# sourceMappingURL=grafana-client.js.map