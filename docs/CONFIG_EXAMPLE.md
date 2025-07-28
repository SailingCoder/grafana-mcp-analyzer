### 业务场景配置

<details>
<summary>电商业务分析</summary>

**用户问题**："我的电商转化率怎么样？如何提升销售额？"

```javascript
// 电商转化率分析
ecommerce_conversion: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"rate(orders_total[5m]) / rate(page_views_total[5m]) * 100","range":{"from":"now-24h","to":"now"}}]}'`,
  systemPrompt: `您是电商业务分析专家。请分析转化率数据并回答以下关键问题：

**核心分析问题**：
1. 当前转化率是多少？与行业标准对比如何？
2. 转化率在一天中的高峰和低谷时段是什么时候？
3. 哪些因素可能影响转化率下降？
4. 具体建议如何提升转化率？预期能带来多少收益？

**输出格式**：
- 数据概览：当前转化率数值和趋势
- 问题诊断：识别转化率瓶颈
- 优化建议：3-5个可执行的改进方案
- 收益预测：预期提升效果和ROI

请用通俗易懂的语言，给出可操作的具体建议。`
}
```

</details>

<details>
<summary>金融风控分析</summary>
**用户问题**："我的交易系统有风险吗？如何预防欺诈？"

```javascript
// 交易风控分析
finance_risk_analysis: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"sum(rate(transaction_amount_total[5m]))","range":{"from":"now-7d","to":"now"}}]}'`,
  systemPrompt: `您是金融风控专家。请分析交易数据并回答以下关键问题：

**核心分析问题**：
1. 当前交易量是否异常？与历史对比如何？
2. 是否存在可疑的交易模式？
3. 哪些交易需要重点关注？
4. 如何优化风控策略？

**输出格式**：
- 风险等级：低/中/高风险
- 异常指标：具体异常数据点
- 风险分析：潜在风险原因
- 防护建议：具体风控措施
- 紧急行动：需要立即处理的事项

请用红色标记高风险，黄色标记中风险，绿色标记低风险。`
}
```
</details>

<details>
<summary>用户行为分析</summary>

**用户问题**："我的用户活跃度怎么样？如何提高用户留存？"

```javascript
// 用户活跃度分析
user_engagement: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"count(increase(user_sessions_total[1h]))","range":{"from":"now-30d","to":"now"}}]}'`,
  systemPrompt: `您是用户行为分析专家。请分析用户活跃度数据并回答以下关键问题：

**核心分析问题**：
1. 用户活跃度趋势如何？是否在增长？
2. 用户使用习惯有什么特点？
3. 哪些用户群体最活跃？
4. 如何提高用户留存率？

**输出格式**：
- 用户画像：活跃用户特征
- 趋势分析：活跃度变化趋势
- 目标用户：最有价值的用户群体
- 留存策略：提高用户粘性的方法
- 预期效果：实施建议后的预期改善

请结合用户生命周期，给出个性化的运营建议。`
}
```

</details>

### 系统监控配置

<details>
<summary>服务器性能监控</summary>

**用户问题**："我的服务器性能怎么样？需要扩容吗？"

```javascript
// 服务器性能分析
server_performance: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{
      "refId":"A",
      "expr":"node_cpu_seconds_total{mode=\"user\"} / node_cpu_seconds_total * 100",
      "range":{"from":"now-2h","to":"now"}
    }]}'`,
  systemPrompt: `您是系统性能专家。请分析服务器性能数据并回答以下关键问题：

**核心分析问题**：
1. CPU使用率是否正常？是否接近瓶颈？
2. 内存使用情况如何？是否存在泄漏？
3. 磁盘I/O是否成为瓶颈？
4. 是否需要扩容或优化？

**输出格式**：
- 性能评分：优秀/良好/一般/差
- 关键指标：CPU、内存、磁盘使用率
- 瓶颈分析：性能问题原因
- 优化建议：具体改进方案
- 告警建议：需要立即关注的问题

请用颜色标记不同严重程度：正常 注意 危险`
}
```
</details>

<details>
<summary>应用错误监控</summary>

**用户问题**："我的应用有错误吗？影响用户体验吗？"

```javascript
// 应用错误分析
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
  systemPrompt: `您是应用监控专家。请分析错误日志并回答以下关键问题：

**核心分析问题**：
1. 错误频率如何？是否在增加？
2. 哪些错误最严重？影响多少用户？
3. 错误集中在哪些功能模块？
4. 如何快速修复和预防？

**输出格式**：
- 错误等级：严重/中等/轻微
- 错误统计：错误数量、影响用户数
- 错误分类：按模块和类型分类
- 修复建议：具体修复步骤
- 预防措施：避免类似错误的方法

请按严重程度排序，优先处理影响用户最多的错误。`
}
```
</details>

### 聚合分析配置

<details>
<summary>全链路性能分析</summary>

**用户问题**："我的系统整体性能怎么样？哪里是瓶颈？"

```javascript
// 前端性能
frontend_performance: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"histogram_quantile(0.95, rate(page_load_time_seconds_bucket[5m]))","range":{"from":"now-1h","to":"now"}}]}'`,
  systemPrompt: '前端性能专家：分析页面加载时间，识别前端性能瓶颈。'
},

// 后端性能
backend_performance: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"histogram_quantile(0.95, rate(api_response_time_seconds_bucket[5m]))","range":{"from":"now-1h","to":"now"}}]}'`,
  systemPrompt: '后端性能专家：分析API响应时间，识别后端性能问题。'
},

// 数据库性能
database_performance: {
  curl: `curl 'api/ds/query' \\
    -X POST \\
    -H 'Content-Type: application/json' \\
    -d '{"queries":[{"refId":"A","expr":"rate(mysql_queries_total[5m])","range":{"from":"now-1h","to":"now"}}]}'`,
  systemPrompt: '数据库性能专家：分析数据库查询性能，识别数据库瓶颈。'
}
```

**使用方式**：
> 👤 您：聚合分析全链路性能：frontend_performance, backend_performance, database_performance
> 
> 🤖 AI：综合分析前端、后端、数据库性能，提供完整的性能优化建议
</details>