/**
 * 🚀 Grafana MCP 标准配置文件
 * 
 * 使用标准 ES 模块格式，确保兼容性
 * 格式：export default config
 */

// 从环境变量获取配置（推荐方式，更安全）
const GRAFANA_URL = process.env.GRAFANA_URL || 'https://your-grafana-api.com';
const GRAFANA_TOKEN = process.env.GRAFANA_TOKEN || 'your-grafana-api-token';

const config = {
  // Grafana服务器地址
  baseUrl: GRAFANA_URL,
  
  // 默认请求头 - 用于认证和设置内容类型
  defaultHeaders: {
    'Authorization': `Bearer ${GRAFANA_TOKEN}`,  // API令牌认证
    'Content-Type': 'application/json'           // JSON格式请求
  },

  // 默认超时配置（可选）
  defaultTimeout: 30000,  // 30秒

  // 智能摘要配置 - 解决大数据响应问题
  dataProcessing: {
    enableSummary: true,      // 启用智能摘要，防止大数据导致响应问题
    maxDataLength: 200000     // 数据大小阈值（字节），200KB
  },
  
  // 预定义查询 - 常用的监控查询
  queries: {
    // 通用数据分析查询
    data_analysis: {
      url: "api/ds/query",
      method: "POST",
      timeout: 30000,
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
      systemPrompt: '你是一个专业的数据分析专家。请对提供的监控数据进行深入分析，包括：1. 数据概览和基本统计 2. 趋势分析和模式识别 3. 异常值检测 4. 关键指标解读 5. 业务影响评估 6. 具体的优化建议和行动项。请用中文提供详细且实用的分析报告。'
    },
    
    // 前端性能监控
    frontend_performance: {
      url: "https://your-grafana-api.com/api/ds/es/query",
      method: "POST",
      timeout: 45000,
      data: {},
      systemPrompt: '你是前端性能分析专家。请分析FCP、LCP、TTFB性能数据，重点关注：1. 页面加载性能趋势 2. 75百分位数性能表现 3. 是否存在性能劣化 4. 用户体验影响评估 5. 性能优化建议。请用中文详细分析性能数据并提供实用的优化建议。'
    },
    
    // 系统健康检查
    health_check: {
      url: 'api/health',
      method: 'GET',
      timeout: 10000,
      systemPrompt: '你是一个系统健康检查专家。请分析服务健康状态，识别潜在问题。如果服务正常，请确认；如果有问题，请提供排查建议。'
    }
  },

  // 健康检查配置
  healthCheck: {
    url: 'api/health'
  }
};

// 标准 ES 模块导出格式
export default config; 

// 快速使用指南
// 
// 第1步：设置环境变量（推荐）
//   export GRAFANA_URL="https://你的grafana.com"
//   export GRAFANA_TOKEN="你的API密钥"
// 
// 第2步：添加自定义查询（两种方式）
//   
//   方式1：curl命令（推荐，v1.1.0新增）
//   1. 在Grafana中执行查询
//   2. 按F12打开开发者工具 → Network标签页
//   3. 找到查询请求，右键 → Copy → Copy as cURL
//   4. 粘贴到下面的curl字段中
//   
//   方式2：HTTP API配置
//   在上面的 queries 中添加你需要的查询（可以从grafana query inspector中复制）
//   
  //   注意：
  //   （1）查询名称必须用英文（如 cpu_usage, memory_check）
  //   （2）避免中文名称，AI无法正确识别
  //   （3）timeout优先级：查询配置 > defaultTimeout > curl命令 > 默认30秒
// 
// 第3步：在Cursor中配置MCP
//   {
//     "mcpServers": {
//       "grafana": {
//         "command": "npx grafana-mcp-analyzer",
//         "env": {
//           "CONFIG_PATH": "./query-config.simple.js"
//         }
//       }
//     }
//   }
// 
// 第4步：开始使用
//   重启Cursor后，直接问AI：
//   "帮我分析CPU使用率" → AI会自动调用对应的查询
//   "检查系统健康状态" → AI会执行 health_check 查询
