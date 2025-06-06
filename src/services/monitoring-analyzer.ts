import axios from 'axios';
import type { ExtractedData, QueryConfig } from '../types/index.js';

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_MAX_DATA_LENGTH = 500000; // 默认500KB阈值
const SUMMARY_LENGTH = 1000; // 数据摘要长度

const DEFAULT_SYSTEM_PROMPT = `你是专业的Grafana监控数据分析专家。你的任务是基于提供的监控数据（包括数据摘要）进行完整分析。

🔍 数据格式说明：
- hasData: 是否有有效数据
- type: 数据类型
- data: 监控数据（完整数据或智能摘要）
- status: HTTP状态码
- timestamp: 数据时间戳

📊 智能摘要机制：
- 默认情况下，所有数据都会完整发送给你处理
- 只有当用户配置了数据处理限制且数据超过阈值时，才会启用智能摘要
- 摘要数据包含完整的统计信息（min/max/avg等）和代表性样本
- statistics字段提供关键数值统计，structure字段展示核心结构
- 遇到摘要数据时，请基于现有信息进行完整分析

✅ 分析要求：
1. 📈 数据概览：基于统计信息分析整体趋势
2. 🚨 异常检测：识别异常值、突变点和问题模式  
3. 📊 指标评估：评估关键性能指标的健康状态
4. 💡 优化建议：提供具体的监控和系统优化建议
5. 🎯 行动项：给出明确的下一步操作建议

⚠️ 重要原则：
- 直接基于提供的数据和摘要进行分析
- 不要要求重新获取数据或执行其他工具
- 摘要数据已包含足够的信息进行专业分析
- 专注于从现有信息中提取最大价值`;

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
 * 智能处理大数据的摘要函数 - 针对Grafana监控数据优化
 */
function createDataSummary(data: any): string {
  if (!data || typeof data !== 'object') {
    return String(data);
  }

  const summary: any = {};
  
  // 如果是数组，分析数据特征
  if (Array.isArray(data)) {
    const length = data.length;
    if (length > 10) {
      summary.type = 'array';
      summary.totalItems = length;
      summary.firstItems = data.slice(0, 3);
      summary.lastItems = data.slice(-2);
      
      // 如果数组元素是时序数据，提供统计信息
      if (data[0] && typeof data[0] === 'object') {
        const firstItem = data[0];
        if (firstItem.value !== undefined || firstItem.metric || firstItem.timestamp || firstItem.values) {
          summary.dataType = 'timeSeries';
          
          // 尝试从不同字段提取数值
          const values = data.flatMap((item: any) => {
            if (item.values && Array.isArray(item.values)) {
              return item.values.map((v: any) => parseFloat(v[1] || v.value || 0));
            }
            return [parseFloat(item.value || item.y || 0)];
          }).filter((v: number) => !isNaN(v));
          
          if (values.length > 0) {
            summary.statistics = {
              min: Math.min(...values),
              max: Math.max(...values),
              avg: values.reduce((a, b) => a + b, 0) / values.length,
              count: values.length
            };
          }
        }
      }
      
      summary.note = `[监控数据摘要] ${length}个数据点，已显示关键统计信息`;
    } else {
      return JSON.stringify(data, null, 2);
    }
  } else {
    // 对象类型，识别Grafana数据结构
    const keys = Object.keys(data);
    
    // 检查是否包含大数组字段（Grafana常见结构）
    let hasLargeArrays = false;
    let totalDataPoints = 0;
    
    keys.forEach(key => {
      const value = data[key];
      if (Array.isArray(value) && value.length > 50) {
        hasLargeArrays = true;
        totalDataPoints += value.length;
      }
    });
    
    // 如果有大数组或字段数量多，进行摘要
    if (hasLargeArrays || keys.length > 20) {
      summary.type = 'object';
      summary.totalKeys = keys.length;
      summary.structure = {};
      
      if (hasLargeArrays) {
        summary.totalDataPoints = totalDataPoints;
      }
      
      // Grafana常见字段优先级
      const grafanaImportantKeys = keys.filter(key => 
        key.includes('result') || 
        key.includes('data') || 
        key.includes('series') ||
        key.includes('value') || 
        key.includes('metric') ||
        key.includes('target') ||
        key.includes('time') ||
        key.includes('error') ||
        key.includes('status') ||
        key.includes('query') ||
        key.includes('panel')
      );
      
      // 保留重要字段的摘要信息
      [...grafanaImportantKeys, ...keys.filter(k => !grafanaImportantKeys.includes(k))].slice(0, 8).forEach(key => {
        const value = data[key];
        if (Array.isArray(value)) {
          if (value.length > 50) {
            // 大数组进行摘要
            summary.structure[key] = {
              type: 'array',
              length: value.length,
              sample: value.slice(0, 2),
              ...value.length > 2 && { lastSample: value.slice(-1) }
            };
            
                         // 尝试提取统计信息
             if (value[0] && typeof value[0] === 'object') {
               const item = value[0];
               if (item.values && Array.isArray(item.values)) {
                 const allValues = value.flatMap((v: any) => v.values?.map((val: any) => parseFloat(val[1] || 0)) || []).filter((v: number) => !isNaN(v));
                if (allValues.length > 0) {
                  summary.structure[key].statistics = {
                    min: Math.min(...allValues),
                    max: Math.max(...allValues),
                    avg: allValues.reduce((a, b) => a + b, 0) / allValues.length,
                    count: allValues.length
                  };
                }
              }
            }
          } else {
            summary.structure[key] = {
              type: 'array',
              length: value.length,
              sample: value.slice(0, Math.min(2, value.length))
            };
          }
        } else if (typeof value === 'object' && value !== null) {
          summary.structure[key] = {
            type: 'object',
            keys: Object.keys(value).slice(0, 5)
          };
        } else {
          summary.structure[key] = value;
        }
      });
      
      // 显示其他字段的概览
      const processedKeys = Object.keys(summary.structure);
      const otherKeys = keys.filter(key => !processedKeys.includes(key));
      if (otherKeys.length > 0) {
        summary.otherFields = {
          count: otherKeys.length,
          examples: otherKeys.slice(0, 5)
        };
      }
      
      summary.note = `[监控数据摘要] ${keys.length}个字段的对象${hasLargeArrays ? `，包含${totalDataPoints}个数据点` : ''}，已提取关键监控信息`;
    } else {
      return JSON.stringify(data, null, 2);
    }
  }
  
  return JSON.stringify(summary, null, 2);
}

/**
 * 为客户端AI格式化分析上下文
 * @param prompt 用户的分析需求描述
 * @param data 从Grafana提取的监控数据
 * @param config 查询配置，包含数据处理策略
 * @returns 格式化后的分析上下文字符串
 */
export function formatDataForClientAI(
  prompt: string, 
  data: ExtractedData, 
  config?: QueryConfig
): string {
  // 获取数据处理配置
  const dataProcessing = config?.dataProcessing;
  const enableSummary = dataProcessing?.enableSummary ?? false; // 默认false（无限制）
  const maxDataLength = dataProcessing?.maxDataLength ?? DEFAULT_MAX_DATA_LENGTH;
  
  let formattedData: string = '无数据';
  let dataSize = 0;
  let isTruncated = false;
  let shouldWarn = false;
  
  // 安全处理data.data，确保即使为null或undefined也能正常工作
  const rawData = data.data !== undefined ? data.data : null;
  
  try {
    if (rawData === null || rawData === undefined) {
      formattedData = '无数据';
      dataSize = 8; // '无数据'的字符长度
    } else if (typeof rawData === 'object') {
      // 处理对象类型数据
      try {
        const jsonStr = JSON.stringify(rawData, null, 2);
        dataSize = jsonStr.length;
        
        if (enableSummary && jsonStr.length > maxDataLength) {
          // 配置了智能摘要且数据超过阈值
          console.log(`⚠️ 数据量过大 (${Math.round(dataSize/1024)}KB > ${Math.round(maxDataLength/1024)}KB)，启用智能摘要处理`);
          formattedData = createDataSummary(rawData);
          isTruncated = true;
          shouldWarn = true;
        } else {
          // 未配置摘要或数据在阈值内，发送完整数据
          formattedData = jsonStr;
          if (dataSize > 100000) { // 100KB以上提示（但不摘要）
            console.log(`📊 数据量较大 (${Math.round(dataSize/1024)}KB)，发送完整数据给AI处理`);
          }
        }
      } catch (error) {
        // 处理JSON序列化错误（如循环引用）
        console.error('数据序列化失败，可能包含循环引用:', error);
        formattedData = '{"error": "数据序列化失败，可能包含循环引用或不支持的数据类型"}';
        dataSize = formattedData.length;
      }
    } else if (typeof rawData === 'string') {
      // 处理字符串类型数据
      dataSize = rawData.length;
      
      if (enableSummary && rawData.length > maxDataLength) {
        // 字符串数据摘要处理 - 保持JSON格式一致性
        console.log(`⚠️ 字符串数据过大 (${Math.round(dataSize/1024)}KB > ${Math.round(maxDataLength/1024)}KB)，使用摘要处理`);
        const prefix = rawData.substring(0, SUMMARY_LENGTH);
        formattedData = JSON.stringify({
          type: 'string',
          length: rawData.length,
          sample: prefix,
          note: `[字符串数据摘要] 原始长度: ${dataSize} 字符，已截取前${SUMMARY_LENGTH}字符`
        }, null, 2);
        isTruncated = true;
        shouldWarn = true;
      } else {
        // 尝试解析字符串是否为JSON
        try {
          JSON.parse(rawData);
          // 如果能解析为JSON，保持原样
          formattedData = rawData;
        } catch {
          // 不是JSON，则包装为JSON字符串
          formattedData = JSON.stringify(rawData);
        }
      }
    } else {
      // 处理其他基本类型(number, boolean等)
      formattedData = JSON.stringify(rawData);
      dataSize = formattedData.length;
    }
  } catch (error) {
    // 兜底错误处理
    console.error('格式化数据时发生未预期错误:', error);
    formattedData = JSON.stringify({
      error: '数据处理失败',
      message: error instanceof Error ? error.message : String(error)
    }, null, 2);
    dataSize = formattedData.length;
  }

  return `请基于以下Grafana监控数据进行专业分析：

用户需求：${prompt}

数据概览：
- 数据类型：${data.type}
- 有效数据：${data.hasData ? '是' : '否'}
- HTTP状态：${data.status}  
- 时间戳：${data.timestamp}
${isTruncated ? `- 原始数据大小：${Math.round(dataSize/1024)}KB（已智能摘要处理）` : dataSize > 50000 ? `- 数据大小：${Math.round(dataSize/1024)}KB` : ''}

${isTruncated ? '数据摘要：' : '原始数据：'}
${data.hasData ? formattedData : '无有效数据'}

${shouldWarn ? `
⚠️ 数据量警告：
由于数据量过大（${Math.round(dataSize/1024)}KB > ${Math.round(maxDataLength/1024)}KB），已启用智能摘要处理。
虽然摘要包含了关键统计信息，但分析准确性可能受影响。

💡 建议优化：
1. 缩小查询时间范围（如从24小时改为1小时）
2. 增加数据采样间隔（如从1分钟改为5分钟）
3. 使用聚合查询减少原始数据量
4. 或在配置中提高maxDataLength阈值

📊 当前摘要已包含关键统计信息，请基于摘要进行分析。` : ''}

✅ 请直接基于现有数据进行分析，提供：
1. 数据解读和关键指标分析
2. 异常检测和问题识别  
3. 趋势分析和模式发现
4. 优化建议和行动建议

⚠️ 重要：请勿要求重新获取数据或执行其他工具，直接基于提供的信息完成分析即可。`;
} 