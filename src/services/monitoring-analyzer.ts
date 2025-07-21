import type { ExtractedData } from '../types/index.js';
import { getMaxChunkSize } from './config-manager.js';

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
function generateAnalysisTemplate(_prompt: string, hasAggregateData: boolean = false): string {
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

### 4. 业务洞察 (Business Insights)
- **价值发现**：从数据中发现的业务价值和机会
- **用户行为**：用户行为模式和偏好分析
- **效率评估**：流程效率和性能表现评估
- **竞争优势**：可以转化为竞争优势的数据洞察

### 5. 预测与趋势 (Forecast & Trends)
- **趋势预测**：基于历史数据的未来趋势预测
- **场景分析**：不同情况下的可能结果分析
- **风险识别**：潜在的业务风险和机会点
- **目标达成**：达成业务目标的可能性评估

### 6. 行动建议 (Action Recommendations)
- **立即行动**：需要立即采取的关键行动
- **短期改进**：1-4周内可实施的改进措施
- **中期规划**：1-3个月的战略规划建议
- **长期策略**：长期发展策略和投资建议

### 7. 可视化建议 (Visualization Recommendations)
- **仪表盘设计**：建议的Grafana仪表盘配置
- **关键图表**：重要的图表类型和配置建议
- **告警设置**：建议的告警阈值和规则
- **定期报告**：建议的定期分析和报告机制`;

  if (hasAggregateData) {
    return baseTemplate + `

### 8. 综合关联分析 (Comprehensive Correlation)
- **数据源关联**：分析不同数据源间的关联关系
- **影响传播**：识别指标变化的影响传播路径
- **整体表现**：整体业务表现和健康度评估
- **协同优化**：多维度协同优化的建议`;
  }

  return baseTemplate;
}

/**
 * 新一代智能摘要算法 v2.0
 * 专门针对Grafana数据结构优化，提供更准确的摘要
 */
export function generateSmartSummary(data: any, maxSize: number = getMaxChunkSize()): any {
  const dataStr = JSON.stringify(data);
  const currentSize = Buffer.byteLength(dataStr, 'utf8');
  
  if (currentSize <= maxSize) {
    return data;
  }
  
  // 检测数据类型并使用对应的专业摘要算法
  const dataType = detectGrafanaDataType(data);
  
  let summarizedData: any;
  
  switch (dataType) {
    case 'grafana-query':
      summarizedData = generateGrafanaQuerySummary(data, maxSize);
      break;
    case 'timeseries':
      summarizedData = generateTimeseriesSummary(data, maxSize);
      break;
    case 'table':
      summarizedData = generateTableSummary(data, maxSize);
      break;
    case 'array':
      summarizedData = generateArraySummary(data, maxSize);
      break;
    case 'object':
      summarizedData = generateObjectSummary(data, maxSize);
      break;
    default:
      summarizedData = generateEnhancedGenericSummary(data, maxSize);
      break;
  }
  
  // 验证摘要结果大小
  const summaryStr = JSON.stringify(summarizedData);
  const summarySize = Buffer.byteLength(summaryStr, 'utf8');
  
  // 如果摘要后仍然过大，使用激进压缩策略
  if (summarySize > maxSize) {
    return generateAggressiveSummary(summarizedData, maxSize);
  }
  
  return summarizedData;
}

/**
 * 检测Grafana数据类型
 */
export function detectGrafanaDataType(data: any): string {
  // 检查包装后的 ExtractedData 结构
  if (data?.data?.results && typeof data.data.results === 'object') {
    return 'grafana-query';
  }
  // 检查直接的查询结果结构
  if (data?.results && (Array.isArray(data.results) || typeof data.results === 'object')) {
    return 'grafana-query';
  }
  if (data?.series && Array.isArray(data.series)) {
    return 'timeseries';
  }
  if (data?.tables && Array.isArray(data.tables)) {
    return 'table';
  }
  if (Array.isArray(data)) {
    return 'array';
  }
  if (typeof data === 'object' && data !== null) {
    return 'object';
  }
  return 'generic';
}

/**
 * Grafana查询结果专用摘要算法
 * 处理 { data: { results: { A: { frames: [{ fields: [...] }] } } } } 结构
 */
function generateGrafanaQuerySummary(data: any, maxSize: number): any {
  // 提取results对象
  const resultsObj = data?.data?.results || data?.results || {};
  const resultKeys = Object.keys(resultsObj);
  
  const summary: any = {
    __summary: true,
    __dataType: 'grafana_query_summary',
    __notice: '这是Grafana查询结果的智能摘要',
    __originalStats: {
      resultCount: resultKeys.length,
      totalFrames: 0,
      totalFields: 0,
      totalDataPoints: 0
    },
    results: []
  };
  
  const targetSize = maxSize * 0.7; // 预留30%给元数据
  let currentSize = 0;
  
  // 遍历每个查询结果
  for (const resultKey of resultKeys) {
    const result = resultsObj[resultKey];
    const frames = result?.frames || [];
    
    summary.__originalStats.totalFrames += frames.length;
    
    const resultSummary: any = {
      refId: resultKey,
      status: result?.status || 'unknown',
      frameCount: frames.length,
      frames: []
    };
    
    // 处理每个frame
    for (let j = 0; j < frames.length; j++) {
      const frame = frames[j];
      const fields = frame?.schema?.fields || frame?.fields || [];
      
      summary.__originalStats.totalFields += fields.length;
      
      // 分析字段结构
      const fieldAnalysis = analyzeFields(fields, frame.data);
      summary.__originalStats.totalDataPoints += fieldAnalysis.totalDataPoints;
      
      const frameSummary = generateFrameSummary(frame, fieldAnalysis, targetSize / frames.length);
      
      // 检查大小限制
      const frameSize = Buffer.byteLength(JSON.stringify(frameSummary), 'utf8');
      if (currentSize + frameSize <= targetSize) {
        resultSummary.frames.push(frameSummary);
        currentSize += frameSize;
      } else {
        // 超出限制，只保留统计信息
        resultSummary.frames.push({
          __truncated: true,
          name: frame?.schema?.name || frame?.name || 'unknown',
          fieldCount: fields.length,
          dataPointCount: fieldAnalysis.totalDataPoints,
          timeRange: fieldAnalysis.timeRange,
          valueRange: fieldAnalysis.valueRange
        });
        break;
      }
    }
    
    summary.results.push(resultSummary);
    
    if (currentSize >= targetSize) break;
  }
  
  return summary;
}

/**
 * 分析字段结构，提取关键统计信息
 */
function analyzeFields(fields: any[], frameData?: any): any {
  const analysis: any = {
    totalDataPoints: 0,
    timeField: null,
    valueFields: [],
    timeRange: null,
    valueRange: null
  };
  
  // frameData.values 是二维数组：[字段索引][数据点索引]
  const dataValues = frameData?.values || [];
  
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const fieldValues = dataValues[i] || [];
    
    if (fieldValues.length > 0) {
      analysis.totalDataPoints = Math.max(analysis.totalDataPoints, fieldValues.length);
    }
    
    // 检测时间字段
    if (field.type === 'time' || field.name === 'time' || field.name === 'Time') {
      analysis.timeField = field;
      if (fieldValues.length > 0) {
        const timeValues = fieldValues.filter((v: any) => typeof v === 'number');
        if (timeValues.length > 0) {
          analysis.timeRange = {
            start: Math.min(...timeValues),
            end: Math.max(...timeValues),
            count: timeValues.length
          };
        }
      }
    } else if (field.type === 'number' && fieldValues.length > 0) {
      // 数值字段
      analysis.valueFields.push(field);
      const numericValues = fieldValues.filter((v: any) => typeof v === 'number' && !isNaN(v));
      if (numericValues.length > 0) {
        const fieldRange = {
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          avg: numericValues.reduce((a: number, b: number) => a + b, 0) / numericValues.length,
          count: numericValues.length,
          fieldName: field.name
        };
        
        // 更新全局value range
        if (!analysis.valueRange) {
          analysis.valueRange = fieldRange;
        } else {
          analysis.valueRange.min = Math.min(analysis.valueRange.min, fieldRange.min);
          analysis.valueRange.max = Math.max(analysis.valueRange.max, fieldRange.max);
          analysis.valueRange.count += fieldRange.count;
        }
      }
    }
  }
  
  return analysis;
}

/**
 * 生成Frame的智能摘要
 */
function generateFrameSummary(frame: any, analysis: any, maxFrameSize: number): any {
  const fields = frame?.schema?.fields || frame?.fields || [];
  const frameData = frame?.data || {};
  const dataValues = frameData.values || [];
  
  const summary: any = {
    name: frame?.schema?.name || frame?.name || 'unknown',
    meta: frame?.meta,
    fieldCount: fields.length,
    dataPointCount: analysis.totalDataPoints,
    fields: []
  };
  
  if (analysis.timeRange) {
    summary.timeRange = analysis.timeRange;
  }
  
  if (analysis.valueRange) {
    summary.valueRange = analysis.valueRange;
  }
  
  // 智能采样字段数据
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const fieldValues = dataValues[i] || [];
    const fieldSummary = generateFieldSummary(field, fieldValues, analysis, maxFrameSize / fields.length);
    summary.fields.push(fieldSummary);
  }
  
  return summary;
}

/**
 * 生成字段的智能摘要
 */
function generateFieldSummary(field: any, fieldValues: any[], _analysis: any, maxFieldSize: number): any {
  const summary: any = {
    name: field.name,
    type: field.type,
    config: field.config
  };
  
  if (!Array.isArray(fieldValues) || fieldValues.length === 0) {
    summary.values = [];
    return summary;
  }
  
  const totalPoints = fieldValues.length;
  const maxPoints = Math.floor(maxFieldSize / 50); // 假设每个数据点平均50字节
  
  if (totalPoints <= maxPoints) {
    summary.values = fieldValues;
    return summary;
  }
  
  // 智能采样策略
  if (field.type === 'time' || field.name === 'time') {
    // 时间字段：均匀采样
    summary.values = uniformSample(fieldValues, maxPoints);
  } else if (field.type === 'number') {
    // 数值字段：保留关键点（极值、变化点等）
    summary.values = intelligentNumericSample(fieldValues, maxPoints);
  } else {
    // 其他字段：首尾采样
    summary.values = headTailSample(fieldValues, maxPoints);
  }
  
  // 添加采样元数据
  summary.__sampling = {
    originalCount: totalPoints,
    sampledCount: summary.values.length,
    samplingRatio: summary.values.length / totalPoints,
    strategy: getStrategyName(field)
  };
  
  return summary;
}

/**
 * 智能数值采样：保留极值和变化点
 */
function intelligentNumericSample(values: number[], maxPoints: number): number[] {
  if (values.length <= maxPoints) return values;
  
     const result: number[] = [];
  
  // 1. 保留开始和结束点
  result.push(values[0]);
  if (maxPoints > 2) result.push(values[values.length - 1]);
  
  let remainingPoints = maxPoints - 2;
  if (remainingPoints <= 0) return result;
  
  // 2. 找到极值点
  const extremes: { index: number, value: number }[] = [];
  for (let i = 1; i < values.length - 1; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    const next = values[i + 1];
    
    // 局部极值
    if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
      extremes.push({ index: i, value: curr });
    }
  }
  
  // 按极值程度排序，选择最重要的极值点
  extremes.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const selectedExtremes = extremes.slice(0, Math.min(extremes.length, Math.floor(remainingPoints * 0.3)));
  
  for (const extreme of selectedExtremes) {
    result.push(extreme.value);
  }
  
  remainingPoints -= selectedExtremes.length;
  
  // 3. 均匀采样剩余点
  if (remainingPoints > 0) {
    const uniformStep = Math.floor(values.length / remainingPoints);
    for (let i = uniformStep; i < values.length - uniformStep; i += uniformStep) {
      if (result.length < maxPoints) {
        result.push(values[i]);
      }
    }
  }
  
  return result;
}

/**
 * 均匀采样
 */
function uniformSample(values: any[], maxPoints: number): any[] {
  if (values.length <= maxPoints) return values;
  
  const step = values.length / maxPoints;
  const result: any[] = [];
  
  for (let i = 0; i < maxPoints; i++) {
    const index = Math.floor(i * step);
    result.push(values[index]);
  }
  
  return result;
}

/**
 * 首尾采样
 */
function headTailSample(values: any[], maxPoints: number): any[] {
  if (values.length <= maxPoints) return values;
  
  const headCount = Math.floor(maxPoints * 0.5);
  const tailCount = maxPoints - headCount;
  
  const result = [
    ...values.slice(0, headCount),
    ...values.slice(-tailCount)
  ];
  
  return result;
}

/**
 * 获取采样策略名称
 */
function getStrategyName(field: any): string {
  if (field.type === 'time' || field.name === 'time') {
    return 'uniform_time';
  } else if (typeof field.values?.[0] === 'number') {
    return 'intelligent_numeric';
  } else {
    return 'head_tail';
  }
}

/**
 * 时间序列数据摘要
 */
function generateTimeseriesSummary(data: any, maxSize: number): any {
  return generateArraySummary(data.series || [], maxSize);
}

/**
 * 表格数据摘要
 * 专门处理表格数据的智能摘要算法
 */
function generateTableSummary(data: any, maxSize: number): any {
  const tables = data.tables || [];
  
  if (tables.length === 0) return data;
  
  const summary: any = {
    __summary: true,
    __dataType: 'table_summary',
    __notice: '这是表格数据的智能摘要',
    __originalStats: {
      tableCount: tables.length,
      totalRows: 0,
      totalColumns: 0
    },
    tables: []
  };
  
  const targetSize = maxSize * 0.7; // 预留30%给元数据
  let currentSize = 0;
  
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    const rows = table.rows || [];
    const columns = table.columns || [];
    
    summary.__originalStats.totalRows += rows.length;
    summary.__originalStats.totalColumns += columns.length;
    
    // 为每个表创建摘要
    const tableSummary: any = {
      __originalRowCount: rows.length,
      __originalColumnCount: columns.length,
      columns: columns,
      rows: []
    };
    
    // 智能采样表格行
    if (rows.length > 0) {
      const maxRows = Math.min(
        Math.max(10, Math.floor(targetSize / (tables.length * JSON.stringify(rows[0]).length))),
        rows.length
      );
      
      if (rows.length <= maxRows) {
        tableSummary.rows = rows;
      } else {
        // 保留头部、中间采样和尾部行
        const headCount = Math.min(Math.floor(maxRows * 0.4), 5);
        const tailCount = Math.min(Math.floor(maxRows * 0.3), 5);
        const middleCount = maxRows - headCount - tailCount;
        
        // 头部行
        for (let j = 0; j < headCount; j++) {
          tableSummary.rows.push(rows[j]);
        }
        
        // 中间采样
        if (middleCount > 0) {
          const middleStart = headCount;
          const middleEnd = rows.length - tailCount;
          const step = Math.floor((middleEnd - middleStart) / middleCount);
          
          for (let j = 0; j < middleCount; j++) {
            const index = middleStart + j * step;
            if (index < middleEnd) {
              tableSummary.rows.push(rows[index]);
            }
          }
        }
        
        // 尾部行
        for (let j = Math.max(0, rows.length - tailCount); j < rows.length; j++) {
          if (tableSummary.rows.length < maxRows) {
            tableSummary.rows.push(rows[j]);
          }
        }
        
        tableSummary.__sampling = {
          originalRowCount: rows.length,
          sampledRowCount: tableSummary.rows.length,
          samplingRatio: tableSummary.rows.length / rows.length,
          strategy: 'head_middle_tail_sampling'
        };
      }
    }
    
    // 检查大小限制
    const tableSummaryStr = JSON.stringify(tableSummary);
    const tableSize = Buffer.byteLength(tableSummaryStr, 'utf8');
    
    if (currentSize + tableSize <= targetSize) {
      summary.tables.push(tableSummary);
      currentSize += tableSize;
    } else {
      // 超出限制，只保留统计信息
      summary.tables.push({
        __truncated: true,
        __originalRowCount: rows.length,
        __originalColumnCount: columns.length,
        columns: columns,
        sampleRows: rows.slice(0, 3), // 只保留前3行作为样本
        __note: '表格过大，已截断'
      });
      break;
    }
  }
  
  return summary;
}

/**
 * 增强的通用摘要算法
 * 比原始 generateGenericSummary 更智能的压缩策略
 */
function generateEnhancedGenericSummary(data: any, maxSize: number): any {
  const summary: any = {
    __summary: true,
    __dataType: 'enhanced_generic_summary',
    __notice: '这是增强的智能摘要，保留了数据的关键结构信息',
    __originalStructure: {
      type: typeof data,
      isArray: Array.isArray(data),
      keys: typeof data === 'object' && data !== null ? Object.keys(data).slice(0, 10) : null,
      arrayLength: Array.isArray(data) ? data.length : null,
      size: JSON.stringify(data).length
    }
  };
  
  const targetSize = maxSize * 0.6; // 预留40%给元数据
  let processedSize = 0;
  
  if (Array.isArray(data)) {
    // 数组数据：智能采样
    const maxItems = Math.min(20, Math.floor(targetSize / 100)); // 假设每项100字节
    summary.data = data.slice(0, maxItems);
    summary.__sampling = {
      originalLength: data.length,
      sampledLength: summary.data.length,
      strategy: 'head_sampling'
    };
  } else if (typeof data === 'object' && data !== null) {
    // 对象数据：保留关键字段
    summary.data = {};
    const entries = Object.entries(data);
    
    for (const [key, value] of entries.slice(0, 10)) { // 最多保留10个字段
      const valueStr = JSON.stringify(value);
      const fieldSize = Buffer.byteLength(valueStr, 'utf8');
      
      if (processedSize + fieldSize < targetSize) {
        if (Array.isArray(value) && value.length > 10) {
          // 大数组只保留样本
          summary.data[key] = value.slice(0, 5);
          summary.data[`${key}_info`] = {
            type: 'array_sample',
            originalLength: value.length,
            note: '仅显示前5个元素'
          };
        } else if (typeof value === 'string' && value.length > 200) {
          // 长字符串截断
          summary.data[key] = value.substring(0, 100) + '...[截断]';
        } else {
          summary.data[key] = value;
        }
        processedSize += fieldSize;
      } else {
        // 超出限制，只记录字段信息
        summary.data[`${key}_info`] = {
          type: typeof value,
          size: fieldSize,
          note: '字段过大已省略'
        };
        break;
      }
    }
    
    if (entries.length > 10) {
      summary.__truncated = `省略了 ${entries.length - 10} 个字段`;
    }
  } else {
    // 基本类型
    const valueStr = String(data);
    if (valueStr.length > targetSize) {
      summary.data = valueStr.substring(0, targetSize) + '...[截断]';
    } else {
      summary.data = data;
    }
  }
  
  return summary;
}

/**
 * 激进压缩摘要算法
 * 当常规摘要仍然过大时使用的最后手段
 */
export function generateAggressiveSummary(data: any, maxSize: number): any {
  const aggressiveSummary: any = {
    __summary: true,
    __dataType: 'aggressive_compression',
    __notice: '这是激进压缩的数据摘要，仅保留最核心的统计信息',
    __compression: 'maximum',
    __originalSize: JSON.stringify(data).length
  };
  
  // 提取核心统计信息
  if (data.__summary) {
    // 如果输入本身就是摘要，进一步压缩
    aggressiveSummary.__originalStats = data.__originalStats || null;
    aggressiveSummary.__dataType = data.__dataType + '_compressed';
    
    if (data.data && Array.isArray(data.data)) {
      aggressiveSummary.dataStats = {
        length: data.data.length,
        sampleFirst: data.data[0] || null,
        sampleLast: data.data[data.data.length - 1] || null,
        sampleMiddle: data.data[Math.floor(data.data.length / 2)] || null
      };
    } else if (data.results && Array.isArray(data.results)) {
      aggressiveSummary.resultsStats = {
        count: data.results.length,
        frameCount: data.__originalStats?.totalFrames || 0,
        fieldCount: data.__originalStats?.totalFields || 0,
        dataPointCount: data.__originalStats?.totalDataPoints || 0
      };
    }
  } else {
    // 从原始数据提取最基本的统计信息
    if (Array.isArray(data)) {
      aggressiveSummary.dataStats = {
        type: 'array',
        length: data.length,
        firstItem: data[0] || null,
        lastItem: data[data.length - 1] || null
      };
    } else if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      aggressiveSummary.dataStats = {
        type: 'object',
        keyCount: keys.length,
        sampleKeys: keys.slice(0, 5),
        hasResults: 'results' in data,
        hasSeries: 'series' in data,
        hasTables: 'tables' in data
      };
    } else {
      aggressiveSummary.dataStats = {
        type: typeof data,
        value: String(data).substring(0, 50)
      };
    }
  }
  
  // 确保结果足够小
  const currentStr = JSON.stringify(aggressiveSummary);
  if (Buffer.byteLength(currentStr, 'utf8') > maxSize) {
    // 最后的手段：只保留最基本信息
    return {
      __summary: true,
      __dataType: 'minimal_summary',
      __notice: '数据过大，已压缩为最小摘要',
      __originalSize: JSON.stringify(data).length,
      __status: 'data_available_via_tools',
      __message: '请使用 get_monitoring_data 工具获取完整数据'
    };
  }
  
  return aggressiveSummary;
}

/**
 * 生成数组数据摘要（适用于时间序列数据）
 */
function generateArraySummary(data: any[], maxSize: number): any {
  if (data.length === 0) return data;
  
  // 计算采样率，确保至少保留一些项目
  const itemSize = Buffer.byteLength(JSON.stringify(data[0]), 'utf8');
  const calculatedMaxItems = Math.floor(maxSize / itemSize * 0.8); // 预留20%空间给元数据
  
  // 确保至少保留最小数量的项目，但不超过原始数组长度
  const maxItems = Math.max(
    Math.min(calculatedMaxItems, data.length),
    Math.min(3, data.length) // 至少保留3个项目（如果数组有的话）
  );
  
  if (data.length <= maxItems) {
    return data;
  }
  
  // 智能采样：保留首尾和均匀分布的中间点
  const sampledData = [];
  
  // 保留开始部分
  const headCount = Math.min(Math.floor(maxItems * 0.3), 50);
  for (let i = 0; i < headCount && i < data.length; i++) {
    sampledData.push(data[i]);
  }
  
  // 中间均匀采样
  const middleCount = Math.floor(maxItems * 0.4);
  const start = headCount;
  const end = data.length - Math.min(Math.floor(maxItems * 0.3), 50);
  
  if (end > start) {
    const middleStep = Math.max(1, Math.floor((end - start) / middleCount));
    for (let i = start; i < end; i += middleStep) {
      if (sampledData.length < maxItems - Math.floor(maxItems * 0.3)) {
        sampledData.push(data[i]);
      }
    }
  }
  
  // 保留结尾部分
  const tailCount = Math.min(Math.floor(maxItems * 0.3), 50);
  const tailStart = Math.max(data.length - tailCount, sampledData.length);
  for (let i = tailStart; i < data.length; i++) {
    if (sampledData.length < maxItems) {
      sampledData.push(data[i]);
    }
  }
  
  // 添加摘要元数据
  return {
    __summary: true,
    __originalLength: data.length,
    __sampledLength: sampledData.length,
    __samplingRatio: sampledData.length / data.length,
    __notice: '这是智能采样后的数据摘要，包含了原始数据的代表性样本',
    __dataType: 'timeseries_sample',
    data: sampledData
  };
}

/**
 * 生成对象数据摘要
 */
function generateObjectSummary(data: any, maxSize: number): any {
  const result: any = {
    __summary: true,
    __notice: '这是智能生成的数据摘要',
    __dataType: 'object_summary'
  };
  
  // 统计字段信息
  const fieldStats: any = {};
  let processedSize = 0;
  const targetSize = maxSize * 0.8; // 预留20%空间
  
  for (const [key, value] of Object.entries(data)) {
    const valueStr = JSON.stringify(value);
    const fieldSize = Buffer.byteLength(valueStr, 'utf8');
    
    fieldStats[key] = {
      type: typeof value,
      size: fieldSize,
      isArray: Array.isArray(value),
      arrayLength: Array.isArray(value) ? value.length : null
    };
    
    // 如果字段不大，直接包含
    if (processedSize + fieldSize < targetSize) {
      if (Array.isArray(value) && fieldSize > maxSize / 10) {
        // 大数组需要采样
        result[key] = generateArraySummary(value, maxSize / 5);
      } else {
        result[key] = value;
      }
      processedSize += fieldSize;
    } else {
      // 大字段只保留统计信息
      if (Array.isArray(value)) {
        result[key + '_summary'] = {
          type: 'array',
          length: value.length,
          sample: value.slice(0, 3),
          note: '仅显示前3个元素样本'
        };
      } else if (typeof value === 'string') {
        result[key + '_summary'] = {
          type: 'string',
          length: value.length,
          preview: value.substring(0, 100) + (value.length > 100 ? '...' : ''),
          note: '仅显示前100个字符'
        };
      } else {
        result[key + '_summary'] = {
          type: typeof value,
          size: fieldSize,
          note: '字段过大，已省略'
        };
      }
    }
  }
  
  result.__fieldStats = fieldStats;
  return result;
}

/**
 * 生成数据概览
 * 提供数据统计信息而非完整数据内容
 * 采用优雅的错误处理，保持数据类型的连续性
 */
export function generateDataOverview(data: ExtractedData): any {
  // 基础数据验证
  if (!data || typeof data !== 'object') {
    console.warn('generateDataOverview: 输入数据无效', { data });
    return {
      type: 'unknown',
      hasData: false,
      timestamp: new Date().toISOString(),
      status: 'unknown',
      stats: null
    };
  }

  const overview: any = {
    type: data.type || 'unknown',
    hasData: Boolean(data.hasData),
    timestamp: data.timestamp || new Date().toISOString(),
    status: data.status || 'unknown'
  };

  // 安全的数据访问函数
  const safeGet = (obj: any, path: (string | number)[], defaultValue: any = 0): any => {
    try {
      return path.reduce((current, key) => current?.[key], obj) ?? defaultValue;
    } catch (error) {
      console.warn(`generateDataOverview: 安全访问失败 ${path.join('.')}`, error);
      return defaultValue;
    }
  };

  const safeReduce = (array: any[], reducer: (sum: number, item: any) => number, initialValue: number = 0): number => {
    try {
      if (!Array.isArray(array)) return initialValue;
      return array.reduce(reducer, initialValue);
    } catch (error) {
      console.warn('generateDataOverview: reduce操作失败', error);
      return initialValue;
    }
  };

  // 根据数据类型生成统计信息
  try {
    if (data.type === 'timeseries' && data.data?.series) {
      const series = safeGet(data.data, ['series'], []);
      overview.stats = {
        seriesCount: Array.isArray(series) ? series.length : 0,
        totalDataPoints: safeReduce(series, (sum: number, seriesItem: any) => {
          const values = safeGet(seriesItem, ['fields', 0, 'values'], []);
          return sum + (Array.isArray(values) ? values.length : 0);
        }),
        fieldCount: safeReduce(series, (sum: number, seriesItem: any) => {
          const fields = safeGet(seriesItem, ['fields'], []);
          return sum + (Array.isArray(fields) ? fields.length : 0);
        })
      };
    } else if (data.type === 'tables' && data.data?.tables) {
      const tables = safeGet(data.data, ['tables'], []);
      overview.stats = {
        tableCount: Array.isArray(tables) ? tables.length : 0,
        totalRows: safeReduce(tables, (sum: number, table: any) => {
          const rows = safeGet(table, ['rows'], []);
          return sum + (Array.isArray(rows) ? rows.length : 0);
        }),
        columnCount: safeReduce(tables, (sum: number, table: any) => {
          const columns = safeGet(table, ['columns'], []);
          return sum + (Array.isArray(columns) ? columns.length : 0);
        })
      };
    } else if (data.type === 'elasticsearch' && data.data?.responses) {
      const responses = safeGet(data.data, ['responses'], []);
      overview.stats = {
        responseCount: Array.isArray(responses) ? responses.length : 0,
        totalHits: safeReduce(responses, (sum: number, response: any) => {
          const hits = safeGet(response, ['hits'], {});
          const total = safeGet(hits, ['total'], 0);
          // 处理ES中total可能是对象的情况
          if (typeof total === 'object' && total !== null) {
            return sum + (safeGet(total, ['value'], 0));
          }
          return sum + (typeof total === 'number' ? total : 0);
        }),
        hasAggregations: Array.isArray(responses) && responses.some((r: any) => {
          try {
            return Boolean(safeGet(r, ['aggregations']));
          } catch {
            return false;
          }
        })
      };
    } else {
      // 未知数据类型或数据格式不符合预期，提供空的统计信息
      overview.stats = null;
      console.warn(`generateDataOverview: 不支持的数据类型或格式: ${data.type}`);
    }
  } catch (error) {
    // 统计生成失败时，保持数据类型不变，只将stats设为null
    console.error('generateDataOverview: 统计生成失败', error);
    overview.stats = null;
  }

  return overview;
}

/**
 * 生成基于Resources机制的完整分析指导
 */
function buildFullAnalysisGuidance(
  prompt: string, 
  requestId: string,
  dataOverview: any,
  storageResult: any,
  queryConfig?: any,
  supportsResources: boolean = false
): string {
  const customSystemPrompt = queryConfig?.systemPrompt;
  const isAggregateAnalysis = Array.isArray(dataOverview?.queryNames) || dataOverview?.type === 'aggregate-analysis';
  
  // 获取数据类型专项指导
  const dataTypeGuidance = getDataTypeSpecificGuidance(dataOverview?.type || 'default');
  
  // 生成分析报告模板
  const analysisTemplate = generateAnalysisTemplate(prompt, isAggregateAnalysis);

  return `# 数据已准备完成 - 请通过Resources机制进行Grafana数据专业分析任务

## 分析目标
${prompt}

## 专家角色定位
${customSystemPrompt || DEFAULT_SYSTEM_PROMPT}

${dataTypeGuidance}

## 数据资源信息
- **请求ID**: ${requestId}
- **数据状态**: ${dataOverview?.message || '数据已准备完成'}
- **数据获取方式**: 必须通过下方ResourceLinks获取
${isAggregateAnalysis ? `- **分析类型**: 综合分析` : '- **分析类型**: 单项分析'}

  ## 🔗 数据访问资源（必须执行）
  
  **⚠️ 关键指令 - 禁止使用工具访问数据**：
  - **严禁使用** test_resource_access 工具
  - **严禁使用** list_data 工具
  - **严禁使用** 任何其他MCP工具获取数据
  - **必须直接访问** 下方的ResourceLinks
  
  **必须直接访问的ResourceLinks**：
  ${supportsResources && storageResult.type === 'chunked' 
    ? (storageResult.resourceUris || []).map((link: string) => `- 📊 ${link}`).join('\n')
    : '- 📊 使用get_monitoring_data工具获取数据'}

  **明确执行步骤**：
  1. **直接访问ResourceLinks**：直接读取上述每个资源链接的内容（不要使用工具）
  2. **获取JSON数据**：您应该能看到完整的JSON格式监控数据
  3. **提取数值指标**：从JSON数据中提取具体的数值、百分比、时间序列
  4. **基于真实数据分析**：使用实际获取的数据回答用户问题

  **预期数据格式**：
  您应该能直接看到类似以下格式的监控数据：
  \`\`\`json
  {
    "data": { "values": [...] },
    "timestamp": "2025-01-21T...",
    "metrics": { "cpu_usage": 45.2 }
  }
  \`\`\`

  **重要验证**：
  - 如果您无法直接访问ResourceLinks，请使用 get_monitoring_data 工具作为备用方案
  - 如果您看到了实际的监控数据，请提供具体的数值分析
  - 不要基于此分析指引或配置信息进行推测性分析
  
  **备用数据获取方案**：
  如果ResourceLinks访问失败，请使用以下工具获取相同数据：
  \`get_monitoring_data\` 工具，参数：requestId="${requestId}"

${analysisTemplate}

## 关键分析要求

### 专业性要求
1. **数据驱动**：所有结论必须基于实际数据支撑，避免主观推测
2. **量化分析**：提供具体的数值、百分比、变化幅度等量化指标
3. **对比基准**：与历史数据、目标值、行业基准、最佳实践对比
4. **业务视角**：从业务角度解释数据含义和影响

### 重点关注领域
1. **趋势变化**：识别重要的趋势变化和拐点
2. **异常模式**：发现异常数据模式和潜在问题
3. **机会识别**：发现业务改进和优化机会
4. **影响评估**：评估对业务目标和用户体验的影响

### 建议输出标准
1. **可执行性**：提供具体的行动建议和实施步骤
2. **优先级明确**：按业务影响和紧急程度排序
3. **成本效益**：分析实施成本和预期收益
4. **时间规划**：提供清晰的实施时间线

### 报告质量要求
- **结构清晰**：使用标题、列表、表格等结构化格式
- **重点突出**：使用加粗等方式突出重要信息
- **可视化建议**：建议创建的Grafana图表和仪表盘配置
- **持续改进**：提供持续监控和改进的建议

---
**开始分析：请按照以上要求，通过ResourceLinks获取完整数据，进行深度专业分析，输出结构化的数据分析报告。**`;
}

/**
 * 为AI提供专业的DevOps分析指引，支持多种提示模式
 * 重要：这个函数返回的是指引信息，不是最终分析结果
 * 
 * @param prompt 用户分析请求
 * @param requestId 请求ID
 * @param dataOverview 数据概览
 * @param resourceLinks 数据资源链接
 * @param queryConfig 查询配置
 */
export function buildAnalysisGuidance(
  prompt: string, 
  requestId: string,
  dataOverview: any,
  storageResult: any,
  queryConfig?: any,
  supportsResources: boolean = false
): string {
  const customSystemPrompt = queryConfig?.systemPrompt;
  const promptMode = queryConfig?.promptMode || 'default'; // 默认使用专业全面的分析
  const isAggregateAnalysis = Array.isArray(dataOverview?.queryNames) || dataOverview?.type === 'aggregate-analysis';
  
  // Custom模式：用户想要自定义，简洁实用
  if (promptMode === 'custom') {
    const systemPrompt = customSystemPrompt || '您是数据分析专家，请进行专业的数据分析。';
    
    // 根据Resources支持情况构建指引
    if (supportsResources && storageResult.type === 'chunked') {
      // 支持Resources且数据分块，使用ResourceLinks
      const resourceLinks = storageResult.resourceUris || [];
    const resourceLinksDisplay = resourceLinks.length > 0 
        ? resourceLinks.map((link: string) => `- ${link}`).join('\n')
      : '- 暂无数据资源';
      
    return `${systemPrompt}

## 分析目标
${prompt}

## 数据信息
- **请求ID**: ${requestId}
- **数据状态**: ${dataOverview?.message || '数据已准备完成'}
- **获取方式**: 通过ResourceLinks访问原始数据（分块存储）
${isAggregateAnalysis ? '- **分析类型**: 综合分析' : '- **分析类型**: 单项分析'}

  ## 🔗 分析数据源（必须执行）
  **您必须通过以下ResourceLinks获取实际数据**
${resourceLinksDisplay}

  **执行步骤**：
  1. **访问ResourceLinks**: 立即访问上述每个资源链接
  2. **获取数据**: 确保获得完整的JSON格式数据
  3. **提取指标**: 从原始数据中提取关键数值
  4. **回答问题**: 基于实际数据直接回答用户需求

  **备用数据获取方案**：
  如果ResourceLinks访问失败，请使用以下工具获取相同数据：
  \`get_monitoring_data\` 工具，参数：requestId="${requestId}"

  ## 分析要求
  1. **必须获取数据**: 不访问ResourceLinks就无法进行分析
  2. **基于数据分析**: 所有结论必须来自实际数据
  3. **提供具体数值**: 给出准确的百分比、数值等
  4. **直接回答**: 针对"${prompt}"给出明确答案
  5. **避免推测**: 不要基于配置或假设进行分析

---
** 重要提醒**: 必须先通过ResourceLinks获取数据，然后进行分析！`;
    } else {
      // 不支持Resources或数据为full.json，使用工具获取
      return `${systemPrompt}

## 🎯 最终分析任务
${prompt}

**重要说明**: 这是一次性完整分析任务。调用get_monitoring_data工具获取数据后，请立即进行完整分析并给出最终结论。不要说"重新运行分析"或"需要更多数据"。

## 🔢 数据内容说明
**您将获取到的数据包含**：
- 📊 完整的监控数据（根据查询类型而定）
- 🔢 具体的数值信息（可能包括指标、计数、比例等）
- ⏰ 时间戳信息（适用于时间序列数据）
- 📈 足够进行深度分析的数据点

**⚠️ 智能摘要数据识别**：
如果数据包含 __summary: true 标记，说明这是大数据的智能摘要：
- __originalStats: 原始数据统计信息
- __sampling: 采样策略和比例信息
- timeRange/valueRange: 数据范围和统计信息
- 摘要数据已保留关键特征点（极值、变化点等）

**您必须**：
- ✅ 提取并报告具体的数值
- ✅ 计算并报告变化趋势（如适用）
- ✅ 识别关键指标和异常值
- ✅ 如果是摘要数据，基于统计信息和采样数据进行分析
- ✅ 报告数据范围、极值、平均值等关键统计指标
- ❌ 不能仅仅描述"数据状态良好"等泛泛之谈

## 数据信息
- **请求ID**: ${requestId}
- **数据状态**: ${dataOverview?.message || '数据已准备完成'}
- **存储类型**: ${storageResult.type === 'full' ? '完整数据' : '智能摘要数据'}
- **获取方式**: 通过工具直接获取
${isAggregateAnalysis ? '- **分析类型**: 综合分析' : '- **分析类型**: 单项分析'}

## 📊 数据获取（必须执行）
**请使用以下工具获取分析数据**：

\`\`\`
工具名: get_monitoring_data
参数: {
  "requestId": "${requestId}",
  "dataType": "data"
}
\`\`\`

**数据说明**：
- 📊 此请求包含完整的监控数据
- 🔢 数据包含具体的数值信息，可用于分析
- 📈 数据包含时间序列或结构化信息
- ⚠️ **请分析实际的数值数据，而非仅仅描述元数据**

**重要约束**：
- ⚠️ **禁止使用** chunk-* 作为dataType参数
- ✅ **只能使用** "data" 或 "analysis" 作为dataType
- 📊 数据已统一处理，无需分块获取

**执行步骤**：
1. **调用工具**: 使用上述参数调用get_monitoring_data工具
2. **获取数据**: 确保获得完整的JSON格式数据
3. **提取指标**: 从原始数据中提取关键数值
4. **回答问题**: 基于实际数据直接回答用户需求

## 分析要求
1. **必须获取数据**: 不调用工具就无法进行分析
2. **基于数据分析**: 所有结论必须来自实际数据
3. **提供具体数值**: 
   - ✅ 必须包含具体数值（如：响应时间123ms、错误率2.5%）
   - ✅ 必须包含变化幅度（如：较昨日上升3.2%）
   - ✅ 必须包含关键指标数值（如：平均值、最大值、异常点）
   - ❌ 禁止模糊描述（如："性能表现良好"、"数据正常"）
4. **直接回答**: 针对"${prompt}"给出明确答案
5. **避免推测**: 不要基于配置或假设进行分析

## ⚠️ 重要约束
- **一次性分析**: 调用一次get_monitoring_data工具即可获得完整数据
- **无需重复**: 数据已经完整，不需要重新执行analyze_query
- **无需更多数据**: 当前数据足够完成所有分析需求
- **直接完成**: 获取数据后直接进行完整分析，不要说"重新运行"

---
** 关键提醒**: 调用一次get_monitoring_data获取数据后，立即进行完整分析并给出最终结论！`;
    }
  }
  
  // Default模式：专业全面的分析（使用buildFullAnalysisGuidance）
  return buildFullAnalysisGuidance(prompt, requestId, dataOverview, storageResult, queryConfig, supportsResources);
}
