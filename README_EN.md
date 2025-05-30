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
| **Intelligent Anomaly Detection** | AI proactively discovers and reports performance bottlenecks and anomalies in monitoring data | Early risk warning |
| **Multi-Data Source Support** | Perfect compatibility with mainstream data sources like Prometheus, MySQL, Elasticsearch | Unified monitoring view |
| **Professional DevOps Recommendations** | Not just displaying data, but providing specific actionable optimization solutions | Improve DevOps efficiency |
| **Real-time Response Analysis** | No need to manually interpret charts, AI provides analysis conclusions in seconds | Save time costs |
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

> 💡 **Configuration Path Guide**: `CONFIG_PATH` supports relative paths, absolute paths, and remote addresses. See [CONFIG_PATH_GUIDE](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/docs/CONFIG_PATH_GUIDE.md) for details.

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
    // Frontend performance monitoring query
    frontend_performance: {
      url: "api/ds/es/query",
      method: "POST",
      data: {
        es: {
          index: 'frontend_metrics',
          query: 'your_elasticsearch_query'
        }
      },
      systemPrompt: `You are a frontend performance analysis expert. Please conduct in-depth analysis of FCP (First Contentful Paint) performance data:
      
      **Analysis Focus**:
      1. Page first contentful paint time trend analysis
      2. 75th percentile performance evaluation  
      3. Performance degradation issue identification
      4. User experience impact assessment
      5. Targeted optimization recommendations
      
      Please provide detailed performance analysis reports and practical optimization suggestions in English.`
    },
    
    // CPU usage monitoring query
    cpu_usage: {
      url: 'api/ds/sql/query',
      method: 'POST',
      data: {
        sql: 'SELECT time, cpu_usage FROM system_metrics WHERE time > now() - 1h'
      },
      systemPrompt: `You are a CPU performance analysis expert. Please comprehensively analyze CPU usage data:
      
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

- Method 1 (Recommended):
Get configuration through Grafana: Go to chart → Click "Query Inspector" → Copy query configuration.
If copying fails, try parsing panel JSON and then extract again.

- Method 2:
Use browser developer tools: Open DevTools → Switch to Network panel → Find corresponding API request → Copy request parameters.

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

### Common Issue Solutions

<details>
<summary>❌ Unable to connect to Grafana service</summary>

**Possible causes and solutions:**
- ✅ Check Grafana address format: Must include `https://` or `http://`
- ✅ Verify API key validity: Ensure not expired and has sufficient permissions
- ✅ Test network connectivity: Use ping command to check network status
- ✅ Firewall settings: Ensure ports are not blocked

</details>

<details>
<summary>❌ AI reports MCP tools not found</summary>

**Solution steps:**
1. 🔄 Completely exit Cursor and restart
2. 📁 Check if configuration file path is correct
3. 🔍 Ensure Node.js version ≥ 18
4. ⚙️ If using nvm: `nvm alias default 18.x.x`

</details>

<details>
<summary>❌ Query execution failure or timeout</summary>

**Troubleshooting directions:**
- 🕐 Increase timeout settings
- 📊 Simplify query statement complexity
- 🔍 Check data source connection status
- 📈 Verify query syntax correctness

</details>

---

## Advanced Configuration

<details>
<summary>Protecting Sensitive Information with Environment Variables</summary>

To improve security, it's recommended to store sensitive information in environment variables:

```bash
# Set environment variables
export GRAFANA_URL="https://your-grafana-domain.com"
export GRAFANA_TOKEN="your-secure-api-token"
```

Modify configuration file:
```javascript
const config = {
  baseUrl: process.env.GRAFANA_URL,
  defaultHeaders: {
    'Authorization': `Bearer ${process.env.GRAFANA_TOKEN}`,
    'Content-Type': 'application/json'
  },
  // ... other configurations remain unchanged
};

export default config;
```

</details>

<details>
<summary>MCP Tools List</summary>

| Tool Name | Function Description | Use Case | Return Content |
|-----------|---------------------|----------|----------------|
| `analyze_query` | Execute query and provide AI intelligent analysis | When professional insights and recommendations are needed | Data + analysis report |
| `execute_query` | Execute raw data query | When only raw data is needed | Pure data results |
| `check_health` | Grafana service health check | Service status monitoring | Health status information |
| `list_queries` | List all available queries | View configured query list | Query configuration list |
| `server_status` | MCP server status check | MCP connection status confirmation | Server status |

</details>

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details. 