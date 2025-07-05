/**
 * 🚀 Grafana MCP 场景示例配置文件
 * 
 * 这个配置文件提供了各种Grafana数据分析场景的示例，涵盖：
 * 📊 业务指标分析、👥 用户行为分析、⚡ 性能监控、📝 日志分析、
 * 🌐 IoT数据分析、💰 财务数据分析、🔧 系统监控、🚀 应用监控
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

  // 预定义查询 - 涵盖各种Grafana使用场景
  queries: {
    // ========== 📊 业务指标分析场景 ==========
    
    // 电商业务 - 销售转化率
    ecommerce_conversion: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"rate(orders_total[5m]) / rate(page_views_total[5m]) * 100","range":{"from":"now-24h","to":"now"}}]}'`,
      systemPrompt: '您是电商业务分析专家，专注于转化率优化和用户购买行为分析。请分析销售转化率数据，重点关注：1. 转化率趋势变化和关键拐点 2. 高峰和低谷时段识别 3. 用户购买行为模式 4. 影响转化的关键因素 5. 转化率优化建议和A/B测试方案 6. 预期收益评估。请提供具体的业务改进建议。'
    },
    
    // 金融业务 - 交易量分析
    finance_transactions: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"sum(rate(transaction_amount_total[5m]))","range":{"from":"now-7d","to":"now"}}]}'`,
      systemPrompt: '您是金融数据分析专家，专长于交易风险控制和业务增长分析。请分析交易量数据，重点关注：1. 交易量趋势和周期性模式 2. 异常交易模式识别 3. 风险信号检测 4. 业务增长机会 5. 风控策略优化建议 6. 合规性评估。请提供风险控制和业务增长的平衡建议。'
    },

    // ========== 👥 用户行为分析场景 ==========
    
    // 用户活跃度分析
    user_activity: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"count(increase(user_sessions_total[1h]))","range":{"from":"now-30d","to":"now"}}]}'`,
      systemPrompt: '您是用户行为分析专家，专注于用户留存和参与度优化。请分析用户活跃度数据，重点关注：1. 用户活跃度趋势和留存率 2. 用户行为模式和偏好 3. 用户生命周期分析 4. 流失风险用户识别 5. 用户参与度提升策略 6. 个性化推荐建议。请提供用户体验优化和留存率提升方案。'
    },

    // 内容消费分析
    content_engagement: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"rate(content_views_total[5m])","range":{"from":"now-7d","to":"now"}}]}'`,
      systemPrompt: '您是内容运营分析专家，专注于内容策略和用户参与度优化。请分析内容消费数据，重点关注：1. 内容消费趋势和热点识别 2. 用户内容偏好分析 3. 内容质量评估 4. 内容推荐优化 5. 创作者生态健康度 6. 内容策略建议。请提供内容运营和用户参与度提升策略。'
    },

    // ========== ⚡ 性能监控场景 ==========
    
    // 前端性能监控
    frontend_performance: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"histogram_quantile(0.95, rate(page_load_time_seconds_bucket[5m]))","range":{"from":"now-6h","to":"now"}}]}'`,
      systemPrompt: '您是前端性能优化专家，专注于用户体验和页面性能提升。请分析前端性能数据，重点关注：1. 页面加载时间趋势和P95性能 2. 关键性能指标(LCP、FID、CLS)分析 3. 性能瓶颈识别和影响评估 4. 用户体验影响分析 5. 性能优化建议和实施方案 6. 监控告警策略。请提供具体的性能优化技术方案。'
    },

    // 数据库性能监控
    database_performance: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"rate(mysql_slow_queries_total[5m])","range":{"from":"now-2h","to":"now"}}]}'`,
      systemPrompt: '您是数据库性能调优专家，专注于数据库性能优化和稳定性保障。请分析数据库性能数据，重点关注：1. 慢查询趋势和性能瓶颈 2. 数据库连接池和资源利用率 3. 查询优化机会识别 4. 索引优化建议 5. 数据库架构优化方案 6. 性能告警策略。请提供数据库优化和扩展方案。'
    },

    // ========== 📝 日志分析场景 ==========
    
    // 应用日志分析
    application_logs: {
      url: "api/ds/es/query",
      method: "POST",
      data: {
        "queries": [
          {
            "refId": "A",
            "query": "level:ERROR",
            "timeField": "@timestamp",
            "size": 500
          }
        ]
      },
      systemPrompt: '您是应用日志分析专家，专注于故障排查和系统稳定性分析。请分析应用日志数据，重点关注：1. 错误模式和异常趋势识别 2. 故障根因分析和影响评估 3. 系统稳定性评估 4. 性能瓶颈定位 5. 预警和监控策略 6. 系统改进建议。请提供故障排查和系统稳定性提升方案。'
    },

    // 安全日志分析
    security_logs: {
      url: "api/ds/es/query",
      method: "POST",
      data: {
        "queries": [
          {
            "refId": "A",
            "query": "tags:security AND level:WARN",
            "timeField": "@timestamp",
            "size": 200
          }
        ]
      },
      systemPrompt: '您是网络安全分析专家，专注于安全威胁检测和风险评估。请分析安全日志数据，重点关注：1. 异常访问模式和潜在威胁识别 2. 安全事件趋势和攻击模式 3. 风险等级评估和紧急响应建议 4. 安全策略优化建议 5. 合规性检查和审计建议 6. 安全监控和告警策略。请提供安全加固和风险缓解方案。'
    },

    // ========== 🌐 IoT数据分析场景 ==========
    
    // IoT设备监控
    iot_devices: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"avg(temperature_celsius)","range":{"from":"now-24h","to":"now"}}]}'`,
      systemPrompt: '您是IoT数据分析专家，专注于设备监控和智能运维。请分析IoT设备数据，重点关注：1. 设备健康状态和性能趋势 2. 异常设备和故障预警 3. 设备使用模式和优化机会 4. 能耗分析和节能建议 5. 设备生命周期管理 6. 预测性维护策略。请提供设备优化和智能运维方案。'
    },

    // 传感器数据分析
    sensor_data: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"rate(sensor_readings_total[10m])","range":{"from":"now-12h","to":"now"}}]}'`,
      systemPrompt: '您是传感器数据分析专家，专注于环境监控和数据质量分析。请分析传感器数据，重点关注：1. 数据质量和传感器可靠性评估 2. 环境参数变化趋势和异常检测 3. 传感器校准和维护建议 4. 数据采集优化策略 5. 预警阈值设置建议 6. 传感器网络优化方案。请提供传感器监控和数据质量提升建议。'
    },

    // ========== 💰 财务数据分析场景 ==========
    
    // 收入分析
    revenue_analysis: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"sum(increase(revenue_total[1d]))","range":{"from":"now-90d","to":"now"}}]}'`,
      systemPrompt: '您是财务数据分析专家，专注于收入增长和盈利能力分析。请分析收入数据，重点关注：1. 收入趋势和增长模式分析 2. 收入来源结构和贡献度 3. 季节性和周期性因素影响 4. 收入预测和目标达成分析 5. 盈利能力和成本效益评估 6. 收入增长策略建议。请提供收入优化和增长策略方案。'
    },

    // 成本分析
    cost_analysis: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"sum(rate(operational_costs_total[1h]))","range":{"from":"now-30d","to":"now"}}]}'`,
      systemPrompt: '您是成本控制分析专家，专注于成本优化和效率提升。请分析成本数据，重点关注：1. 成本结构和主要成本项分析 2. 成本趋势和异常支出识别 3. 成本效益分析和优化机会 4. 预算执行情况和偏差分析 5. 成本控制策略和节约方案 6. ROI评估和投资建议。请提供成本优化和效率提升方案。'
    },

    // ========== 🔧 系统监控场景 ==========
    
    // CPU使用率监控
    cpu_usage: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)","range":{"from":"now-6h","to":"now"}}]}'`,
      systemPrompt: '您是系统性能监控专家，专注于服务器性能优化和容量规划。请分析CPU使用率数据，重点关注：1. CPU使用率趋势和负载模式 2. 性能瓶颈和资源争用识别 3. 系统容量评估和扩展建议 4. 性能优化和调优建议 5. 监控告警阈值设置 6. 自动化运维策略。请提供系统性能优化和容量规划方案。'
    },

    // 内存使用率监控
    memory_usage: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100","range":{"from":"now-6h","to":"now"}}]}'`,
      systemPrompt: '您是内存管理专家，专注于内存优化和泄漏检测。请分析内存使用率数据，重点关注：1. 内存使用趋势和峰值分析 2. 内存泄漏风险识别 3. 内存分配模式和优化机会 4. 内存容量规划和扩展建议 5. 垃圾回收优化策略 6. 内存监控和告警设置。请提供内存优化和管理建议。'
    },

    // ========== 🚀 应用监控场景 ==========
    
    // API响应时间监控
    api_response_time: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))","range":{"from":"now-4h","to":"now"}}]}'`,
      systemPrompt: '您是API性能优化专家，专注于接口性能和用户体验提升。请分析API响应时间数据，重点关注：1. 响应时间趋势和P95性能 2. 慢接口识别和瓶颈分析 3. 性能劣化检测和根因分析 4. 用户体验影响评估 5. 接口优化和架构改进建议 6. SLA监控和告警策略。请提供API性能优化和用户体验提升方案。'
    },

    // 应用错误率监控
    application_errors: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100","range":{"from":"now-2h","to":"now"}}]}'`,
      systemPrompt: '您是应用稳定性专家，专注于错误率控制和服务可靠性提升。请分析应用错误率数据，重点关注：1. 错误率趋势和异常模式识别 2. 错误类型分析和影响评估 3. 服务稳定性和可用性评估 4. 故障恢复时间和影响范围 5. 错误率降低策略和改进建议 6. 监控告警和故障响应优化。请提供应用稳定性和可靠性提升方案。'
    },

    // ========== 聚合分析测试配置 ==========
    
    // 业务综合分析 - 用户转化漏斗
    user_funnel_views: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"rate(page_views_total[5m])","range":{"from":"now-24h","to":"now"}}]}'`,
      systemPrompt: '您是转化漏斗分析专家。请分析页面浏览量数据，重点关注访问流量趋势、用户获取效果、流量来源分析。'
    },
    
    user_funnel_signups: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"rate(user_signups_total[5m])","range":{"from":"now-24h","to":"now"}}]}'`,
      systemPrompt: '您是用户注册分析专家。请分析用户注册数据，重点关注注册转化率、注册流程优化、用户获取成本分析。'
    },
    
    user_funnel_purchases: {
      curl: `curl 'https://your-grafana-api.com/api/ds/query' \\
        -X POST \\
        -H 'Content-Type: application/json' \\
        -d '{"queries":[{"refId":"A","expr":"rate(purchases_total[5m])","range":{"from":"now-24h","to":"now"}}]}'`,
      systemPrompt: '您是购买转化分析专家。请分析购买数据，重点关注购买转化率、客单价分析、购买行为模式。'
    }
  },

  // 健康检查配置
  healthCheck: {
    url: 'api/health'
  }
};

module.exports = config; 

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