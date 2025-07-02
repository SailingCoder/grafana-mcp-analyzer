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

## 📊 数据存储架构

### 以请求为中心的存储模式

本项目采用以请求为中心的数据存储模式，每个请求都是独立的数据单元：

```
~/.grafana-mcp-analyzer/data-store/
  ├── request-1751457026755-nsegn2dj6/
  │   ├── metadata.json         // 请求元数据
  │   ├── analysis.json         // 分析结果
  │   └── data/                 // 响应数据文件夹
  │       └── full.json         // 完整数据(小数据)
  │
  └── request-1751457026758-tbbaa3ema/
      ├── metadata.json         // 请求元数据
      └── data/                 // 响应数据文件夹
          ├── chunk-0.json      // 数据分块1
          ├── chunk-1.json      // 数据分块2
          └── ...               // 更多数据分块
```

### 数据文件说明

1. **metadata.json**: 包含请求的完整信息
   ```json
   {
     "id": "request-1751457026755-nsegn2dj6",
     "timestamp": "2025-07-02T11:50:26.755Z",
     "url": "api/ds/query",
     "method": "POST",
     "params": {},
     "data": { "targets": [...] },
     "prompt": "分析CPU使用率",
     "sessionId": "session-test"
   }
   ```

2. **data/full.json**: 小数据的完整响应（< 1MB）

3. **data/chunk-*.json**: 大数据的分块存储（≥ 1MB）

4. **analysis.json**: AI分析结果
   ```json
   {
     "prompt": "分析CPU使用率",
     "timestamp": "2025-07-02T11:50:26.755Z",
     "result": "CPU使用率正常，平均值为30%"
   }
   ```

### 工具清单
| 工具名 | 功能 | 参数 |
|--------|------|------|
| `analyze_query` | 执行查询并AI分析 | `prompt`, `queryName`, `request`, `curl`, `sessionId` |
| `execute_query` | 执行原始查询 | `queryName`, `request`, `curl`, `sessionId` |
| `check_health` | 健康检查 | `expectedStatus`, `timeout` |
| `list_queries` | 查询列表 | `includeConfig` |
| `manage_sessions` | 会话管理 | `action`, `sessionId`, `metadata` |
| `analyze_session` | 会话聚合分析 | `sessionId`, `requestIds`, `prompt` |
| `generate_report` | 生成分析报告 | `sessionId`, `aggregateId`, `format` |

### 资源清单
| 资源名 | URI模式 | 功能 |
|--------|---------|------|
| `monitoring-data` | `monitoring-data://{requestId}/{dataType}` | 访问监控数据 |
| `monitoring-data-index` | `monitoring-data-index://requests` | 查看所有请求 |
| `monitoring-data-index` | `monitoring-data-index://session/{sessionId}` | 查看会话请求 |

### 大数据处理

系统自动处理大型数据集：

1. **自动分块**: 数据超过1MB时自动分块存储
2. **透明访问**: 通过ResourceLinks提供统一访问接口
3. **按需加载**: 客户端可以选择加载完整数据或特定数据块

```typescript
// 访问完整数据
const data = await getResponseData(requestId);

// 访问特定数据块
const chunk = await getResponseData(requestId, 'chunk-0');

// 列出所有数据文件
const files = await listDataFiles(requestId);
```

### 核心代码结构
```typescript
// src/server/mcp-server.ts
const server = new McpServer({
  name: 'grafana-mcp-analyzer',
  version: '1.0.0'
});

// 定义工具
server.tool('analyze_query', {
  prompt: z.string().describe('分析需求描述'),
  queryName: z.string().optional(),
  request: z.object({}).optional()
}, async ({ prompt, queryName, request }) => {
  // 执行查询逻辑
  // AI分析逻辑
  return result;
});
```

## 📦 扩展开发

### 添加新的数据源
1. 在配置文件中添加新查询：
```javascript
export default {
  queries: {
    new_datasource_query: {
      url: 'api/ds/query',
      data: {
        queries: [{
          datasource: { uid: 'new-uid', type: 'influxdb' },
          query: 'your-influxdb-query',
          refId: 'A'
        }]
      }
    }
  }
};
```

2. 测试新查询：
```bash
CONFIG_PATH=./config npm run dev
```

### 会话与聚合分析

本项目支持会话管理和聚合分析，可以将多个相关请求组织在一个会话中，并进行整体分析。

#### 会话管理

会话提供了一种组织和管理相关请求的方式：

```typescript
// 创建新会话
const sessionId = await createSession({
  description: '性能监控分析会话',
  createdBy: 'user'
});

// 在会话中执行查询
const result = await analyzeQuery({
  sessionId,
  prompt: '分析CPU使用率',
  request: { ... }
});

// 获取会话中的所有请求
const requests = await listRequestsBySession(sessionId);
```

#### 数据访问模式

新的存储结构提供了更灵活的数据访问方式：

```typescript
// 按请求ID访问
const metadata = await getRequestMetadata(requestId);
const data = await getResponseData(requestId);
const analysis = await getAnalysis(requestId);

// 按会话访问
const sessionRequests = await listRequestsBySession(sessionId);

// 全局访问
const allRequests = await listAllRequests();
```

#### 聚合分析

聚合分析可以对会话中的多个请求进行整体分析：

```typescript
// 对会话中的所有请求进行聚合分析
const analysisResult = await analyzeSession({
  sessionId,
  prompt: '综合分析所有性能指标，找出系统瓶颈'
});

// 对会话中的特定请求进行聚合分析
const analysisResult = await analyzeSession({
  sessionId,
  requestIds: ['request-1', 'request-2'],
  prompt: '比较这两次查询的性能差异'
});
```

#### 报告生成

可以基于聚合分析生成格式化报告：

```typescript
// 生成Markdown格式报告
const report = await generateReport({
  sessionId,
  format: 'markdown'
});

// 生成HTML格式报告
const report = await generateReport({
  sessionId,
  aggregateId: 'aggregate-123',
  format: 'html'
});
```

### ResourceLinks使用

ResourceLinks提供了统一的数据访问接口：

```typescript
// 访问请求数据
`monitoring-data://${requestId}/data`

// 访问分析结果
`monitoring-data://${requestId}/analysis`

// 访问特定数据块
`monitoring-data://${requestId}/chunk-0`

// 查看所有请求
`monitoring-data-index://requests`

// 查看会话请求
`monitoring-data-index://session/${sessionId}`
```

### 添加新的MCP工具
```typescript
// 在 src/server/mcp-server.ts 中添加
server.tool('new_tool', {
  param1: z.string().describe('参数描述')
}, async ({ param1 }) => {
  // 工具逻辑
  return {
    content: [{
      type: 'text',
      text: '结果文本'
    }]
  };
});
```

## 🧪 测试和调试

### 本地测试
```bash
# 开发模式
npm run dev

# 测试构建
npm run build && npm test

# 测试ResourceLinks功能
npm run test:resource-links
```

### 配置测试
```bash
# 测试配置加载
node -e "import('./config/query-config.simple.js').then(c => console.log(c.default))"
```

### AI助手集成测试
在Cursor中配置MCP服务器并测试：
```json
{
  "mcpServers": {
    "test-grafana": {
      "command": "node",
      "args": ["./dist/server/mcp-server.js"],
      "env": {
        "CONFIG_PATH": "./config/query-config.simple.js"
      }
    }
  }
}
```

## 📚 相关资源

- [MCP官方文档](https://modelcontextprotocol.io/)
- [MCP SDK文档](https://github.com/modelcontextprotocol/typescript-sdk)
- [Grafana API文档](https://grafana.com/docs/grafana/latest/http_api/)

## 🔍 常见问题

**Q: 如何处理异步操作？**
A: MCP工具函数本身就是async函数，可以直接使用await

**Q: 如何添加新的AI服务？**
A: 参考`docs/AI_SERVICE_CONFIG.md`文档配置新的AI服务

**Q: 如何处理大型监控数据？**
A: 使用ResourceLinks功能，数据会自动分块存储，AI可以按需加载
