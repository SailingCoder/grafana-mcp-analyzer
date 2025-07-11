# 性能优化指南 📈

## 概述

Grafana MCP Analyzer 在 v2.1.0 版本中引入了多项性能优化，使系统能够更好地处理大规模数据分析场景。本指南将介绍这些优化及其使用方法。

## 核心优化

### 1. 并发查询处理

**原理**: 使用 `Promise.all` 并行执行多个查询，而不是串行执行。

**优势**:
- 显著减少总执行时间
- 特别适合聚合分析场景
- 对于多数据源分析效果最佳

**使用方法**:
```javascript
// 使用 aggregate_analyze 工具自动启用并发查询
const result = await mcp.callTool('aggregate_analyze', {
  queryNames: ['cpu_usage', 'memory_usage', 'disk_usage'],
  prompt: '分析系统整体性能状况',
  sessionId: 'session-001'
});
```

### 2. 智能缓存系统

**原理**: 自动缓存查询结果，避免重复执行相同查询。

**优势**:
- 减少重复查询，提高响应速度
- 自动管理缓存生命周期
- 智能清理策略，防止内存泄漏

**配置选项**:
```bash
# 环境变量配置
export MAX_CACHE_SIZE=200     # 最大缓存项数量（默认100）
export DEBUG_CACHE=true       # 启用缓存调试日志
```

**缓存策略**:
- 默认缓存有效期: 5分钟
- 缓存键生成: 基于查询URL、方法、参数等
- 缓存清理: LRU (最近最少使用) 策略

### 3. 错误处理和重试机制

**原理**: 自动重试失败的查询，使用指数退避策略。

**优势**:
- 提高系统稳定性
- 自动处理临时网络问题
- 防止级联失败

**配置选项**:
```bash
# 环境变量配置
export MAX_RETRIES=5          # 最大重试次数（默认3）
export BASE_DELAY=2000        # 基础延迟毫秒数（默认1000）
export DEBUG_RETRIES=true     # 启用重试调试日志
```

## 性能调优建议

### 聚合分析优化

对于需要分析多个相关指标的场景，建议使用 `aggregate_analyze` 工具而不是多次调用 `analyze_query`：

```javascript
// 推荐: 使用聚合分析（并发执行）
const result = await mcp.callTool('aggregate_analyze', {
  queryNames: ['cpu', 'memory', 'network', 'disk'],
  prompt: '分析系统瓶颈'
});

// 不推荐: 单独分析（串行执行）
const cpu = await mcp.callTool('analyze_query', { queryName: 'cpu' });
const memory = await mcp.callTool('analyze_query', { queryName: 'memory' });
// ...
```

### 缓存优化

对于频繁查询但数据变化不大的场景，可以调整缓存策略：

```javascript
// 在配置文件中设置查询的缓存属性
{
  "queries": {
    "slow_changing_data": {
      "url": "api/ds/query",
      "method": "POST",
      "data": { ... },
      "cacheOptions": {
        "ttl": 600000,  // 10分钟缓存
        "priority": "high"
      }
    }
  }
}
```

### 大数据处理建议

对于超大数据集，建议：

1. **增加分块大小阈值**：适用于高性能服务器
   ```javascript
   // 在代码中调整
   const result = await storeResponseData(requestId, data, 1024 * 1024); // 1MB
   ```

2. **使用数据筛选**：在查询时减少返回的数据量
   ```javascript
   // 在查询配置中添加时间范围限制
   const query = {
     "url": "api/ds/query",
     "data": {
       "from": "now-1h",  // 只查询最近1小时
       "to": "now"
     }
   };
   ```

## 性能监控

系统内置了性能监控功能，可以通过以下方式查看：

```javascript
// 获取缓存统计
const cacheStats = cacheManager.getCacheStats();
console.log(`缓存项数: ${cacheStats.size}`);

// 获取数据存储统计
const storeStats = await getDataStoreStats();
console.log(`总请求数: ${storeStats.totalRequests}`);
console.log(`总数据大小: ${storeStats.totalSizeMB} MB`);
```

## 最佳实践

1. **会话管理**：使用会话ID关联相关查询
2. **定期清理**：设置自动清理过期数据
3. **监控缓存**：观察缓存命中率，调整缓存大小
4. **错误处理**：实现应用级错误处理，补充系统级重试机制

## 更多资源

- [架构优化方案](./ARCHITECTURE_OPTIMIZATION_PLAN.md)
- [立即可行的改进建议](./IMMEDIATE_IMPROVEMENTS.md)
- [性能测试结果](../PERFORMANCE_RESULTS.md)
- [更新日志](../CHANGELOG.md)

如有任何问题或建议，请提交Issue或Pull Request。 