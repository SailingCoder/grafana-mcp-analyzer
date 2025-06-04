/**
 * 🚀 Grafana MCP 简化配置文件
 * 
 * 这是一个简单易用的配置文件，适合快速开始使用。
 * 只需要修改几个关键配置就能让AI助手分析你的Grafana数据！
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

  // 预定义查询 - 常用的监控查询
  queries: {
    // 通用数据分析查询 - 用于分析各种监控数据
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
      systemPrompt: '你是一个专业的数据分析专家。请对提供的监控数据进行深入分析，包括：1. 数据概览和基本统计 2. 趋势分析和模式识别 3. 异常值检测 4. 关键指标解读 5. 业务影响评估 6. 具体的优化建议和行动项。请用中文提供详细且实用的分析报告。'
    },
    
    // 前端性能监控（HTTP API方式）
    frontend_performance: {
      url: "api/ds/es/query",
      method: "POST",
      data: {},
      systemPrompt: '你是前端性能分析专家。请分析FCP（First Contentful Paint）性能数据，重点关注：1. 页面首次内容绘制时间趋势 2. 75百分位数性能表现 3. 是否存在性能劣化 4. 用户体验影响评估 5. 性能优化建议。请用中文详细分析性能数据并提供实用的优化建议。'
    },
    
    // CPU使用率监控（curl命令方式）
    cpu_usage: {
      curl: `curl 'api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"rate(cpu_usage[5m])","range":{"from":"now-1h","to":"now"}}]}'`,
      // AI分析提示 - 告诉AI如何分析这个数据
      systemPrompt: '你是一个CPU性能分析专家。请分析CPU使用率数据，识别性能问题并提供优化建议。重点关注：1. 使用率趋势 2. 峰值时间点 3. 是否存在性能瓶颈 4. 优化建议'
    },

    // 内存使用率监控（curl命令方式示例）
    memory_usage: {
      curl: `curl 'api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"B","expr":"(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100","range":{"from":"now-6h","to":"now"}}]}'`,
      systemPrompt: '你是一个内存分析专家。请分析内存使用情况，识别内存泄漏风险和优化机会。重点关注：1. 内存使用趋势 2. 是否接近内存上限 3. 内存泄漏风险 4. 优化建议'
    },

    // 系统健康检查 - 快速检查Grafana服务状态
    health_check: {
      url: 'api/health',
      method: 'GET',
      systemPrompt: '你是一个系统健康检查专家。请分析服务健康状态，识别潜在问题。如果服务正常，请确认；如果有问题，请提供排查建议。'
    }
  },

  // 健康检查配置，用于MCP工具的健康检查
  healthCheck: {
    url: 'api/health'
  }
};

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
