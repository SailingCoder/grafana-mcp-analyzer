# Grafana MCP Analyzer 🤖

![Version](https://img.shields.io/npm/v/grafana-mcp-analyzer) ![License](https://img.shields.io/npm/l/grafana-mcp-analyzer)

**Let AI directly understand your monitoring data and intelligently analyze operational status**

[English](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README.md) | [中文文档](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README_EN.md)

## Overview

Imagine this scenario:
- You ask AI: "How is my server doing right now?"
- AI directly checks your Grafana monitoring and responds: "CPU usage is high, recommend checking these processes..."

No more staring at complex monitoring charts - let AI analyze everything for you!

## Features

Grafana MCP Analyzer is a server library based on **MCP (Model Context Protocol)** that enables AI assistants like Claude and ChatGPT to:

1. 💬 **Natural conversational queries**: "Help me check memory usage" → AI immediately analyzes and provides recommendations
2. 🔍 **Intelligent anomaly detection**: AI proactively discovers and reports anomalies in monitoring data
3. 📊 **Multi-datasource support**: Supports various Grafana data sources like Prometheus, MySQL, Elasticsearch
4. 💡 **Smart recommendations**: Not only displays monitoring data but also provides specific optimization suggestions
5. 🚀 **Efficiency boost**: No need to manually analyze charts - AI directly interprets Grafana data and provides analysis conclusions
6. 💡 **Small size**：The size of the package is very small, only 52KB


---

## Quick Start 🚀

### Step 1: Configure AI Assistant

Open **Cursor Settings** → Search for **"MCP"** → Add the following configuration: (Using Cursor as example)

```bash
npm install -g grafana-mcp-analyzer
```

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

Note: Any AI assistant that supports MCP can be configured similarly. Also, you need Node.js environment locally, version >= 18+.

> **Note**: `CONFIG_PATH` supports relative paths, absolute paths, and remote addresses. See [CONFIG_PATH_GUIDE](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/docs/CONFIG_PATH_GUIDE.md) for details

### Step 2: Create Configuration File

Create a `grafana-config.js` file in your project root directory:

> **Complete configuration example**: See [query-config.simple.js](./config/query-config.simple.js)

```javascript
const config = {
  baseUrl: 'https://your-grafana-address.com',  // Replace with your Grafana address
  defaultHeaders: {
    'Authorization': 'Bearer your-api-key',  // Replace with your API key
    'Content-Type': 'application/json'
  },
  queries: {
    // Frontend performance monitoring
    frontend_performance: {
      url: "api/ds/es/query",
      method: "POST",
      data: {
        es: {
          index: 'your_index',
          query: 'your_query_statement'
        }
        // More configuration...
      },
      systemPrompt: 'You are a frontend performance analysis expert. Please analyze FCP (First Contentful Paint) performance data, focusing on: 1. Page first content paint time trends 2. 75th percentile performance 3. Performance degradation detection 4. User experience impact assessment 5. Performance optimization recommendations. Please provide detailed analysis and practical optimization suggestions in English.'
    },
    
    // CPU usage monitoring
    cpu_usage: {
      url: 'api/ds/sql/query',
      method: 'POST',
      data: {
        sql: 'SELECT * FROM your_table'
        // More configuration...
      },
      systemPrompt: 'You are a CPU performance analysis expert. Please analyze CPU usage data, identify performance issues and provide optimization recommendations. Focus on: 1. Usage trends 2. Peak time points 3. Performance bottlenecks 4. Optimization suggestions'
    },
  },
  healthCheck: { url: 'api/health' }
};

export default config;
```

>Note: The data section contains query configuration, and systemPrompt is the AI analysis prompt used to guide how AI analyzes the data.

#### How to get query configuration?

1. **Method 1** (Recommended): Go to Grafana → Open any chart → Click "Query inspector" → Copy the Query configuration
2. **Method 2**: Check the Network panel in browser developer tools and copy the relevant API request parameters

### Step 3: Test Run

Completely close and restart Cursor, then try:

> **You**: Analyze frontend performance monitoring  
> **AI**: Analyzing...

> **You**: Analyze CPU usage monitoring  
> **AI**: Analyzing...

**Configuration complete!** 🎉

---

## Troubleshooting 💡

### Common Issues and Solutions

**❌ Cannot connect to Grafana?**
- Check if Grafana address format is correct (must include `https://`)
- Confirm API key is valid and not expired
- Verify network connection is working

**❌ AI says tools not found?**
- Completely exit Cursor and restart
- Check if configuration file path is correct
- Ensure Node.js version ≥ 18, if using nvm, set with `nvm alias default 18.**.**`

---

## Advanced Configuration

<details>
<summary> Local Installation (Recommended for production)</summary>

If you want stable usage without depending on network downloads:

```bash
npm install -g grafana-mcp-analyzer
```

Then modify the command in configuration file:
```json
{
  "mcpServers": {
    "grafana": {
      "command": "node",
      "args": ["/Users/username/Downloads/grafana-mcp-analyzer/dist/server/mcp-server.js"],
      "env": {
        "CONFIG_PATH": "/Users/username/Downloads/grafana-mcp-analyzer/grafana-config.js"
      }
    }
  }
}
```

</details>

<details>
<summary>Protect Sensitive Information with Environment Variables</summary>

For better security, it's recommended to store sensitive information in environment variables:

```bash
export GRAFANA_URL="https://your-grafana-domain.com"
export GRAFANA_TOKEN="your-api-key"
```

Then modify the configuration file:
```javascript
const config = {
  baseUrl: process.env.GRAFANA_URL,
  defaultHeaders: {
    'Authorization': `Bearer ${process.env.GRAFANA_TOKEN}`,
    'Content-Type': 'application/json'
  },
  // ... other configurations
};
```

</details>

<details>
<summary>MCP List</summary>

| Tool | Function | Use Case |
|------|----------|----------|
| `analyze_query` | 🧠 Execute query and intelligent analysis | Need AI insights and recommendations |
| `execute_query` | 📊 Execute raw query | Only need data |
| `check_health` | 🏥 Health check | Check service status |
| `list_queries` | 📋 Query list | View available queries |

</details>

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details. 