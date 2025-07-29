# Grafana MCP Analyzer 🤖

![Version](https://img.shields.io/npm/v/grafana-mcp-analyzer) ![License](https://img.shields.io/npm/l/grafana-mcp-analyzer) 

**Let AI directly understand your monitoring data - Intelligent DevOps analysis assistant**

[English](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README_EN.md) | [中文文档](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/README.md)

## ✨ Project Introduction

Imagine this scenario:

* You ask AI: "How is my server doing right now?"
* AI directly checks your Grafana monitoring and answers: "CPU usage is high, suggest checking these processes..."

Complex monitoring charts, AI analyzes them with one click! Say goodbye to traditional manual monitoring methods and let AI become your dedicated DevOps assistant!

## 🚀 Core Features

Grafana MCP Analyzer is based on **MCP (Model Context Protocol)** protocol, empowering AI assistants like Claude and ChatGPT with the following superpowers:

-   **Natural Language Queries** - Easy access to monitoring data, AI outputs professional analysis with one click
-   **Multi-turn Conversation Support** - Support complex multi-turn conversation analysis, able to perform in-depth analysis based on context, avoiding data confusion
-   **curl Support** - Directly use browser-copied curl to compose queries
-   **Full Data Source Support** - Prometheus, MySQL, ES, and more
-   **Professional DevOps Recommendations** - Not just displaying data, but providing actionable optimization solutions, improving DevOps efficiency

> 💡 **New Architecture Pattern**: Session Cache → Progressive Data Retrieval → Progressive Deep Analysis → Intelligent Cache Reuse, making AI analysis more natural and efficient

## 🛠️ Quick Start

### Step 1: Installation

```bash
npm install -g grafana-mcp-analyzer
```

> **Environment Requirements**: Node.js 18+ | [Installation Guide](https://blog.csdn.net/qq_37834631/article/details/148457021?spm=1001.2014.3001.5501)

### Step 2: Configure AI Assistant (Using Cursor as example)

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

Note: `CONFIG_PATH` supports absolute paths and remote paths. Remote paths are recommended for quick experience.

### Step 3: Create Configuration File

If you need to connect to your own data, create a configuration file named `grafana-config-play.js` at the `CONFIG_PATH` location.

> If you just want to quickly experience the example, you can skip this step and go directly to step 4.

<details>
<summary>Click to expand and view example</summary>

```javascript
/**
 * Configuration file based on Grafana Play demo instance
 * Configuration file content source: https://raw.githubusercontent.com/SailingCoder/grafana-mcp-analyzer/main/config/grafana-config-play.js
 * Request configuration methods: Supports http api and curl
 */
const config = {
  // Grafana server address
  baseUrl: 'https://play.grafana.org',
  
  // Default request headers
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*'
  },

  // Health check configuration
  healthCheck: {
    url: 'api/health'
  },

  // Query definitions
  queries: {
    // Price Only, Hollow Candles
    // Using HTTP API format
    // Data source: https://play.grafana.org/d/candlestick/candlestick?orgId=1&from=2021-07-13T22:13:30.740Z&to=2021-07-13T22:46:18.921Z&timezone=utc&viewPanel=panel-7
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
      systemPrompt: `You are a Dogecoin candlestick chart analysis expert.

**Analysis Focus**:
1. Price trend identification - Identify main trend direction (uptrend/downtrend/sideways)
2. Key price level analysis - Find support and resistance levels
3. Trading opportunity assessment - Identify entry opportunities based on candlestick patterns
4. Risk assessment - Provide risk warnings and investment advice

**Output Format**:
## Chart Overview
- Time range: [specific time]
- Price range: [highest-lowest price]
- Main trend: [uptrend/downtrend/sideways]

## Technical Analysis
- Support level: [price level]
- Resistance level: [price level]
- Key behavior: [important price behavior]

## Trading Recommendations
- Short-term direction: [bullish/bearish/neutral]
- Key price levels: [levels to watch]
- Risk warnings: [important reminders]`
    },
    // faro-shop-control-plane - Overall CPU Utilization
    // Using cUrl format
    // Data source: https://play.grafana.org/d/cNMLIAFK/cpu-utilization-details-cores?var-interval=$__auto&orgId=1&from=now-3h&to=now&timezone=browser&var-host=faro-shop-control-plane&var-cpu=$__all&viewPanel=panel-22
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
      systemPrompt: `You are a system performance analysis expert, focusing on CPU utilization historical trend analysis.

**Data Characteristics**: This is historical time series data of overall CPU utilization, including:
- **user**: User mode CPU utilization
- **system**: System mode CPU utilization  
- **iowait**: I/O wait time
- **softirq**: Software interrupts
- **Max Core Utilization**: Single core maximum utilization

**Analysis Focus**:
1. **Historical Trend Analysis** - Identify CPU utilization change trends and patterns
2. **Performance Bottleneck Identification** - Analyze which CPU mode consumes the most resources
3. **Peak Analysis** - Identify peak times and causes of CPU utilization
4. **System Health Assessment** - Evaluate overall system health based on historical data
5. **Capacity Planning Recommendations** - Predict future resource needs based on trends

**Output Requirements**:
- Provide specific time ranges and data statistics
- Identify key performance indicators and anomaly patterns
- Analyze usage patterns of different CPU modes
- Give optimization recommendations based on historical data

Please provide a detailed CPU performance trend analysis report.`
    },
  }
};

module.exports = config;
```
</details>

### Step 4: Start Using!

**Restart the MCP Grafana service in Cursor**, then start experiencing intelligent analysis!

> ⚠️ **Important Reminder**: After modifying `mcp.json` or `grafana-config-play.js` configuration files, you must restart the MCP Grafana service in Cursor for changes to take effect.

**1. You want to know**: How is Dogecoin's recent price trend?

**Conversation Example**:

```text
👤 You: Help me analyze candlestick_priceOnly_hollowCandles data
🤖 AI: Okay, let me get Dogecoin's candlestick data and analyze...

👤 You: This analysis is too simple, can you explain support and resistance levels in detail?
🤖 AI: Based on the previous data, let me do an in-depth analysis of technical indicators...

👤 You: What's the current price position? Any investment opportunities?
🤖 AI: According to technical analysis, the current price is at...
```

**2. You want to know**: How is the system's overall CPU performance?

**Conversation Example**:

```
👤 You: Analyze overall_cpu_utilization data
🤖 AI: Provide CPU analysis report

👤 You: How is the CPU utilization trend changing?
🤖 AI: Based on the previous data, analyze CPU utilization change trends

👤 You: When did this peak occur?
🤖 AI: Based on our previous analysis, identify CPU peak time

👤 You: Do we need to scale up? What's the cost of scaling?
🤖 AI: Based on historical data, provide scaling recommendations and cost assessment
```

**Configuration Complete!**

![Demo Screenshot](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/docs/image(1).png)

**Important Limitation Notice**: Due to AI model context processing limitations, it's recommended to control data size within 300KB (can be adjusted based on model capabilities) for optimal analysis results.

## MCP Tool List

| Tool | Function | Use Case |
|------|----------|----------|
| `analyze_query` | Query + AI Analysis | First-time data retrieval and analysis |
| `analyze_existing_data` | Analysis based on existing data | Multi-turn conversation in-depth analysis |
| `chunk_workflow` | Chunked data workflow | Large data volume automatic chunking |
| `manage_cache` | Cache management | Cache statistics, cleanup and optimization |
| `list_queries` | Query list | View available data sources |
| `check_health` | Health check | System status monitoring |
| `list_data` | Data list | View stored historical data |
| `server_status` | Server status | Server running information |

> **Note**: The system adopts intelligent session cache management, supporting progressive analysis and multi-turn conversations, more flexible and efficient than traditional aggregate analysis.

### Tool Usage

```javascript
// AI assistant automatically selects appropriate tools
👤 "Analyze CPU usage" → 🤖 Call analyze_query
👤 "Analyze based on previous data" → 🤖 Call analyze_existing_data
👤 "Check cache status" → 🤖 Call manage_cache
👤 "Analyze large data volume" → 🤖 Call chunk_workflow

// Cache management specific operations
👤 "View cache statistics" → 🤖 manage_cache action: 'stats'
👤 "List cache entries" → 🤖 manage_cache action: 'list'
👤 "Clean expired cache" → 🤖 manage_cache action: 'cleanup'
👤 "Smart cache cleanup" → 🤖 manage_cache action: 'smart_cleanup'
👤 "Clear all cache" → 🤖 manage_cache action: 'clear'
```

## Advanced Configuration

The following content is for users who need to customize data sources or perform more advanced usage scenarios.

<details>
<summary>How to Get Request Configuration?</summary>

### Method 1: HTTP API (like `candlestick_priceOnly_hollowCandles`)

1.  Get Data parameters: Enter chart → "Query Inspector" → "JSON" parse → Copy request body
2.  Get URL and Headers Token: View request parameters through Network panel, manually construct HTTP configuration.

### Method 2: curl (Recommended, applicable to all panels, like `overall_cpu_utilization`):

1.  Execute query in Grafana
2.  Press F12 to open developer tools → Network tab
3.  Find query request → Right click → Copy as cURL
4.  Paste the copied curl into the configuration file
</details>

<details>
<summary>Configuration File Examples</summary>

- [Basic Configuration](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/config/grafana-config.simple.js)
- [Remote Real Configuration](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/config/grafana-config-play.js)
</details>

<details>
<summary>Environment Variable Description</summary>

```json
{
  "mcpServers": {
    "grafana": {
      "command": "grafana-mcp-analyzer",
      "env": {
        "CONFIG_PATH": "https://raw.githubusercontent.com/SailingCoder/grafana-mcp-analyzer/main/config/grafana-config-play.js",
        "MAX_CHUNK_SIZE": "50",
        "DATA_EXPIRY_HOURS": "24",
        "CONFIG_MAX_AGE": "300",
        "SESSION_TIMEOUT_HOURS": "24"
      }
    }
  }
}
```

| Environment Variable | Type | Default | Description |
| -------------------- | ---- | ------- | ----------- |
| `CONFIG_PATH` | string | Required | Configuration file path (local or HTTPS remote address) |
| `MAX_CHUNK_SIZE` | number | `50` | Maximum data chunk size (KB), affects data slicing size |
| `DATA_EXPIRY_HOURS` | number | `24` | Data expiration time (hours), controls cache automatic cleanup |
| `CONFIG_MAX_AGE` | number | `300` | Remote configuration file cache time (seconds), set to `0` to disable |
| `SESSION_TIMEOUT_HOURS` | number | `24` | Session timeout (hours), controls session management |

### Environment Variable Description

#### **Data Management**
- **`MAX_CHUNK_SIZE`** - Controls large data file chunking size, default 50KB, can be adjusted based on AI model context window
- **`DATA_EXPIRY_HOURS`** - Controls data cache expiration time, system regularly cleans expired data to free storage space

#### **Configuration Management**
- **`CONFIG_PATH`** - Supports local absolute paths or HTTPS remote addresses, supports GitHub Raw, cloud storage, etc.
- **`CONFIG_MAX_AGE`** - Remote configuration file cache time, avoids frequent network requests, set to 0 to disable cache

#### **Session Management**
- **`SESSION_TIMEOUT_HOURS`** - Controls session timeout time, expired sessions are automatically cleaned

</details>

<details>
<summary>Multi-turn Conversation Features</summary>

### Core Features
- **Intelligent Cache Management** - Automatically cache query results, avoid repeated data retrieval
- **Session Context Maintenance** - Maintain analysis context within the same conversation
- **Data Isolation** - Different session data is isolated, avoiding confusion
- **Cache Reuse** - Perform in-depth analysis based on existing data, improving efficiency

### Usage Scenarios
```
👤 You: Analyze candlestick_priceOnly_hollowCandles data
🤖 AI: Retrieve data and analyze price trends...

👤 You: How long will this trend last?
🤖 AI: Based on the previous data, analyze trend persistence...

👤 You: What impact will trend changes have?
🤖 AI: Based on our previous analysis, predict the impact of trend changes...
```

### Cache Management

#### **Simple Conversation Operations**
```
👤 You: Check cache
🤖 AI: Display cache statistics

👤 You: Delete CPU cache
🤖 AI: Delete overall_cpu_utilization related cache

👤 You: Clear all cache
🤖 AI: Delete all cache data
```

#### **Supported Operations**
- **Check Cache** - Display cache count and size
- **Delete Specific Cache** - Delete cache for a specific query (e.g., "Delete CPU cache")
- **Clear All Cache** - Delete all cache data
- **Automatic Cleanup** - System periodically cleans expired cache

</details>

<details>
<summary>Supported Configuration Types: Local Absolute Path / Remote Path</summary>
    
### 1. Remote Paths
    
Support accessing remote configuration files via HTTPS URL, suitable for team collaboration and multi-environment deployment:

```json
{
  "env": {
    "CONFIG_PATH": "https://raw.githubusercontent.com/SailingCoder/grafana-mcp-analyzer/main/config/grafana-config-play.js"
  }
}
```

Supported remote storage:

*   GitHub Raw: `https://raw.githubusercontent.com/SailingCoder/grafana-mcp-analyzer/main/config/grafana-config-play.js`
*   Alibaba Cloud OSS: `https://bucket.oss-cn-hangzhou.aliyuncs.com/config.js`
*   Tencent Cloud COS: `https://bucket-123.cos.ap-shanghai.myqcloud.com/config.js`
*   AWS S3: `https://bucket.s3.amazonaws.com/config.js`

Note:
- ❌ GitHub web page paths not supported, like https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/config/grafana-config-play.js, returns HTML page
- ✅ Must use GitHub Raw format to get raw JS file, like https://raw.githubusercontent.com/SailingCoder/grafana-mcp-analyzer/main/config/grafana-config-play.js


### 2. Local Paths
    
Support configuring local absolute paths for quick testing analysis:
    
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
<summary>Command Line Options</summary>

```bash
# Show version information
grafana-mcp-analyzer -v
grafana-mcp-analyzer --version

# Show help information
grafana-mcp-analyzer -h
grafana-mcp-analyzer --help
```

</details>


<details>
<summary>Access Permission Environment Variables (Optional)</summary>

If you need to call protected Grafana APIs, you can set:

```bash
export GRAFANA_URL="https://your-grafana.com"
export GRAFANA_TOKEN="your-api-token"
```
You can also directly inject tokens via Headers in the configuration file for access.
</details>

## Configuration Examples

### Business Scenario Configuration

<details>
<summary>E-commerce Business Analysis</summary>

**User Question**: "How is my e-commerce conversion rate? How to improve sales?"

```javascript
// E-commerce conversion rate analysis
ecommerce_conversion: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"rate(orders_total[5m]) / rate(page_views_total[5m]) * 100","range":{"from":"now-24h","to":"now"}}]}'`,
  systemPrompt: `You are an e-commerce business analysis expert. Please analyze conversion rate data and answer the following key questions:

**Core Analysis Questions**:
1. What is the current conversion rate? How does it compare to industry standards?
2. When are the peak and valley periods of conversion rate during the day?
3. What factors might affect the decline in conversion rate?
4. Specific suggestions on how to improve conversion rate? How much revenue can be expected?

**Output Format**:
- Data overview: Current conversion rate values and trends
- Problem diagnosis: Identify conversion rate bottlenecks
- Optimization suggestions: 3-5 actionable improvement plans
- Revenue forecast: Expected improvement effects and ROI

Please use simple language and give specific actionable suggestions.`
}
```

</details>

<details>
<summary>Financial Risk Analysis</summary>
**User Question**: "Is there risk in my trading system? How to prevent fraud?"

```javascript
// Transaction risk analysis
finance_risk_analysis: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"sum(rate(transaction_amount_total[5m]))","range":{"from":"now-7d","to":"now"}}]}'`,
  systemPrompt: `You are a financial risk control expert. Please analyze transaction data and answer the following key questions:

**Core Analysis Questions**:
1. Is the current transaction volume abnormal? How does it compare to history?
2. Are there suspicious transaction patterns?
3. Which transactions need special attention?
4. How to optimize risk control strategies?

**Output Format**:
- Risk level: Low/Medium/High risk
- Abnormal indicators: Specific abnormal data points
- Risk analysis: Potential risk causes
- Protection suggestions: Specific risk control measures
- Emergency actions: Issues requiring immediate attention

Please mark high risk in red, medium risk in yellow, low risk in green.`
}
```
</details>

<details>
<summary>User Behavior Analysis</summary>

**User Question**: "How is my user activity? How to improve user retention?"

```javascript
// User engagement analysis
user_engagement: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"count(increase(user_sessions_total[1h]))","range":{"from":"now-30d","to":"now"}}]}'`,
  systemPrompt: `You are a user behavior analysis expert. Please analyze user activity data and answer the following key questions:

**Core Analysis Questions**:
1. How is the user activity trend? Is it growing?
2. What are the characteristics of user usage habits?
3. Which user groups are most active?
4. How to improve user retention rate?

**Output Format**:
- User profile: Active user characteristics
- Trend analysis: Activity trend changes
- Target users: Most valuable user groups
- Retention strategy: Methods to improve user stickiness
- Expected effects: Expected improvements after implementing suggestions

Please provide personalized operational suggestions based on user lifecycle.`
}
```

</details>

### System Monitoring Configuration

<details>
<summary>Server Performance Monitoring</summary>

**User Question**: "How is my server performance? Do I need to scale up?"

```javascript
// Server performance analysis
server_performance: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{
      "refId":"A",
      "expr":"node_cpu_seconds_total{mode=\"user\"} / node_cpu_seconds_total * 100",
      "range":{"from":"now-2h","to":"now"}
    }]}'`,
  systemPrompt: `You are a system performance expert. Please analyze server performance data and answer the following key questions:

**Core Analysis Questions**:
1. Is CPU usage normal? Is it approaching bottleneck?
2. How is memory usage? Is there a leak?
3. Is disk I/O becoming a bottleneck?
4. Is scaling or optimization needed?

**Output Format**:
- Performance score: Excellent/Good/Average/Poor
- Key indicators: CPU, memory, disk usage
- Bottleneck analysis: Causes of performance issues
- Optimization suggestions: Specific improvement plans
- Alert recommendations: Issues requiring immediate attention

Please use colors to mark different severity levels: Normal Attention Danger`
}
```
</details>

<details>
<summary>Application Error Monitoring</summary>

**User Question**: "Are there errors in my application? Does it affect user experience?"

```javascript
// Application error analysis
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
  systemPrompt: `You are an application monitoring expert. Please analyze error logs and answer the following key questions:

**Core Analysis Questions**:
1. How is the error frequency? Is it increasing?
2. Which errors are most serious? How many users are affected?
3. Which functional modules are errors concentrated in?
4. How to quickly fix and prevent?

**Output Format**:
- Error level: Severe/Medium/Minor
- Error statistics: Number of errors, affected users
- Error classification: By module and type
- Fix suggestions: Specific fix steps
- Prevention measures: Ways to avoid similar errors

Please sort by severity, prioritize fixing errors affecting the most users.`
}
```
</details>

## Troubleshooting

<details>
<summary>Cannot connect to Grafana service</summary>

*   Check Grafana address format: Must include `https://` or `http://`
*   Verify API key validity: Ensure not expired and has sufficient permissions
*   Test network connectivity and firewall settings

</details>

<details>
<summary>AI prompts cannot find MCP tools</summary>

*   Completely exit Cursor and restart
*   Check if configuration file path is correct
*   Ensure Node.js version ≥ 18

</details>

<details>
<summary>Query execution failure or timeout</summary>

*   Increase timeout settings
*   Check data source connection status
*   When data volume is too large, reduce time range

</details>

<details>
<summary>Data confusion in multi-turn conversations</summary>

*   Ensure using correct queryName, use different names for different queries
*   System automatically caches different query data, avoiding confusion
*   If data confusion occurs, you can re-call analyze_query to get new data
*   Use analyze_existing_data for in-depth analysis based on cached data
*   System supports session isolation, data from different sessions is independent

</details>

<details>
<summary>Cache management issues</summary>

*   View cache statistics: Use manage_cache tool to view cache status
*   Clean expired cache: Regularly clean expired cache to free storage space
*   Cache performance optimization: System automatically performs intelligent cache optimization
*   Cache conflict handling: Same queryName with different configurations automatically deduplicates

</details>

## Recommended Articles

*   [grafana-mcp-analyzer: Lightweight AI analysis monitoring chart DevOps tool based on MCP!](https://blog.csdn.net/qq_37834631/article/details/148473620?spm=1001.2014.3001.5501) - CSDN technical blog in-depth analysis

## License

MIT License. See [LICENSE](LICENSE) file for details. 