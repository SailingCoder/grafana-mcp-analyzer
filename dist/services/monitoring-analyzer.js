import axios from 'axios';
const DEFAULT_TIMEOUT = 30000;
const MAX_DATA_LENGTH = 2000;
const DEFAULT_SYSTEM_PROMPT = `你是专业的Grafana监控数据分析专家。请基于提供的监控数据进行分析，给出专业洞察和建议。

数据格式说明：
- hasData: 是否有有效数据
- type: 数据类型
- data: 实际响应数据
- status: HTTP状态码
- timestamp: 数据时间戳

请提供：
1. 数据概览和趋势分析
2. 异常检测和告警建议  
3. 性能优化建议
4. 具体行动项`;
/**
 * 使用AI服务分析监控数据
 */
export async function analyzeWithAI(prompt, extractedData, globalConfig, queryConfig) {
    try {
        // 如果没有配置AI服务，返回null
        const aiServiceConfig = queryConfig?.aiService || globalConfig?.aiService;
        if (!aiServiceConfig?.url) {
            return null;
        }
        // 构建请求体
        const requestBody = {
            prompt,
            data: extractedData.data,
            metadata: {
                type: extractedData.type,
                hasData: extractedData.hasData,
                timestamp: extractedData.timestamp
            },
            system: queryConfig?.systemPrompt || globalConfig?.aiService?.systemPrompt || undefined
        };
        // 发送请求到AI服务
        const response = await axios({
            method: 'POST',
            url: aiServiceConfig.url,
            headers: {
                'Content-Type': 'application/json',
                ...(aiServiceConfig.apiKey && { 'Authorization': `Bearer ${aiServiceConfig.apiKey}` }),
                ...aiServiceConfig.headers
            },
            data: requestBody,
            timeout: aiServiceConfig.timeout || 30000
        });
        // 返回AI分析结果
        return response.data?.analysis || response.data?.content || response.data?.result || response.data;
    }
    catch (error) {
        console.error('AI分析失败:', error);
        return null;
    }
}
/**
 * 格式化数据供客户端AI使用
 */
export function formatDataForClientAI(prompt, extractedData) {
    try {
        // 数据摘要
        const summary = {
            type: extractedData.type,
            hasData: extractedData.hasData,
            timestamp: extractedData.timestamp
        };
        // 根据数据类型格式化
        let formattedData = '';
        if (extractedData.type === 'timeseries') {
            formattedData = formatTimeseriesData(extractedData.data);
        }
        else if (extractedData.type === 'tables') {
            formattedData = formatTableData(extractedData.data);
        }
        else if (extractedData.type === 'elasticsearch') {
            formattedData = formatElasticsearchData(extractedData.data);
        }
        else {
            // 限制数据大小，避免超出上下文窗口
            const dataStr = JSON.stringify(extractedData.data, null, 2);
            formattedData = dataStr.length > 5000
                ? dataStr.substring(0, 5000) + '...(数据已截断)'
                : dataStr;
        }
        return `
## 监控数据分析上下文

### 查询信息
- 数据类型: ${summary.type}
- 时间戳: ${summary.timestamp}
- 是否有数据: ${summary.hasData ? '是' : '否'}

### 用户问题
${prompt}

### 数据
\`\`\`json
${formattedData}
\`\`\`

请基于以上数据回答用户问题。如果数据不足以回答问题，请说明原因。
`;
    }
    catch (error) {
        console.error('格式化数据失败:', error);
        return `无法格式化数据: ${error instanceof Error ? error.message : String(error)}`;
    }
}
/**
 * 格式化时间序列数据
 */
function formatTimeseriesData(data) {
    if (!data?.series || !Array.isArray(data.series)) {
        return JSON.stringify(data, null, 2);
    }
    let result = '';
    for (let i = 0; i < Math.min(data.series.length, 3); i++) {
        const series = data.series[i];
        result += `Series ${i + 1}: ${series.name || 'unnamed'}\n`;
        if (series.fields && Array.isArray(series.fields)) {
            // 获取字段名
            const fieldNames = series.fields.map((f) => f.name || 'unnamed');
            result += `Fields: ${fieldNames.join(', ')}\n`;
            // 获取数据点数量
            const dataLength = series.fields[0]?.values?.length || 0;
            result += `Data points: ${dataLength}\n`;
            // 显示前几个数据点作为示例
            if (dataLength > 0) {
                result += 'Sample data:\n';
                for (let j = 0; j < Math.min(dataLength, 5); j++) {
                    const row = fieldNames.map((_, idx) => series.fields[idx]?.values?.[j]).join(', ');
                    result += `  ${row}\n`;
                }
            }
        }
        result += '\n';
    }
    if (data.series.length > 3) {
        result += `... and ${data.series.length - 3} more series\n`;
    }
    return result;
}
/**
 * 格式化表格数据
 */
function formatTableData(data) {
    if (!data?.tables || !Array.isArray(data.tables)) {
        return JSON.stringify(data, null, 2);
    }
    let result = '';
    for (let i = 0; i < Math.min(data.tables.length, 3); i++) {
        const table = data.tables[i];
        result += `Table ${i + 1}:\n`;
        if (table.columns && Array.isArray(table.columns)) {
            // 获取列名
            const columnNames = table.columns.map((c) => c.text || 'unnamed');
            result += `Columns: ${columnNames.join(', ')}\n`;
            // 获取行数
            const rowCount = table.rows?.length || 0;
            result += `Rows: ${rowCount}\n`;
            // 显示前几行作为示例
            if (rowCount > 0) {
                result += 'Sample rows:\n';
                for (let j = 0; j < Math.min(rowCount, 5); j++) {
                    result += `  ${JSON.stringify(table.rows[j])}\n`;
                }
            }
        }
        result += '\n';
    }
    if (data.tables.length > 3) {
        result += `... and ${data.tables.length - 3} more tables\n`;
    }
    return result;
}
/**
 * 格式化Elasticsearch数据
 */
function formatElasticsearchData(data) {
    if (!data?.responses || !Array.isArray(data.responses)) {
        return JSON.stringify(data, null, 2);
    }
    let result = '';
    for (let i = 0; i < Math.min(data.responses.length, 3); i++) {
        const response = data.responses[i];
        result += `Response ${i + 1}:\n`;
        // 基本信息
        result += `Took: ${response.took}ms\n`;
        result += `Timed out: ${response.timed_out}\n`;
        // 命中数
        if (response.hits) {
            const totalHits = typeof response.hits.total === 'object'
                ? response.hits.total.value
                : response.hits.total;
            result += `Total hits: ${totalHits}\n`;
            // 显示前几个命中作为示例
            if (response.hits.hits && Array.isArray(response.hits.hits)) {
                const hitsCount = response.hits.hits.length;
                result += `Returned hits: ${hitsCount}\n`;
                if (hitsCount > 0) {
                    result += 'Sample hits:\n';
                    for (let j = 0; j < Math.min(hitsCount, 3); j++) {
                        const hit = response.hits.hits[j];
                        result += `  ID: ${hit._id}, Score: ${hit._score}\n`;
                        result += `  Source: ${JSON.stringify(hit._source).substring(0, 100)}...\n`;
                    }
                }
            }
        }
        // 聚合
        if (response.aggregations) {
            const aggKeys = Object.keys(response.aggregations);
            result += `Aggregations: ${aggKeys.join(', ')}\n`;
            // 显示前几个聚合作为示例
            for (let j = 0; j < Math.min(aggKeys.length, 3); j++) {
                const aggKey = aggKeys[j];
                const agg = response.aggregations[aggKey];
                result += `  ${aggKey}: ${JSON.stringify(agg).substring(0, 100)}...\n`;
            }
        }
        result += '\n';
    }
    if (data.responses.length > 3) {
        result += `... and ${data.responses.length - 3} more responses\n`;
    }
    return result;
}
/**
 * 智能处理监控数据，生成数据摘要
 */
function processSmartDataSummary(data) {
    // 检测数据类型
    if (Array.isArray(data)) {
        return processArrayData(data);
    }
    else if (isGrafanaQueryResponse(data)) {
        return processGrafanaQueryResponse(data);
    }
    else if (isTimeSeriesData(data)) {
        return processTimeSeriesData(data);
    }
    else {
        // 通用对象处理
        return processGenericObject(data);
    }
}
/**
 * 处理数组类型数据
 */
function processArrayData(data) {
    if (data.length === 0)
        return '空数组';
    if (data.length > 100) {
        // 大型数组，提供摘要
        return `数组包含 ${data.length} 个元素。样本数据:\n${JSON.stringify(data.slice(0, 5), null, 2)}\n\n统计摘要:\n${generateArrayStats(data)}`;
    }
    else {
        // 小型数组，可以全部展示
        return JSON.stringify(data, null, 2);
    }
}
/**
 * 生成数组统计信息
 */
function generateArrayStats(data) {
    try {
        // 尝试提取数值型数据进行统计
        const numericValues = data
            .map(item => {
            if (typeof item === 'number')
                return item;
            if (typeof item === 'object' && item !== null) {
                // 尝试从对象中提取数值
                const values = Object.values(item).filter(v => typeof v === 'number');
                return values.length > 0 ? values[0] : null;
            }
            return null;
        })
            .filter(item => item !== null);
        if (numericValues.length > 0) {
            const sum = numericValues.reduce((a, b) => a + b, 0);
            const avg = sum / numericValues.length;
            const min = Math.min(...numericValues);
            const max = Math.max(...numericValues);
            return `数值统计: 最小值=${min.toFixed(2)}, 最大值=${max.toFixed(2)}, 平均值=${avg.toFixed(2)}, 样本数=${numericValues.length}`;
        }
        return `数组长度: ${data.length}`;
    }
    catch (error) {
        return `数组长度: ${data.length}`;
    }
}
/**
 * 检测是否为Grafana查询响应
 */
function isGrafanaQueryResponse(data) {
    return data &&
        (data.results || data.data || data.series || data.frames ||
            (data.response && data.response.results));
}
/**
 * 处理Grafana查询响应
 */
function processGrafanaQueryResponse(data) {
    let summary = '## Grafana查询结果摘要\n\n';
    // 处理results对象
    if (data.results) {
        const resultKeys = Object.keys(data.results);
        summary += `查询ID: ${resultKeys.join(', ')}\n\n`;
        // 分析每个查询结果
        for (const key of resultKeys) {
            const result = data.results[key];
            summary += `### 查询 ${key}:\n`;
            if (result.frames) {
                summary += processDataFrames(result.frames);
            }
            else if (result.series) {
                summary += `- 包含 ${result.series.length} 个数据系列\n`;
            }
            else if (result.tables) {
                summary += `- 包含 ${result.tables.length} 个数据表\n`;
            }
            if (result.error) {
                summary += `- 错误: ${result.error}\n`;
            }
            summary += '\n';
        }
    }
    else if (data.data?.result) {
        // 处理Prometheus格式
        summary += processPrometheusData(data.data);
    }
    else if (data.frames) {
        // 直接处理数据帧
        summary += processDataFrames(data.frames);
    }
    else {
        // 未识别的格式，返回精简的JSON
        const jsonStr = JSON.stringify(data, null, 2);
        if (jsonStr.length > MAX_DATA_LENGTH) {
            summary += `原始数据(已截断):\n${jsonStr.substring(0, MAX_DATA_LENGTH)}...\n`;
        }
        else {
            summary += `原始数据:\n${jsonStr}\n`;
        }
    }
    return summary;
}
/**
 * 处理Grafana数据帧
 */
function processDataFrames(frames) {
    if (!frames || frames.length === 0)
        return '- 无数据帧\n';
    let summary = `- 包含 ${frames.length} 个数据帧\n`;
    // 分析每个数据帧
    for (let i = 0; i < Math.min(frames.length, 3); i++) {
        const frame = frames[i];
        if (!frame)
            continue;
        // 提取帧信息
        const name = frame.name || `帧 ${i + 1}`;
        const fields = frame.fields || [];
        const rows = frame.length || (fields[0]?.values?.length || 0);
        summary += `  - ${name}: ${rows} 行, ${fields.length} 列\n`;
        // 提取字段名称
        if (fields.length > 0) {
            const fieldNames = fields.map((f) => f.name || f.labels?.name || '未命名').join(', ');
            summary += `    - 字段: ${fieldNames}\n`;
        }
        // 提取时间范围
        const timeField = fields.find((f) => f.type === 'time');
        if (timeField && timeField.values && timeField.values.length > 0) {
            const firstTime = new Date(timeField.values[0]).toISOString();
            const lastTime = new Date(timeField.values[timeField.values.length - 1]).toISOString();
            summary += `    - 时间范围: ${firstTime} 至 ${lastTime}\n`;
        }
        // 提取数值统计
        const valueField = fields.find((f) => f.type === 'number' || f.name === 'Value');
        if (valueField && valueField.values && valueField.values.length > 0) {
            const values = valueField.values;
            const numValues = values.filter((v) => typeof v === 'number');
            if (numValues.length > 0) {
                const sum = numValues.reduce((a, b) => a + b, 0);
                const avg = sum / numValues.length;
                const min = Math.min(...numValues);
                const max = Math.max(...numValues);
                summary += `    - 值统计: 最小=${min.toFixed(2)}, 最大=${max.toFixed(2)}, 平均=${avg.toFixed(2)}\n`;
            }
        }
    }
    if (frames.length > 3) {
        summary += `  - 还有 ${frames.length - 3} 个数据帧未显示\n`;
    }
    return summary;
}
/**
 * 处理Prometheus格式数据
 */
function processPrometheusData(data) {
    if (!data || !data.result)
        return '- 无Prometheus数据\n';
    const results = Array.isArray(data.result) ? data.result : [data.result];
    let summary = `- 包含 ${results.length} 个Prometheus结果\n`;
    // 分析前几个结果
    for (let i = 0; i < Math.min(results.length, 5); i++) {
        const result = results[i];
        if (result.metric) {
            const metricName = result.metric.__name__ || '未命名指标';
            const labels = Object.entries(result.metric)
                .filter(([key]) => key !== '__name__')
                .map(([key, value]) => `${key}="${value}"`)
                .join(', ');
            summary += `  - ${metricName}{${labels}}\n`;
        }
        if (result.values) {
            // 处理矩阵数据
            const numPoints = result.values.length;
            if (numPoints > 0) {
                const firstTime = new Date(result.values[0][0] * 1000).toISOString();
                const lastTime = new Date(result.values[numPoints - 1][0] * 1000).toISOString();
                summary += `    - ${numPoints} 个数据点, 时间范围: ${firstTime} 至 ${lastTime}\n`;
                // 计算值的统计信息
                try {
                    const values = result.values.map((v) => parseFloat(v[1])).filter((v) => !isNaN(v));
                    if (values.length > 0) {
                        const sum = values.reduce((a, b) => a + b, 0);
                        const avg = sum / values.length;
                        const min = Math.min(...values);
                        const max = Math.max(...values);
                        summary += `    - 值统计: 最小=${min.toFixed(2)}, 最大=${max.toFixed(2)}, 平均=${avg.toFixed(2)}\n`;
                    }
                }
                catch (e) {
                    // 忽略统计计算错误
                }
            }
        }
        else if (result.value) {
            // 处理向量数据
            const timestamp = new Date(result.value[0] * 1000).toISOString();
            const value = result.value[1];
            summary += `    - 值: ${value} (${timestamp})\n`;
        }
    }
    if (results.length > 5) {
        summary += `  - 还有 ${results.length - 5} 个结果未显示\n`;
    }
    return summary;
}
/**
 * 检测是否为时间序列数据
 */
function isTimeSeriesData(data) {
    // 检查是否有典型的时间序列结构
    return data &&
        (data.datapoints ||
            (data.target && data.datapoints) ||
            (data.timestamps && data.values) ||
            (Array.isArray(data) && data[0] && Array.isArray(data[0]) && data[0].length === 2));
}
/**
 * 处理时间序列数据
 */
function processTimeSeriesData(data) {
    let summary = '## 时间序列数据摘要\n\n';
    let timeseriesData = [];
    // 提取时间序列数据点
    if (data.datapoints) {
        timeseriesData = data.datapoints;
        summary += `指标名称: ${data.target || '未命名'}\n`;
    }
    else if (data.timestamps && data.values) {
        timeseriesData = data.timestamps.map((t, i) => [t, data.values[i]]);
    }
    else if (Array.isArray(data) && data[0] && Array.isArray(data[0]) && data[0].length === 2) {
        timeseriesData = data;
    }
    if (timeseriesData.length === 0) {
        return summary + '无数据点\n';
    }
    // 计算基本统计信息
    const numPoints = timeseriesData.length;
    const values = timeseriesData.map(point => point[1]).filter(v => typeof v === 'number' && !isNaN(v));
    if (values.length === 0) {
        return summary + `包含 ${numPoints} 个数据点，但没有有效的数值\n`;
    }
    // 时间范围
    const firstTime = new Date(timeseriesData[0][0]).toISOString();
    const lastTime = new Date(timeseriesData[numPoints - 1][0]).toISOString();
    // 值统计
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    // 计算标准差
    const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    // 检测异常值 (超过平均值±2个标准差)
    const upperBound = avg + 2 * stdDev;
    const lowerBound = avg - 2 * stdDev;
    const anomalies = values.filter(v => v > upperBound || v < lowerBound);
    summary += `- 数据点: ${numPoints} 个\n`;
    summary += `- 时间范围: ${firstTime} 至 ${lastTime}\n`;
    summary += `- 值统计: 最小=${min.toFixed(2)}, 最大=${max.toFixed(2)}, 平均=${avg.toFixed(2)}, 标准差=${stdDev.toFixed(2)}\n`;
    if (anomalies.length > 0) {
        const anomalyPercent = (anomalies.length / values.length * 100).toFixed(1);
        summary += `- 异常值: 检测到 ${anomalies.length} 个异常值 (${anomalyPercent}%)\n`;
    }
    // 检测趋势
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const trend = secondHalfAvg - firstHalfAvg;
    const trendPercent = (trend / firstHalfAvg * 100).toFixed(1);
    if (Math.abs(trend) > 0.05 * firstHalfAvg) {
        const trendDirection = trend > 0 ? '上升' : '下降';
        summary += `- 趋势: ${trendDirection} ${Math.abs(parseFloat(trendPercent))}%\n`;
    }
    else {
        summary += `- 趋势: 相对稳定\n`;
    }
    return summary;
}
/**
 * 处理通用对象数据
 */
function processGenericObject(data) {
    const keys = Object.keys(data);
    if (keys.length === 0) {
        return '空对象';
    }
    // 如果对象很小，直接返回完整JSON
    const jsonStr = JSON.stringify(data, null, 2);
    if (jsonStr.length <= MAX_DATA_LENGTH) {
        return jsonStr;
    }
    // 对于大对象，创建结构摘要
    let summary = '## 数据结构摘要\n\n';
    // 添加顶级键摘要
    summary += `包含 ${keys.length} 个顶级键: ${keys.join(', ')}\n\n`;
    // 处理每个顶级键的摘要
    for (const key of keys) {
        const value = data[key];
        summary += `### ${key}:\n`;
        if (value === null) {
            summary += '- null\n';
        }
        else if (typeof value === 'undefined') {
            summary += '- undefined\n';
        }
        else if (typeof value === 'object') {
            if (Array.isArray(value)) {
                summary += `- 数组，包含 ${value.length} 个元素\n`;
                // 添加数组样本
                if (value.length > 0) {
                    const sample = value.slice(0, 2);
                    summary += `- 样本: ${JSON.stringify(sample)}\n`;
                }
            }
            else {
                const nestedKeys = Object.keys(value);
                summary += `- 对象，包含 ${nestedKeys.length} 个键\n`;
                // 添加嵌套键列表
                if (nestedKeys.length > 0) {
                    summary += `- 键: ${nestedKeys.join(', ')}\n`;
                }
            }
        }
        else {
            // 基本类型值
            summary += `- ${typeof value}: ${value}\n`;
        }
        summary += '\n';
    }
    return summary;
}
//# sourceMappingURL=monitoring-analyzer.js.map