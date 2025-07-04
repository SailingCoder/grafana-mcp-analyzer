/**
 * 🚀 Grafana MCP 简化配置文件
 * 
 * 这是一个简单易用的配置文件，适合快速开始使用。
 * 只需要修改几个关键配置就能让AI助手分析你的Grafana数据！
 * 
 * ✨ v2.0.0 功能说明：
 * - systemPrompt: 为每个查询配置专业的AI分析指引
 * - 支持9个强大的MCP工具，包括聚合分析、批量分析等
 * - 智能数据处理：小数据直接分析，大数据自动存储
 * - 灵活的分析体验：通过对话prompt + systemPrompt双重指引
 */
const config = {
  // Grafana服务器地址
  baseUrl: 'https://your-grafana-api.com',
  
  // 默认请求头 - 用于认证和设置内容类型
  defaultHeaders: {
    'Authorization': `Bearer your-grafana-api-token`,  // API令牌认证
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
      systemPrompt: '您是一个专业的数据分析专家。请对提供的监控数据进行深入分析，包括：1. 数据概览和基本统计 2. 趋势分析和模式识别 3. 异常值检测 4. 关键指标解读 5. 业务影响评估 6. 具体的优化建议和行动项。请用中文提供详细且实用的分析报告。'
    },
    
    // 前端性能监控（HTTP API方式）
    frontend_performance: {
      url: "https://your-grafana-api.com/api/ds/es/query",
      method: "POST",
      data: {},
      systemPrompt: '您是前端性能分析专家。请分析FCP（First Contentful Paint）性能数据，重点关注：1. 页面首次内容绘制时间趋势 2. 75百分位数性能表现 3. 是否存在性能劣化 4. 用户体验影响评估 5. 性能优化建议。请用中文详细分析性能数据并提供实用的优化建议。'
    },
    
    // CPU使用率监控（curl命令方式）
    cpu_usage: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"rate(cpu_usage[5m])","range":{"from":"now-1h","to":"now"}}]}'`,
      // AI分析提示 - 告诉AI如何分析这个数据
      systemPrompt: '您是一个CPU性能分析专家。请分析CPU使用率数据，识别性能问题并提供优化建议。重点关注：1. 使用率趋势 2. 峰值时间点 3. 是否存在性能瓶颈 4. 优化建议'
    },

    // 内存使用率监控（curl命令方式示例）
    memory_usage: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"B","expr":"(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100","range":{"from":"now-6h","to":"now"}}]}'`,
      systemPrompt: '您是一个内存分析专家。请分析内存使用情况，识别内存泄漏风险和优化机会。重点关注：1. 内存使用趋势 2. 是否接近内存上限 3. 内存泄漏风险 4. 优化建议'
    },

    // 系统健康检查 - 快速检查Grafana服务状态
    health_check: {
      url: 'api/health',
      method: 'GET',
      systemPrompt: '您是一个系统健康检查专家。请分析服务健康状态，识别潜在问题。如果服务正常，请确认；如果有问题，请提供排查建议。'
    },

    // ========== 聚合分析测试配置 (aggregate_analyze) ==========
    // 用于测试聚合分析功能：AI会同时查询多个指标并进行综合关联分析
    
    // 系统概览 - CPU使用率
    system_cpu: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"rate(cpu_usage[5m])","range":{"from":"now-1h","to":"now"}}]}'`,
      systemPrompt: '您是CPU使用率分析专家。请分析CPU使用率数据，重点关注：1. 使用率趋势变化 2. 峰值时间点识别 3. 性能瓶颈检测 4. 系统负载评估 5. 优化建议。'
    },
    
    // 系统概览 - 内存使用率
    system_memory: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100","range":{"from":"now-1h","to":"now"}}]}'`,
      systemPrompt: '您是内存使用率分析专家。请分析内存使用情况，重点关注：1. 内存使用趋势 2. 是否接近内存上限 3. 内存泄漏风险评估 4. 内存优化建议。'
    },
    
    // 系统概览 - 磁盘IO
    system_disk_io: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"rate(node_disk_io_time_seconds_total[5m])","range":{"from":"now-1h","to":"now"}}]}'`,
      systemPrompt: '您是磁盘IO性能分析专家。请分析磁盘IO性能，重点关注：1. IO等待时间趋势 2. 磁盘性能瓶颈 3. 读写模式分析 4. 存储优化建议。'
    },

    // ========== 批量分析测试配置 (batch_analyze) ==========
    // 用于测试批量分析功能：AI会分别查询每个指标并提供独立的专业分析
    
    // 应用监控 - 响应时间
    app_response_time: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))","range":{"from":"now-1h","to":"now"}}]}'`,
      systemPrompt: '您是响应时间分析专家。请分析API响应时间数据，重点关注：1. P95响应时间趋势 2. 慢请求识别 3. 性能瓶颈定位 4. 用户体验影响评估 5. 性能优化建议。'
    },
    
    // 应用监控 - 错误率
    app_error_rate: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"rate(http_requests_total{status=~\"5..\"}[5m])","range":{"from":"now-1h","to":"now"}}]}'`,
      systemPrompt: '您是错误率分析专家。请分析应用错误率数据，重点关注：1. 错误率趋势变化 2. 异常模式识别 3. 服务稳定性评估 4. 错误类型分析 5. 故障排查建议。'
    },
    
    // 应用监控 - 请求量
    app_request_volume: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"rate(http_requests_total[5m])","range":{"from":"now-1h","to":"now"}}]}'`,
      systemPrompt: '您是请求量分析专家。请分析应用请求量数据，重点关注：1. 流量趋势变化 2. 峰值时间识别 3. 容量规划建议 4. 负载均衡效果 5. 扩容建议。'
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
//           "CONFIG_PATH": "./grafana-config.simple.js"
//         }
//       }
//     }
//   }
// 
// 第4步：开始使用
//   重启Cursor后，直接问AI：
//   "帮我分析CPU使用率" → AI会自动调用对应的查询
//   "检查系统健康状态" → AI会执行 health_check 查询