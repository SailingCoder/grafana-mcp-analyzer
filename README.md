# Grafana MCP Analyzer 🤖

![Version](https://img.shields.io/npm/v/grafana-mcp-analyzer) ![License](https://img.shields.io/npm/l/grafana-mcp-analyzer) 

**让AI直接读懂你的监控数据，智能化运维分析助手**

[English](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README_EN.md) | [中文文档](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README.md)

## ✨ 项目简介

想象一下这样的场景：
- 您问AI："我的服务器现在怎么样？" 
- AI直接查看您的Grafana监控，回答："CPU使用率偏高，建议检查这几个进程..."
- 复杂的监控图表，AI帮您一键分析！


告别传统的手动监控方式，让AI成为您的专属运维助手！

## 🚀 核心特性

Grafana MCP Analyzer 基于 **MCP (Model Context Protocol)** 协议，赋能Claude、ChatGPT等AI助手具备以下超能力：

| 功能 | 描述 | 价值 |
|------|------|------|
| **自然对话查询** | "帮我看看内存使用情况" → AI立即分析并提供专业建议 | 降低技术门槛 |
| **curl命令支持** | 支持直接使用curl命令配置查询，从浏览器复制粘贴即可 | 简化配置流程 |
| **智能异常检测** | AI主动发现并报告性能瓶颈和异常情况 | 提前预警风险 |
| **多数据源支持** | 完美兼容Prometheus、MySQL、Elasticsearch等 | 统一监控视图 |
| **专业DevOps建议** | 不只是展示数据，更提供可执行的优化方案 | 提升DevOps效率 |
| **轻量化部署** | 超小52KB体积，快速集成部署 | 零负担使用 |

---

## 🛠️ 快速开始

### 步骤1：安装和配置

#### 全局安装
```bash
npm install -g grafana-mcp-analyzer
```

#### 配置AI助手（以Cursor为例）

1. 打开 **Cursor设置** → 搜索 **"MCP"**
2. 添加以下服务器配置：

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

> 💡 **配置路径说明**：`CONFIG_PATH` 支持相对路径、绝对路径及远程地址。详见 [CONFIG_PATH_GUIDE](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/docs/CONFIG_PATH_GUIDE.md)

### 步骤2：创建配置文件

在项目根目录创建 `grafana-config.js` 配置文件：

```javascript
const config = {
  // 连接你的Grafana
  baseUrl: 'https://your-grafana-domain.com',
  defaultHeaders: {
    'Authorization': 'Bearer your-api-token',
    'Content-Type': 'application/json'
  },
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
    },
  },
  healthCheck: { 
    url: 'api/health',
    timeout: 5000
  }
};

module.exports = config;
```

📌 配置获取技巧：

**推荐：浏览器复制curl命令**
1. 在Grafana中执行查询 → 按F12打开开发者工具 → Network标签页
2. 找到查询请求 → 右键 → Copy as cURL → 粘贴到配置文件的curl字段

**其他方式：**
- **Query Inspector**：进入图表 → "Query Inspector" → "JSON"标签 → 复制到data字段
- **手动构造**：通过Network面板查看请求参数手动构造HTTP配置

💡 详细的curl命令配置方法请参考[高级配置](#高级配置)部分。

### 步骤3：测试运行

**完全重启Cursor**，然后体验智能分析：

👤 您：分析前端性能监控数据
🤖 AI：正在连接Grafana并分析前端性能指标...

👤 您：检查CPU使用率是否正常  
🤖 AI：正在获取CPU监控数据并进行智能分析...

**配置完成！**

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/922ac00595694c5796556586b224d63f.png#pic_center)


---

## 🔧 常见问题

<details>
<summary>❌ 无法连接到Grafana服务</summary>

- ✅ 检查Grafana地址格式：必须包含`https://`或`http://`
- ✅ 验证API密钥有效性：确保未过期且有足够权限
- ✅ 测试网络连通性和防火墙设置

</details>

<details>
<summary>❌ AI提示找不到MCP工具</summary>

1. 🔄 完全退出Cursor并重新启动
2. 📁 检查配置文件路径是否正确
3. 🔍 确保Node.js版本 ≥ 18

</details>

<details>
<summary>❌ 查询执行失败或超时</summary>

- 🕐 增加timeout设置
- 📊 简化查询语句复杂度
- 🔍 检查数据源连接状态

</details>

---

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
| `execute_query` | 原始数据查询 | 仅需要数据 |
| `check_health` | 健康检查 | 状态监控 |
| `list_queries` | 查询列表 | 查看配置 |

</details>

## 📄 许可证

MIT 开源协议。详见 [LICENSE](LICENSE) 文件。