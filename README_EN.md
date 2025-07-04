# Grafana MCP Analyzer 🤖

![Version](https://img.shields.io/npm/v/grafana-mcp-analyzer) ![License](https://img.shields.io/npm/l/grafana-mcp-analyzer)

**Let AI directly understand your monitoring data - Intelligent DevOps Analysis Assistant**

[English](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README_EN.md) | [中文文档](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README.md)

## ✨ Project Overview

Imagine these scenarios:

*   You ask AI: "How is my server doing now?"
*   AI directly checks your Grafana monitoring and responds: "CPU usage is high, recommend checking these processes..."

Complex monitoring charts analyzed by AI with one click! Say goodbye to traditional manual monitoring and let AI become your dedicated DevOps assistant!


## 🚀 Core Features

Grafana MCP Analyzer is based on the **MCP (Model Context Protocol)**, empowering AI assistants like Claude and ChatGPT with the following superpowers:

-   【Natural Language Queries】Easy access to monitoring data with AI providing professional analysis in one click
-   【Smart Formatting】Support for **large data volume** analysis with efficient parsing of various data types
-   【cURL Support】Direct use of browser-copied cURL commands for query composition
-   【Aggregate Analysis】Single query or dashboard-level comprehensive analysis
-   【Anomaly Detection】AI proactively reports performance issues with early warnings
-   【Full Data Source Support】Prometheus, MySQL, ES, and all other data sources fully supported
-   【Professional DevOps Recommendations】Not just displaying data, but providing actionable optimization solutions to improve DevOps efficiency


## 🛠️ Quick Start

### Step 1: Installation and Configuration

### Global Installation

```bash
npm install -g grafana-mcp-analyzer
```

MCP requires `Node.js 18+` environment, [Complete Guide to Quick Node.js Installation](https://blog.csdn.net/qq_37834631/article/details/148457021?spm=1001.2014.3001.5501)

#### Configure AI Assistant (Using Cursor as example)

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

Configuration supports relative paths, absolute paths, and remote URLs. See [CONFIG_PATH_GUIDE](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/docs/CONFIG_PATH_GUIDE.md) for details

### Step 2: Create Configuration File `grafana-config.js`

```javascript
// module.exports {
export default {
  // Grafana basic configuration
  baseUrl: 'https://your-grafana-domain.com',
  defaultHeaders: {
    'Authorization': 'Bearer your-api-token',
    'Content-Type': 'application/json'
  },
  
  // Health check configuration
  healthCheck: { 
    url: 'api/health'
  },
  
  // Query definitions
  queries: {
    // Method 1: cURL command (Recommended, copy directly from browser)
    cpu_usage: {
      curl: `curl ...`,
      systemPrompt: `You are a CPU analysis expert. Please analyze this data from three dimensions: trends, bottlenecks, and recommendations...`
    },
    // Method 2: HTTP API configuration (suitable for complex queries)
    frontend_performance: {
      url: "api/ds/es/query",
      method: "POST",
      data: { ... },
      systemPrompt: `You are a frontend performance expert...`
    }
  }
};
```

**Configuration Retrieval Tips:**

**Copy cURL command from browser** (Recommended):

1.  Execute query in Grafana
2.  Press F12 to open developer tools → Network tab
3.  Find query request → Right-click → Copy as cURL

**HTTP API configuration:**

1.  Get Data parameters: Go to chart → "Query Inspector" → "JSON" parse → Copy request body
2.  Get URL and Headers Token: View request parameters through Network panel, manually construct HTTP configuration.

### Step 3: Start Using

**Completely restart Cursor**, then experience intelligent analysis:

> 👤 You: Analyze frontend performance monitoring data frontend\_performance\
> 🤖 AI: Connecting to Grafana and analyzing frontend performance metrics...

> 👤 You: Aggregate analyze cpu_usage, frontend_performance\
> 🤖 AI: Simultaneously querying multiple metrics and performing comprehensive correlation analysis...

**Configuration Complete!**

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/922ac00595694c5796556586b224d63f.png#pic_center)


## Business Scenario Configuration Examples

<details>
<summary>E-commerce Business Analysis</summary>

```javascript
// E-commerce conversion rate analysis
ecommerce_conversion: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"rate(orders_total[5m]) / rate(page_views_total[5m]) * 100","range":{"from":"now-24h","to":"now"}}]}'`,
  systemPrompt: 'You are an e-commerce business analysis expert, focusing on conversion rate optimization and user purchase behavior analysis. Please analyze sales conversion rate data, focusing on: 1. Conversion rate trend changes and key inflection points 2. Peak and valley period identification 3. User purchase behavior patterns 4. Key factors affecting conversion 5. Conversion rate optimization recommendations and A/B testing plans 6. Expected revenue assessment. Please provide specific business improvement recommendations.'
}
```

</details>

<details>
<summary>Financial Data Analysis</summary>

```javascript
// Transaction volume analysis
finance_transactions: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"sum(rate(transaction_amount_total[5m]))","range":{"from":"now-7d","to":"now"}}]}'`,
  systemPrompt: 'You are a financial data analysis expert, specializing in transaction risk control and business growth analysis. Please analyze transaction volume data, focusing on: 1. Transaction volume trends and cyclical patterns 2. Abnormal transaction pattern identification 3. Risk signal detection 4. Business growth opportunities 5. Risk control strategy optimization recommendations 6. Compliance assessment. Please provide balanced recommendations for risk control and business growth.'
},

// Revenue analysis
revenue_analysis: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"sum(increase(revenue_total[1d]))","range":{"from":"now-90d","to":"now"}}]}'`,
  systemPrompt: 'You are a financial data analysis expert, focusing on revenue growth and profitability analysis. Please analyze revenue data, focusing on: 1. Revenue trends and growth pattern analysis 2. Revenue source structure and contribution analysis 3. Seasonal and cyclical factor impacts 4. Revenue forecasting and target achievement analysis 5. Profitability and cost-effectiveness assessment 6. Revenue growth strategy recommendations.'
}
```

</details>

<details>
<summary>User Behavior Analysis</summary>

```javascript
// User activity analysis
user_activity: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"count(increase(user_sessions_total[1h]))","range":{"from":"now-30d","to":"now"}}]}'`,
  systemPrompt: 'You are a user behavior analysis expert, focusing on user retention and engagement optimization. Please analyze user activity data, focusing on: 1. User activity trends and retention rates 2. User behavior patterns and preferences 3. User lifecycle analysis 4. Churn risk user identification 5. User engagement improvement strategies 6. Personalized recommendation suggestions.'
},

// Content consumption analysis
content_engagement: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"rate(content_views_total[5m])","range":{"from":"now-7d","to":"now"}}]}'`,
  systemPrompt: 'You are a content operations analysis expert, focusing on content strategy and user engagement optimization. Please analyze content consumption data, focusing on: 1. Content consumption trends and hotspot identification 2. User content preference analysis 3. Content quality assessment 4. Content recommendation optimization 5. Creator ecosystem health 6. Content strategy recommendations.'
}
```

</details>

<details>
<summary>Security Analysis</summary>

```javascript
// Security log analysis
security_logs: {
  url: "api/ds/es/query",
  method: "POST",
  data: {
    "queries": [
      {
        "refId": "A",
        "query": "tags:security AND level:WARN",
        "timeField": "@timestamp",
        "size": 200
      }
    ]
  },
  systemPrompt: 'You are a network security analysis expert, focusing on security threat detection and risk assessment. Please analyze security log data, focusing on: 1. Abnormal access patterns and potential threat identification 2. Security event trends and attack patterns 3. Risk level assessment and emergency response recommendations 4. Security policy optimization recommendations 5. Compliance checks and audit recommendations 6. Security monitoring and alerting strategies.'
}
```

</details>

<details>
<summary>IoT Device Monitoring</summary>

```javascript
// IoT device monitoring
iot_devices: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"avg(temperature_celsius)","range":{"from":"now-24h","to":"now"}}]}'`,
  systemPrompt: 'You are an IoT data analysis expert, focusing on device monitoring and intelligent operations. Please analyze IoT device data, focusing on: 1. Device health status and performance trends 2. Abnormal devices and fault warnings 3. Device usage patterns and optimization opportunities 4. Energy consumption analysis and energy-saving recommendations 5. Device lifecycle management 6. Predictive maintenance strategies.'
},

// Sensor data analysis
sensor_data: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"rate(sensor_readings_total[10m])","range":{"from":"now-12h","to":"now"}}]}'`,
  systemPrompt: 'You are a sensor data analysis expert, focusing on environmental monitoring and data quality analysis. Please analyze sensor data, focusing on: 1. Data quality and sensor reliability assessment 2. Environmental parameter change trends and anomaly detection 3. Sensor calibration and maintenance recommendations 4. Data collection optimization strategies 5. Warning threshold setting recommendations 6. Sensor network optimization solutions.'
}
```

</details>

<details>
<summary>User Conversion Funnel Analysis (Aggregate Analysis Example)</summary>

```javascript
// User conversion funnel - page views
user_funnel_views: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"rate(page_views_total[5m])","range":{"from":"now-24h","to":"now"}}]}'`,
  systemPrompt: 'You are a conversion funnel analysis expert. Please analyze page view data, focusing on traffic trends, user acquisition effectiveness, and traffic source analysis.'
},

// User conversion funnel - user registration
user_funnel_signups: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"rate(user_signups_total[5m])","range":{"from":"now-24h","to":"now"}}]}'`,
  systemPrompt: 'You are a user registration analysis expert. Please analyze user registration data, focusing on registration conversion rates, registration process optimization, and user acquisition cost analysis.'
},

// User conversion funnel - purchase conversion
user_funnel_purchases: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"rate(purchases_total[5m])","range":{"from":"now-24h","to":"now"}}]}'`,
  systemPrompt: 'You are a purchase conversion analysis expert. Please analyze purchase data, focusing on purchase conversion rates, average order value analysis, and purchase behavior patterns.'
}

// Usage:
// 👤 You: Use aggregate_analyze to comprehensively analyze user conversion funnel: user_funnel_views, user_funnel_signups, user_funnel_purchases
// 🤖 AI: Will simultaneously analyze data from all three stages, providing complete funnel analysis and optimization recommendations
```

</details>

## System Monitoring Configuration Examples

<details>
<summary>Metrics Monitoring Configuration</summary>

```javascript
// Metrics query
prometheus_metrics: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{
      "refId":"A",
      "expr":"node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100",
      "range":{"from":"now-2h","to":"now"}
    }]}'`,
  systemPrompt: `Memory usage expert analysis: Focus on memory leak risks, usage trends, abnormal fluctuations, and optimization recommendations.`
}
```

</details>

<details>
<summary>Log Analysis Configuration</summary>

```javascript
// Elasticsearch log query
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
  systemPrompt: `Log analysis expert: Identify error patterns, frequency analysis, impact assessment, and troubleshooting recommendations.`
}
```

</details>

<details>
<summary>Network Monitoring Configuration</summary>

```javascript
// Network latency monitoring
network_latency: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -d '{"queries":[{
      "refId":"A", 
      "expr":"histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
      "range":{"from":"now-30m","to":"now"}
    }]}'`,
  systemPrompt: `Network performance expert: Analyze P95 latency, identify slow requests, locate network bottlenecks, and optimization strategies.`
}
```

</details>

<details>
<summary>Database Monitoring Configuration</summary>

```javascript
// MySQL performance monitoring
mysql_performance: {
  url: "api/ds/mysql/query",
  method: "POST", 
  data: {
    sql: "SELECT * FROM performance_schema.events_statements_summary_by_digest ORDER BY avg_timer_wait DESC LIMIT 10"
  },
  systemPrompt: `Database performance expert: Slow query analysis, index optimization recommendations, query performance trend assessment.`
}
```

</details>


## Common Issues

<details>
<summary>Unable to connect to Grafana service</summary>

*   Check Grafana address format: Must include `https://` or `http://`
*   Verify API key validity: Ensure not expired and has sufficient permissions
*   Test network connectivity and firewall settings

</details>

<details>
<summary>AI reports MCP tools not found</summary>

*   Completely exit Cursor and restart
*   Check if configuration file path is correct
*   Ensure Node.js version ≥ 18

</details>

<details>
<summary>Query execution failure or timeout</summary>

*   Increase timeout settings
*   Check data source connection status
*   For large data volumes, reduce time range

</details>

## Advanced Configuration

<details>
<summary>Environment Variables Configuration</summary>

```bash
export GRAFANA_URL="https://your-grafana.com"
export GRAFANA_TOKEN="your-api-token"
```

</details>

<details>
<summary>MCP Tools List</summary>

| Tool | Function | Use Case |
|------|----------|----------|
| `analyze_query` | Query + AI analysis | Need professional advice |
| `query_data` | Raw data query | Only need data |
| `aggregate_analyze` | Aggregate analysis | Multi-query unified analysis |
| `batch_analyze` | Batch analysis ⚠️ Not Recommended | Output format issues |
| `list_queries` | Query list | View configuration |
| `check_health` | Health check | Status monitoring |
| `manage_sessions` | Session management | Manage analysis sessions |
| `list_data` | Data list | View stored data |
| `server_status` | Server status | Server information |

Tool Usage

```javascript
// AI assistant automatically selects appropriate tools
👤 "Analyze CPU usage" → 🤖 Calls analyze_query
👤 "Get memory data" → 🤖 Calls query_data  
👤 "Check service status" → 🤖 Calls check_health
👤 "What monitoring queries are available" → 🤖 Calls list_queries
👤 "Aggregate analyze system metrics" → 🤖 Calls aggregate_analyze
👤 "Batch analyze multiple metrics" → 🤖 Recommend aggregate_analyze instead
```
</details>

---

## Recommended Articles

- [grafana-mcp-analyzer：基于 MCP 的轻量 AI 分析监控图表的运维神器！](https://blog.csdn.net/qq_37834631/article/details/148473620?spm=1001.2014.3001.5501) - In-depth Analysis on CSDN Tech Blog

## License

MIT License. See [LICENSE](LICENSE) file for details. 