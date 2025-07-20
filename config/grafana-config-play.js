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
      systemPrompt: `您是系统性能分析专家，专注于CPU使用率数据分析。

**核心任务**：直接回答用户的问题："我的服务器现在怎么样？"

**必须回答的问题**：
当前CPU使用率是多少？（具体数值）

**输出格式**：
## 服务器状态概览
**直接结论**：服务器CPU使用率 [具体数值]%，状态 [正常/偏高/异常]

## 详细数据
- **当前使用率**：[数值]%
- **平均使用率**：[数值]%
- **峰值使用率**：[数值]%
- **主要使用模式**：[user/system/iowait等]

## 风险评估
[基于数据的具体风险分析]

## 行动建议
[具体的可执行建议]

**重要**：如果无法获取到实际数据，请明确说明"无法获取实际数据"，并解释可能的原因。不要基于假设进行分析！`
    },
  }
};

module.exports = config; 