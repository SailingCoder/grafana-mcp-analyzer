/**
 * Grafana MCP 分析器类型定义
 */
// 类型守卫函数
export function isValidHttpMethod(method) {
    return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
}
export function isValidHealthStatus(status) {
    return ['healthy', 'degraded', 'unhealthy'].includes(status);
}
//# sourceMappingURL=index.js.map