# Grafana MCP Analyzer 🤖

![Version](https://img.shields.io/npm/v/grafana-mcp-analyzer) ![License](https://img.shields.io/npm/l/grafana-mcp-analyzer)

**Let AI directly understand your monitoring data - Intelligent DevOps Analysis Assistant**

[English](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README_EN.md) | [中文文档](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README.md)

## ✨ Project Overview

Imagine these scenarios:
- You ask AI: "How is my server doing now?" 
- AI directly checks your Grafana monitoring and responds: "CPU usage is high, recommend checking these processes..."
- Complex monitoring charts analyzed by AI with one click!

Say goodbye to traditional manual monitoring and let AI become your dedicated DevOps assistant!

## 🚀 Core Features

Grafana MCP Analyzer is based on the **MCP (Model Context Protocol)**, empowering AI assistants like Claude and ChatGPT with the following superpowers:

| Feature | Description | Value |
|---------|-------------|-------|
| **Natural Conversation Queries** | "Help me check memory usage" → AI immediately analyzes and provides professional advice | Lower technical barriers |
| **cURL Command Support** | Support direct cURL command configuration, copy from browser and paste | Simplify configuration process |
| **Multi-Level Analysis** | Support precise analysis of individual charts and aggregated analysis of entire dashboards | Flexible analysis granularity |
| **Intelligent Anomaly Detection** | AI proactively discovers and reports performance bottlenecks and anomalies | Early risk warning |
| **Multi-Data Source Support** | Perfect compatibility with Prometheus, MySQL, Elasticsearch, etc. | Unified monitoring view |
| **Professional DevOps Recommendations** | Not just displaying data, but providing actionable optimization solutions | Improve DevOps efficiency |
| **Lightweight Deployment** | Ultra-small 52KB footprint for quick integration and deployment | Zero-burden usage |

---

## 🛠️ Quick Start

### Step 1: Installation and Configuration

#### Global Installation
```bash
npm install -g grafana-mcp-analyzer
```

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
const config = {
  // Connect to your Grafana
  baseUrl: 'https://your-grafana-domain.com',
  defaultHeaders: {
    'Authorization': 'Bearer your-api-token',
    'Content-Type': 'application/json'
  },
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
      url: "api/ds/es/query",
      method: "POST",
      data: {
        es: {
          index: 'frontend_metrics',
          query: 'your_elasticsearch_query'
        }
      },
      systemPrompt: `You are a frontend performance analysis expert. Please analyze FCP metrics and provide recommendations, including:
      1. Page loading trends;
      2. P75 performance;
      3. Performance alerts;
      4. User experience assessment;
      5. Targeted optimization solutions.`
    },
  },
  healthCheck: { 
    url: 'api/health',
    timeout: 5000
  }
};

module.exports = config;
```

📌 Configuration Retrieval Tips:

**Copy cURL command from browser:** (Recommended)
1. Execute query in Grafana → Press F12 to open developer tools → Network tab
2. Find query request → Right-click → Copy as cURL → Paste to config file curl field

**HTTP API Configuration:**
1. Get Data parameters: Go to chart → "Query Inspector" → "JSON" parse → Copy request body
2. Get URL and Headers Token: View request parameters through Network panel, manually construct HTTP configuration.

### Step 3: Test Run

**Completely restart Cursor**, then experience intelligent analysis:

👤 You: Analyze frontend performance monitoring data
🤖 AI: Connecting to Grafana and analyzing frontend performance metrics...

👤 You: Check if CPU usage is normal  
🤖 AI: Retrieving CPU monitoring data and conducting intelligent analysis...

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
| `execute_query` | Raw data query | Only need data |
| `check_health` | Health check | Status monitoring |
| `list_queries` | Query list | View configuration |

Tool Usage

```javascript
// AI assistant automatically selects appropriate tools
👤 "Analyze CPU usage" → 🤖 Calls analyze_query
👤 "Get memory data" → 🤖 Calls execute_query  
👤 "Check service status" → 🤖 Calls check_health
👤 "What monitoring queries are available" → 🤖 Calls list_queries
```
</details>

## License

MIT License. See [LICENSE](LICENSE) file for details. 