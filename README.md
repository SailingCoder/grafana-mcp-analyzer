# Grafana MCP Analyzer 🤖

![Version](https://img.shields.io/npm/v/grafana-mcp-analyzer) ![License](https://img.shields.io/npm/l/grafana-mcp-analyzer) 

**让 AI 直接读懂你的监控数据，成为你的专属智能运维助手！**

[English](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README_EN.md) | [中文文档](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README.md)

## ✨ 项目简介

想象一下这样的场景：

* 您问AI："我的服务器现在怎么样？"
* AI直接查看您的Grafana监控，回答："CPU使用率偏高，建议检查这几个进程..."

繁杂的监控图表，AI 辅助你一键解读。你无需再逐图筛查，真正实现从 **图表到洞察** 的闭环分析体验！

## 🚀 核心特性

Grafana MCP Analyzer 基于 **MCP (Model Context Protocol)** 协议，赋能Claude、ChatGPT等AI助手具备以下超能力：

-   **自然语言查询** - 轻松访问监控数据，AI 一键输出专业分析
-   **多轮对话支持** - 支持复杂的多轮对话分析，能够基于上下文进行深入分析
-   **curl支持** - 直接使用浏览器 copy 的 curl 合成查询
-   **全数据源支持** - Prometheus、MySQL、ES 等通通支持
-   **专业 DevOps 建议** - 不只是展示数据，更提供可执行的优化方案，提升DevOps效率

> 💡 **架构新模式**：会话缓存 → 逐步获取数据 → 渐进式深入分析 → 缓存复用，让AI分析更准确、更高效。


## 🛠️ 快速开始

### 第一步：极速安装（30秒）

```bash
npm install -g grafana-mcp-analyzer
```

> **环境要求**：Node.js 18+ | [安装指南](https://blog.csdn.net/qq_37834631/article/details/148457021?spm=1001.2014.3001.5501)

### 第二步：AI 助手集成（30秒）

Cursor设置 → “MCP” → 服务配置（以Cursor为例），或者创建 .cursor/mcp.json 中添加配置：

```json
{
  "mcpServers": {
    "grafana": {
      "command": "grafana-mcp-analyzer",
      "env": {
        "CONFIG_PATH": "https://raw.githubusercontent.com/SailingCoder/grafana-mcp-analyzer/main/config/grafana-config-play.js",
        "MAX_CHUNK_SIZE": "100"
      }
    }
  }
}
```

注：`CONFIG_PATH`支持绝对路径、远程路径，推荐使用远程路径快速体验。

### 第三步：编写配置文件（1分钟）

如需连接自有数据，可在 `CONFIG_PATH` 路径下创建配置文件：（grafana-config-play.js 示例 👉 [点此查看](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/config/grafana-config-play.js) ）

> 如果你只想快速体验示例，可跳过此步骤，直接执行第四步。

<details>
<summary>点击展开查看示例</summary>

```javascript
/**
 * 基于Grafana Play演示实例的配置文件
 * 以下配置文件内容来源：https://raw.githubusercontent.com/SailingCoder/grafana-mcp-analyzer/main/config/grafana-config-play.js
 * Request 配置方式：支持 http api 和 curl
 */
const config = {
  // Grafana服务器地址
  baseUrl: 'https://play.grafana.org',
  
  // 默认请求头
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*'
  },

  // 健康检查配置
  healthCheck: {
    url: 'api/health'
  },

  // 查询定义
  queries: {
    // Price Only, Hollow Candles
    // 使用HTTP API格式
    // 数据源：https://play.grafana.org/d/candlestick/candlestick?orgId=1&from=2021-07-13T22:13:30.740Z&to=2021-07-13T22:46:18.921Z&timezone=utc&viewPanel=panel-7
    candlestick_priceOnly_hollowCandles: {
      url: 'api/ds/query',
      method: 'POST',
      params: {
        ds_type: 'grafana-testdata-datasource',
        requestId: 'SQR279'
      },
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        'origin': 'https://play.grafana.org',
        'pragma': 'no-cache',
        'priority': 'u=1, i',
        'referer': 'https://play.grafana.org/d/candlestick/candlestick?orgId=1&from=2021-07-13T22:13:30.740Z&to=2021-07-13T22:46:18.921Z&timezone=utc&viewPanel=panel-7',
        'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'traceparent': '00-f0f1243b82acf0e362fd1f836565154a-fc3a173d3190c9df-01',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        'x-dashboard-title': 'Candlestick',
        'x-dashboard-uid': 'candlestick',
        'x-datasource-uid': 'PD8C576611E62080A',
        'x-grafana-device-id': '49c7d4ecdeee88ab5dde64deffa8ea2e',
        'x-grafana-org-id': '1',
        'x-panel-id': '7',
        'x-panel-plugin-id': 'candlestick',
        'x-panel-title': 'Price Only, Hollow Candles',
        'x-plugin-id': 'grafana-testdata-datasource'
      },
      data: {
        queries: [{
          csvFileName: "ohlc_dogecoin.csv",
          refId: "A",
          scenarioId: "csv_file",
          datasource: {
            type: "grafana-testdata-datasource",
            uid: "PD8C576611E62080A"
          },
          datasourceId: 454,
          intervalMs: 2000,
          maxDataPoints: 1180
        }],
        from: "1626214410740",
        to: "1626216378921"
      },
      systemPrompt: `您是狗狗币K线图分析专家。

**分析重点**：
1. 价格趋势识别 - 识别主要趋势方向(上涨/下跌/横盘)
2. 关键价位分析 - 找出支撑位和阻力位
3. 交易机会评估 - 基于K线形态识别入场时机
4. 风险评估 - 提供风险提示和投资建议

**输出格式**：
## 图表概览
- 时间范围：[具体时间]
- 价格范围：[最高价-最低价] 
- 主要趋势：[上涨/下跌/横盘]

## 技术分析
- 支撑位：[价格水平]
- 阻力位：[价格水平]
- 关键行为：[重要价格行为]

## 交易建议
- 短期方向：[看涨/看跌/中性]
- 关键价位：[关注价位]
- 风险提示：[重要提醒]`
    },
    // faro-shop-control-plane - Overall CPU Utilization
    // 使用 cUrl 格式
    // 数据源：https://play.grafana.org/d/cNMLIAFK/cpu-utilization-details-cores?var-interval=$__auto&orgId=1&from=now-3h&to=now&timezone=browser&var-host=faro-shop-control-plane&var-cpu=$__all&viewPanel=panel-22
    overall_cpu_utilization: {
      curl: `curl 'https://play.grafana.org/api/ds/query?ds_type=prometheus&requestId=SQR112' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: zh-CN,zh;q=0.9' \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/json' \
  -b '_ga=GA1.2.1909983567.1753671369; _gid=GA1.2.532774264.1753671369; rl_page_init_referrer=RudderEncrypt%3AU2FsdGVkX1%2B2lASJjXBqxv6%2FOpvlv5ClRT5vw%2BELHuE%3D; rl_page_init_referring_domain=RudderEncrypt%3AU2FsdGVkX19MSXh%2BQbiHW5f9mLAaP3ghy%2FcJZIk9zhI%3D; intercom-id-agpb1wfw=219eac14-cc23-4ca5-aa16-c299fab8c0ab; intercom-session-agpb1wfw=; intercom-device-id-agpb1wfw=fd9a6df6-d6c8-4b40-958b-568fc7f30ae2; rl_group_id=RudderEncrypt%3AU2FsdGVkX196IBi0ppflecKuY9333Hf3E8fCWy4xJNU%3D; rl_group_trait=RudderEncrypt%3AU2FsdGVkX19%2Fc4msmFb6pg0d4rM%2BpLKI9zqEnxxFrPE%3D; rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX186iymdvmvCOhwF2sff5XEHniCdK0idYHYA4P%2BUpg8hnPVqFbQpqF%2Fn5dfeDz3BxORb9hPn8cIvwQ%3D%3D; rl_user_id=RudderEncrypt%3AU2FsdGVkX1%2B7qEm%2BjVUpWQfQIZgdXaAXNAGDqx%2ByBo3qzXCeyxQWfQNHP9CFM4cX; rl_trait=RudderEncrypt%3AU2FsdGVkX19zSSOXFUxzg3KWR6VQOAkavGgxHg9JdbDKn6hPh3%2BBm3nDBP%2F6tM0wl0b6r0f1A2MZ2SeB6p9f%2FeeaUcrUzR%2FQDfqJHZGhOCdpwmOXZVVQncG%2Ff3ITY6GU%2BvGu9sfYHNgcpS5UHphpBA%3D%3D; _ga_Y0HRZEVBCW=GS2.2.s1753671369$o1$g1$t1753671728$j23$l0$h0; rl_session=RudderEncrypt%3AU2FsdGVkX18BkXGTwuY7KtE7Zr6WjpDFDtkvh9%2Btz4dc8BJeXT1%2FrqgdzGnXydN9EMwRRVR%2FQzGVBtyZ%2FNhg27pvhkbqL2QVLD%2F79GRtbxM8qDKCDo4c%2FfokCEdeF8AoiuRXQzPkAC7UEy7g1swC9w%3D%3D' \
  -H 'origin: https://play.grafana.org' \
  -H 'pragma: no-cache' \
  -H 'priority: u=1, i' \
  -H 'referer: https://play.grafana.org/d/cNMLIAFK/cpu-utilization-details-cores?var-interval=$__auto&orgId=1&from=now-3h&to=now&timezone=browser&var-host=faro-shop-control-plane&var-cpu=$__all&viewPanel=panel-22&inspect=panel-22&inspectTab=query' \
  -H 'sec-ch-ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'traceparent: 00-fea7a897de47671f57a42d15b26043a5-578babdc8cb152e0-01' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36' \
  -H 'x-dashboard-title: CPU Utilization Details (Cores)' \
  -H 'x-dashboard-uid: cNMLIAFK' \
  -H 'x-datasource-uid: grafanacloud-prom' \
  -H 'x-grafana-device-id: 49c7d4ecdeee88ab5dde64deffa8ea2e' \
  -H 'x-grafana-org-id: 1' \
  -H 'x-panel-id: 22' \
  -H 'x-panel-plugin-id: timeseries' \
  -H 'x-panel-title: $host - Overall CPU Utilization' \
  -H 'x-plugin-id: prometheus' \
  --data-raw $'{"queries":[{"calculatedInterval":"2s","datasource":{"type":"prometheus","uid":"grafanacloud-prom"},"datasourceErrors":{},"errors":{},"expr":"clamp_max((avg by (mode) ( (clamp_max(rate(node_cpu_seconds_total{instance=\\"faro-shop-control-plane\\",mode\u0021=\\"idle\\"}[1m]),1)) or (clamp_max(irate(node_cpu_seconds_total{instance=\\"faro-shop-control-plane\\",mode\u0021=\\"idle\\"}[5m]),1)) )),1)","format":"time_series","hide":false,"interval":"1m","intervalFactor":1,"legendFormat":"{{mode}}","metric":"","refId":"A","step":300,"exemplar":false,"requestId":"22A","utcOffsetSec":28800,"scopes":[],"adhocFilters":[],"datasourceId":171,"intervalMs":60000,"maxDataPoints":1180},{"datasource":{"type":"prometheus","uid":"grafanacloud-prom"},"expr":"clamp_max(max by () (sum  by (cpu) ( (clamp_max(rate(node_cpu_seconds_total{instance=\\"faro-shop-control-plane\\",mode\u0021=\\"idle\\",mode\u0021=\\"iowait\\"}[1m]),1)) or (clamp_max(irate(node_cpu_seconds_total{instance=\\"faro-shop-control-plane\\",mode\u0021=\\"idle\\",mode\u0021=\\"iowait\\"}[5m]),1)) )),1)","format":"time_series","hide":false,"interval":"1m","intervalFactor":1,"legendFormat":"Max Core Utilization","refId":"B","exemplar":false,"requestId":"22B","utcOffsetSec":28800,"scopes":[],"adhocFilters":[],"datasourceId":171,"intervalMs":60000,"maxDataPoints":1180}],"from":"1753660994019","to":"1753671794019"}'`,
      systemPrompt: `您是系统性能分析专家，专注于CPU使用率历史趋势分析。

**数据特点**：这是总体CPU使用率的历史时间序列数据，包含：
- **user**: 用户模式CPU使用率
- **system**: 系统模式CPU使用率  
- **iowait**: I/O等待时间
- **softirq**: 软件中断
- **Max Core Utilization**: 单核最大使用率

**分析重点**：
1. **历史趋势分析** - 识别CPU使用率的变化趋势和模式
2. **性能瓶颈识别** - 分析哪个CPU模式占用最多资源
3. **峰值分析** - 识别CPU使用率的峰值时间和原因
4. **系统健康评估** - 基于历史数据评估系统整体健康状况
5. **容量规划建议** - 基于趋势预测未来资源需求

**输出要求**：
- 提供具体的时间范围和数据统计
- 识别关键的性能指标和异常模式
- 分析不同CPU模式的使用情况
- 给出基于历史数据的优化建议

请提供详细的CPU性能趋势分析报告。`
    },
  }
};

module.exports = config;
```
</details>

### 第四步：开始使用！

修改完配置后，重启 Cursor 即可开始使用：

![在这里插入图片描述](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/docs/image(1).png)

> ⚠️ **注意：** 修改 `mcp.json` 或配置文件后，都需要重启 Cursor。

然后，体验 AI 智能分析：

**1、你想了解**：狗狗币最近的价格走势怎么样？

**对话示例**：

```text
👤 你：帮我分析一下candlestick_priceOnly_hollowCandles的数据
🤖 AI：好的，我来获取狗狗币的K线数据并分析...

👤 你：这个分析太简单了，能详细说说支撑位和阻力位吗？
🤖 AI：基于刚才的数据，我来深入分析技术指标...

👤 你：现在价格在什么位置？有投资机会吗？
🤖 AI：根据技术分析，当前价格在...
```

**2、你想了解**：系统CPU整体运行状况如何？

**对话示例**：

```
👤 您：分析overall_cpu_utilization的数据
🤖 AI：提供CPU分析报告

👤 您：CPU使用率的变化趋势如何？
🤖 AI：基于刚才的数据，分析CPU使用率变化趋势

👤 您：这个峰值是什么时候出现的？
🤖 AI：基于我们之前的分析，识别CPU峰值时间

👤 您：需要扩容吗？扩容的成本是多少？
🤖 AI：基于历史数据，提供扩容建议和成本评估
```

一句话总结：**AI 不再只是“聊天”，现在它也能读懂你的监控图表了。**


## MCP工具清单

| 工具 | 功能 | 使用场景 |
|------|------|----------|
| `analyze_query` | 查询+AI分析 | 首次获取数据并分析 |
| `analyze_existing_data` | 基于已有数据分析 | 多轮对话深入分析 |
| `chunk_workflow` | 分块数据工作流 | 大数据量自动分块处理 |
| `manage_cache` | 缓存管理 | 缓存统计、清理和优化 |
| `list_queries` | 查询列表 | 查看可用数据源 |
| `check_health` | 健康检查 | 系统状态监控 |
| `list_data` | 数据列表 | 查看存储的历史数据 |
| `server_status` | 服务器状态 | 服务器运行信息 |

> **说明**：系统采用会话缓存管理，支持渐进式分析和多轮对话，比传统的聚合分析更加灵活高效。

#### 工具使用方式

```javascript
// AI助手会自动选择合适的工具
👤 "分析CPU使用情况" → 🤖 调用 analyze_query
👤 "基于刚才的数据深入分析" → 🤖 调用 analyze_existing_data
👤 "查看缓存状态" → 🤖 调用 manage_cache
👤 "分析大数据量" → 🤖 调用 chunk_workflow

// 缓存管理操作
👤 "查看缓存" → 🤖 调用 manage_cache
👤 "删除overall_cpu_utilization缓存" → 🤖 调用 manage_cache
👤 "清空所有缓存" → 🤖 调用 manage_cache
```

## 高级配置

以下内容适用于需要自定义数据源或进行更高级使用场景的用户。

<details>
<summary>如何获取 Request 配置？</summary>

#### 方式一：HTTP API（如 `candlestick_priceOnly_hollowCandles`）

1.  获取 Data 传参：进入图表 → "Query Inspector" → "JSON"解析 → 拷贝请求体(request)
2.  获取 Url 和 Headers Token：通过 Network 面板查看请求参数，手动构造 HTTP 配置。

#### 方式二：curl（推荐，适用于所有面板，如`overall_cpu_utilization`）：

1.  在Grafana中执行查询
2.  按F12打开开发者工具 → Network标签页
3.  找到查询请求 → 右键点击 → Copy as cURL
4.  将复制的 curl 粘贴至配置文件中即可
</details>

<details>
<summary>配置建议（MAX_CHUNK_SIZE）</summary>

```json
"env": {
  "MAX_CHUNK_SIZE": "100"
}
```
受限于目前市场 AI 模型的上下文处理能力，为提高分析的准确性和效率，系统会自动将大数据量按 100KB 分块处理。

- 100KB - 保守策略，兼容所有模型
- 150KB - 平衡策略，推荐设置
- 200KB - 激进策略，仅限新模型

**推荐设置**：

- **Claude 3.5 Sonnet / GPT-4 Turbo**: `MAX_CHUNK_SIZE=150`
- **GPT-4 (8K)**: `MAX_CHUNK_SIZE=100`
- **Claude 3**: `MAX_CHUNK_SIZE=200`

建议分析的数据最大体积控制在 500KB 以内（可根据模型能力做适当调整），分析效果最佳。您可以通过调整查询的时间范围、数据源等参数来控制总数据量。

</details>


<details>
<summary>环境变量说明</summary>

```json
{
  "mcpServers": {
    "grafana": {
      "command": "grafana-mcp-analyzer",
      "env": {
        "CONFIG_PATH": "https://raw.githubusercontent.com/SailingCoder/grafana-mcp-analyzer/main/config/grafana-config-play.js",
        "MAX_CHUNK_SIZE": "100",
        "DATA_EXPIRY_HOURS": "24",
        "CONFIG_MAX_AGE": "300",
        "SESSION_TIMEOUT_HOURS": "24"
      }
    }
  }
}
```

| 环境变量名 | 类型 | 默认值 | 说明 |
| --------- | ---- | ------ | ---- |
| `MAX_CHUNK_SIZE` | number | `100` | 单块最大数据体积（KB），影响数据切片大小，可根据AI模型上下文窗口调整 |
| `CONFIG_PATH` | string | 必填 | 配置文件路径（本地或 HTTPS 远程地址），支持GitHub Raw、云存储等 |
| `CONFIG_MAX_AGE` | number | `300` | 远程配置文件缓存时间（秒），设为 `0` 则禁用 |
| `DATA_EXPIRY_HOURS` | number | `24` | 数据过期时间（小时），避免频繁网络请求，控制缓存自动清理 |
| `SESSION_TIMEOUT_HOURS` | number | `24` | 会话超时时间（小时），控制会话管理，过期会话会被自动清理 |

</details>

<details>
<summary>支持配置类型：本地绝对路径 / 远程路径</summary>
    
#### 1. 远程路径
    
支持通过HTTPS URL访问远程配置文件，适用于团队协作和多环境部署：

```json
{
  "env": {
    "CONFIG_PATH": "https://raw.githubusercontent.com/SailingCoder/grafana-mcp-analyzer/main/config/grafana-config-play.js"
  }
}
```

支持的远程存储：

*   GitHub Raw: `https://raw.githubusercontent.com/SailingCoder/grafana-mcp-analyzer/main/config/grafana-config-play.js`
*   阿里云OSS: `https://bucket.oss-cn-hangzhou.aliyuncs.com/config.js`
*   腾讯云COS: `https://bucket-123.cos.ap-shanghai.myqcloud.com/config.js`
*   AWS S3: `https://bucket.s3.amazonaws.com/config.js`

注意：
- ❌ 不支持 GitHub 网页路径，如 https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/config/grafana-config-play.js,	返回的是 HTML 页面
- ✅ 必须使用 GitHub Raw 格式获取原始 JS 文件，如 https://raw.githubusercontent.com/SailingCoder/grafana-mcp-analyzer/main/config/grafana-config-play.js


#### 2. 本地路径
    
支持传入本地绝对路径，适用于快速测试分析：
    
```json
{
  "mcpServers": {
    "grafana": {
      "command": "grafana-mcp-analyzer",
      "env": {
        "CONFIG_PATH": "/Users/your-username/project/grafana-config.js"
      }
    }
  }
}
```
</details>

<details>
<summary>命令行选项</summary>

```bash
# 显示版本信息
grafana-mcp-analyzer -v
grafana-mcp-analyzer --version

# 显示帮助信息
grafana-mcp-analyzer -h
grafana-mcp-analyzer --help
```

</details>

## 配置示例

<details>
<summary>电商业务分析</summary>

**用户问题**："我的电商转化率怎么样？如何提升销售额？"

```javascript
// 电商转化率分析
ecommerce_conversion: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"rate(orders_total[5m]) / rate(page_views_total[5m]) * 100","range":{"from":"now-24h","to":"now"}}]}'`,
  systemPrompt: `您是电商业务分析专家。请分析转化率数据并回答以下关键问题：

**核心分析问题**：
1. 当前转化率是多少？与行业标准对比如何？
2. 转化率在一天中的高峰和低谷时段是什么时候？
3. 哪些因素可能影响转化率下降？
4. 具体建议如何提升转化率？预期能带来多少收益？

**输出格式**：
- 数据概览：当前转化率数值和趋势
- 问题诊断：识别转化率瓶颈
- 优化建议：3-5个可执行的改进方案
- 收益预测：预期提升效果和ROI

请用通俗易懂的语言，给出可操作的具体建议。`
}
```

</details>

<details>
<summary>金融风控分析</summary>
**用户问题**："我的交易系统有风险吗？如何预防欺诈？"

```javascript
// 交易风控分析
finance_risk_analysis: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"sum(rate(transaction_amount_total[5m]))","range":{"from":"now-7d","to":"now"}}]}'`,
  systemPrompt: `您是金融风控专家。请分析交易数据并回答以下关键问题：

**核心分析问题**：
1. 当前交易量是否异常？与历史对比如何？
2. 是否存在可疑的交易模式？
3. 哪些交易需要重点关注？
4. 如何优化风控策略？

**输出格式**：
- 风险等级：低/中/高风险
- 异常指标：具体异常数据点
- 风险分析：潜在风险原因
- 防护建议：具体风控措施
- 紧急行动：需要立即处理的事项

请用红色标记高风险，黄色标记中风险，绿色标记低风险。`
}
```
</details>

<details>
<summary>用户行为分析</summary>

**用户问题**："我的用户活跃度怎么样？如何提高用户留存？"

```javascript
// 用户活跃度分析
user_engagement: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"count(increase(user_sessions_total[1h]))","range":{"from":"now-30d","to":"now"}}]}'`,
  systemPrompt: `您是用户行为分析专家。请分析用户活跃度数据并回答以下关键问题：

**核心分析问题**：
1. 用户活跃度趋势如何？是否在增长？
2. 用户使用习惯有什么特点？
3. 哪些用户群体最活跃？
4. 如何提高用户留存率？

**输出格式**：
- 用户画像：活跃用户特征
- 趋势分析：活跃度变化趋势
- 目标用户：最有价值的用户群体
- 留存策略：提高用户粘性的方法
- 预期效果：实施建议后的预期改善

请结合用户生命周期，给出个性化的运营建议。`
}
```

</details>

<details>
<summary>服务器性能监控</summary>

**用户问题**："我的服务器性能怎么样？需要扩容吗？"

```javascript
// 服务器性能分析
server_performance: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{
      "refId":"A",
      "expr":"node_cpu_seconds_total{mode=\"user\"} / node_cpu_seconds_total * 100",
      "range":{"from":"now-2h","to":"now"}
    }]}'`,
  systemPrompt: `您是系统性能专家。请分析服务器性能数据并回答以下关键问题：

**核心分析问题**：
1. CPU使用率是否正常？是否接近瓶颈？
2. 内存使用情况如何？是否存在泄漏？
3. 磁盘I/O是否成为瓶颈？
4. 是否需要扩容或优化？

**输出格式**：
- 性能评分：优秀/良好/一般/差
- 关键指标：CPU、内存、磁盘使用率
- 瓶颈分析：性能问题原因
- 优化建议：具体改进方案
- 告警建议：需要立即关注的问题

请用颜色标记不同严重程度：正常 注意 危险`
}
```
</details>

<details>
<summary>应用错误监控</summary>

**用户问题**："我的应用有错误吗？影响用户体验吗？"

```javascript
// 应用错误分析
app_error_analysis: {
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
  systemPrompt: `您是应用监控专家。请分析错误日志并回答以下关键问题：

**核心分析问题**：
1. 错误频率如何？是否在增加？
2. 哪些错误最严重？影响多少用户？
3. 错误集中在哪些功能模块？
4. 如何快速修复和预防？

**输出格式**：
- 错误等级：严重/中等/轻微
- 错误统计：错误数量、影响用户数
- 错误分类：按模块和类型分类
- 修复建议：具体修复步骤
- 预防措施：避免类似错误的方法

请按严重程度排序，优先处理影响用户最多的错误。`
}
```
</details>



## 常见问题

<details>
<summary>无法连接到Grafana服务</summary>

*   检查Grafana地址格式：必须包含`https://`或`http://`
*   验证API密钥有效性：确保未过期且有足够权限
*   测试网络连通性和防火墙设置

</details>

<details>
<summary>AI提示找不到MCP工具</summary>

*   完全退出Cursor并重新启动
*   检查配置文件路径是否正确
*   确保Node.js版本 ≥ 18

</details>

<details>
<summary>查询执行失败或超时</summary>

*   增加timeout设置
*   检查数据源连接状态
*   数据量过大时，缩小时间范围

</details>

<details>
<summary>多轮对话中数据混淆</summary>

*   确保使用正确的queryName，不同查询使用不同的名称
*   系统会自动缓存不同查询的数据，避免混淆
*   如果遇到数据混淆，可以重新调用analyze_query获取新数据
*   使用analyze_existing_data进行基于缓存数据的深入分析
*   系统支持会话隔离，不同会话的数据相互独立

</details>

<details>
<summary>缓存管理问题</summary>

*   查看缓存统计：使用manage_cache工具查看缓存状态 
    👤 你：获取缓存
    🤖 AI：我来为您获取当前的缓存信息
*   清理过期缓存：定期清理过期缓存释放存储空间 
    👤 你：清除所有缓存
    🤖 AI：我来尝试清除所有缓存。
*   缓存性能优化：系统会自动进行智能缓存优化 
*   缓存冲突处理：相同queryName不同配置会自动去重

</details>

## 文章推荐

*   [grafana-mcp-analyzer：基于 MCP 的轻量 AI 分析监控图表的运维神器！](https://blog.csdn.net/qq_37834631/article/details/148473620?spm=1001.2014.3001.5501) - CSDN技术博客深度解析

## 许可证

MIT 开源协议。详见 [LICENSE](LICENSE) 文件。