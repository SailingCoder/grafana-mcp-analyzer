import { parseCurlCommand } from '../dist/datasources/curl-parser.js';

// 测试Grafana Play狗狗币K线图curl命令
const grafanaPlayCurl = `curl 'https://play.grafana.org/api/ds/query?ds_type=grafana-testdata-datasource&requestId=SQR102' \\
  -H 'accept: application/json, text/plain, */*' \\
  -H 'accept-language: zh-CN,zh;q=0.9' \\
  -H 'content-type: application/json' \\
  -b '_ga=GA1.2.497637465.1748604909; rl_page_init_referrer=RudderEncrypt%3AU2FsdGVkX18iNK6zoKxsJ6SxiPxhVFM0Jm9Ahie9ls8pyuBRlrRqQ0bSGJhcjAw3; rl_page_init_referring_domain=RudderEncrypt%3AU2FsdGVkX1%2FSZM2m%2FqBf1FRaAYA9n2ml0bPKujVsdVc%3D; _gid=GA1.2.2114306902.1748914650; intercom-id-agpb1wfw=cf1d2376-1221-4f87-a5cb-48e7723572ec; intercom-session-agpb1wfw=; intercom-device-id-agpb1wfw=d03dd4fa-d89f-4d25-9ea0-8fae23e81fd4; rl_group_id=RudderEncrypt%3AU2FsdGVkX19jG87Cy%2FxE5i%2B4gHhd13RtlKqwCGp40so%3D; rl_group_trait=RudderEncrypt%3AU2FsdGVkX1%2F5qWJAlsBrwyA3JrKrZh%2Bwm%2FZ0%2FsXyiak%3D; rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX1%2BqgSFUdo14W%2BUZbKSxK2fDbXel%2Fv0HEkpOiyUcHH8DifAasKD8GtiAUJo4v1Y0ghCQeHZGPkiLfg%3D%3D; rl_user_id=RudderEncrypt%3AU2FsdGVkX1%2B2bIdhy62zlUFnQnWxOp%2F0aY3uhhXBQOoWG%2BjzLp9lkGO%2B2T7SFkHm; rl_trait=RudderEncrypt%3AU2FsdGVkX1%2FFyErS%2BWpvs5HGY%2BdQ3n%2Buult4GA8htZt%2B%2BHZyHTEBmP%2B1ObeQYEPsVmshXzprUDG4SGvGzMsF1O8XGLcfZbOtfWN0q7Pm%2FYynJJj3wu%2F%2FEDYAMnfPl%2BO0QCf1NNXgTEtgwG5nkQ%2Brfw%3D%3D; _ga_Y0HRZEVBCW=GS2.2.s1748931036$o5$g1$t1748931037$j59$l0$h0; rl_session=RudderEncrypt%3AU2FsdGVkX1%2BlWr5cuIPlMKUkB3yDupMvMs%2BK6UlQfUPwI%2B5e9d%2BBpW9x4dx%2FJg2ffQ4CufTTsyJ2ghAZA5h7qKDfIBCz0jhCbgQsNqPgpezY1vmx6Dy7eHHKpXmfZ1pmTqEpOeip1Xn5ohX%2Bhklocg%3D%3D' \\
  -H 'origin: https://play.grafana.org' \\
  -H 'priority: u=1, i' \\
  -H 'referer: https://play.grafana.org/d/candlesticksss/candlestick2?orgId=1&from=2021-07-13T22:13:30.740Z&to=2021-07-13T22:46:18.921Z&timezone=utc&inspectTab=query&inspect=2&editPanel=2' \\
  -H 'sec-ch-ua: "Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"' \\
  -H 'sec-ch-ua-mobile: ?0' \\
  -H 'sec-ch-ua-platform: "macOS"' \\
  -H 'sec-fetch-dest: empty' \\
  -H 'sec-fetch-mode: cors' \\
  -H 'sec-fetch-site: same-origin' \\
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36' \\
  -H 'x-dashboard-uid: candlesticksss' \\
  -H 'x-datasource-uid: 9cY0WtPMz' \\
  -H 'x-grafana-device-id: d847192f5c65cc7b2dc81a91df771565' \\
  -H 'x-grafana-org-id: 1' \\
  -H 'x-panel-id: 2' \\
  -H 'x-panel-plugin-id: candlestick' \\
  -H 'x-plugin-id: grafana-testdata-datasource' \\
  --data-raw '{"queries":[{"csvFileName":"ohlc_dogecoin.csv","datasource":{"type":"grafana-testdata-datasource","uid":"9cY0WtPMz"},"refId":"A","scenarioId":"csv_file","datasourceId":153,"intervalMs":1000,"maxDataPoints":1558}],"from":"1626214410740","to":"1626216378921"}'`;

console.log('测试Grafana Play狗狗币K线图curl命令:');
console.log('curl命令长度:', grafanaPlayCurl.length);

const result = parseCurlCommand(grafanaPlayCurl);
console.log('\n解析结果:');
console.log('URL:', result.url);
console.log('方法:', result.method);
console.log('Content-Type:', result.headers['content-type']);

// 显示请求数据
if (result.data) {
  console.log('\n请求数据:');
  console.log('数据类型:', typeof result.data);
  console.log('数据内容:', result.data);
  
  // 如果data是字符串，尝试解析JSON；如果已经是对象，直接使用
  let queryData;
  if (typeof result.data === 'string') {
    try {
      queryData = JSON.parse(result.data);
    } catch (e) {
      console.log('JSON解析失败:', e.message);
      console.log('原始数据:', result.data);
      queryData = null;
    }
  } else {
    queryData = result.data;
  }
  
  if (queryData && queryData.queries && queryData.queries[0]) {
    console.log('查询类型:', queryData.queries[0].scenarioId);
    console.log('CSV文件:', queryData.queries[0].csvFileName);
    console.log('数据源类型:', queryData.queries[0].datasource.type);
    console.log('数据源UID:', queryData.queries[0].datasource.uid);
    console.log('时间范围:', {
      from: new Date(parseInt(queryData.from)).toISOString(),
      to: new Date(parseInt(queryData.to)).toISOString()
    });
    console.log('最大数据点:', queryData.queries[0].maxDataPoints);
    console.log('间隔毫秒:', queryData.queries[0].intervalMs);
  }
}

// 显示Grafana特定头信息
console.log('\nGrafana特定头信息:');
console.log('仪表板UID:', result.headers['x-dashboard-uid']);
console.log('数据源UID:', result.headers['x-datasource-uid']);
console.log('面板ID:', result.headers['x-panel-id']);
console.log('面板插件ID:', result.headers['x-panel-plugin-id']);
console.log('插件ID:', result.headers['x-plugin-id']);
console.log('组织ID:', result.headers['x-grafana-org-id']);
console.log('设备ID:', result.headers['x-grafana-device-id']);

// 显示Cookie信息
if (result.headers['cookie']) {
  console.log('\nCookie存在:', result.headers['cookie'].length > 0);
  console.log('Cookie长度:', result.headers['cookie'].length);
  
  // 解析主要的Google Analytics cookies
  const cookies = result.headers['cookie'];
  const gaMatch = cookies.match(/_ga=([^;]+)/);
  const gidMatch = cookies.match(/_gid=([^;]+)/);
  
  if (gaMatch) console.log('Google Analytics ID:', gaMatch[1]);
  if (gidMatch) console.log('Google Analytics GID:', gidMatch[1]);
}

console.log('\n✅ curl解析成功！这是一个Grafana Play的狗狗币K线图数据查询请求。'); 