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

| 特性 | 描述 | 价值 |
|------|------|------|
| **自然对话查询** | "帮我看看内存使用情况" → AI立即分析并给出专业建议 | 降低技术门槛 |
| **智能异常识别** | AI主动发现并告知监控数据中的性能瓶颈和异常 | 提前预警风险 |
| **多数据源支持** | 完美兼容Prometheus、MySQL、Elasticsearch等主流数据源 | 统一监控视图 |
| **专业运维建议** | 不仅展示数据，更提供具体可行的优化方案 | 提升运维效率 |
| **即时响应分析** | 无需手动解读图表，AI秒级给出分析结论 | 节省时间成本 |
| **轻量级部署** | 仅52KB的极小体积，快速集成部署 | 零负担使用 |

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
  // Grafana服务基础配置
  baseUrl: 'https://your-grafana-domain.com',  // 替换为您的Grafana地址
  defaultHeaders: {
    'Authorization': 'Bearer your-api-token',  // 替换为您的API密钥
    'Content-Type': 'application/json'
  },
  
  // 预定义查询配置
  queries: {
    // 前端性能监控查询
    frontend_performance: {
      url: "api/ds/es/query",
      method: "POST",
      data: {
        es: {
          index: 'frontend_metrics',
          query: 'your_elasticsearch_query'
        }
      },
      systemPrompt: `您是前端性能分析专家。请深度分析FCP（First Contentful Paint）性能数据：
      
      **分析重点**：
      1. 页面首次内容绘制时间趋势分析
      2. 75百分位数性能表现评估  
      3. 性能劣化问题识别
      4. 用户体验影响评估
      5. 针对性优化建议
      
      请用中文提供详细的性能分析报告和实用的优化建议。`
    },
    
    // CPU使用率监控查询
    cpu_usage: {
      url: 'api/ds/sql/query',
      method: 'POST',
      data: {
        sql: 'SELECT time, cpu_usage FROM system_metrics WHERE time > now() - 1h'
      },
      systemPrompt: `您是CPU性能分析专家。请全面分析CPU使用率数据：
      
      **关键指标**：
      1. CPU使用率趋势和变化模式
      2. 性能峰值时间点分析
      3. 潜在性能瓶颈识别
      4. 系统负载健康度评估
      5. 专业优化建议
      
      请提供专业的CPU性能分析报告和改进方案。`
    }
  },
  
  // 健康检查配置
  healthCheck: { 
    url: 'api/health',
    timeout: 5000
  }
};

export default config;
```

📌 配置获取技巧：

- 方法一（推荐）：
通过 Grafana 获取配置：进入图表 → 点击 "Query Inspector" → 复制查询配置。
如遇复制失败，可尝试解析面板 JSON 后再次提取。

- 方法二：
使用浏览器开发者工具：打开 DevTools → 切换至 Network 面板 → 找到对应的接口请求 → 复制请求参数。


### 步骤3：测试运行

**完全重启Cursor**，然后体验智能分析：

```
👤 您：分析前端性能监控数据
🤖 AI：正在连接Grafana并分析前端性能指标...

👤 您：检查CPU使用率是否正常  
🤖 AI：正在获取CPU监控数据并进行智能分析...
```

**配置完成！**

---

### 常见问题解决方案

<details>
<summary>❌ 无法连接到Grafana服务</summary>

**可能原因和解决方案：**
- ✅ 检查Grafana地址格式：必须包含`https://`或`http://`
- ✅ 验证API密钥有效性：确保未过期且有足够权限
- ✅ 测试网络连通性：ping命令检查网络状态
- ✅ 防火墙设置：确保端口未被阻止

</details>

<details>
<summary>❌ AI提示找不到MCP工具</summary>

**解决步骤：**
1. 🔄 完全退出Cursor并重新启动
2. 📁 检查配置文件路径是否正确
3. 🔍 确保Node.js版本 ≥ 18
4. ⚙️ 如使用nvm：`nvm alias default 18.x.x`

</details>

<details>
<summary>❌ 查询执行失败或超时</summary>

**排查方向：**
- 🕐 增加timeout设置
- 📊 简化查询语句复杂度
- 🔍 检查数据源连接状态
- 📈 验证查询语法正确性

</details>

---

## 高级配置

<details>
<summary>环境变量保护敏感信息</summary>

为了提高安全性，建议将敏感信息存储在环境变量中：

```bash
# 设置环境变量
export GRAFANA_URL="https://your-grafana-domain.com"
export GRAFANA_TOKEN="your-secure-api-token"
```

修改配置文件：
```javascript
const config = {
  baseUrl: process.env.GRAFANA_URL,
  defaultHeaders: {
    'Authorization': `Bearer ${process.env.GRAFANA_TOKEN}`,
    'Content-Type': 'application/json'
  },
  // ... 其他配置保持不变
};

export default config;
```

</details>

<details>
<summary>MCP工具清单</summary>

| 工具名称 | 功能描述 | 适用场景 | 返回内容 |
|----------|----------|----------|----------|
| `analyze_query` | 执行查询并提供AI智能分析 | 需要专业洞察和建议 | 数据+分析报告 |
| `execute_query` | 执行原始数据查询 | 仅需要原始数据 | 纯数据结果 |
| `check_health` | Grafana服务健康检查 | 服务状态监控 | 健康状态信息 |
| `list_queries` | 列出所有可用查询 | 查看配置的查询列表 | 查询配置清单 |
| `server_status` | MCP服务器状态检查 | MCP连接状态确认 | 服务器状态 |

</details>

---

## 许可证

本项目遵循 MIT 开源协议。详见 [LICENSE](LICENSE) 文件。

