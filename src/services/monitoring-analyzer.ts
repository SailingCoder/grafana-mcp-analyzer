import axios from 'axios';
import type { ExtractedData, QueryConfig } from '../types/index.js';

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
 * 使用AI分析监控数据
 */
export async function analyzeWithAI(
  prompt: string,
  data: ExtractedData,
  globalConfig?: QueryConfig,
  queryConfig?: { systemPrompt?: string; aiService?: any }
): Promise<string | null> {
  // 获取AI配置
  const aiConfig = queryConfig?.aiService || globalConfig?.aiService;
  if (!aiConfig?.url) {
    return null; // 无AI配置，使用客户端AI
  }

  try {
    // 获取系统提示词
    const systemPrompt = queryConfig?.systemPrompt || 
                        globalConfig?.systemPrompt || 
                        DEFAULT_SYSTEM_PROMPT;

    const userMessage = `${prompt}\n\n监控数据：\n${JSON.stringify(data, null, 2)}`;
    
    // 构建请求体
    let requestBody;
    if (aiConfig.bodyTemplate) {
      // 使用自定义模板
      const template = JSON.stringify(aiConfig.bodyTemplate);
      const replaced = template
        .replace(/\{\{systemPrompt\}\}/g, systemPrompt.replace(/"/g, '\\"'))
        .replace(/\{\{userMessage\}\}/g, userMessage.replace(/"/g, '\\"'));
      requestBody = JSON.parse(replaced);
    } else {
      // 默认OpenAI格式
      requestBody = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      };
    }

    // 发送请求
    const response = await axios.post(aiConfig.url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        ...aiConfig.headers
      },
      timeout: aiConfig.timeout || DEFAULT_TIMEOUT
    });

    // 解析响应
    if (aiConfig.responseParser?.contentPath) {
      // 自定义解析路径
      const paths = aiConfig.responseParser.contentPath.split('.');
      let result = response.data;
      for (const path of paths) {
        result = result?.[path];
      }
      return typeof result === 'string' ? result : null;
    } else {
      // 默认OpenAI格式
      return response.data?.choices?.[0]?.message?.content || null;
    }
    
  } catch (error: any) {
    console.error('外部AI分析失败:', error.message);
    return null; // 失败时回退到客户端AI
  }
}

/**
 * 为客户端AI格式化分析上下文
 */
export function formatDataForClientAI(prompt: string, data: ExtractedData): string {
  // 智能数据处理而非简单截断
  let processedData: string;
  
  if (!data.hasData || !data.data) {
    processedData = '无有效数据';
  } else if (typeof data.data === 'object') {
    // 处理对象类型数据
    processedData = processSmartDataSummary(data.data);
  } else {
    // 处理字符串或其他类型
    processedData = String(data.data);
    if (processedData.length > MAX_DATA_LENGTH) {
      processedData = `${processedData.substring(0, MAX_DATA_LENGTH)}...`;
    }
  }

  return `请基于以下Grafana监控数据进行专业分析：

用户需求：${prompt}

数据概览：
- 数据类型：${data.type}
- 有效数据：${data.hasData ? '是' : '否'}
- HTTP状态：${data.status}
- 时间戳：${data.timestamp}
${data.metadata ? `- 数据大小：${data.metadata.responseSize || '未知'} 字节
- 内容类型：${data.metadata.contentType || '未知'}` : ''}

数据分析：
${processedData}

请提供：数据解读、异常检测、趋势分析和优化建议。`;
}

/**
 * 智能处理监控数据，生成数据摘要
 */
function processSmartDataSummary(data: any): string {
  // 检测数据类型
  if (Array.isArray(data)) {
    return processArrayData(data);
  } else if (isGrafanaQueryResponse(data)) {
    return processGrafanaQueryResponse(data);
  } else if (isTimeSeriesData(data)) {
    return processTimeSeriesData(data);
  } else {
    // 通用对象处理
    return processGenericObject(data);
  }
}

/**
 * 处理数组类型数据
 */
function processArrayData(data: any[]): string {
  if (data.length === 0) return '空数组';
  
  if (data.length > 100) {
    // 大型数组，提供摘要
    return `数组包含 ${data.length} 个元素。样本数据:\n${JSON.stringify(data.slice(0, 5), null, 2)}\n\n统计摘要:\n${generateArrayStats(data)}`;
  } else {
    // 小型数组，可以全部展示
    return JSON.stringify(data, null, 2);
  }
}

/**
 * 生成数组统计信息
 */
function generateArrayStats(data: any[]): string {
  try {
    // 尝试提取数值型数据进行统计
    const numericValues = data
      .map(item => {
        if (typeof item === 'number') return item;
        if (typeof item === 'object' && item !== null) {
          // 尝试从对象中提取数值
          const values = Object.values(item).filter(v => typeof v === 'number');
          return values.length > 0 ? values[0] : null;
        }
        return null;
      })
      .filter(item => item !== null) as number[];
    
    if (numericValues.length > 0) {
      const sum = numericValues.reduce((a, b) => a + b, 0);
      const avg = sum / numericValues.length;
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      
      return `数值统计: 最小值=${min.toFixed(2)}, 最大值=${max.toFixed(2)}, 平均值=${avg.toFixed(2)}, 样本数=${numericValues.length}`;
    }
    
    return `数组长度: ${data.length}`;
  } catch (error) {
    return `数组长度: ${data.length}`;
  }
}

/**
 * 检测是否为Grafana查询响应
 */
function isGrafanaQueryResponse(data: any): boolean {
  return data && 
    (data.results || data.data || data.series || data.frames || 
     (data.response && data.response.results));
}

/**
 * 处理Grafana查询响应
 */
function processGrafanaQueryResponse(data: any): string {
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
      } else if (result.series) {
        summary += `- 包含 ${result.series.length} 个数据系列\n`;
      } else if (result.tables) {
        summary += `- 包含 ${result.tables.length} 个数据表\n`;
      }
      
      if (result.error) {
        summary += `- 错误: ${result.error}\n`;
      }
      
      summary += '\n';
    }
  } else if (data.data?.result) {
    // 处理Prometheus格式
    summary += processPrometheusData(data.data);
  } else if (data.frames) {
    // 直接处理数据帧
    summary += processDataFrames(data.frames);
  } else {
    // 未识别的格式，返回精简的JSON
    const jsonStr = JSON.stringify(data, null, 2);
    if (jsonStr.length > MAX_DATA_LENGTH) {
      summary += `原始数据(已截断):\n${jsonStr.substring(0, MAX_DATA_LENGTH)}...\n`;
    } else {
      summary += `原始数据:\n${jsonStr}\n`;
    }
  }
  
  return summary;
}

/**
 * 处理Grafana数据帧
 */
function processDataFrames(frames: any[]): string {
  if (!frames || frames.length === 0) return '- 无数据帧\n';
  
  let summary = `- 包含 ${frames.length} 个数据帧\n`;
  
  // 分析每个数据帧
  for (let i = 0; i < Math.min(frames.length, 3); i++) {
    const frame = frames[i];
    
    if (!frame) continue;
    
    // 提取帧信息
    const name = frame.name || `帧 ${i+1}`;
    const fields = frame.fields || [];
    const rows = frame.length || (fields[0]?.values?.length || 0);
    
    summary += `  - ${name}: ${rows} 行, ${fields.length} 列\n`;
    
    // 提取字段名称
    if (fields.length > 0) {
      const fieldNames = fields.map((f: any) => f.name || f.labels?.name || '未命名').join(', ');
      summary += `    - 字段: ${fieldNames}\n`;
    }
    
    // 提取时间范围
    const timeField = fields.find((f: any) => f.type === 'time');
    if (timeField && timeField.values && timeField.values.length > 0) {
      const firstTime = new Date(timeField.values[0]).toISOString();
      const lastTime = new Date(timeField.values[timeField.values.length - 1]).toISOString();
      summary += `    - 时间范围: ${firstTime} 至 ${lastTime}\n`;
    }
    
    // 提取数值统计
    const valueField = fields.find((f: any) => f.type === 'number' || f.name === 'Value');
    if (valueField && valueField.values && valueField.values.length > 0) {
      const values = valueField.values;
      const numValues = values.filter((v: any) => typeof v === 'number');
      
      if (numValues.length > 0) {
        const sum = numValues.reduce((a: number, b: number) => a + b, 0);
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
function processPrometheusData(data: any): string {
  if (!data || !data.result) return '- 无Prometheus数据\n';
  
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
        const lastTime = new Date(result.values[numPoints-1][0] * 1000).toISOString();
        
        summary += `    - ${numPoints} 个数据点, 时间范围: ${firstTime} 至 ${lastTime}\n`;
        
        // 计算值的统计信息
        try {
          const values = result.values.map((v: any) => parseFloat(v[1])).filter((v: any) => !isNaN(v));
          if (values.length > 0) {
            const sum = values.reduce((a: number, b: number) => a + b, 0);
            const avg = sum / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            summary += `    - 值统计: 最小=${min.toFixed(2)}, 最大=${max.toFixed(2)}, 平均=${avg.toFixed(2)}\n`;
          }
        } catch (e) {
          // 忽略统计计算错误
        }
      }
    } else if (result.value) {
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
function isTimeSeriesData(data: any): boolean {
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
function processTimeSeriesData(data: any): string {
  let summary = '## 时间序列数据摘要\n\n';
  let timeseriesData: [number, number][] = [];
  
  // 提取时间序列数据点
  if (data.datapoints) {
    timeseriesData = data.datapoints;
    summary += `指标名称: ${data.target || '未命名'}\n`;
  } else if (data.timestamps && data.values) {
    timeseriesData = data.timestamps.map((t: number, i: number) => [t, data.values[i]]);
  } else if (Array.isArray(data) && data[0] && Array.isArray(data[0]) && data[0].length === 2) {
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
  const lastTime = new Date(timeseriesData[numPoints-1][0]).toISOString();
  
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
  } else {
    summary += `- 趋势: 相对稳定\n`;
  }
  
  return summary;
}

/**
 * 处理通用对象数据
 */
function processGenericObject(data: any): string {
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
    } else if (typeof value === 'undefined') {
      summary += '- undefined\n';
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) {
        summary += `- 数组，包含 ${value.length} 个元素\n`;
        
        // 添加数组样本
        if (value.length > 0) {
          const sample = value.slice(0, 2);
          summary += `- 样本: ${JSON.stringify(sample)}\n`;
        }
      } else {
        const nestedKeys = Object.keys(value);
        summary += `- 对象，包含 ${nestedKeys.length} 个键\n`;
        
        // 添加嵌套键列表
        if (nestedKeys.length > 0) {
          summary += `- 键: ${nestedKeys.join(', ')}\n`;
        }
      }
    } else {
      // 基本类型值
      summary += `- ${typeof value}: ${value}\n`;
    }
    
    summary += '\n';
  }
  
  return summary;
} 