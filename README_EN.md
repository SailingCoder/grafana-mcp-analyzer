# Grafana MCP Analyzer 🤖

![Version](https://img.shields.io/npm/v/grafana-mcp-analyzer) ![License](https://img.shields.io/npm/l/grafana-mcp-analyzer)

**Let AI directly understand your monitoring data - Intelligent DevOps Analysis Assistant**

[English](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README_EN.md) | [中文文档](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README.md)

## ✨ Project Overview

Imagine these scenarios:
- You ask AI: "How is my server doing now?" 
- AI directly checks your Grafana monitoring and responds: "CPU usage is high, recommend checking these processes..."

Complex monitoring charts analyzed by AI with one click! Say goodbye to traditional manual monitoring and let AI become your dedicated DevOps assistant!

> 🎉 **v2.0.0 Major Update**: Complete architecture refactor, resolving large data volume analysis, providing 9 core tools.
> 
> ✨ **New Features**:
> - **Dual AI Guidance**: `systemPrompt` configuration + conversation `prompt` parameters for professional analysis
> - **Tool Upgrades**: `execute_query` → `query_data`, more powerful functionality
> - **New Tools**: `aggregate_analyze`, `batch_analyze`, `manage_sessions`, `list_data`, `server_status`
> - **Smart Data Processing**: Direct analysis for small data, automatic storage for large data with ResourceLinks access
> - **Professional Analysis**: Each query can be configured with dedicated `systemPrompt` for domain expert-level analysis

## 🚀 Core Features

Grafana MCP Analyzer is based on the **MCP (Model Context Protocol)**, empowering AI assistants like Claude and ChatGPT with the following superpowers:

- **Natural Conversation Queries**: "Help me check memory usage" → AI immediately analyzes and provides professional advice, lowering technical barriers
- **Smart Data Formatting**: Intelligent data formatting with support for large data volume analysis, achieving comprehensive data analysis
- **cURL Command Support**: Support direct cURL command configuration, copy from browser and paste, simplifying configuration process
- **Aggregated Data Processing**: Support precise analysis of individual charts and aggregated analysis of entire dashboards, flexible analysis granularity
- **Intelligent Anomaly Detection**: AI proactively discovers and reports performance bottlenecks and anomalies, early risk warning
- **Full Data Source Support**: Perfect compatibility with Prometheus, MySQL, Elasticsearch and all data sources/query commands, unified monitoring view
- **Professional DevOps Recommendations**: Not just displaying data, but providing actionable optimization solutions, improving DevOps efficiency

## 🛠️ Quick Start

### Step 1: Installation and Configuration

#### Global Installation
```bash
npm install -g grafana-mcp-analyzer
```
> MCP relies on the ` Node.js 18+` environment. For recommended installation methods, please refer to the [Complete Guide to Quick Installation of Node.js](https://blog.csdn.net/qq_37834631/article/details/148457021?spm=1001.2014.3001.5501)

#### Configure AI Assistant (Using Cursor as example)

1. Open **Cursor Settings** → Search **"MCP"**
2. Add the following server configuration:

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

> 💡 **Tip**: Any AI assistant supporting MCP protocol can use similar configuration. Requires Node.js 18+ environment support.

> 💡 **CONFIG_PATH Description**: `CONFIG_PATH` supports relative paths, absolute paths, and remote URLs. See [CONFIG_PATH_GUIDE](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/docs/CONFIG_PATH_GUIDE.md) for details

### Step 2: Create Configuration File

Create a `grafana-config.js` configuration file in your project root directory:

```javascript
export default {
  // Grafana basic configuration
  baseUrl: 'https://your-grafana-domain.com',
  defaultHeaders: {
    'Authorization': 'Bearer your-api-token',  // API token authentication
    'Content-Type': 'application/json'         // JSON format request
  },
  
  // Health check configuration
  healthCheck: { 
    url: 'api/health'
  },
  
  // Query definitions
  queries: {
    // Method 1: cURL command (Recommended, copy directly from browser)
    cpu_usage: {
      curl: `curl 'https://your-grafana-domain.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"rate(cpu_usage[5m])","range":{"from":"now-1h","to":"now"}}]}'`,
      systemPrompt: `You are a CPU performance analysis expert. Please analyze CPU usage from the following dimensions:
      1. Trend changes and anomaly point identification;
      2. Performance bottleneck and root cause analysis;
      3. Optimization recommendations and alert thresholds;
      4. Potential impact assessment on business systems.`
    },
    
    // Method 2: HTTP API configuration (suitable for complex queries)
    frontend_performance: {
      url: "https://your-grafana-domain.com/api/ds/es/query",
      method: "POST",
      data: {},
      systemPrompt: `You are a frontend performance analysis expert. Please analyze FCP (First Contentful Paint) performance data, focusing on:
      1. First contentful paint time trends;
      2. 75th percentile performance;
      3. Performance degradation detection;
      4. User experience impact assessment;
      5. Performance optimization recommendations. Please provide detailed analysis and practical optimization suggestions.`
    },
    
    // General data analysis query - for analyzing various monitoring data
    data_analysis: {
      url: "api/ds/query",
      method: "POST",
      data: {
        "queries": [
          {
            "refId": "A",
            "expr": "up",
            "range": {
              "from": "now-1h",
              "to": "now"
            }
          }
        ]
      },
      systemPrompt: 'You are a professional data analysis expert. Please conduct in-depth analysis of the provided monitoring data, including: 1. Data overview and basic statistics 2. Trend analysis and pattern recognition 3. Anomaly detection 4. Key metric interpretation 5. Business impact assessment 6. Specific optimization recommendations and action items. Please provide detailed and practical analysis reports.'
    }
  }
};
```

📌 Configuration Retrieval Tips:

**Copy cURL command from browser:** (Recommended)
1. Execute query in Grafana → Press F12 to open developer tools → Network tab
2. Find query request → Right-click → Copy as cURL → Paste to config file curl field

**HTTP API Configuration:**
1. Get Data parameters: Go to chart → "Query Inspector" → "JSON" parse → Copy request body
2. Get URL and Headers Token: View request parameters through Network panel, manually construct HTTP configuration.

💡 **systemPrompt Professional Analysis Guidance**:

- **Working Principle**: Configure professional AI analysis guidance for each query, making AI act as domain-specific expert roles
- **Usage**: `systemPrompt` in configuration file + user `prompt` in conversation for dual guidance
- **Analysis Effect**: CPU experts analyze CPU data, frontend experts analyze performance data, providing stronger professionalism
- **Customization Recommendations**: Customize appropriate expert roles and analysis focuses based on your business scenarios

### Step 3: Test Run

**Completely restart Cursor**, then experience intelligent analysis:

> 👤 You: Analyze frontend performance monitoring data frontend_performance  
> 🤖 AI: Connecting to Grafana and analyzing frontend performance metrics...

> 👤 You: Analyze cpu_usage is CPU usage normal  
> 🤖 AI: Retrieving CPU monitoring data and conducting intelligent analysis...

**Configuration Complete!**

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/922ac00595694c5796556586b224d63f.png#pic_center)


---

## More Configuration Examples

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

<details>
<summary>Aggregate Analysis Configuration (aggregate_analyze)</summary>

```javascript
// Aggregate analysis usage example
// 👤 You: Use aggregate_analyze to analyze these system metrics: system_cpu, system_memory, system_disk_io
// 🤖 AI: Simultaneously query multiple metrics and perform comprehensive correlation analysis

// Configure multiple related queries (flat structure)
system_cpu: {
  curl: `curl 'api/ds/query' -X POST -d '{"queries":[{"refId":"A","expr":"rate(cpu_usage[5m])"}]}'`,
  systemPrompt: `You are a CPU usage analysis expert. Please analyze CPU usage data, focusing on: 1. Usage trend changes 2. Peak time identification 3. Performance bottleneck detection 4. System load assessment 5. Optimization recommendations.`
},
system_memory: {
  curl: `curl 'api/ds/query' -X POST -d '{"queries":[{"refId":"A","expr":"(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100"}]}'`,
  systemPrompt: `You are a memory usage analysis expert. Please analyze memory usage, focusing on: 1. Memory usage trends 2. Whether approaching memory limits 3. Memory leak risk assessment 4. Memory optimization recommendations.`
},
system_disk_io: {
  curl: `curl 'api/ds/query' -X POST -d '{"queries":[{"refId":"A","expr":"rate(node_disk_io_time_seconds_total[5m])"}]}'`,
  systemPrompt: `You are a disk IO performance analysis expert. Please analyze disk IO performance, focusing on: 1. IO wait time trends 2. Disk performance bottlenecks 3. Read/write pattern analysis 4. Storage optimization recommendations.`
}

// Aggregate analysis will comprehensively analyze all metrics, providing overall system health assessment
```

</details>

<details>
<summary>Batch Analysis Configuration (batch_analyze)</summary>

```javascript
// Batch analysis usage example
// 👤 You: Use batch_analyze to analyze these application metrics: app_response_time, app_error_rate, app_request_volume
// 🤖 AI: Separately query each metric and provide independent professional analysis

// Configure multiple application monitoring queries (flat structure)
app_response_time: {
  curl: `curl 'api/ds/query' -X POST -d '{"queries":[{"refId":"A","expr":"histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"}]}'`,
  systemPrompt: `You are a response time analysis expert. Please analyze API response time data, focusing on: 1. P95 response time trends 2. Slow request identification 3. Performance bottleneck location 4. User experience impact assessment 5. Performance optimization recommendations.`
},
app_error_rate: {
  curl: `curl 'api/ds/query' -X POST -d '{"queries":[{"refId":"A","expr":"rate(http_requests_total{status=~\"5..\"}[5m])"}]}'`,
  systemPrompt: `You are an error rate analysis expert. Please analyze application error rate data, focusing on: 1. Error rate trend changes 2. Anomaly pattern identification 3. Service stability assessment 4. Error type analysis 5. Troubleshooting recommendations.`
},
app_request_volume: {
  curl: `curl 'api/ds/query' -X POST -d '{"queries":[{"refId":"A","expr":"rate(http_requests_total[5m])"}]}'`,
  systemPrompt: `You are a request volume analysis expert. Please analyze application request volume data, focusing on: 1. Traffic trend changes 2. Peak time identification 3. Capacity planning recommendations 4. Load balancing effects 5. Scaling recommendations.`
}

// Batch analysis will provide independent professional analysis reports for each metric
```

</details>

## Common Issues

<details>
<summary>❌ Unable to connect to Grafana service</summary>

- Check Grafana address format: Must include `https://` or `http://`
- Verify API key validity: Ensure not expired and has sufficient permissions
- Test network connectivity and firewall settings

</details>

<details>
<summary>❌ AI reports MCP tools not found</summary>

- Completely exit Cursor and restart
- Check if configuration file path is correct
- Ensure Node.js version ≥ 18 (node -v)

</details>

<details>
<summary>❌ Query execution failure or timeout</summary>

- Increase timeout settings
- Check data source connection status
- Data volume too large, reduce time range

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
| `batch_analyze` | Batch analysis | Multi-query independent analysis |
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
👤 "Batch analyze multiple metrics" → 🤖 Calls batch_analyze
```
</details>

---

## 📖 Recommended Articles

- [grafana-mcp-analyzer：基于 MCP 的轻量 AI 分析监控图表的运维神器！](https://blog.csdn.net/qq_37834631/article/details/148473620?spm=1001.2014.3001.5501) - In-depth Analysis on CSDN Tech Blog

## License

MIT License. See [LICENSE](LICENSE) file for details. 