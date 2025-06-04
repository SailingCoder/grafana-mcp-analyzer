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
| **cURL Command Support** | Support direct cURL command configuration, copy from browser and paste | Simplify configuration |
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

### Step 2: Create Configuration File

Create a `grafana-config.js` configuration file in your project root directory:

```javascript
const config = {
  // Grafana service basic configuration
  baseUrl: 'https://your-grafana-domain.com',  // Replace with your Grafana address
  defaultHeaders: {
    'Authorization': 'Bearer your-api-token',  // Replace with your API key
    'Content-Type': 'application/json'
  },
  
  // Predefined query configurations
  queries: {
    // HTTP API configuration method
    frontend_performance: {
      url: "api/ds/es/query",
      method: "POST",
      data: {
        es: {
          index: 'frontend_metrics',
          query: 'your_elasticsearch_query'
        }
      },
      systemPrompt: `You are a frontend performance analysis expert. Please analyze FCP (First Contentful Paint) performance data:
      
      **Analysis Focus**:
      1. Page first contentful paint time trend analysis
      2. 75th percentile performance evaluation  
      3. Performance degradation issue identification
      4. User experience impact assessment
      5. Targeted optimization recommendations
      
      Please provide detailed performance analysis reports and practical optimization suggestions.`
    },
    
    // cURL command configuration method (v1.1.0 new feature)
    cpu_usage: {
      curl: `curl 'api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"rate(cpu_usage[5m])","range":{"from":"now-1h","to":"now"}}]}'`,
      systemPrompt: `You are a CPU performance analysis expert. Please analyze CPU usage data:
      
      **Key Metrics**:
      1. CPU usage trends and change patterns
      2. Performance peak time point analysis
      3. Potential performance bottleneck identification
      4. System load health assessment
      5. Professional optimization recommendations
      
      Please provide professional CPU performance analysis reports and improvement solutions.`
    }
  },
  
  // Health check configuration
  healthCheck: { 
    url: 'api/health',
    timeout: 5000
  }
};

export default config;
```

📌 Configuration Retrieval Tips:

**Recommended: Copy cURL Command from Browser**
1. Execute query in Grafana → Press F12 to open developer tools → Network tab
2. Find query request → Right-click → Copy as cURL → Paste to config file curl field

**Other Methods:**
- **Query Inspector**: Go to chart → "Query Inspector" → "JSON" tab → Copy to data field
- **Manual Construction**: View request parameters through Network panel and manually construct HTTP config

💡 For detailed cURL configuration methods, see [Advanced Configuration](#advanced-configuration) section.

### Step 3: Test Run

**Completely restart Cursor**, then experience intelligent analysis:

```
👤 You: Analyze frontend performance monitoring data
🤖 AI: Connecting to Grafana and analyzing frontend performance metrics...

👤 You: Check if CPU usage is normal  
🤖 AI: Retrieving CPU monitoring data and conducting intelligent analysis...
```

**Configuration Complete!**

![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/922ac00595694c5796556586b224d63f.png#pic_center)

---

## 🔧 Common Issues

<details>
<summary>❌ Unable to connect to Grafana service</summary>

- ✅ Check Grafana address format: Must include `https://` or `http://`
- ✅ Verify API key validity: Ensure not expired and has sufficient permissions
- ✅ Test network connectivity and firewall settings

</details>

<details>
<summary>❌ AI reports MCP tools not found</summary>

1. 🔄 Completely exit Cursor and restart
2. 📁 Check if configuration file path is correct
3. 🔍 Ensure Node.js version ≥ 18

</details>

<details>
<summary>❌ Query execution failure or timeout</summary>

- 🕐 Increase timeout settings
- 📊 Simplify query statement complexity
- 🔍 Check data source connection status

</details>

---

## 🔧 Advanced Configuration

### cURL Command Support (v1.1.0)

**Two configuration methods:**

```javascript
// Method 1: Traditional HTTP configuration
cpu_usage: {
  url: 'api/ds/query',
  method: 'POST',
  data: { queries: [...] }
},

// Method 2: cURL command (Recommended)
memory_usage: {
  curl: `curl 'api/ds/query' -X POST -d '{"queries":[...]}'`,
  systemPrompt: 'Analyze memory usage...'
}
```

**cURL Parameters Supported:** `-X`, `-H`, `-d`, `-u`, `--connect-timeout`, `--max-time`

### Environment Variables Configuration

```bash
export GRAFANA_URL="https://your-grafana.com"
export GRAFANA_TOKEN="your-api-token"
```

### MCP Tools List

| Tool | Function | Use Case |
|------|----------|----------|
| `analyze_query` | Query + AI analysis | Need professional advice |
| `execute_query` | Raw data query | Only need data |
| `check_health` | Health check | Status monitoring |
| `list_queries` | Query list | View configuration |

---

## 📄 License

MIT License. See the [LICENSE](LICENSE) file for details. 