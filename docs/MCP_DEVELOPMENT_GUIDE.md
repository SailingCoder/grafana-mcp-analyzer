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
