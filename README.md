# Grafana MCP Analyzer 🤖

![Version](https://img.shields.io/npm/v/grafana-mcp-analyzer) ![License](https://img.shields.io/npm/l/grafana-mcp-analyzer) 

**让AI直接读懂你的监控数据，智能化运维分析助手**

[English](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README_EN.md) | [中文文档](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README.md)

## ✨ 项目简介

想象一下这样的场景：

*   您问AI："我的服务器现在怎么样？"
*   AI直接查看您的Grafana监控，回答："CPU使用率偏高，建议检查这几个进程..."

复杂的监控图表，AI帮您一键分析！告别传统的手动监控方式，让AI成为您的专属运维助手！

> 🎉 **v2.0.0 重大更新**：全新架构重构，解决大数据量分析，提供9个核心工具。
> 
> ✨ **新功能特性**：
> - **双重AI指引**：`systemPrompt` 配置 + 对话 `prompt` 参数，实现专业化分析
> - **工具升级**：`execute_query` → `query_data`，功能更强大
> - **新增工具**：`aggregate_analyze`、`batch_analyze`、`manage_sessions`、`list_data`、`server_status`
> - **智能数据处理**：小数据直接分析，大数据自动存储并提供ResourceLinks访问
> - **专业分析**：每个查询可配置专属的 `systemPrompt` 实现领域专家级分析

## 🚀 核心特性

Grafana MCP Analyzer 基于 **MCP (Model Context Protocol)** 协议，赋能Claude、ChatGPT等AI助手具备以下超能力：

*   **自然对话查询**："帮我看看内存使用情况" → AI立即分析并提供专业建议，降低技术门槛
*   **智能数据格式化**：智能数据格式化，支持大数据量分析，做到全量数据分析。
*   **curl命令支持**：支持直接使用curl命令配置查询，从浏览器复制粘贴即可，简化配置流程
*   **聚合数据处理**：支持单个图表精准分析，也支持整个Dashboard聚合分析，灵活的分析粒度
*   **智能异常检测**：AI主动发现并报告性能瓶颈和异常情况，提前预警风险
*   **全数据源支持**：完美兼容Prometheus、MySQL、Elasticsearch等所有数据源/查询命令，统一监控视图
*   **专业DevOps建议**：不只是展示数据，更提供可执行的优化方案，提升DevOps效率

## 🛠️ 快速开始

### 步骤1：安装和配置

#### 全局安装

```bash
npm install -g grafana-mcp-analyzer
```

> MCP 依赖 `Node.js 18+` 环境，推荐安装方式详见：[Node.js 快速安装最全指南](https://blog.csdn.net/qq_37834631/article/details/148457021?spm=1001.2014.3001.5501)

#### 配置AI助手（以Cursor为例）

1.  打开 **Cursor设置** → 搜索 **"MCP"**
2.  添加以下服务器配置：

```json
{
  "mcpServers": {
    "grafana": {
      "command": "grafana-mcp-analyzer",
      "env": {
        "CONFIG_PATH": "./grafana-config.js"
      }
    }
  }
}
```

> 💡 **提示**：任何支持MCP协议的AI助手都可以使用类似配置。需要Node.js 18+环境支持。

> 💡 **配置路径说明**：`CONFIG_PATH` 支持相对路径、绝对路径及远程地址。详见 [CONFIG\_PATH\_GUIDE](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/docs/CONFIG_PATH_GUIDE.md)

### 步骤2：创建配置文件

在项目根目录创建 `grafana-config.js` 配置文件：

```javascript
export default {
  // Grafana基础配置
  baseUrl: 'https://your-grafana-domain.com',
  defaultHeaders: {
    'Authorization': 'Bearer your-api-token',
    'Content-Type': 'application/json'
  },
  
  // 健康检查配置
  healthCheck: { 
    url: 'api/health'
  },
  
  // 查询定义
  queries: {
    // 方式1：curl命令（推荐，浏览器直接复制）
    cpu_usage: {
      curl: `curl 'https://your-grafana-domain.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"rate(cpu_usage[5m])","range":{"from":"now-1h","to":"now"}}]}'`,
      systemPrompt: `您是CPU性能分析专家。请从以下维度分析CPU使用率：
      1. 趋势变化与异常点识别；
      2. 性能瓶颈及根因分析；
      3. 优化建议与预警阈值；
      4. 对业务系统的潜在影响评估。`
    },
    // 方式2：HTTP API配置（适合复杂查询）
    frontend_performance: {
      url: "api/ds/es/query",
      method: "POST",
      data: {
        es: {
          index: 'frontend_metrics',
          query: 'your_elasticsearch_query'
        }
      },
      systemPrompt: `您是前端性能分析专家，请分析FCP指标并给出建议，包括：
      1. 页面加载趋势；
      2. P75表现；
      3. 性能预警；
      4. 用户体验评估；
      5. 针对性优化方案。`
    }
  }
};
```

📌 **配置获取技巧**：

**浏览器复制curl命令**（推荐）：

1.  在Grafana中执行查询
2.  按F12打开开发者工具 → Network标签页
3.  找到查询请求 → 右键 → Copy as cURL
4.  使用curl解析工具转换为配置格式

**HTTP API配置：**

1.  获取 Data 传参：进入图表 → "Query Inspector" → "JSON"解析 → 拷贝请求体(request)
2.  获取 Url 和 Headers Token：通过 Network 面板查看请求参数，手动构造 HTTP 配置。

💡 **systemPrompt 专业分析指引**：

- **作用原理**：为每个查询配置专业的AI分析指引，让AI扮演特定领域的专家角色
- **使用方式**：配置文件中的 `systemPrompt` + 对话时的用户 `prompt` 双重指引
- **分析效果**：CPU专家分析CPU数据、前端专家分析性能数据，专业性更强
- **自定义建议**：根据您的业务场景，自定义适合的专家角色和分析重点

### 步骤3：开始使用

**完全重启Cursor**，然后体验智能分析：

> 👤 您：分析前端性能监控数据 frontend\_performance\
> 🤖 AI：正在连接Grafana并分析前端性能指标...

> 👤 您：分析 cpu\_usage CPU使用率是否正常\
> 🤖 AI：正在获取CPU监控数据并进行智能分析...

**配置完成！**

![在这里插入图片描述](https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/52198b23d89d499593d3eef3b6483391~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgU2FpbGluZw==:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiMzA3NTE4OTg4MTAwMjM3In0%3D\&rk3s=e9ecf3d6\&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018\&x-orig-expires=1751704101\&x-orig-sign=x8ktB4SMoQ%2B97UMhmLXogegxjx8%3D)

## 更多配置示例

<details>
<summary>指标监控配置</summary>

```javascript
// 指标查询
prometheus_metrics: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{
      "refId":"A",
      "expr":"node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100",
      "range":{"from":"now-2h","to":"now"}
    }]}'`,
  systemPrompt: `内存使用率专家分析：重点关注内存泄漏风险、使用趋势、异常波动和优化建议。`
}
```

</details>

<details>
<summary>日志分析配置</summary>

```javascript
// Elasticsearch日志查询
error_logs: {
  url: "api/ds/es/query", 
  method: "POST",
  data: {
    es: {
      index: "app-logs-*",
      query: {
        "query": {
          "bool": {
            "must": [
              {"term": {"level": "ERROR"}},
              {"range": {"@timestamp": {"gte": "now-1h"}}}
            ]
          }
        }
      }
    }
  },
  systemPrompt: `日志分析专家：识别错误模式、频率分析、影响评估和问题定位建议。`
}
```

</details>

<details>
<summary>网络监控配置</summary>

```javascript
// 网络延迟监控
network_latency: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -d '{"queries":[{
      "refId":"A", 
      "expr":"histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
      "range":{"from":"now-30m","to":"now"}
    }]}'`,
  systemPrompt: `网络性能专家：分析P95延迟、识别慢请求、网络瓶颈定位和优化策略。`
}
```

</details>

<details>
<summary>数据库监控配置</summary>

```javascript
// MySQL性能监控
mysql_performance: {
  url: "api/ds/mysql/query",
  method: "POST", 
  data: {
    sql: "SELECT * FROM performance_schema.events_statements_summary_by_digest ORDER BY avg_timer_wait DESC LIMIT 10"
  },
  systemPrompt: `数据库性能专家：慢查询分析、索引优化建议、查询性能趋势评估。`
}
```

</details>

## ❓ 常见问题

<details>
<summary>❌ 无法连接到Grafana服务</summary>

*   检查Grafana地址格式：必须包含`https://`或`http://`
*   验证API密钥有效性：确保未过期且有足够权限
*   测试网络连通性和防火墙设置

</details>

<details>
<summary>❌ AI提示找不到MCP工具</summary>

*   完全退出Cursor并重新启动
*   检查配置文件路径是否正确
*   确保Node.js版本 ≥ 18

</details>

<details>
<summary>❌ 查询执行失败或超时</summary>

*   增加timeout设置
*   检查数据源连接状态
*   数据量过大时，缩小时间范围

</details>

## 高级配置

<details>
<summary>环境变量配置</summary>

```bash
export GRAFANA_URL="https://your-grafana.com"
export GRAFANA_TOKEN="your-api-token"
```

</details>

<details>
<summary>MCP工具清单</summary>

| 工具 | 功能 | 使用场景 |
|------|------|----------|
| `analyze_query` | 查询+AI分析 | 需要专业建议 |
| `query_data` | 原始数据查询 | 仅需要数据 |
| `aggregate_analyze` | 聚合分析 | 多查询统一分析 |
| `batch_analyze` | 批量分析 | 多查询独立分析 |
| `list_queries` | 查询列表 | 查看配置 |
| `check_health` | 健康检查 | 状态监控 |
| `manage_sessions` | 会话管理 | 管理分析会话 |
| `list_data` | 数据列表 | 查看存储数据 |
| `server_status` | 服务器状态 | 服务器信息 |

工具使用方式

```javascript
// AI助手会自动选择合适的工具
👤 "分析CPU使用情况" → 🤖 调用 analyze_query
👤 "获取内存数据" → 🤖 调用 query_data  
👤 "检查服务状态" → 🤖 调用 check_health
👤 "有哪些监控查询" → 🤖 调用 list_queries
👤 "聚合分析系统指标" → 🤖 调用 aggregate_analyze
👤 "批量分析多个指标" → 🤖 调用 batch_analyze
```
</details>

---

## 文章推荐

- [grafana-mcp-analyzer：基于 MCP 的轻量 AI 分析监控图表的运维神器！](https://blog.csdn.net/qq_37834631/article/details/148473620?spm=1001.2014.3001.5501) - CSDN技术博客深度解析

## 许可证

MIT 开源协议。详见 [LICENSE](LICENSE) 文件。