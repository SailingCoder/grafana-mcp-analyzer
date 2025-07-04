/**
 * Grafana MCP 分析器类型定义
 */
// 类型守卫函数
export function isValidHttpMethod(method) {
    return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}
//# sourceMappingURL=index.js.map