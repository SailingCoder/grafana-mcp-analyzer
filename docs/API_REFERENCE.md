# API 参考文档

## 概述

Grafana MCP Analyzer 提供了 9 个核心工具，专注于配置驱动的数据查询和分析。所有查询都从配置文件获取，支持自动数据存储和智能分析。

## MCP 工具接口

### 1. analyze_query

分析单个查询的数据，集成查询、存储和分析功能。

**参数**：
```typescript
{
  queryName: string;       // 查询名称（从配置文件获取）
  prompt: string;          // 分析需求描述
  sessionId?: string;      // 会话ID（可选）
}
```

**返回值**：
```typescript
{
  success: boolean;
  requestId: string;
  queryName: string;
  formattedData?: string;  // 格式化数据（小数据时）
  dataSize: number;
  storageType: 'full' | 'chunked';
  message: string;
}
```

**使用示例**：
```javascript
const result = await mcp.callTool('analyze_query', {
  queryName: 'cpu_usage',
  prompt: '分析CPU使用率趋势，识别异常峰值',
  sessionId: 'session-001'
});
```

### 2. query_data

仅执行查询并存储数据，不进行分析。

**参数**：
```typescript
{
  queryName: string;       // 查询名称（从配置文件获取）
  description?: string;    // 查询描述
  sessionId?: string;      // 会话ID（可选）
}
```

**返回值**：
```typescript
{
  requestId: string;
  queryName: string;
  dataSize: number;
  storageType: 'full' | 'chunked';
  message: string;
  hasData: boolean;
}
```

**使用示例**：
```javascript
const result = await mcp.callTool('query_data', {
  queryName: 'memory_usage',
  description: '获取内存使用率数据',
  sessionId: 'session-001'
});
```

### 3. aggregate_analyze

聚合分析多个查询的数据，将数据合并后进行统一分析。

**参数**：
```typescript
{
  queryNames: string[];    // 查询名称列表（从配置文件获取）
  prompt: string;          // 聚合分析需求描述
  sessionId?: string;      // 会话ID（可选）
}
```

**返回值**：
```typescript
{
  success: boolean;
  requestIds: string[];
  queryNames: string[];
  formattedData?: string;  // 格式化数据（小数据时）
  totalSize: number;
  message: string;
}
```

**使用示例**：
```javascript
const result = await mcp.callTool('aggregate_analyze', {
  queryNames: ['front_analysis', 'frontend_performance', 'front_analysis_2'],
  prompt: '聚合分析前端性能数据，对比不同时间段的表现',
  sessionId: 'session-001'
});
```

### 4. batch_analyze

批量分析多个查询，每个查询单独分析并返回独立结果。

**参数**：
```typescript
{
  queryNames: string[];    // 查询名称列表（从配置文件获取）
  prompt: string;          // 批量分析需求描述
  sessionId?: string;      // 会话ID（可选）
}
```

**返回值**：
```typescript
{
  success: boolean;
  results: Array<{
    queryName: string;
    requestId: string;
    dataSize: number;
    storageType: 'full' | 'chunked';
    formattedData?: string;
  }>;
  message: string;  // 包含所有格式化数据的汇总
}
```

**使用示例**：
```javascript
const result = await mcp.callTool('batch_analyze', {
  queryNames: ['cpu_usage', 'memory_usage', 'disk_usage'],
  prompt: '分析系统资源使用情况，识别潜在瓶颈',
  sessionId: 'session-001'
});
```

### 5. list_queries

列出配置文件中可用的查询名称。

**参数**：
```typescript
{
  includeConfig?: boolean; // 是否包含完整配置信息，默认false
}
```

**返回值**：
```typescript
{
  queries: string[];       // 查询名称列表
  count: number;          // 查询数量
  config?: Record<string, any>; // 完整配置（当includeConfig=true时）
}
```

**使用示例**：
```javascript
// 列出查询名称
const queries = await mcp.callTool('list_queries', {});

// 包含完整配置
const queriesWithConfig = await mcp.callTool('list_queries', {
  includeConfig: true
});
```

### 6. manage_sessions

管理MCP会话，支持创建、查看、删除会话。

**参数**：
```typescript
{
  action: 'list' | 'create' | 'get' | 'delete'; // 操作类型
  sessionId?: string;      // 会话ID（get、delete时必需）
  metadata?: Record<string, any>; // 会话元数据（create时可选）
}
```

**返回值**：
```typescript
{
  success: boolean;
  sessionId?: string;      // 新创建的会话ID
  sessions?: SessionInfo[]; // 会话列表（list时）
  message?: string;        // 操作结果消息
}
```

**使用示例**：
```javascript
// 列出所有会话
const sessions = await mcp.callTool('manage_sessions', {
  action: 'list'
});

// 创建新会话
const newSession = await mcp.callTool('manage_sessions', {
  action: 'create',
  metadata: { project: 'monitoring', user: 'admin' }
});

// 获取会话信息
const sessionInfo = await mcp.callTool('manage_sessions', {
  action: 'get',
  sessionId: 'session-123'
});

// 删除会话
const deleteResult = await mcp.callTool('manage_sessions', {
  action: 'delete',
  sessionId: 'session-123'
});
```

### 7. list_data

列出存储的监控数据，支持按会话筛选。

**参数**：
```typescript
{
  sessionId?: string;      // 会话ID筛选（可选）
  limit?: number;          // 返回数量限制，默认10
}
```

**返回值**：
```typescript
{
  data: Array<{
    requestId: string;
    timestamp: string;
    prompt: string;
    sessionId?: string;
    dataSize: number;
    queryName?: string;
  }>;
  total: number;           // 总数据量
  returned: number;        // 返回数量
  sessionId: string;       // 筛选的会话ID或'all'
}
```

**使用示例**：
```javascript
// 列出所有数据
const allData = await mcp.callTool('list_data', {
  limit: 20
});

// 列出特定会话的数据
const sessionData = await mcp.callTool('list_data', {
  sessionId: 'session-123',
  limit: 10
});
```

### 8. server_status

获取MCP服务器状态信息。

**参数**：
```typescript
// 无参数
```

**返回值**：
```typescript
{
  server: {
    name: string;
    version: string;
    description: string;
  };
  config: {
    hasBaseUrl: boolean;
    hasHealthCheck: boolean;
    queryCount: number;
  };
  timestamp: string;
}
```

**使用示例**：
```javascript
const status = await mcp.callTool('server_status', {});
```

### 9. check_health

检查Grafana连接和MCP服务器健康状态。

**参数**：
```typescript
{
  timeout?: number;        // 超时时间（毫秒）
  expectedStatus?: number; // 期望的HTTP状态码
}
```

**返回值**：
```typescript
{
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  // 其他健康检查详情
}
```

**使用示例**：
```javascript
const health = await mcp.callTool('check_health', {
  timeout: 5000,
  expectedStatus: 200
});
```

## 配置文件结构

### 基本结构
```javascript
const config = {
  baseUrl: 'https://your-grafana.com',
  
  // 健康检查配置（可选）
  healthCheck: {
    url: 'api/health'
  },
  
  // 查询定义
  queries: {
    cpu_usage: {
      url: 'api/ds/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        queries: [{
          refId: 'A',
          expr: 'cpu_usage_percent'
        }]
      }
    },
    
    memory_usage: {
      url: 'api/ds/query',
      method: 'POST',
      data: {
        queries: [{
          refId: 'B', 
          expr: 'memory_usage_percent'
        }]
      }
    }
  }
};

module.exports = config;
```

### 查询配置选项
```typescript
{
  url: string;                    // 查询URL
  method?: string;                // HTTP方法，默认POST
  headers?: Record<string, string>; // 请求头
  params?: Record<string, any>;    // URL参数
  data?: any;                     // 请求体数据
  timeout?: number;               // 超时时间
  axiosConfig?: any;              // 自定义Axios配置
  systemPrompt?: string;          // AI分析专家指引（v2.0.0新增）
}
```

### systemPrompt 专业分析指引

`systemPrompt` 是 v2.0.0 版本的核心功能，用于为每个查询配置专业的 AI 分析指引：

**功能特性**：
- **专家角色定义**：让 AI 扮演特定领域的专家（如 CPU 专家、前端性能专家等）
- **分析维度指引**：明确告诉 AI 从哪些角度分析数据
- **业务场景适配**：根据具体业务需求定制分析重点
- **双重指引机制**：与用户对话时的 `prompt` 参数结合，实现精准分析

**使用示例**：
```javascript
cpu_monitoring: {
  url: 'api/ds/query',
  data: { /* 查询配置 */ },
  systemPrompt: `您是CPU性能分析专家。请从以下维度分析：
1. 使用率趋势和峰值分析
2. 性能瓶颈识别和根因分析  
3. 容量规划和预警阈值建议
4. 业务影响评估和优化方案`
}
```

## 使用最佳实践

### 1. 查询命名规范
- 使用描述性名称：`cpu_usage`, `frontend_performance`
- 避免特殊字符：使用下划线分隔
- 按功能分类：`sys_cpu`, `app_response_time`

### 2. 会话管理
- 相关查询使用相同sessionId
- sessionId格式：`{project}-{date}-{sequence}`
- 例如：`webapp-2024-01-15-001`

### 3. 分析提示词
- 明确分析目标：指标趋势、异常检测、性能分析
- 提供上下文：时间范围、业务场景、关注重点
- 具体化需求：具体数值、阈值、对比维度

### 4. 数据大小优化
- 控制查询时间范围，避免过大数据集
- 使用合适的聚合粒度
- 考虑分页查询大数据集

## 错误处理

### 常见错误
- `查询配置不存在: {queryName}` - 检查配置文件中的查询定义
- `Request metadata not found: {requestId}` - 请求ID不存在或已过期
- `Analysis not found: {requestId}` - 该请求未进行过分析

### 故障排除
1. **配置问题**: 检查CONFIG_PATH环境变量和配置文件语法
2. **网络问题**: 验证Grafana连接和API访问权限
3. **存储问题**: 检查数据存储目录权限和磁盘空间
4. **分析问题**: 确认AI服务配置和API密钥

## 版本更新

### v2.0.0 (当前版本)
- ✅ 重构为9个核心工具
- ✅ 配置驱动的查询管理
- ✅ 智能数据分析（小数据直接分析，大数据存储）
- ✅ 聚合分析和批量分析
- ✅ 简化的用户体验

### 迁移指南
从v1.x迁移到v2.0：
1. 更新工具调用：`execute_query` → `query_data`
2. 更新工具调用：`analyze_query` → `analyze_query`（参数变化）
3. 配置文件：确保所有查询都在配置文件中定义
4. 会话分析：使用`aggregate_analyze`替代`analyze_session` 