# Grafana MCP Analyzer

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

Note: `CONFIG_PATH` supports absolute paths and remote paths. See advanced configuration below for details.

### Step 3: Create Configuration File `grafana-config.js`

The `CONFIG_PATH` in step 2 is already configured with a remote path. If you just want to quickly experience this library, you can skip this step and go directly to step 4. If you want to use your own data sources or parameters, you can refer to the following configuration for customization.

The following is the default configuration pointed to by CONFIG_PATH in step 2 (from documentation example):

```javascript
/**
 * Configuration file based on Grafana Play demo instance
 * Data source (Dogecoin OHLC data): https://play.grafana.org/d/candlesticksss/candlestick2?orgId=1&from=2021-07-13T22:13:30.740Z&to=2021-07-13T22:46:18.921Z&timezone=utc
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
      systemPrompt: \`You are a Dogecoin data analysis expert, focusing on OHLC (Open, High, Low, Close) data analysis.

**Analysis Focus**:
1. Price trends and volatility patterns - Identify main trend direction and change cycles
2. Support and resistance level identification - Find key price levels
3. Trading opportunity analysis - Identify entry and exit timing based on technical indicators
4. Risk assessment and recommendations - Evaluate current market risk and investment advice
5. Technical indicator analysis - Comprehensive analysis combining multiple technical indicators

**Output Requirements**:
- Analyze based on actual data, provide specific numerical interpretations
- Identify key price levels and trend changes
- Give clear trading recommendations and risk warnings
- Provide actionable investment strategies

Please provide professional investment analysis and recommendations.\`
    },

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
      systemPrompt: \`You are a financial market technical analysis expert, focusing on cryptocurrency market analysis.

**Analysis Focus**:
1. Market trend and momentum analysis - Identify main trend direction and momentum changes
2. Price pattern recognition - Identify classic patterns like head and shoulders, double bottom, triangles
3. Volume and price relationship - Analyze volume support for price movements
4. Market sentiment assessment - Evaluate market sentiment based on technical indicators
5. Short-term and long-term investment strategy recommendations - Provide investment advice for different time frames

**Output Requirements**:
- Analyze based on actual data, provide specific numerical interpretations
- Identify key price patterns and trend changes
- Give clear trading recommendations and risk warnings
- Provide actionable investment strategies

Please provide detailed technical analysis report.\`
    }
  }
};

module.exports = config; 
```

**Configuration Tips**:

**Browser Copy curl Command** (Recommended):

1.  Execute query in Grafana
2.  Press F12 to open developer tools → Network tab
3.  Find query request → Right click → Copy as cURL

**HTTP API Configuration**:

1.  Get Data parameters: Enter chart → "Query Inspector" → "JSON" parse → Copy request body
2.  Get URL and Headers Token: View request parameters through Network panel, manually construct HTTP configuration.

> For configuration file examples, see: [Basic Configuration](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/config/grafana-config.simple.js) and [Remote Real Configuration](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/config/grafana-config-play.js)

### Step 4: Start Using

**Completely restart Cursor**, then experience intelligent analysis:

> 👤 You: Analyze dogecoin_panel_2 data  
> 🤖 AI: Connecting to Grafana and analyzing...

> 👤 You: Aggregate analysis of dogecoin_panel_2 and dogecoin_panel_7 data  
> 🤖 AI: Querying multiple indicators simultaneously for comprehensive correlation analysis...

**Configuration Complete!**

![Demo Screenshot](https://i-blog.csdnimg.cn/direct/922ac00595694c5796556586b224d63f.png#pic_center)

## MCP Tool List

| Tool | Function | Use Case |
|------|----------|----------|
| `analyze_query` | Query + AI Analysis | Need professional advice |
| `query_data` | Raw data query | Only need data |
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

<details>
<summary>Environment Variable Configuration</summary>

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

- MAX_CHUNK_SIZE: Maximum data chunk size (KB, default 100)
- SESSION_TIMEOUT_HOURS: Session timeout (hours, default 24)
- CONFIG_MAX_AGE: Configuration cache time (seconds, default 300)
```

</details>

<details>
<summary>Configuration Support: Absolute Paths, Remote Paths</summary>
    
**1. Remote Paths**
    
Support accessing remote configuration files via HTTPS URL, suitable for team collaboration and multi-environment deployment:

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

Supported remote storage:

*   Alibaba Cloud OSS: `https://bucket.oss-cn-hangzhou.aliyuncs.com/config.js`
*   Tencent Cloud COS: `https://bucket-123.cos.ap-shanghai.myqcloud.com/config.js`
*   AWS S3: `https://bucket.s3.amazonaws.com/config.js`
*   GitHub Raw: `https://raw.githubusercontent.com/user/repo/main/config.js`

Note:
❌ GitHub Page	https://github.com/user/repo/blob/main/file.js	Returns HTML page
✅ GitHub Raw	https://raw.githubusercontent.com/user/repo/main/file.js	Returns raw file

**2. Absolute Paths**
    
Also supports configuring local absolute paths for quick configuration analysis:
    
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

**Environment Variable Description**

| Variable Name     | Default | Description                                    |
| ---------------- | ------- | ---------------------------------------------- |
| `CONFIG_PATH`    | Required| Configuration file path (local path or HTTPS URL) |
| `CONFIG_MAX_AGE` | `300`   | Remote configuration cache time (seconds), set to 0 to disable cache |

Cache features:

*   Smart caching: Default 5-minute cache, improves access speed
*   Fault tolerance: Automatically use expired cache when network fails
*   Auto cleanup: Automatically clean expired cache files on startup
*   Real-time updates: Set CONFIG_MAX_AGE=0 to disable cache and get latest configuration every time

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
<summary>Environment Variable Configuration</summary>

```bash
export GRAFANA_URL="https://your-grafana.com"
export GRAFANA_TOKEN="your-api-token"
```

</details>

## Configuration Examples

### Business Scenario Configuration

#### E-commerce Business Analysis

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

**AI Response Example**:
> **Conversion Rate Analysis Report**
> 
> Current conversion rate: 2.3% (industry average 3.5%)
> 
> **Problem Diagnosis**:
> - Lowest conversion rate from 2-4 PM (1.2%)
> - Mobile conversion rate 40% lower than PC
> 
> **Optimization Suggestions**:
> 1. Optimize mobile payment process, expected 0.5% improvement
> 2. Add promotional activities in afternoon, expected 0.3% improvement
> 3. Improve product page loading speed, expected 0.2% improvement
> 
> **Expected Revenue**: Conversion rate improved to 3.0%, monthly sales increase of 150,000

#### Financial Risk Analysis

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

**AI Response Example**:
> **Risk Alert: Medium Risk**
> 
> **Abnormal Indicators**:
> - Transaction volume increased abnormally by 200% from 2-4 AM
> - Single transaction amount exceeds 10 times the average
> 
> **Risk Analysis**:
> Suspected automated trading or abnormal user behavior
> 
> **Protection Suggestions**:
> 1. Immediately enable transaction limits during early morning hours
> 2. Increase manual review for large transactions
> 3. Strengthen user identity verification
> 
> **Emergency Actions**: Suspend suspicious account transactions

#### User Behavior Analysis

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

**AI Response Example**:
> **User Profile Analysis**
> 
> **Activity Trends**:
> - Daily active users: 12,500 (8% increase week-over-week)
> - Weekly active users: 45,000 (12% increase week-over-week)
> 
> **Target User Groups**:
> - 25-35 year old female users most active
> - 8-10 PM usage peak period
> 
> **Retention Strategy**:
> 1. Launch personalized recommendations for female users
> 2. Add interactive features during evening hours
> 3. Build user growth system
> 
> **Expected Effects**: User retention rate improved by 15%, monthly active users increased by 20%

### System Monitoring Configuration

#### Server Performance Monitoring

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

**AI Response Example**:
> **Performance Score: Good**
> 
> **Key Indicators**:
> - CPU usage: 65% (Attention)
> - Memory usage: 78% (Attention)
> - Disk I/O: 45% (Normal)
> 
> **Bottleneck Analysis**:
> CPU usage reaches 85% during business peak, approaching threshold
> 
> **Optimization Suggestions**:
> 1. Optimize database queries, expected 15% CPU usage reduction
> 2. Add cache layer, expected 10% CPU usage reduction
> 3. Consider scaling up 2 CPU cores
> 
> **Alert Recommendations**: Set CPU usage 80% alert

#### Application Error Monitoring

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

**AI Response Example**:
> **Error Level: Medium**
> 
> **Error Statistics**:
> - Errors in 1 hour: 156 times
> - Affected users: About 2,300 people
> - Error rate: 0.8% (industry standard <0.5%)
> 
> **Error Classification**:
> 1. Payment module errors: 89 times (most serious)
> 2. User login errors: 45 times
> 3. Data query errors: 22 times
> 
> **Fix Suggestions**:
> 1. Immediately check payment gateway connection
> 2. Optimize login verification logic
> 3. Increase database connection pool
> 
> **Prevention Measures**: Add error monitoring alerts, set error rate threshold

### Aggregate Analysis Configuration

#### Full-Chain Performance Analysis

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

**AI Response Example**:
> **Full-Chain Performance Analysis Report**
> 
> **Performance Overview**:
> - Frontend load time: 2.1 seconds (target <1.5 seconds)
> - Backend response time: 850ms (target <500ms)
> - Database query: 120ms (target <100ms)
> 
> **Bottleneck Identification**:
> 1. Frontend: Image resources too large, recommend compression
> 2. Backend: Complex API processing logic, recommend optimization
> 3. Database: Queries missing indexes, recommend adding
> 
> **Optimization Suggestions**:
> 1. Frontend optimization: Expected 30% load speed improvement
> 2. Backend optimization: Expected 40% response speed improvement
> 3. Database optimization: Expected 20% query speed improvement
> 
> **Overall Effect**: User experience improved by 35%, page load time reduced to 1.4 seconds

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

---

## Recommended Articles

- [grafana-mcp-analyzer: Lightweight AI analysis monitoring chart DevOps tool based on MCP!](https://blog.csdn.net/qq_37834631/article/details/148473620?spm=1001.2014.3001.5501) - CSDN technical blog in-depth analysis
- [AI Intelligent Analysis Demo](https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/docs/analysis-results) - View real AI analysis results demo

## License

MIT License. See [LICENSE](LICENSE) file for details. 