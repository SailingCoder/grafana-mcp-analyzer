/**
 * 基于Grafana Play演示实例的配置文件
 * 数据源：https://play.grafana.org (狗狗币OHLC数据)
 */
const config = {
  // Grafana服务器地址
  baseUrl: 'https://play.grafana.org',
  
  // 默认请求头
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*'
  },

  // 健康检查配置
  healthCheck: {
    url: 'api/health'
  },

  // 查询定义
  queries: {
    // 第一个查询 - 使用curl格式（面板2的狗狗币数据）
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
      systemPrompt: `您是狗狗币数据分析专家，专注于OHLC（开盘价、最高价、最低价、收盘价）数据分析。

**分析重点**：
1. 价格趋势和波动模式 - 识别主要趋势方向和变化周期
2. 支撑位和阻力位识别 - 找出关键价格水平
3. 交易机会分析 - 基于技术指标识别入场和出场时机
4. 风险评估和建议 - 评估当前市场风险和投资建议
5. 技术指标分析 - 结合多个技术指标进行综合分析

**输出要求**：
- 基于实际数据进行分析，提供具体数值解读
- 识别关键的价格水平和趋势变化
- 给出明确的交易建议和风险提示
- 提供可操作的投资策略

请提供专业的投资分析和建议。`
    },

    // 第二个查询 - 使用HTTP API格式（面板7的狗狗币数据）
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
      systemPrompt: `您是金融市场技术分析专家，专注于加密货币市场分析。

**分析重点**：
1. 市场趋势和动量分析 - 识别主要趋势方向和动量变化
2. 价格模式识别 - 识别头肩顶、双底、三角形等经典形态
3. 成交量与价格关系 - 分析成交量对价格走势的支撑
4. 市场情绪评估 - 基于技术指标评估市场情绪状态
5. 短期和长期投资策略建议 - 提供不同时间周期的投资建议

**输出要求**：
- 基于实际数据进行分析，提供具体数值解读
- 识别关键的价格模式和趋势变化
- 给出明确的交易建议和风险提示
- 提供可操作的投资策略

请提供详细的技术分析报告。`
    }
  }
};

module.exports = config; 