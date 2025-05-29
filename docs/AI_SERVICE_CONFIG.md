# AI服务配置指南（开发中）

## 📋 概述

Grafana MCP Analyzer 支持配置外部AI服务进行数据分析。如果不配置，将使用客户端AI（如Cursor的Claude）。

## 🔧 基础配置

在配置文件中添加 `aiService` 字段：

```javascript
export default {
  baseUrl: process.env.GRAFANA_URL,
  // ... 其他配置
  aiService: {
    url: "https://api.openai.com/v1/chat/completions",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    bodyTemplate: {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "{{systemPrompt}}" },
        { role: "user", content: "{{userMessage}}" }
      ]
    }
  }
};
```

## 🔀 模板变量

- `{{systemPrompt}}`: 系统提示词（自动生成）
- `{{userMessage}}`: 用户消息（包含分析需求和数据）

## 🎯 AI提供商示例

### OpenAI
```javascript
aiService: {
  url: "https://api.openai.com/v1/chat/completions",
  headers: {
    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    "Content-Type": "application/json"
  },
  bodyTemplate: {
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "{{systemPrompt}}" },
      { role: "user", content: "{{userMessage}}" }
    ],
    temperature: 0.7,
    max_tokens: 2000
  }
}
```

### Azure OpenAI
```javascript
aiService: {
  url: "https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2023-05-15",
  headers: {
    "api-key": process.env.AZURE_OPENAI_KEY,
    "Content-Type": "application/json"
  },
  bodyTemplate: {
    messages: [
      { role: "system", content: "{{systemPrompt}}" },
      { role: "user", content: "{{userMessage}}" }
    ],
    temperature: 0.7,
    max_tokens: 2000
  }
}
```

### Anthropic Claude
```javascript
aiService: {
  url: "https://api.anthropic.com/v1/messages",
  headers: {
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01"
  },
  bodyTemplate: {
    model: "claude-3-sonnet-20240229",
    max_tokens: 2000,
    system: "{{systemPrompt}}",
    messages: [
      { role: "user", content: "{{userMessage}}" }
    ]
  }
}
```

## 🎚️ 多层级配置

### 全局配置
```javascript
export default {
  // 全局AI配置
  aiService: {
    url: "https://api.openai.com/v1/chat/completions",
    headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
    bodyTemplate: { model: "gpt-3.5-turbo" }
  },
  queries: {
    // 查询继承全局配置
    cpu_usage: { /* 查询配置 */ }
  }
};
```

### 查询级配置（覆盖全局）
```javascript
export default {
  aiService: { /* 全局配置 */ },
  queries: {
    // 关键告警使用高级模型
    critical_alert: {
      // 查询配置...
      systemPrompt: "你是紧急故障分析专家",
      aiService: {
        bodyTemplate: { 
          model: "gpt-4",
          temperature: 0.1 
        }
      }
    },
    
    // 日常监控使用客户端AI节省成本
    routine_check: {
      // 查询配置...
      systemPrompt: "日常监控分析"
      // 不配置aiService，使用客户端AI
    }
  }
};
```

## 📊 返回结果

```json
{
  "success": true,
  "extractedData": { /* 原始数据 */ },
  "aiAnalysis": {
    "success": true,
    "analysis": "AI分析结果文本",
    "timestamp": "2023-12-21T10:30:00Z",
    "details": {
      "aiServiceConfigured": true,
      "requestSent": true,
      "responseReceived": true,
      "contentParsed": true,
      "fallbackUsed": false
    }
  }
}
```

### 状态说明
- `aiServiceConfigured`: 是否配置了AI服务
- `requestSent`: 是否成功发送请求
- `responseReceived`: 是否收到响应
- `contentParsed`: 是否成功解析内容
- `fallbackUsed`: 是否使用基础分析兜底

## 💡 最佳实践

1. **环境变量**: 使用环境变量存储API密钥
2. **成本优化**: 关键分析用高级模型，日常监控用客户端AI
3. **超时设置**: 配置合理的超时时间防止阻塞
4. **错误处理**: 配置兜底方案确保服务可用

```javascript
// 推荐配置结构
export default {
  aiService: {
    url: process.env.AI_SERVICE_URL,
    headers: {
      "Authorization": `Bearer ${process.env.AI_API_KEY}`
    },
    bodyTemplate: {
      model: process.env.AI_MODEL || "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 2000
    },
    timeout: 30000  // 30秒超时
  }
};
```

## 测试配置

可以通过MCP工具测试AI服务配置：

```
你: @grafana 帮我分析一下CPU使用率
AI: [如果配置正确，会返回AI分析结果；如果配置错误或未配置，会返回基础分析结果]
```

## 故障排除

### 常见问题

1. **配置不生效**
   - 检查配置文件路径和JSON格式
   - 确认 `CONFIG_PATH` 环境变量设置正确

2. **认证失败**
   - 验证API密钥是否正确
   - 检查请求头配置

3. **响应解析失败**
   - 检查 `responseParser.contentPath` 配置
   - 查看AI服务的实际响应格式

4. **超时错误**
   - 调整 `timeout` 参数
   - 检查网络连接
