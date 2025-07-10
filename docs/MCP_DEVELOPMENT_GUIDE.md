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
| `batch_analyze` | 批量分析多个查询 | `queryNames`, `prompt`, `sessionId` |
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
   - `full.json`: 小数据完整存储（< 100KB）
   - `chunk-*.json`: 大数据分块存储（≥ 100KB）

3. **analysis.json**: AI分析结果（可选）

### 大数据处理

- **自动分块**: 超过100KB自动分块存储
- **透明访问**: 通过ResourceLinks统一访问
- **按需加载**: 支持完整或分块访问
- **性能**: 避免内存溢出，支持大数据处理

## ResourceLinks

### 格式
```
monitoring-data://{requestId}/data        # 完整数据
monitoring-data://{requestId}/chunk-{n}   # 数据分块
monitoring-data://{requestId}/analysis    # 分析结果
```

### 使用场景
- 大数据查询结果
- 聚合分析的原始数据
- 批量分析的详细结果
- 历史数据访问

## 性能指标

### 数据处理能力
- **小数据**: <100KB，内存处理，响应<100ms
- **中等数据**: 100KB-1MB，单文件存储，响应<500ms  
- **大数据**: >1MB，自动分块，存储<2s
- **超大数据**: >10MB，建议分页查询

### 并发支持
- **单会话**: 支持并发查询
- **多会话**: 完全独立，无干扰
- **资源限制**: 基于系统内存和磁盘

## 🔧 命令行参数

```bash
# 显示版本信息
grafana-mcp-analyzer -v
grafana-mcp-analyzer --version

# 显示帮助信息
grafana-mcp-analyzer -h
grafana-mcp-analyzer --help
```

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

### 工作流程实现

#### analyze_query 工作流程
1. 从配置文件获取查询配置
2. 执行查询并存储数据
3. 小数据（≤100KB）：格式化数据供IDE AI分析
4. 大数据（>100KB）：存储数据，通过ResourceLinks访问

```typescript
// src/services/monitoring-analyzer.ts
export async function analyzeQuery(queryName: string, prompt: string, sessionId?: string) {
  // 1. 获取查询配置
  const queryConfig = configManager.getQueryConfig(queryName);
  if (!queryConfig) throw new Error(`查询配置不存在: ${queryName}`);
  
  // 2. 执行查询
  const { requestId, data } = await executeGrafanaQuery(queryConfig);
  
  // 3. 存储请求元数据
  await dataStore.storeRequestMetadata(requestId, {
    queryName,
    prompt,
    sessionId,
    timestamp: new Date().toISOString()
  });
  
  // 4. 存储响应数据
  const storageResult = await dataStore.storeResponseData(requestId, data);
  
  // 5. 根据数据大小决定处理方式
  if (storageResult.storageType === 'full') {
    // 小数据：直接格式化
    return {
      success: true,
      requestId,
      queryName,
      formattedData: JSON.stringify(data, null, 2),
      dataSize: storageResult.dataSize,
      storageType: 'full',
      message: `查询成功，数据大小: ${formatBytes(storageResult.dataSize)}`
    };
  } else {
    // 大数据：返回资源链接
    return {
      success: true,
      requestId,
      queryName,
      dataSize: storageResult.dataSize,
      storageType: 'chunked',
      message: `查询成功，数据已分块存储，大小: ${formatBytes(storageResult.dataSize)}`
    };
  }
}
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

### 批量分析
```typescript
// 多个查询的批量分析 - 分别分析每个查询
server.tool('batch_analyze', {
  queryNames: z.array(z.string()).describe('查询名称列表'),
  prompt: z.string().describe('批量分析需求描述'),
  sessionId: z.string().optional().describe('会话ID（可选）')
}, async ({ queryNames, prompt, sessionId }) => {
  // 对每个查询单独分析，保持结果的独立性
  // 适合需要了解每个查询详细分析的场景
});
```

### 批量分析 vs 聚合分析
- **批量分析(`batch_analyze`)**：对多个查询分别进行分析，每个查询保持独立的分析结果
- **聚合分析(`aggregate_analyze`)**：将多个查询的数据合并后进行统一分析

#### 使用场景建议
- **批量分析**：适合需要了解每个查询详细分析的场景，如故障排查、性能对比
- **聚合分析**：适合需要从整体角度分析多个相关数据源的场景，如系统综合评估

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

## 📦 打包和发版流程

### 打包步骤

1. **清理旧构建文件**
```bash
npm run clean
```

2. **构建优化版本**
```bash
npm run build:slim
```

3. **运行测试**
```bash
npm test
npm run test:cleanup
```

4. **检查打包内容**
```bash
npm pack --dry-run
```

### 发版步骤

1. **更新版本号**
```bash
# 手动修改 package.json 中的版本号
# 或使用 npm 命令自动更新
npm version patch  # 小版本更新 (x.x.X)
npm version minor  # 次版本更新 (x.X.x)
npm version major  # 主版本更新 (X.x.x)
```

2. **发布到 NPM**
```bash
# 测试发布过程但不实际发布
npm publish --dry-run

# 正式发布
npm publish
```

3. **创建 Git 标签**
```bash
git tag v$(node -p "require('./package.json').version")
git push origin --tags
```

### 发布检查清单

- [ ] 所有测试通过
- [ ] 版本号已更新
- [ ] CHANGELOG 已更新 (如有)
- [ ] README 文档已更新
- [ ] 代码中无调试输出
- [ ] 无敏感信息泄露
