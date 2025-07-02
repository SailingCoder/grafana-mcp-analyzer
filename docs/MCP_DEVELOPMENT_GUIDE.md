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
| 工具名 | 功能 | 参数 |
|--------|------|------|
| `analyze_query` | 执行查询并AI分析 | `prompt`, `queryName`, `request` |
| `execute_query` | 执行原始查询 | `queryName`, `request` |
| `check_health` | 健康检查 | `expectedStatus`, `timeout` |
| `list_queries` | 查询列表 | `includeConfig` |
| `manage_sessions` | 会话管理 | `action`, `sessionId`, `metadata` |
| `analyze_session` | 会话聚合分析 | `sessionId`, `requestIds`, `prompt` |
| `generate_report` | 生成分析报告 | `sessionId`, `aggregateId`, `format` |

### 资源清单
| 资源名 | URI模式 | 功能 |
|--------|---------|------|
| `monitoring-data` | `monitoring-data://{sessionId}/{responseId}/{dataType}` | 访问监控数据块 |
| `monitoring-data-legacy` | `monitoring-data://{dataId}` | 访问旧版监控数据 |
| `monitoring-data-index` | `monitoring-data-index://sessions` | 查看所有可用会话 |
| `monitoring-data-index` | `monitoring-data-index://session/{sessionId}` | 查看会话详情 |
| `monitoring-data-index-legacy` | `monitoring-data-index://list` | 查看旧版数据集 |

### 大数据处理
本项目使用MCP的ResourceLinks功能处理大型监控数据集：

1. **数据分块存储**：大型数据集会被自动分割成多个较小的块
2. **按需加载**：AI可以根据需要选择性地加载数据块
3. **元数据索引**：提供数据结构和内容的概览信息
4. **完整性保证**：确保不会因为数据截断而丢失关键信息
5. **自动清理**：过期数据会被自动清理，避免存储空间无限增长

#### 数据清理机制

- 默认情况下，数据在24小时后自动过期并被清理
- 可以通过环境变量`MCP_DATA_EXPIRY_HOURS`自定义过期时间
- 清理操作在服务启动时自动执行
- 也可以通过`npm run clean-data`手动清理所有数据

#### 实现原理
```typescript
// 大数据处理流程
if (dataSize > MAX_DATA_LENGTH) {
  // 1. 创建数据摘要
  const dataSummary = { ... };
  
  // 2. 分割数据并存储
  const chunks = splitDataIntoChunks(data);
  
  // 3. 创建ResourceLinks
  return {
    content: [
      { type: "text", text: "数据概览..." },
      { type: "resource", resource: { uri: "monitoring-data://..." } },
      // 更多资源链接...
    ]
  };
}
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

// 获取会话信息
const sessionInfo = await getSessionInfo(sessionId);
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
