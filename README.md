# Grafana MCP Analyzer 🤖

![Version](https://img.shields.io/npm/v/grafana-mcp-analyzer) ![License](https://img.shields.io/npm/l/grafana-mcp-analyzer)

**让AI直接理解你的监控数据，智能分析运维状况**

[English](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README.md) | [中文文档](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README_EN.md)

## 概述

想象一下这样的场景：
- 您问AI："我的服务器现在怎么样？" 
- AI直接查看您的Grafana监控，回答："CPU使用率偏高，建议检查这几个进程..."

不用再盯着复杂的监控图表，AI帮您分析一切！

## 功能特性

Grafana MCP Analyzer 是一个基于 **MCP (Model Context Protocol)** 的服务器库，让Claude、ChatGPT等AI助手能够：

1. 💬 **自然对话式查询**："帮我看看内存使用情况" → AI立即分析并给出建议  
2. 🔍 **智能异常识别**：AI主动发现并告知监控数据中的异常
3. 📊 **多数据源支持**：支持Prometheus、MySQL、Elasticsearch等各种Grafana数据源
4. 💡 **智能建议**：不仅能展示监控数据，还能提供具体的优化建议
5. 🚀 **效率提升**：无需手动分析图表，AI直接解读Grafana数据并给出分析结论

---

## 快速开始 🚀

### 步骤1：配置AI助手

打开 **Cursor设置** → 搜索 **"MCP"** → 添加以下配置：（以Cursor为例）

```json
{
  "mcpServers": {
    "grafana": {
      "command": "npx grafana-mcp-analyzer",
      "env": {
        "CONFIG_PATH": "./grafana-config.js"
      }
    }
  }
}
```

注意：任何支持 MCP 的 AI 助手，都可以配置类似的MCP服务器。同时，本地需要配置 Node.js 环境，版本 >= 18+。

> `CONFIG_PATH` 支持相对路径、绝对路径以及远程地址。详见 [CONFIG_PATH_GUIDE](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/docs/CONFIG_PATH_GUIDE.md)

### 步骤2：创建配置文件

在项目根目录创建 `grafana-config.js` 文件：

> **完整配置示例**：参考 [query-config.simple.js](./config/query-config.simple.js)

```javascript
const config = {
  baseUrl: 'https://你的grafana地址.com',  // 替换为您的Grafana地址
  defaultHeaders: {
    'Authorization': 'Bearer 你的API密钥',  // 替换为您的API密钥
    'Content-Type': 'application/json'
  },
  queries: {
    // 前端性能监控
    frontend_performance: {
      url: "api/ds/es/query",
      method: "POST",
      data: {
        es: {
          index: 'your_index',
          query: '你的查询语句'
        }
        // 更多配置...
      },
      systemPrompt: '您是前端性能分析专家。请分析FCP（First Contentful Paint）性能数据，重点关注：1. 页面首次内容绘制时间趋势 2. 75百分位数性能表现 3. 是否存在性能劣化 4. 用户体验影响评估 5. 性能优化建议。请用中文详细分析性能数据并提供实用的优化建议。'
    },
    
    // CPU使用率监控
    cpu_usage: {
      url: 'api/ds/sql/query',
      method: 'POST',
      data: {
        sql: 'SELECT * FROM your_table'
        // 更多配置...
      },
      systemPrompt: '您是CPU性能分析专家。请分析CPU使用率数据，识别性能问题并提供优化建议。重点关注：1. 使用率趋势 2. 峰值时间点 3. 是否存在性能瓶颈 4. 优化建议'
    },
  },
  healthCheck: { url: 'api/health' }
};

export default config;
```

>注意：data中是查询配置，systemPrompt是AI分析提示，用于指导AI如何分析数据。

#### 如何获取查询配置？

1. **方法一**（推荐）：进入Grafana → 打开任意图表 → 点击"Query inspector" → 复制查询 Query 配置
2. **方法二**：在浏览器开发者工具中查看Network面板，复制相关接口的请求参数

### 步骤3：测试运行

完全关闭并重新启动Cursor，然后尝试：

> **您**：分析前端性能监控  
> **AI**：正在分析...

> **您**：分析CPU使用率监控  
> **AI**：正在分析...

**配置完成！** 🎉

---

## 故障排除 💡

### 常见问题及解决方案

**❌ 无法连接到Grafana？**
- 检查Grafana地址格式是否正确（需包含 `https://`）
- 确认API密钥是否有效且未过期
- 验证网络连接是否正常

**❌ AI提示找不到工具？**
- 完全退出Cursor并重新启动
- 检查配置文件路径是否正确
- 确保Node.js版本 ≥ 18，如果是 nvm 管理，可通过 `nvm alias default 18.**.**`

---

## 高级配置

<details>
<summary> 本地安装（推荐用于生产环境）</summary>

如果您希望稳定使用而不依赖网络下载：

```bash
npm install -g grafana-mcp-analyzer
```

然后将配置文件中的命令修改为：
```json
{
  "mcpServers": {
    "grafana": {
      "command": "node",
      "args": ["/Users/username/Downloads/grafana-mcp-analyzer/dist/server/mcp-server.js"],
      "env": {
        "CONFIG_PATH": "/Users/username/Downloads/grafana-mcp-analyzer/grafana-config.js"
      }
    }
  }
}
```

</details>

<details>
<summary>环境变量保护敏感信息</summary>

为了提高安全性，建议将敏感信息存储在环境变量中：

```bash
export GRAFANA_URL="https://您的grafana域名.com"
export GRAFANA_TOKEN="您的API密钥"
```

然后修改配置文件：
```javascript
const config = {
  baseUrl: process.env.GRAFANA_URL,
  defaultHeaders: {
    'Authorization': `Bearer ${process.env.GRAFANA_TOKEN}`,
    'Content-Type': 'application/json'
  },
  // ... 其他配置
};
```

</details>

<details>
<summary>MCP List</summary>


| 工具 | 功能 | 使用场景 |
|------|------|----------|
| `analyze_query` | 🧠 执行查询并智能分析 | 需要AI洞察和建议 |
| `execute_query` | 📊 执行原始查询 | 只需要数据 |
| `check_health` | 🏥 健康检查 | 检查服务状态 |
| `list_queries` | 📋 查询列表 | 查看可用查询 |

</details>

---

## 许可证

本项目遵循 MIT 许可证。详见 [LICENSE](LICENSE) 文件。
