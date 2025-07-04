import type { ExtractedData } from '../types/index.js';



/**
 * 生成数据概览
 * 提供数据统计信息而非完整数据内容
 */
export function generateDataOverview(data: ExtractedData): any {
  const overview: any = {
    type: data.type,
    hasData: data.hasData,
    timestamp: data.timestamp,
    status: data.status
  };

  // 根据数据类型生成统计信息
  if (data.type === 'timeseries' && data.data?.series) {
    overview.stats = {
      seriesCount: data.data.series.length,
      totalDataPoints: data.data.series.reduce((sum: number, series: any) => 
        sum + (series.fields?.[0]?.values?.length || 0), 0),
      fieldCount: data.data.series.reduce((sum: number, series: any) => 
        sum + (series.fields?.length || 0), 0)
    };
  } else if (data.type === 'tables' && data.data?.tables) {
    overview.stats = {
      tableCount: data.data.tables.length,
      totalRows: data.data.tables.reduce((sum: number, table: any) => 
        sum + (table.rows?.length || 0), 0),
      columnCount: data.data.tables.reduce((sum: number, table: any) => 
        sum + (table.columns?.length || 0), 0)
    };
  } else if (data.type === 'elasticsearch' && data.data?.responses) {
    overview.stats = {
      responseCount: data.data.responses.length,
      totalHits: data.data.responses.reduce((sum: number, response: any) => 
        sum + (typeof response.hits?.total === 'object' ? response.hits.total.value : response.hits?.total || 0), 0),
      hasAggregations: data.data.responses.some((r: any) => r.aggregations)
    };
  }

  return overview;
}

/**
 * 为AI提供分析指引，结合查询配置的systemPrompt
 * AI将通过ResourceLinks访问完整数据
 */
export function buildAnalysisGuidance(
  prompt: string, 
  requestId: string,
  dataOverview: any,
  resourceLinks: string[],
  queryConfig?: any
): string {
  // 构建专业分析指引
  const systemPrompt = queryConfig?.systemPrompt || `您是一个专业的数据分析专家。请根据以下数据进行全面分析：
1. 数据趋势分析和关键指标识别
2. 异常值检测和风险评估  
3. 性能问题诊断和根因分析
4. 业务影响评估和预警建议
5. 具体的优化建议和改进方案

请提供详细、实用的分析报告，包含具体的数值分析和可执行的建议。`;

  return `## 监控数据分析任务

### 用户需求
${prompt}

### 专业分析指引
${systemPrompt}

### 数据概览
- 请求ID: ${requestId}
- 数据类型: ${dataOverview.type}
- 数据状态: ${dataOverview.hasData ? '有数据' : '无数据'}
- 时间戳: ${dataOverview.timestamp}
${dataOverview.stats ? `- 统计信息: ${JSON.stringify(dataOverview.stats, null, 2)}` : ''}

### 完整数据访问
通过以下ResourceLinks访问完整数据：
${resourceLinks.map(link => `- ${link}`).join('\n')}

### 分析方法
1. 通过ResourceLinks获取完整原始数据
2. 根据上述专业分析指引进行深度分析
3. 关注数据质量和异常值
4. 提供具体的分析结论和改进建议

**重要：请按照专业分析指引的要求，通过ResourceLinks获取完整数据进行全面分析，确保分析的专业性和准确性。**`;
} 