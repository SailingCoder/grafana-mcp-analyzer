import type { ExtractedData } from '../types/index.js';

const DEFAULT_SYSTEM_PROMPT = `您是一位资深的Grafana数据分析专家，具备丰富的数据可视化和洞察挖掘经验。您擅长从各类数据源中发现有价值的信息，并提供可执行的业务建议。请对数据进行专业分析，重点关注：

## 核心分析目标
- **数据洞察挖掘**：从数据中发现有价值的业务洞察和趋势
- **异常模式识别**：识别数据中的异常模式和潜在问题
- **业务影响评估**：分析数据变化对业务目标的影响
- **决策支持建议**：提供基于数据的决策建议和行动方案

## 数据分析维度
1. **趋势分析**：识别长期趋势、季节性模式、周期性变化
2. **异常检测**：发现异常值、异常模式、偏离正常范围的数据点
3. **对比分析**：与历史数据、目标值、基准线进行对比
4. **关联分析**：分析不同指标间的关联性和影响关系
5. **预测分析**：基于历史数据预测未来趋势和可能的变化

## 关键关注点
- **业务指标**：关注对业务目标有直接影响的关键指标
- **用户体验**：分析影响用户体验的相关数据
- **效率优化**：识别可以提升效率的优化机会
- **风险预警**：提前识别可能影响业务的风险信号

## 建议输出标准
- **可执行性**：提供具体的行动建议和实施方案
- **优先级排序**：按照业务影响和紧急程度排序
- **量化分析**：提供具体的数值分析和量化指标
- **可视化建议**：建议创建的图表和仪表盘配置`;

/**
 * 根据数据类型获取专门的分析指导
 */
function getDataTypeSpecificGuidance(dataType: string): string {
  const guidanceMap: Record<string, string> = {
    'timeseries': `
## 时序数据专项分析指导
- **趋势识别**：分析数据的上升、下降、平稳趋势，识别关键拐点
- **周期性模式**：识别日周期、周周期、月周期等业务和用户行为模式
- **异常事件**：检测突发峰值、异常下降等重要事件
- **基线建立**：建立正常水位基线，计算P50/P90/P95/P99百分位数
- **预测分析**：基于历史趋势预测未来走向和可能的变化
- **目标对比**：与业务目标、KPI指标、SLA要求进行对比分析`,

    'tables': `
## 表格数据专项分析指导
- **数据质量**：检查数据完整性、准确性、一致性
- **分布特征**：分析数据分布，识别异常分布和离群值
- **排序分析**：按关键指标排序，识别Top N表现者和问题项
- **统计分析**：计算平均值、中位数、标准差等描述性统计
- **分组对比**：按不同维度分组，识别差异化表现
- **趋势对比**：与历史数据、目标值、行业基准对比`,

    'elasticsearch': `
## 日志数据专项分析指导
- **事件模式**：分析事件的时间分布和频率模式
- **用户行为**：分析用户访问模式、使用习惯和行为变化
- **业务流程**：跟踪业务流程的执行情况和效率
- **异常检测**：识别异常访问、错误模式、安全威胁
- **性能分析**：分析响应时间、处理效率等性能指标
- **业务洞察**：从日志中挖掘业务相关的洞察和机会`,

    'default': `
## 通用数据分析指导
- **数据探索**：全面了解数据的结构、范围和特征
- **质量评估**：评估数据的完整性、准确性、时效性
- **异常识别**：使用统计方法识别异常值和异常模式
- **关联发现**：分析不同指标间的关联关系和影响因素
- **价值挖掘**：从数据中发现业务价值和改进机会`
  };

  return guidanceMap[dataType] || guidanceMap['default'];
}

/**
 * 生成结构化的分析报告模板
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateAnalysisTemplate(_prompt: string, _hasAggregateData: boolean = false): string {
  const baseTemplate = `
## 分析报告结构要求

### 1. 执行摘要 (Executive Summary)
- **关键洞察**：最重要的3-5个数据洞察
- **影响评估**：对业务目标和用户体验的影响分析
- **优先级建议**：按重要性和紧急程度排序的行动建议
- **量化结果**：关键指标的量化分析结果

### 2. 数据概览与模式 (Data Overview & Patterns)
- **数据质量**：数据完整性、准确性、时效性评估
- **总体趋势**：整体数据趋势和发展方向
- **模式识别**：周期性模式、季节性变化、异常模式
- **关键指标**：最重要的业务指标表现

### 3. 深度分析 (Deep Analysis)
- **异常检测**：异常值、异常模式、异常时间段的识别
- **对比分析**：与历史数据、目标值、基准线的对比
- **关联分析**：不同指标间的关联关系和影响因素
- **细分分析**：按不同维度的细分表现

### 4. 业务洞察与建议 (Business Insights & Recommendations)
- **业务影响**：数据变化对业务目标的具体影响
- **机会识别**：基于数据发现的业务机会和优化点
- **风险预警**：潜在风险和问题的早期预警
- **行动建议**：具体的、可执行的改进建议

### 5. 技术建议 (Technical Recommendations)
- **数据质量改进**：数据收集、处理、存储的改进建议
- **监控优化**：监控策略和告警规则的优化建议
- **可视化建议**：仪表盘和图表的最佳实践建议
- **性能优化**：系统性能和数据处理效率的优化建议

## 分析质量要求
- **准确性**：基于数据事实，避免主观臆断
- **可操作性**：提供具体、可执行的建议
- **优先级**：按重要性和紧急程度排序
- **量化**：提供具体的数值和指标支持
- **时效性**：关注当前和未来的业务影响`;

  return baseTemplate;
}

/**
 * 生成数据概览统计
 */
export function generateDataOverview(data: ExtractedData): any {
  const safeGet = (obj: any, path: (string | number)[], defaultValue: any = 0): any => {
    return path.reduce((current, key) => current?.[key], obj) ?? defaultValue;
  };

  // 基础统计
  const overview = {
    dataType: 'unknown',
    totalSize: 0,
    recordCount: 0,
    timeRange: null as any,
    keyMetrics: {} as any,
    dataQuality: {
      completeness: 0,
      consistency: 0,
      accuracy: 0
    }
  };

  try {
    // 检测数据类型
    if (data?.data?.results && typeof data.data.results === 'object') {
      overview.dataType = 'grafana-query';
      const results = data.data.results;
      const resultKeys = Object.keys(results);
      
      overview.recordCount = resultKeys.length;
      
      // 统计frames和fields
      let totalFrames = 0;
      let totalFields = 0;
      let totalDataPoints = 0;
      
      resultKeys.forEach(key => {
        const result = results[key];
        if (result?.frames && Array.isArray(result.frames)) {
          totalFrames += result.frames.length;
          
          result.frames.forEach((frame: any) => {
            if (frame?.fields && Array.isArray(frame.fields)) {
              totalFields += frame.fields.length;
              
              frame.fields.forEach((field: any) => {
                if (field?.values && Array.isArray(field.values)) {
                  totalDataPoints += field.values.length;
                }
              });
            }
          });
        }
      });
      
      overview.keyMetrics = {
        resultCount: resultKeys.length,
        totalFrames,
        totalFields,
        totalDataPoints
      };
      
         } else if (data?.data?.series && Array.isArray(data.data.series)) {
       overview.dataType = 'timeseries';
       overview.recordCount = data.data.series.length;
       
       // 统计时间序列数据
       let totalDataPoints = 0;
       let timeRange = { start: null, end: null };
       
       data.data.series.forEach((series: any) => {
         if (series?.datapoints && Array.isArray(series.datapoints)) {
           totalDataPoints += series.datapoints.length;
           
           series.datapoints.forEach((point: any) => {
             if (point && point.length >= 2) {
               const timestamp = point[1];
               if (!timeRange.start || timestamp < timeRange.start) {
                 timeRange.start = timestamp;
               }
               if (!timeRange.end || timestamp > timeRange.end) {
                 timeRange.end = timestamp;
               }
             }
           });
         }
       });
       
       overview.timeRange = timeRange;
       overview.keyMetrics = {
         seriesCount: data.data.series.length,
         totalDataPoints
       };
       
     } else if (data?.data?.tables && Array.isArray(data.data.tables)) {
       overview.dataType = 'tables';
       overview.recordCount = data.data.tables.length;
       
       // 统计表格数据
       let totalRows = 0;
       let totalColumns = 0;
       
       data.data.tables.forEach((table: any) => {
         if (table?.rows && Array.isArray(table.rows)) {
           totalRows += table.rows.length;
         }
         if (table?.columns && Array.isArray(table.columns)) {
           totalColumns = Math.max(totalColumns, table.columns.length);
         }
       });
       
       overview.keyMetrics = {
         tableCount: data.data.tables.length,
         totalRows,
         totalColumns
       };
      
         } else if (data?.data?.responses || data?.data?.hits || data?.data?.aggregations) {
       overview.dataType = 'elasticsearch';
       
       // 统计Elasticsearch数据
       const hits = safeGet(data.data, ['hits', 'hits'], []);
       const total = safeGet(data.data, ['hits', 'total'], { value: 0 });
       const aggregations = data.data?.aggregations || {};
       
       overview.recordCount = Array.isArray(hits) ? hits.length : 0;
       overview.keyMetrics = {
         totalHits: typeof total === 'object' ? total.value : total,
         returnedHits: hits.length,
         aggregationCount: Object.keys(aggregations).length
       };
      
    } else if (Array.isArray(data)) {
      overview.dataType = 'array';
      overview.recordCount = data.length;
      overview.keyMetrics = {
        arrayLength: data.length,
        itemTypes: [...new Set(data.map(item => typeof item))]
      };
      
    } else if (typeof data === 'object' && data !== null) {
      overview.dataType = 'object';
      overview.recordCount = 1;
      overview.keyMetrics = {
        propertyCount: Object.keys(data).length,
        propertyTypes: [...new Set(Object.values(data).map(value => typeof value))]
      };
    }
    
    // 计算数据大小
    overview.totalSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
    
  } catch (error) {
    console.error('生成数据概览时出错:', error);
  }

  return overview;
}

/**
 * 构建完整的分析指导
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildFullAnalysisGuidance(
  prompt: string, 
  _requestId: string,
  dataOverview: any,
  storageResult: any,
  _queryConfig?: any,
  supportsResources: boolean = false
): string {
  const dataType = dataOverview?.dataType || 'unknown';
  const dataTypeGuidance = getDataTypeSpecificGuidance(dataType);
  
  let resourceInstructions = '';
  if (supportsResources && storageResult?.type === 'chunked') {
    resourceInstructions = `
## ⚠️ 重要：数据访问说明
数据已按${Math.round(storageResult.chunkingStrategy.split('-')[1])}KB分块存储，**必须使用以下方式获取数据，不要使用curl或其他方法**：

1. **获取分块元数据**：
   - 使用 \`get_monitoring_data\` 工具，设置 \`dataType\` 为 \`metadata\`
   - 这将返回所有分块的概览信息

2. **获取具体分块**：
   - 使用 \`get_monitoring_data\` 工具，设置 \`dataType\` 为 \`chunk-N\`（N为分块编号）
   - 例如：\`chunk-1\`, \`chunk-2\`, \`chunk-3\` 等
   - **必须按顺序获取所有分块，不能跳过任何分块！**

3. **分块分析策略**：
   - 先获取元数据了解整体结构
   - **必须按顺序获取并分析每个分块（1到${storageResult.chunks}）**
   - 在最终报告中整合所有分块的分析结果
   - 重点关注跨分块的数据模式和趋势

4. **数据完整性要求**：
   - 总共有 ${storageResult.chunks} 个分块
   - 每个分块大小不超过${Math.round(storageResult.chunkingStrategy.split('-')[1])}KB
   - **必须获取所有${storageResult.chunks}个分块，不能遗漏任何分块！**
   - **跳过任何分块都会导致分析不完整！**

**重要提醒**：这是唯一正确的数据获取方式，不要尝试使用curl或其他外部方法！`;
  }
  
  const analysisTemplate = generateAnalysisTemplate(prompt, false);
  
  return `${DEFAULT_SYSTEM_PROMPT}

${dataTypeGuidance}

${resourceInstructions}

${analysisTemplate}

## 当前数据信息
- **数据类型**: ${dataOverview?.dataType || 'unknown'}
- **数据大小**: ${Math.round(dataOverview?.totalSize / 1024)}KB
- **记录数量**: ${dataOverview?.recordCount || 0}
- **存储方式**: ${storageResult?.type || 'full'}
${storageResult?.type === 'chunked' ? `- **分块数量**: ${storageResult.chunks}` : ''}
${storageResult?.type === 'chunked' ? `- **分块策略**: ${storageResult.chunkingStrategy}` : ''}

## 分析任务
${prompt}

请基于以上指导，对数据进行专业、深入的分析，并提供有价值的业务洞察和建议。`;
}

/**
 * 构建分析指导
 */
export function buildAnalysisGuidance(
  prompt: string, 
  requestId: string,
  dataOverview: any,
  storageResult: any,
  queryConfig?: any,
  supportsResources: boolean = false
): string {
  return buildFullAnalysisGuidance(prompt, requestId, dataOverview, storageResult, queryConfig, supportsResources);
}
