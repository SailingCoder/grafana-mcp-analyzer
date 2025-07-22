# Grafana MCP Analyzer 🤖

![Version](https://img.shields.io/npm/v/grafana-mcp-analyzer) ![License](https://img.shields.io/npm/l/grafana-mcp-analyzer) 

**让AI直接读懂你的监控数据，智能化运维分析助手**

[English](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README_EN.md) | [中文文档](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README.md)

## ✨ 项目简介

想象一下这样的场景：

* 您问AI："我的服务器现在怎么样？"
* AI直接查看您的Grafana监控，回答："CPU使用率偏高，建议检查这几个进程..."

复杂的监控图表，AI帮您一键分析！告别传统的手动监控方式，让AI成为您的专属运维助手！

## 🚀 核心特性

Grafana MCP Analyzer 基于 **MCP (Model Context Protocol)** 协议，赋能Claude、ChatGPT等AI助手具备以下超能力：

-   **自然语言查询** - 轻松访问监控数据，AI 一键输出专业分析
-   **智能格式化** - 支持**大数据量**分析，高效解析各类数据
-   **curl支持** - 直接使用浏览器 copy 的 curl 合成查询
-   **聚合分析** - 单个查询或 Dashboard 级别综合分析
-   **异常检测** - AI 主动报告性能问题，提前警报
-   **全数据源支持** - Prometheus、MySQL、ES 等通通支持
-   **专业 DevOps 建议** - 不只是展示数据，更提供可执行的优化方案，提升DevOps效率

## 🛠️ 快速开始

### 第一步：安装

```bash
npm install -g grafana-mcp-analyzer
```

> **环境要求**：Node.js 18+ | [安装指南](https://blog.csdn.net/qq_37834631/article/details/148457021?spm=1001.2014.3001.5501)

### 第二步：配置AI助手（以Cursor为例）

```json
{
  "mcpServers": {
    "grafana": {
      "command": "grafana-mcp-analyzer",
      "env": {
        "CONFIG_PATH": "https://raw.githubusercontent.com/SailingCoder/grafana-mcp-analyzer/main/config/grafana-config-play.js"
      }
    }
  }
}
```

注：`CONFIG_PATH`支持绝对路径、远程路径，推荐使用远程路径快速体验。

### 第三步：编写配置文件

如果你希望使用自己的数据源，可创建一个`CONFIG_PATH`路径下的`grafana-config-play.js`配置文件：

<details>
<summary>点击展开查看示例</summary>

```javascript
/**
 * 基于Grafana Play演示实例的配置文件
 * 数据源(狗狗币OHLC数据)：https://play.grafana.org/d/candlesticksss/candlestick2?orgId=1&from=2021-07-13T22:13:30.740Z&to=2021-07-13T22:46:18.921Z&timezone=utc
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
    // 第一个查询 - 使用curl格式（面板2的狗狗币数据）
    // dogecoin_panel_2 ....

    // 第二个查询 - 使用HTTP API格式（面板7的狗狗币数据）
    'dogecoin_panel_7': {
      url: 'api/ds/query',
      method: 'POST',
      params: {
        ds_type: 'grafana-testdata-datasource',
        requestId: 'SQR109'
      },
      headers: {
        'accept': 'application/json, text/plain, */*',
        'content-type': 'application/json',
        'x-datasource-uid': '9cY0WtPMz',
        'x-grafana-org-id': '1',
        'x-panel-id': '7',
        'x-panel-plugin-id': 'candlestick',
        'x-plugin-id': 'grafana-testdata-datasource'
      },
      data: {
        queries: [{
          csvFileName: "ohlc_dogecoin.csv",
          datasource: {
            type: "grafana-testdata-datasource",
            uid: "9cY0WtPMz"
          },
          refId: "A",
          scenarioId: "csv_file",
          datasourceId: 153,
          intervalMs: 2000,
          maxDataPoints: 1150
        }],
        from: "1626214410740",
        to: "1626216378921"
      },
      systemPrompt: `您是金融市场技术分析专家，专注于加密货币市场分析。

**分析重点**：
1. 市场趋势和动量分析 - 识别主要趋势方向和动量变化
2. 价格模式识别 - 识别头肩顶、双底、三角形等经典形态
3. 成交量与价格关系 - 分析成交量对价格走势的支撑
4. 市场情绪评估 - 基于技术指标评估市场情绪状态
5. 短期和长期投资策略建议 - 提供不同时间周期的投资建议

**输出要求**：
- 基于实际数据进行分析，提供具体数值解读
- 识别关键的价格模式和趋势变化
- 给出明确的交易建议和风险提示
- 提供可操作的投资策略

请提供详细的技术分析报告。`
    },
    overall_cpu_utilization100: {
      curl: `curl 'https://play.grafana.org/api/ds/query?ds_type=prometheus&requestId=SQR371' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: zh-CN,zh;q=0.9' \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/json' \
  -b '_ga=GA1.2.387525048.1751712678; rl_page_init_referrer=RudderEncrypt%3AU2FsdGVkX191kw8iAnoyFkv6jbIl3EOkbSdK21uFLwGid2zCBcXWXVl4rK8kP9uB; rl_page_init_referring_domain=RudderEncrypt%3AU2FsdGVkX1%2FQpNd4Fbr7FgBG8YeyeoTAiBUO993bC9E%3D; _gid=GA1.2.354949503.1752935466; rl_group_id=RudderEncrypt%3AU2FsdGVkX1%2Fyd5jy%2Bq5XZfeqcDGhXMhz56ANft0NLCo%3D; rl_group_trait=RudderEncrypt%3AU2FsdGVkX1%2F9hmHjbWlb%2F%2B2RP0JlMRymkg9QBgUw3oE%3D; rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX19JQD0l8hbD8ApQMSbVisxyXCEuam7wcYtcnfywOO67gQc7EjkFm0bW%2BNZjB%2BsmRZnHy5ccbyeoHQ%3D%3D; rl_user_id=RudderEncrypt%3AU2FsdGVkX18s9kRPf%2BwQSRIaYGd9O5kGPmZh%2FQhoq4LyI63CRJNoBrh7Cc06OuAO; rl_trait=RudderEncrypt%3AU2FsdGVkX1%2B%2FhZugE4qfWyjSTEFKcsYs0DwcOyfdazoJfVtGv4x0q%2BOFxbqHDD0r%2BLWcg%2F6CceMFQH3dJIa3C0WyF0hWoBLLwV%2BiQB4077KEHTtX%2BkJxjJ4X6czXwpsh%2FsV9e8l4ptVfz%2FgyJLh1qw%3D%3D; _gat=1; _ga_Y0HRZEVBCW=GS2.2.s1752935474$o2$g1$t1752935591$j38$l0$h0; rl_session=RudderEncrypt%3AU2FsdGVkX1%2BUhBGRm24hqUS5TRKZrN31aK8t518MW16GZKplO6iFClFnqmpYiglWbXqKgnDZz8o%2FaGxuQouIM%2BN0BBr8Nh3HY6chGRtVUEeRSRXAAQiiH30%2Bp6%2F57AoqhwV3k0jqvIikr69S9sDpCg%3D%3D' \
  -H 'origin: https://play.grafana.org' \
  -H 'pragma: no-cache' \
  -H 'priority: u=1, i' \
  -H 'referer: https://play.grafana.org/d/cNMLIAFK/cpu-utilization-details-cores?var-interval=$__auto&orgId=1&from=now-3h&to=now&timezone=browser&var-host=faro-shop-control-plane&var-cpu=$__all&refresh=5s&editPanel=22&inspect=22&inspectTab=query' \
  -H 'sec-ch-ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36' \
  -H 'x-dashboard-title: CPU Utilization Details (Cores)' \
  -H 'x-dashboard-uid: cNMLIAFK' \
  -H 'x-datasource-uid: grafanacloud-prom' \
  -H 'x-grafana-device-id: 2b0db28108a0a56f4a0dcf3d59537fe7' \
  -H 'x-grafana-org-id: 1' \
  -H 'x-panel-id: 22' \
  -H 'x-panel-plugin-id: timeseries' \
  -H 'x-panel-title: $host - Overall CPU Utilization' \
  -H 'x-plugin-id: prometheus' \
  --data-raw $'{"queries":[{"calculatedInterval":"2s","datasource":{"type":"prometheus","uid":"grafanacloud-prom"},"datasourceErrors":{},"errors":{},"expr":"clamp_max((avg by (mode) ( (clamp_max(rate(node_cpu_seconds_total{instance=\\"faro-shop-control-plane\\",mode\u0021=\\"idle\\"}[1m]),1)) or (clamp_max(irate(node_cpu_seconds_total{instance=\\"faro-shop-control-plane\\",mode\u0021=\\"idle\\"}[5m]),1)) )),1)","format":"time_series","hide":false,"interval":"1m","intervalFactor":1,"legendFormat":"{{mode}}","metric":"","refId":"A","step":300,"exemplar":false,"requestId":"22A","utcOffsetSec":28800,"scopes":[],"adhocFilters":[],"datasourceId":171,"intervalMs":60000,"maxDataPoints":778},{"datasource":{"type":"prometheus","uid":"grafanacloud-prom"},"expr":"clamp_max(max by () (sum  by (cpu) ( (clamp_max(rate(node_cpu_seconds_total{instance=\\"faro-shop-control-plane\\",mode\u0021=\\"idle\\",mode\u0021=\\"iowait\\"}[5m]),1)) or (clamp_max(irate(node_cpu_seconds_total{instance=\\"faro-shop-control-plane\\",mode\u0021=\\"idle\\",mode\u0021=\\"iowait\\"}[5m]),1)) )),1)","format":"time_series","hide":false,"interval":"1m","intervalFactor":1,"legendFormat":"Max Core Utilization","refId":"B","exemplar":false,"requestId":"22B","utcOffsetSec":28800,"scopes":[],"adhocFilters":[],"datasourceId":171,"intervalMs":60000,"maxDataPoints":778}],"from":"1752924823337","to":"1752935623337"}'`,
      systemPrompt: `您是系统性能分析专家，专注于CPU使用率数据分析。

**核心任务**：直接回答用户的问题："我的服务器现在怎么样？"

**必须回答的问题**：
当前CPU使用率是多少？（具体数值）

**输出格式**：
## 服务器状态概览
**直接结论**：服务器CPU使用率 [具体数值]%，状态 [正常/偏高/异常]

## 详细数据
- **当前使用率**：[数值]%
- **平均使用率**：[数值]%
- **峰值使用率**：[数值]%
- **主要使用模式**：[user/system/iowait等]

## 风险评估
[基于数据的具体风险分析]

## 行动建议
[具体的可执行建议]

**重要**：如果无法获取到实际数据，请明确说明"无法获取实际数据"，并解释可能的原因。不要基于假设进行分析！`
    },
  }
};

module.exports = config;
```
</details>

### 第四步：开始使用！

**完全重启Cursor**，然后体验智能分析：

> 👤 您：分析overall_cpu_utilization100数据\
> 🤖 AI：正在连接Grafana并分析...

> 👤 您：聚合分析dogecoin_panel_2、dogecoin_panel_7的数据\
> 🤖 AI：同时查询多个指标并进行综合关联分析...

**配置完成！**

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/922ac00595694c5796556586b224d63f.png#pic_center)

## MCP工具清单

| 工具 | 功能 | 使用场景 |
|------|------|----------|
| `analyze_query` | 查询+AI分析 | 需要专业建议 |
| `aggregate_analyze` | 聚合分析 | 多查询统一分析 |
| `list_queries` | 查询列表 | 查看配置 |
| `check_health` | 健康检查 | 状态监控 |
| `manage_sessions` | 会话管理 | 管理分析会话 |
| `list_data` | 数据列表 | 查看存储数据 |
| `server_status` | 服务器状态 | 服务器信息 |

### 工具使用方式

```javascript
// AI助手会自动选择合适的工具
👤 "分析CPU使用情况" → 🤖 调用 analyze_query
👤 "聚合分析系统指标" → 🤖 调用 aggregate_analyze
```

## 高级配置

以下内容适用于需要自定义数据源或进行更高级使用场景的用户。

<details>
<summary>如何获取 Request 配置？</summary>

### 方式一：HTTP API（如 `dogecoin_panel_7`）

1.  获取 Data 传参：进入图表 → "Query Inspector" → "JSON"解析 → 拷贝请求体(request)
2.  获取 Url 和 Headers Token：通过 Network 面板查看请求参数，手动构造 HTTP 配置。

### 方式二：curl（推荐，适用于所有面板，如`overall_cpu_utilization100`）：

1.  在Grafana中执行查询
2.  按F12打开开发者工具 → Network标签页
3.  找到查询请求 → 右键点击 → Copy as cURL
4.  将复制的 curl 粘贴至配置文件中即可
</details>

<details>
<summary>配置文件示例</summary>

- [基础版配置](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/config/grafana-config.simple.js)
- [远程真实配置](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/config/grafana-config-play.js)
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
        "SESSION_TIMEOUT_HOURS": "24",
        "CONFIG_MAX_AGE": "300",
      }
    }
  }
}

```


|环境变量名 | 类型 | 默认值 | 说明 |
| ----- | -- | --- | -- |
| `CONFIG_PATH` | string | 必填 | 配置文件路径（本地或 HTTPS 远程地址） |
| `MAX_CHUNK_SIZE` | number | `100` | 单块最大数据体积（KB），影响切片性能 |
| `SESSION_TIMEOUT_HOURS` | number | `24` | 会话过期时间（小时） |
| `CONFIG_MAX_AGE` | number | `300` | 远程配置文件缓存时间（秒），设为 `0` 则禁用 |

缓存特性：

- 智能缓存配置文件（默认缓存 5 分钟）
- 网络失败时使用本地过期缓存
- 启动自动清理缓存文件
- 设置 CONFIG_MAX_AGE=0 可禁用缓存，每次请求都拉取最新配置

</details>

<details>
<summary>支持配置类型：本地绝对路径 / 远程路径</summary>
    
### 1. 远程路径
    
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


### 2. 本地路径
    
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


<details>
<summary>访问权限环境变量（可选）/summary>

如需调用受保护的 Grafana API，可通过以下方式设置：

```bash
export GRAFANA_URL="https://your-grafana.com"
export GRAFANA_TOKEN="your-api-token"
```
你也可以在配置文件中使用 Headers 方式直接注入 token 访问。
</details>

## 配置示例

### 业务场景配置

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

### 系统监控配置

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

### 聚合分析配置

<details>
<summary>全链路性能分析</summary>

**用户问题**："我的系统整体性能怎么样？哪里是瓶颈？"

```javascript
// 前端性能
frontend_performance: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"histogram_quantile(0.95, rate(page_load_time_seconds_bucket[5m]))","range":{"from":"now-1h","to":"now"}}]}'`,
  systemPrompt: '前端性能专家：分析页面加载时间，识别前端性能瓶颈。'
},

// 后端性能
backend_performance: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"histogram_quantile(0.95, rate(api_response_time_seconds_bucket[5m]))","range":{"from":"now-1h","to":"now"}}]}'`,
  systemPrompt: '后端性能专家：分析API响应时间，识别后端性能问题。'
},

// 数据库性能
database_performance: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"rate(mysql_queries_total[5m])","range":{"from":"now-1h","to":"now"}}]}'`,
  systemPrompt: '数据库性能专家：分析数据库查询性能，识别数据库瓶颈。'
}
```

**使用方式**：
> 👤 您：聚合分析全链路性能：frontend_performance, backend_performance, database_performance
> 
> 🤖 AI：综合分析前端、后端、数据库性能，提供完整的性能优化建议
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

## 许可证

MIT 开源协议。详见 [LICENSE](LICENSE) 文件。