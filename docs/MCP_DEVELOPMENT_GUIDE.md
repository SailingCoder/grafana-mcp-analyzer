# MCP开发指南

## 📋 什么是MCP？

**Model Context Protocol (MCP)** 是一个开放协议，让AI助手能够安全地访问外部工具和数据源。

### 架构图
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   用户      │ ←→ │  AI助手     │ ←→ │ MCP服务器   │ ←→ │ 外部系统    │
│ (Cursor等)  │    │ (Claude等)  │    │ (本项目)    │    │ (Grafana)   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 🛠️ MCP核心功能

### 1. Tools (工具)
AI助手可以调用的函数，执行特定操作

### 2. Resources (资源)  
AI助手可以读取的数据源（文件、数据库等）

### 3. Prompts (提示)
预定义的提示模板，提供上下文

## 🔧 本项目的MCP实现

### 工具清单
| 工具名 | 功能 | 主要参数 |
|--------|------|----------|
| `check_health` | 健康检查 | `timeout`, `expectedStatus` |
| `list_queries` | 查询配置列表 | `includeConfig` |
| `analyze_query` | 分析单个查询 | `queryName`, `prompt`, `sessionId` |
| `query_data` | 仅查询数据 | `queryName`, `description`, `sessionId` |
| `aggregate_analyze` | 聚合分析多个查询 | `queryNames`, `prompt`, `sessionId` |
| `batch_analyze` | 批量分析多个查询 ⚠️ 不推荐 | `queryNames`, `prompt`, `sessionId` |
| `manage_sessions` | 会话管理 | `action`, `sessionId`, `metadata` |
| `list_data` | 列出历史数据 | `sessionId`, `limit` |
| `server_status` | 服务器状态 | 无参数 |

### 资源清单
| 资源名 | URI模式 | 功能 |
|--------|---------|------|
| `monitoring-data` | `monitoring-data://{requestId}/{dataType}` | 访问监控数据 |
| `monitoring-data-index` | `monitoring-data-index://requests` | 查看所有请求 |
| `monitoring-data-index` | `monitoring-data-index://session/{sessionId}` | 查看会话请求 |

## 📊 数据存储架构

### 以请求为中心的存储模式

```
~/.grafana-mcp-analyzer/data-store/
  ├── request-{timestamp}-{id}/
  │   ├── metadata.json         // 请求元数据
  │   ├── analysis.json         // 分析结果(可选)
  │   └── data/                 // 响应数据文件夹
  │       ├── full.json         // 完整数据(小数据)
  │       └── chunk-*.json      // 数据分块(大数据)
  └── ...
```

### 数据文件说明

1. **metadata.json**: 请求信息
   ```json
   {
     "id": "request-1751457026755-nsegn2dj6",
     "timestamp": "2025-01-02T11:50:26.755Z",
     "url": "api/ds/query",
     "method": "POST",
     "data": { "targets": [...] },
     "prompt": "分析CPU使用率",
     "sessionId": "session-test"
   }
   ```

2. **data/**: 响应数据存储
   - `full.json`: 小数据完整存储（< 1MB）
   - `chunk-*.json`: 大数据分块存储（≥ 1MB）

3. **analysis.json**: AI分析结果（可选）

### 大数据处理

- **自动分块**: 超过1MB自动分块存储
- **透明访问**: 通过ResourceLinks统一访问
- **按需加载**: 支持完整或分块访问

## 🔧 核心代码结构

### MCP服务器初始化
```typescript
// src/server/mcp-server.ts
const server = new McpServer({
  name: 'grafana-mcp-analyzer',
  version: packageJson.version,
  description: 'Grafana MCP分析器 - 监控数据查询和分析工具'
});

// 工具定义示例
server.tool('analyze_query', {
  queryName: z.string().describe('查询名称（从配置文件获取）'),
  prompt: z.string().describe('分析需求描述'),
  sessionId: z.string().optional().describe('会话ID（可选）')
}, async ({ queryName, prompt, sessionId }) => {
  // 执行查询和分析逻辑
});
```

### 数据存储层
```typescript
// src/services/data-store.ts
export async function storeRequestMetadata(requestId: string, metadata: any);
export async function storeResponseData(requestId: string, data: any);
export async function getResponseData(requestId: string, chunkId?: string);
export async function storeAnalysis(requestId: string, analysis: any);
```

### 资源访问
```typescript
// 注册资源
server.resource("monitoring-data", "monitoring-data://{requestId}/{dataType}", {
  title: "监控数据",
  description: "Grafana监控数据资源查看器"
}, async (uri) => {
  // 资源访问逻辑
});
```

## 📦 扩展开发

### 添加新的数据源

1. **配置文件扩展**：
```javascript
// grafana-config.js
const config = {
  // Grafana服务器地址
  baseUrl: 'https://your-grafana-api.com',
  
  // 默认请求头
  defaultHeaders: {
    'Authorization': 'Bearer your-grafana-api-token',
    'Content-Type': 'application/json'
  },

  // 预定义查询
  queries: {
    cpu_usage: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)","range":{"from":"now-6h","to":"now"}}]}'`,
      systemPrompt: '您是系统性能监控专家，专注于CPU性能分析...'
    },
    
    memory_usage: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100","range":{"from":"now-6h","to":"now"}}]}'`,
      systemPrompt: '您是内存管理专家，专注于内存优化...'
    }
  },

  // 健康检查配置
  healthCheck: {
    url: 'api/health'
  }
};
```

2. **测试新查询**：
```bash
CONFIG_PATH=./config npm run dev
```

### 添加新工具

```typescript
server.tool('new_tool', {
  param1: z.string().describe('参数描述'),
  param2: z.number().optional()
}, async ({ param1, param2 }) => {
  // 工具逻辑
  return createResponse(result);
});
```

### 添加新资源

```typescript
server.resource("new-resource", "new-resource://{id}", {
  title: "新资源",
  description: "新资源描述"
}, async (uri) => {
  // 资源访问逻辑
  return {
    contents: [{
      uri: uri.href,
      text: "资源内容",
      mimeType: "application/json"
    }]
  };
});
```

## 🧪 开发测试

### 本地开发
```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 测试
npm test
```

### 测试工具
```bash
# 测试数据存储
node tests/test-new-data-structure.js

# 测试MCP服务器
node tests/test-mcp-server.js
```

## 🔄 会话管理

### 会话概念
会话提供了组织相关请求的方式，支持：
- 创建/删除会话
- 会话内请求管理
- 聚合分析

### 会话API
```typescript
// 会话管理
await createSession(metadata);
await getSessionInfo(sessionId);
await listSessions();
await deleteSession(sessionId);

// 请求管理
await listRequestsBySession(sessionId);
await getRequestStats(requestId);
```

## 📈 高级分析功能

### 聚合分析
```typescript
// 多个查询的聚合分析
server.tool('aggregate_analyze', {
  queryNames: z.array(z.string()).describe('查询名称列表'),
  prompt: z.string().describe('聚合分析需求描述'),
  sessionId: z.string().optional().describe('会话ID（可选）')
}, async ({ queryNames, prompt, sessionId }) => {
  // 聚合分析逻辑
});
```

### ⚠️ 批量分析（不推荐使用）
```typescript
// 多个查询的批量分析 - 当前实现有输出格式问题
server.tool('batch_analyze', {
  queryNames: z.array(z.string()).describe('查询名称列表'),
  prompt: z.string().describe('批量分析需求描述'),
  sessionId: z.string().optional().describe('会话ID（可选）')
}, async ({ queryNames, prompt, sessionId }) => {
  // ❌ 问题：输出格式会导致信息过载，不适合MCP+AI工作流程
  // ✅ 推荐：使用 aggregate_analyze 替代
});
```

#### 🚨 为什么不推荐 batch_analyze？
- **输出过长**：将所有查询的分析指引拼接在一个响应中
- **格式混乱**：多个完整的分析框架混合，难以解析
- **ResourceLinks分散**：每个查询的数据链接分散，不便访问
- **AI处理困难**：输出格式不适合AI模型进行后续处理

#### ✅ 推荐替代方案
- 使用 `aggregate_analyze` 进行多查询统一分析
- 或者逐个调用 `analyze_query` 进行单独分析

## 📋 最佳实践

### 1. 错误处理
```typescript
try {
  const result = await executeQuery(request);
  return createResponse(result);
} catch (error) {
  return createErrorResponse(error);
}
```

### 2. 数据验证
```typescript
// 使用Zod进行参数验证
const schema = z.object({
  queryName: z.string().describe('查询名称'),
  prompt: z.string().describe('分析需求描述')
});
```

### 3. 资源清理
```typescript
// 定期清理过期数据
const expiredRequests = await listExpiredRequests();
for (const request of expiredRequests) {
  await deleteRequest(request.id);
}
```

## 🚀 部署指南

### 环境变量
```bash
CONFIG_PATH=./config/grafana-config.js
NODE_ENV=production
DATA_EXPIRY_HOURS=24
```

### Docker部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
```

## 📚 参考资料

- [MCP官方文档](https://modelcontextprotocol.io/)
- [Grafana API文档](https://grafana.com/docs/grafana/latest/developers/http_api/)
- [项目GitHub仓库](https://github.com/SailingCoder/grafana-mcp-analyzer)
