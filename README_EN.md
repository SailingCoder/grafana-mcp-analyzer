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
-   **Smart Data Formatting** - Support for **large data volume** analysis, efficiently parsing various data types
-   **curl Support** - Directly use browser-copied curl to compose queries
-   **Aggregate Analysis** - Single query or Dashboard-level comprehensive analysis
-   **Anomaly Detection** - AI actively reports performance issues, early alerts
-   **Full Data Source Support** - Prometheus, MySQL, ES, and more
-   **Professional DevOps Recommendations** - Not just displaying data, but providing actionable optimization solutions, improving DevOps efficiency

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
 * Data source (Dogecoin OHLC data): https://play.grafana.org/d/candlesticksss/candlestick2?orgId=1&from=2021-07-13T22:13:30.740Z&to=2021-07-13T22:46:18.921Z&timezone=utc
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
    // First query - using curl format (Dogecoin data from panel 2)
    // dogecoin_panel_2 ....

    // Second query - using HTTP API format (Dogecoin data from panel 7)
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
      systemPrompt: `You are a financial market technical analysis expert, focusing on cryptocurrency market analysis.

**Analysis Focus**:
1. Market trend and momentum analysis - Identify main trend direction and momentum changes
2. Price pattern recognition - Identify classic patterns like head and shoulders, double bottoms, triangles, etc.
3. Volume and price relationship - Analyze volume support for price trends
4. Market sentiment assessment - Evaluate market sentiment based on technical indicators
5. Short-term and long-term investment strategy recommendations - Provide investment advice for different time periods

**Output Requirements**:
- Analyze based on actual data, provide specific numerical interpretations
- Identify key price patterns and trend changes
- Give clear trading recommendations and risk warnings
- Provide actionable investment strategies

Please provide a detailed technical analysis report.`
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
      systemPrompt: `You are a system performance analysis expert, focusing on CPU utilization data analysis.

**Core Task**: Directly answer the user's question: "How is my server doing right now?"

**Must Answer Questions**:
What is the current CPU utilization? (specific values)

**Output Format**:
## Server Status Overview
**Direct Conclusion**: Server CPU utilization [specific value]%, status [Normal/High/Abnormal]

## Detailed Data
- **Current Utilization**: [value]%
- **Average Utilization**: [value]%
- **Peak Utilization**: [value]%
- **Main Usage Modes**: [user/system/iowait etc]

## Risk Assessment
[Specific risk analysis based on data]

## Action Recommendations
[Specific actionable suggestions]

**Important**: If unable to obtain actual data, please clearly state "Unable to obtain actual data" and explain possible reasons. Do not analyze based on assumptions!`
    },
  }
};

module.exports = config; 
```
</details>

### Step 4: Start Using!

**Completely restart Cursor**, then experience intelligent analysis:

> 👤 You: Analyze overall_cpu_utilization100 data\
> 🤖 AI: Connecting to Grafana and analyzing...

> 👤 You: Aggregate analysis of dogecoin_panel_2 and dogecoin_panel_7 data\
> 🤖 AI: Querying multiple indicators simultaneously for comprehensive correlation analysis...

**Configuration Complete!**

![Demo Screenshot](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/docs/image(1).png)

## MCP Tool List

| Tool | Function | Use Case |
|------|----------|----------|
| `analyze_query` | Query + AI Analysis | Need professional advice |
| `aggregate_analyze` | Aggregate analysis | Multi-query unified analysis |
| `list_queries` | Query list | View configuration |
| `check_health` | Health check | Status monitoring |
| `manage_sessions` | Session management | Manage analysis sessions |
| `list_data` | Data list | View stored data |
| `server_status` | Server status | Server information |

### Tool Usage

```javascript
// AI assistant automatically selects appropriate tools
👤 "Analyze CPU usage" → 🤖 Call analyze_query
👤 "Aggregate system metrics" → 🤖 Call aggregate_analyze
```

## Advanced Configuration

The following content is for users who need to customize data sources or perform more advanced usage scenarios.

<details>
<summary>How to Get Request Configuration?</summary>

### Method 1: HTTP API (like `dogecoin_panel_7`)

1.  Get Data parameters: Enter chart → "Query Inspector" → "JSON" parse → Copy request body
2.  Get URL and Headers Token: View request parameters through Network panel, manually construct HTTP configuration.

### Method 2: curl (Recommended, applicable to all panels, like `overall_cpu_utilization100`):

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
        "MAX_CHUNK_SIZE": "100",
        "SESSION_TIMEOUT_HOURS": "24",
        "CONFIG_MAX_AGE": "300",
      }
    }
  }
}

```


|Environment Variable | Type | Default | Description |
| ----- | -- | --- | -- |
| `CONFIG_PATH` | string | Required | Configuration file path (local or HTTPS remote address) |
| `MAX_CHUNK_SIZE` | number | `100` | Maximum data chunk size (KB), affects slicing performance |
| `SESSION_TIMEOUT_HOURS` | number | `24` | Session timeout (hours) |
| `CONFIG_MAX_AGE` | number | `300` | Remote configuration file cache time (seconds), set to `0` to disable |

Cache features:

- Smart configuration file caching (default 5 minutes)
- Use local expired cache when network fails
- Automatic cache file cleanup on startup
- Set CONFIG_MAX_AGE=0 to disable cache and fetch latest configuration every time

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

### Aggregate Analysis Configuration

<details>
<summary>Full-Chain Performance Analysis</summary>

**User Question**: "How is my system's overall performance? Where are the bottlenecks?"

```javascript
// Frontend performance
frontend_performance: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"histogram_quantile(0.95, rate(page_load_time_seconds_bucket[5m]))","range":{"from":"now-1h","to":"now"}}]}'`,
  systemPrompt: 'Frontend performance expert: Analyze page load times, identify frontend performance bottlenecks.'
},

// Backend performance
backend_performance: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"histogram_quantile(0.95, rate(api_response_time_seconds_bucket[5m]))","range":{"from":"now-1h","to":"now"}}]}'`,
  systemPrompt: 'Backend performance expert: Analyze API response times, identify backend performance issues.'
},

// Database performance
database_performance: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"rate(mysql_queries_total[5m])","range":{"from":"now-1h","to":"now"}}]}'`,
  systemPrompt: 'Database performance expert: Analyze database query performance, identify database bottlenecks.'
}
```

**Usage**:
> 👤 You: Aggregate analysis of full-chain performance: frontend_performance, backend_performance, database_performance
> 
> 🤖 AI: Comprehensive analysis of frontend, backend, database performance, providing complete performance optimization recommendations
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

## Recommended Articles

*   [grafana-mcp-analyzer: Lightweight AI analysis monitoring chart DevOps tool based on MCP!](https://blog.csdn.net/qq_37834631/article/details/148473620?spm=1001.2014.3001.5501) - CSDN technical blog in-depth analysis

## License

MIT License. See [LICENSE](LICENSE) file for details. 