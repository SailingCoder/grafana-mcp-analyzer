[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/sailingcoder-grafana-mcp-analyzer-badge.png)](https://mseep.ai/app/sailingcoder-grafana-mcp-analyzer)

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

-   🗣️ **自然语言查询** - 轻松访问监控数据，AI 一键输出专业分析
-   📈 **智能格式化** - 支持**大数据量**分析，高效解析各类数据
-   🔗 **curl支持** - 直接使用浏览器 copy 的 curl 合成查询
-   🔄 **聚合分析** - 单个查询或 Dashboard 级别综合分析
-   🚨 **异常检测** - AI 主动报告性能问题，提前警报
-   🔌 **全数据源支持** - Prometheus、MySQL、ES 等通通支持
-   💡 **专业 DevOps 建议** - 不只是展示数据，更提供可执行的优化方案，提升DevOps效率

## 🛠️ 快速开始

### 步骤1：安装

```bash
npm install -g grafana-mcp-analyzer
```

> **环境要求**：Node.js 18+ | [安装指南](https://blog.csdn.net/qq_37834631/article/details/148457021?spm=1001.2014.3001.5501)

### 步骤2：配置AI助手（以Cursor为例）

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

注：`CONFIG_PATH`支持绝对路径、远程路径，具体详见下方高级配置。

### 步骤3：编写配置文件 `grafana-config.js`

步骤2 中`CONFIG_PATH`已经配置了远程路径，如果你只是想快速体验这个库，可以跳过这一步，然后直接执行步骤4；如果你想使用自己的数据源或参数，可以参考以下配置来自定义。

以下是步骤 2 中 CONFIG_PATH 指向的默认配置（来自文档示例）：

```javascript
/**
 * 基于Grafana Play演示实例的配置文件
 * 数据源(狗狗币OHLC数据)：https://play.grafana.org/d/candlesticksss/candlestick2?orgId=1&from=2021-07-13T22:13:30.740Z&to=2021-07-13T22:46:18.921Z&timezone=utc
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
    'dogecoin_panel_2': {
      curl: `curl 'https://play.grafana.org/api/ds/query?ds_type=grafana-testdata-datasource&requestId=SQR108' \\
        -X POST \\
        -H 'accept: application/json, text/plain, */*' \\
        -H 'content-type: application/json' \\
        -H 'x-datasource-uid: 9cY0WtPMz' \\
        -H 'x-grafana-org-id: 1' \\
        -H 'x-panel-id: 2' \\
        -H 'x-panel-plugin-id: candlestick' \\
        -H 'x-plugin-id: grafana-testdata-datasource' \\
        --data-raw '{"queries":[{"csvFileName":"ohlc_dogecoin.csv","datasource":{"type":"grafana-testdata-datasource","uid":"9cY0WtPMz"},"refId":"A","scenarioId":"csv_file","datasourceId":153,"intervalMs":2000,"maxDataPoints":1150}],"from":"1626214410740","to":"1626216378921"}'`,
      systemPrompt: '您是狗狗币数据分析专家，专注于OHLC（开盘价、最高价、最低价、收盘价）数据分析。请分析狗狗币价格数据，重点关注：1. 价格趋势和波动模式 2. 支撑位和阻力位识别 3. 交易机会分析 4. 风险评估和建议 5. 技术指标分析。请提供专业的投资分析和建议。'
    },

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
      systemPrompt: '您是金融市场技术分析专家，专注于加密货币市场分析。请分析狗狗币市场数据，重点关注：1. 市场趋势和动量分析 2. 价格模式识别（头肩顶、双底等） 3. 成交量与价格关系 4. 市场情绪评估 5. 短期和长期投资策略建议。请提供详细的技术分析报告。'
    }
  }
};

module.exports = config; 
```

**配置获取技巧**：

**浏览器复制curl命令**（推荐）：

1.  在Grafana中执行查询
2.  按F12打开开发者工具 → Network标签页
3.  找到查询请求 → 右键 → Copy as cURL

**HTTP API配置：**

1.  获取 Data 传参：进入图表 → "Query Inspector" → "JSON"解析 → 拷贝请求体(request)
2.  获取 Url 和 Headers Token：通过 Network 面板查看请求参数，手动构造 HTTP 配置。

> 配置文件示例，可见：[基础版配置](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/config/grafana-config.simple.js)和[远程真实配置](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/config/grafana-config-play.js)

### 步骤4：开始使用

**完全重启Cursor**，然后体验智能分析：

> 👤 您：分析dogecoin_panel_2数据\
> 🤖 AI：正在连接Grafana并分析...

> 👤 您：聚合分析dogecoin_panel_2、dogecoin_panel_7的数据\
> 🤖 AI：同时查询多个指标并进行综合关联分析...

**配置完成！**

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/922ac00595694c5796556586b224d63f.png#pic_center)

## MCP工具清单

| 工具 | 功能 | 使用场景 |
|------|------|----------|
| `analyze_query` | 查询+AI分析 | 需要专业建议 |
| `query_data` | 原始数据查询 | 仅需要数据 |
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
👤 "获取内存数据" → 🤖 调用 query_data  
👤 "检查服务状态" → 🤖 调用 check_health
👤 "有哪些监控查询" → 🤖 调用 list_queries
👤 "聚合分析系统指标" → 🤖 调用 aggregate_analyze
```

## 高级配置

<details>
<summary>配置支持：绝对路径、远程路径</summary>
    
**1. 远程路径**
    
支持通过HTTPS URL访问远程配置文件，适用于团队协作和多环境部署：

```json
{
  "mcpServers": {
    "grafana": {
      "command": "grafana-mcp-analyzer",
      "env": {
        "CONFIG_PATH": "https://raw.githubusercontent.com/SailingCoder/grafana-mcp-analyzer/main/config/grafana-config-play.js",
        "CONFIG_MAX_AGE": "600"
      }
    }
  }
}
```

支持的远程存储：

*   阿里云OSS: `https://bucket.oss-cn-hangzhou.aliyuncs.com/config.js`
*   腾讯云COS: `https://bucket-123.cos.ap-shanghai.myqcloud.com/config.js`
*   AWS S3: `https://bucket.s3.amazonaws.com/config.js`
*   GitHub Raw: `https://raw.githubusercontent.com/user/repo/main/config.js`

注意，如下：
❌ GitHub页面	https://github.com/user/repo/blob/main/file.js	返回HTML页面
✅ GitHub Raw	https://raw.githubusercontent.com/user/repo/main/file.js	返回原始文件


**2. 绝对路径**
    
也支持配置配置本地绝对路径，快速配置分析：
    
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

**环境变量说明**

| 变量名              | 默认值   | 说明                     |
| ---------------- | ----- | ---------------------- |
| `CONFIG_PATH`    | 必填    | 配置文件路径（本地路径或HTTPS URL） |
| `CONFIG_MAX_AGE` | `300` | 远程配置缓存时间（秒），设为0禁用缓存    |

缓存特性：

*   智能缓存：默认缓存5分钟，提升访问速度
*   容错机制：网络失败时自动使用过期缓存
*   自动清理：启动时自动清理过期缓存文件
*   实时更新：设置CONFIG\_MAX\_AGE=0禁用缓存，每次获取最新配置

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
<summary>环境变量配置</summary>

```bash
export GRAFANA_URL="https://your-grafana.com"
export GRAFANA_TOKEN="your-api-token"
```

</details>

## 配置示例

### 业务场景

<details>
<summary>电商业务分析</summary>

```javascript
// 电商转化率分析
ecommerce_conversion: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"rate(orders_total[5m]) / rate(page_views_total[5m]) * 100","range":{"from":"now-24h","to":"now"}}]}'`,
  systemPrompt: '您是电商业务分析专家，专注于转化率优化和用户购买行为分析。请分析销售转化率数据，重点关注：1. 转化率趋势变化和关键拐点 2. 高峰和低谷时段识别 3. 用户购买行为模式 4. 影响转化的关键因素 5. 转化率优化建议和A/B测试方案 6. 预期收益评估。请提供具体的业务改进建议。'
}
```

</details>

<details>
<summary>金融数据分析</summary>

```javascript
// 交易量分析
finance_transactions: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"sum(rate(transaction_amount_total[5m]))","range":{"from":"now-7d","to":"now"}}]}'`,
  systemPrompt: '您是金融数据分析专家，专长于交易风险控制和业务增长分析。请分析交易量数据，重点关注：1. 交易量趋势和周期性模式 2. 异常交易模式识别 3. 风险信号检测 4. 业务增长机会 5. 风控策略优化建议 6. 合规性评估。请提供风险控制和业务增长的平衡建议。'
},

// 收入分析
revenue_analysis: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"sum(increase(revenue_total[1d]))","range":{"from":"now-90d","to":"now"}}]}'`,
  systemPrompt: '您是财务数据分析专家，专注于收入增长和盈利能力分析。请分析收入数据，重点关注：1. 收入趋势和增长模式分析 2. 收入来源结构和贡献度 3. 季节性和周期性因素影响 4. 收入预测和目标达成分析 5. 盈利能力和成本效益评估 6. 收入增长策略建议。'
}
```

</details>

<details>
<summary>用户行为分析</summary>

```javascript
// 用户活跃度分析
user_activity: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"count(increase(user_sessions_total[1h]))","range":{"from":"now-30d","to":"now"}}]}'`,
  systemPrompt: '您是用户行为分析专家，专注于用户留存和参与度优化。请分析用户活跃度数据，重点关注：1. 用户活跃度趋势和留存率 2. 用户行为模式和偏好 3. 用户生命周期分析 4. 流失风险用户识别 5. 用户参与度提升策略 6. 个性化推荐建议。'
},

// 内容消费分析
content_engagement: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"rate(content_views_total[5m])","range":{"from":"now-7d","to":"now"}}]}'`,
  systemPrompt: '您是内容运营分析专家，专注于内容策略和用户参与度优化。请分析内容消费数据，重点关注：1. 内容消费趋势和热点识别 2. 用户内容偏好分析 3. 内容质量评估 4. 内容推荐优化 5. 创作者生态健康度 6. 内容策略建议。'
}
```

</details>

<details>
<summary>安全分析</summary>

```javascript
// 安全日志分析
security_logs: {
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
  systemPrompt: '您是网络安全分析专家，专注于安全威胁检测和风险评估。请分析安全日志数据，重点关注：1. 异常访问模式和潜在威胁识别 2. 安全事件趋势和攻击模式 3. 风险等级评估和紧急响应建议 4. 安全策略优化建议 5. 合规性检查和审计建议 6. 安全监控和告警策略。'
}
```

</details>

<details>
<summary>IoT设备监控</summary>

```javascript
// IoT设备监控
iot_devices: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"avg(temperature_celsius)","range":{"from":"now-24h","to":"now"}}]}'`,
  systemPrompt: '您是IoT数据分析专家，专注于设备监控和智能运维。请分析IoT设备数据，重点关注：1. 设备健康状态和性能趋势 2. 异常设备和故障预警 3. 设备使用模式和优化机会 4. 能耗分析和节能建议 5. 设备生命周期管理 6. 预测性维护策略。'
},

// 传感器数据分析
sensor_data: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"rate(sensor_readings_total[10m])","range":{"from":"now-12h","to":"now"}}]}'`,
  systemPrompt: '您是传感器数据分析专家，专注于环境监控和数据质量分析。请分析传感器数据，重点关注：1. 数据质量和传感器可靠性评估 2. 环境参数变化趋势和异常检测 3. 传感器校准和维护建议 4. 数据采集优化策略 5. 预警阈值设置建议 6. 传感器网络优化方案。'
}
```

</details>

<details>
<summary>用户转化漏斗分析（聚合分析示例）</summary>

```javascript
// 用户转化漏斗 - 页面浏览
user_funnel_views: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"rate(page_views_total[5m])","range":{"from":"now-24h","to":"now"}}]}'`,
  systemPrompt: '您是转化漏斗分析专家。请分析页面浏览量数据，重点关注访问流量趋势、用户获取效果、流量来源分析。'
},

// 用户转化漏斗 - 用户注册
user_funnel_signups: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"rate(user_signups_total[5m])","range":{"from":"now-24h","to":"now"}}]}'`,
  systemPrompt: '您是用户注册分析专家。请分析用户注册数据，重点关注注册转化率、注册流程优化、用户获取成本分析。'
},

// 用户转化漏斗 - 购买转化
user_funnel_purchases: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"rate(purchases_total[5m])","range":{"from":"now-24h","to":"now"}}]}'`,
  systemPrompt: '您是购买转化分析专家。请分析购买数据，重点关注购买转化率、客单价分析、购买行为模式。'
}

// 使用方式：
// 👤 您：使用aggregate_analyze综合分析用户转化漏斗：user_funnel_views, user_funnel_signups, user_funnel_purchases
// 🤖 AI：将同时分析三个环节的数据，提供完整的漏斗分析和优化建议
```

</details>

### 系统监控

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

---

## 文章推荐

- [grafana-mcp-analyzer：基于 MCP 的轻量 AI 分析监控图表的运维神器！](https://blog.csdn.net/qq_37834631/article/details/148473620?spm=1001.2014.3001.5501) - CSDN技术博客深度解析

## 许可证

MIT 开源协议。详见 [LICENSE](LICENSE) 文件。