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

请提供详细的技术分析报告。`,
promptMode: 'custom',
    },
    'overall_cpu_utilization100': {
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
    // Price Only, Hollow Candles
    // 地址：https://play.grafana.org/d/candlestick/candlestick?orgId=1&from=2021-07-13T22:13:30.740Z&to=2021-07-13T22:46:18.921Z&timezone=utc&viewPanel=panel-7
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
      systemPrompt: `您是狗狗币K线图分析专家。

**分析重点**：
1. 价格趋势识别 - 识别主要趋势方向(上涨/下跌/横盘)
2. 关键价位分析 - 找出支撑位和阻力位
3. 交易机会评估 - 基于K线形态识别入场时机
4. 风险评估 - 提供风险提示和投资建议

**输出格式**：
## 图表概览
- 时间范围：[具体时间]
- 价格范围：[最高价-最低价] 
- 主要趋势：[上涨/下跌/横盘]

## 技术分析
- 支撑位：[价格水平]
- 阻力位：[价格水平]
- 关键行为：[重要价格行为]

## 交易建议
- 短期方向：[看涨/看跌/中性]
- 关键价位：[关注价位]
- 风险提示：[重要提醒]`
    },
    // Price & Volume
    // 地址：https://play.grafana.org/d/candlestick/candlestick?orgId=1&from=2021-07-13T22:13:30.740Z&to=2021-07-13T22:46:18.921Z&timezone=utc&viewPanel=panel-2
    candlestick_priceAndVolume: {
      curl: `curl 'https://play.grafana.org/api/ds/query?ds_type=grafana-testdata-datasource&requestId=SQR272' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: zh-CN,zh;q=0.9' \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/json' \
  -b '_ga=GA1.2.1909983567.1753671369; _gid=GA1.2.532774264.1753671369; rl_page_init_referrer=RudderEncrypt%3AU2FsdGVkX1%2B2lASJjXBqxv6%2FOpvlv5ClRT5vw%2BELHuE%3D; rl_page_init_referring_domain=RudderEncrypt%3AU2FsdGVkX19MSXh%2BQbiHW5f9mLAaP3ghy%2FcJZIk9zhI%3D; intercom-id-agpb1wfw=219eac14-cc23-4ca5-aa16-c299fab8c0ab; intercom-session-agpb1wfw=; intercom-device-id-agpb1wfw=fd9a6df6-d6c8-4b40-958b-568fc7f30ae2; rl_group_id=RudderEncrypt%3AU2FsdGVkX19m57CdomBdfwUWoColGlhhszvzmkblCF8%3D; rl_group_trait=RudderEncrypt%3AU2FsdGVkX1%2FCTkkz9fx%2BOcJnyGkflrC09ECYOn6datk%3D; rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX1%2B7SaLpDWGy6DCAopZv60taiGEpXHYqC1eEzYOSijiAVkEeG%2ForDCaXFgRog4mwRTg%2FcsPjuu4Aeg%3D%3D; rl_user_id=RudderEncrypt%3AU2FsdGVkX1%2BQzI9%2FEn3zndOPFPcd9wXbx5b11JgDuwgdoxxERSun4rFRWDPG%2BAdz; rl_trait=RudderEncrypt%3AU2FsdGVkX1%2FNyX9zbnpsHXYHYmFq4YcG%2BM1ADZfYkjRgfWS53zTZNNtLt0yE4L5e79VFmaVcx8YZkYsGGW%2FkP3uKTK2io%2BIALvxAHTcal3aJpTspNJ67MZUy%2Fb%2FE%2BobyKT69Xb5r8L1kybs8MiSHJA%3D%3D; _gat=1; _ga_Y0HRZEVBCW=GS2.2.s1753671369$o1$g1$t1753673283$j59$l0$h0; rl_session=RudderEncrypt%3AU2FsdGVkX1%2BPBVioHV7wivC7Wc9eQbgmbA2tMfUoV9OVeI%2B6eoFRjlsbPG7JuB9jjdERZ45G2ukbmD2gLb66HG6FBjyQnWxTLX2%2FfaAA0csSHvhX0DxOP9YLvN5Cs2N8tFXEGsbwMZkU7QYE5o7Kqw%3D%3D' \
  -H 'origin: https://play.grafana.org' \
  -H 'pragma: no-cache' \
  -H 'priority: u=1, i' \
  -H 'referer: https://play.grafana.org/d/candlestick/candlestick?orgId=1&from=2021-07-13T22:13:30.740Z&to=2021-07-13T22:46:18.921Z&timezone=utc&viewPanel=panel-2&inspect=panel-2&inspectTab=query' \
  -H 'sec-ch-ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'traceparent: 00-2525c09698c97f8a4aafcf5b9bd302d1-129b1e409c1f253a-01' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36' \
  -H 'x-dashboard-title: Candlestick' \
  -H 'x-dashboard-uid: candlestick' \
  -H 'x-datasource-uid: PD8C576611E62080A' \
  -H 'x-grafana-device-id: 49c7d4ecdeee88ab5dde64deffa8ea2e' \
  -H 'x-grafana-org-id: 1' \
  -H 'x-panel-id: 2' \
  -H 'x-panel-plugin-id: candlestick' \
  -H 'x-panel-title: Price & Volume' \
  -H 'x-plugin-id: grafana-testdata-datasource' \
  --data-raw '{"queries":[{"csvFileName":"ohlc_dogecoin.csv","refId":"A","scenarioId":"csv_file","datasource":{"type":"grafana-testdata-datasource","uid":"PD8C576611E62080A"},"datasourceId":454,"intervalMs":2000,"maxDataPoints":1180}],"from":"1626214410740","to":"1626216378921"}'`,
      systemPrompt: `你是一个擅长金融图表分析的智能助手，专注于对蜡烛图（K线图）及其附加技术指标进行解读与趋势分析。

**分析重点**：
- 蜡烛图（K线），展示每个时间段的价格变动；
- 成交量柱状图，反映市场活跃程度；
- 简单移动平均线（sma）；
- 布林带指标，包括上轨（bolup）、下轨（boldn）和中轨（sma）。

**你的任务是**：
1. 分析价格的短期走势（上涨、下跌或横盘）；
2. 解读布林带形态（开口/收口、突破/回落），判断市场波动强度与方向；
3. 判断当前市场情绪（偏多/偏空/震荡）；
4. 结合成交量变化，识别放量上涨、缩量调整、底部放量等关键信号；
5. 避免空泛表述，尽量给出基于图形特征的明确结论（如：价格跌破布林带下轨，可能出现超跌反弹）。

请提供详细的技术分析报告。`
    },
    // faro-shop-control-plane - Overall CPU Utilizatio」n
    // 地址：https://play.grafana.org/d/cNMLIAFK/cpu-utilization-details-cores?var-interval=$__auto&orgId=1&from=now-3h&to=now&timezone=browser&var-host=faro-shop-control-plane&var-cpu=$__all&viewPanel=panel-22
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
      systemPrompt: `您是系统性能分析专家，专注于CPU使用率历史趋势分析。

**数据特点**：这是总体CPU使用率的历史时间序列数据，包含：
- **user**: 用户模式CPU使用率
- **system**: 系统模式CPU使用率  
- **iowait**: I/O等待时间
- **softirq**: 软件中断
- **Max Core Utilization**: 单核最大使用率

**分析重点**：
1. **历史趋势分析** - 识别CPU使用率的变化趋势和模式
2. **性能瓶颈识别** - 分析哪个CPU模式占用最多资源
3. **峰值分析** - 识别CPU使用率的峰值时间和原因
4. **系统健康评估** - 基于历史数据评估系统整体健康状况
5. **容量规划建议** - 基于趋势预测未来资源需求

**输出要求**：
- 提供具体的时间范围和数据统计
- 识别关键的性能指标和异常模式
- 分析不同CPU模式的使用情况
- 给出基于历史数据的优化建议

请提供详细的CPU性能趋势分析报告。`
    },
    // faro-shop-control-plane - Current CPU Core Utilization
    // 地址：https://play.grafana.org/d/cNMLIAFK/cpu-utilization-details-cores?var-interval=$__auto&orgId=1&from=now-3h&to=now&timezone=browser&var-host=faro-shop-control-plane&var-cpu=$__all&viewPanel=panel-78
    current_cpu_core_utilization: {
      curl: `curl 'https://play.grafana.org/api/ds/query?ds_type=prometheus&requestId=SQR262' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: zh-CN,zh;q=0.9' \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/json' \
  -b '_ga=GA1.2.1909983567.1753671369; _gid=GA1.2.532774264.1753671369; rl_page_init_referrer=RudderEncrypt%3AU2FsdGVkX1%2B2lASJjXBqxv6%2FOpvlv5ClRT5vw%2BELHuE%3D; rl_page_init_referring_domain=RudderEncrypt%3AU2FsdGVkX19MSXh%2BQbiHW5f9mLAaP3ghy%2FcJZIk9zhI%3D; intercom-id-agpb1wfw=219eac14-cc23-4ca5-aa16-c299fab8c0ab; intercom-session-agpb1wfw=; intercom-device-id-agpb1wfw=fd9a6df6-d6c8-4b40-958b-568fc7f30ae2; rl_group_id=RudderEncrypt%3AU2FsdGVkX19m57CdomBdfwUWoColGlhhszvzmkblCF8%3D; rl_group_trait=RudderEncrypt%3AU2FsdGVkX1%2FCTkkz9fx%2BOcJnyGkflrC09ECYOn6datk%3D; rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX1%2B7SaLpDWGy6DCAopZv60taiGEpXHYqC1eEzYOSijiAVkEeG%2ForDCaXFgRog4mwRTg%2FcsPjuu4Aeg%3D%3D; rl_user_id=RudderEncrypt%3AU2FsdGVkX1%2BQzI9%2FEn3zndOPFPcd9wXbx5b11JgDuwgdoxxERSun4rFRWDPG%2BAdz; rl_trait=RudderEncrypt%3AU2FsdGVkX1%2FNyX9zbnpsHXYHYmFq4YcG%2BM1ADZfYkjRgfWS53zTZNNtLt0yE4L5e79VFmaVcx8YZkYsGGW%2FkP3uKTK2io%2BIALvxAHTcal3aJpTspNJ67MZUy%2Fb%2FE%2BobyKT69Xb5r8L1kybs8MiSHJA%3D%3D; _gat=1; _ga_Y0HRZEVBCW=GS2.2.s1753671369$o1$g1$t1753671953$j55$l0$h0; rl_session=RudderEncrypt%3AU2FsdGVkX1%2BVkxrLTrf5du2jv7iw4ZL%2FUlPDcIkCcfHhUETWYx38X3Br7wVxEplbmtKZXm5Bm5D2zXD6X%2B69xoCIpHWQnOvcTYaBA%2F%2BpEbT3Y2hfTG3B9pGh8qHKjwVokMDuSNNI4Pzg6%2B4iv0l0yQ%3D%3D' \
  -H 'origin: https://play.grafana.org' \
  -H 'pragma: no-cache' \
  -H 'priority: u=1, i' \
  -H 'referer: https://play.grafana.org/d/cNMLIAFK/cpu-utilization-details-cores?var-interval=$__auto&orgId=1&from=now-3h&to=now&timezone=browser&var-host=faro-shop-control-plane&var-cpu=$__all&viewPanel=panel-78&inspect=panel-78&inspectTab=query' \
  -H 'sec-ch-ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'traceparent: 00-c424210072abb208d0fa4b784448ca00-f7ad883ea7999306-01' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36' \
  -H 'x-dashboard-title: CPU Utilization Details (Cores)' \
  -H 'x-dashboard-uid: cNMLIAFK' \
  -H 'x-datasource-uid: grafanacloud-prom' \
  -H 'x-grafana-device-id: 49c7d4ecdeee88ab5dde64deffa8ea2e' \
  -H 'x-grafana-org-id: 1' \
  -H 'x-panel-id: 78' \
  -H 'x-panel-plugin-id: bargauge' \
  -H 'x-panel-title: $host - Current CPU Core Utilization' \
  -H 'x-plugin-id: prometheus' \
  --data-raw $'{"queries":[{"datasource":{"type":"prometheus","uid":"grafanacloud-prom"},"expr":"clamp_max(avg by () (sum by (cpu) ( (clamp_max(irate(node_cpu_seconds_total{instance=\\"faro-shop-control-plane\\",mode\u0021=\\"idle\\",mode\u0021=\\"iowait\\"}[5m]),1)) )),1)","format":"time_series","instant":true,"interval":"1m","intervalFactor":1,"legendFormat":"Avg","refId":"B","exemplar":false,"requestId":"78B","utcOffsetSec":28800,"scopes":[],"adhocFilters":[],"datasourceId":171,"intervalMs":60000,"maxDataPoints":1180},{"calculatedInterval":"2s","datasource":{"type":"prometheus","uid":"grafanacloud-prom"},"datasourceErrors":{},"errors":{},"expr":"clamp_max((sum by (cpu) ( (clamp_max(irate(node_cpu_seconds_total{instance=\\"faro-shop-control-plane\\",mode\u0021=\\"idle\\",mode\u0021=\\"iowait\\"}[5m]),1)) )),1)","format":"time_series","hide":false,"instant":true,"interval":"1m","intervalFactor":1,"legendFormat":" ","metric":"","refId":"A","step":300,"exemplar":false,"requestId":"78A","utcOffsetSec":28800,"scopes":[],"adhocFilters":[],"datasourceId":171,"intervalMs":60000,"maxDataPoints":1180}],"from":"1753660699751","to":"1753671499751"}'`,
      systemPrompt: `您是系统性能分析专家，专注于CPU核心使用率实时状态分析。

**数据特点**：这是当前CPU核心使用率的实时快照数据，包含：
- **Avg**: 平均CPU使用率 (0.763 = 76.3%)
- **当前值**: 实时CPU使用率 (0.753 = 75.3%)
- **最大值**: 峰值CPU使用率 (0.773 = 77.3%)

**分析重点**：
1. **实时状态评估** - 评估当前CPU使用率的健康状态
2. **性能瓶颈识别** - 分析CPU使用率是否达到瓶颈
3. **负载平衡分析** - 评估CPU负载的分布情况
4. **即时风险评估** - 基于当前数据评估系统风险
5. **应急响应建议** - 提供即时的优化和扩容建议

**输出要求**：
- 提供具体的当前CPU使用率数值
- 评估CPU使用率的健康状态
- 分析是否存在性能瓶颈
- 给出即时的优化建议

请提供当前CPU核心使用率的实时状态分析。`
    }
  }
};

module.exports = config; 