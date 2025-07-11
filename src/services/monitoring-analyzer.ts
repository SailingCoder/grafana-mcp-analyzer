import type { ExtractedData } from '../types/index.js';
import { cacheManager } from './cache-manager.js';

const DEFAULT_SYSTEM_PROMPT = `您是一位资深的Grafana数据分析专家，具备丰富的数据可视化和洞察挖掘经验。您擅长从各类数据源中发现有价值的信息，并提供可执行的业务建议。请对数据进行专业分析，重点关注：

## 🎯 核心分析目标
- **数据洞察挖掘**：从数据中发现有价值的业务洞察和趋势
- **异常模式识别**：识别数据中的异常模式和潜在问题
- **业务影响评估**：分析数据变化对业务目标的影响
- **决策支持建议**：提供基于数据的决策建议和行动方案

## 📊 数据分析维度
1. **趋势分析**：识别长期趋势、季节性模式、周期性变化
2. **异常检测**：发现异常值、异常模式、偏离正常范围的数据点
3. **对比分析**：与历史数据、目标值、基准线进行对比
4. **关联分析**：分析不同指标间的关联性和影响关系
5. **预测分析**：基于历史数据预测未来趋势和可能的变化

## 🚨 关键关注点
- **业务指标**：关注对业务目标有直接影响的关键指标
- **用户体验**：分析影响用户体验的相关数据
- **效率优化**：识别可以提升效率的优化机会
- **风险预警**：提前识别可能影响业务的风险信号

## 💡 建议输出标准
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
## 📈 时序数据专项分析指导
- **趋势识别**：分析数据的上升、下降、平稳趋势，识别关键拐点
- **周期性模式**：识别日周期、周周期、月周期等业务和用户行为模式
- **异常事件**：检测突发峰值、异常下降等重要事件
- **基线建立**：建立正常水位基线，计算P50/P90/P95/P99百分位数
- **预测分析**：基于历史趋势预测未来走向和可能的变化
- **目标对比**：与业务目标、KPI指标、SLA要求进行对比分析`,

    'tables': `
## 📋 表格数据专项分析指导
- **数据质量**：检查数据完整性、准确性、一致性
- **分布特征**：分析数据分布，识别异常分布和离群值
- **排序分析**：按关键指标排序，识别Top N表现者和问题项
- **统计分析**：计算平均值、中位数、标准差等描述性统计
- **分组对比**：按不同维度分组，识别差异化表现
- **趋势对比**：与历史数据、目标值、行业基准对比`,

    'elasticsearch': `
## 🔍 日志数据专项分析指导
- **事件模式**：分析事件的时间分布和频率模式
- **用户行为**：分析用户访问模式、使用习惯和行为变化
- **业务流程**：跟踪业务流程的执行情况和效率
- **异常检测**：识别异常访问、错误模式、安全威胁
- **性能分析**：分析响应时间、处理效率等性能指标
- **业务洞察**：从日志中挖掘业务相关的洞察和机会`,

    'default': `
## 📊 通用数据分析指导
- **数据探索**：全面了解数据的结构、范围和特征
- **质量评估**：评估数据的完整性、准确性、时效性
- **异常识别**：使用统计方法识别异常值和异常模式
- **关联发现**：分析不同指标间的关联关系和影响因素
- **价值挖掘**：从数据中发现业务价值和改进机会`
  };

  return guidanceMap[dataType] || guidanceMap['default'];
}

/**
 * 生成分析报告模板
 * @param isAggregateAnalysis 是否是聚合分析
 * @returns 分析模板
 */
function generateAnalysisTemplate(isAggregateAnalysis: boolean): string {
  return `${isAggregateAnalysis ? '## 📊 聚合分析报告' : '## 📊 分析报告'}

## ⚡ 关键分析要求

### 🎯 专业性要求
1. **数据驱动**：所有结论必须基于实际数据支撑，避免主观推测
2. **量化分析**：提供具体的数值、百分比、变化幅度等量化指标
3. **对比基准**：与历史数据、目标值、行业基准、最佳实践对比
4. **业务视角**：从业务角度解释数据含义和影响

### 🚨 重点关注领域
1. **趋势变化**：识别重要的趋势变化和拐点
2. **异常模式**：发现异常数据模式和潜在问题
3. **机会识别**：发现业务改进和优化机会
4. **影响评估**：评估对业务目标和用户体验的影响

### 💡 建议输出标准
1. **可执行性**：提供具体的行动建议和实施步骤
2. **优先级明确**：按业务影响和紧急程度排序
3. **成本效益**：分析实施成本和预期收益
4. **时间规划**：提供清晰的实施时间线

### 📊 报告质量要求
- **结构清晰**：使用标题、列表、表格等结构化格式
- **重点突出**：使用emoji、加粗等方式突出重要信息
- **可视化建议**：建议创建的Grafana图表和仪表盘配置
- **持续改进**：提供持续监控和改进的建议

---
**🔥 开始分析：请按照以上要求，通过ResourceLinks获取完整数据，进行深度专业分析，输出结构化的数据分析报告。**`;
}

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
 * 为AI提供专业的DevOps分析指引，结合查询配置的systemPrompt
 * 针对不同数据类型和分析场景提供专门的分析方法论
 */
export function buildAnalysisGuidance(
  prompt: string, 
  requestId: string,
  dataOverview: any,
  resourceLinks: string[],
  queryConfig?: any
): string {
  // 尝试从缓存获取分析指引
  const cacheKey = {
    action: 'buildAnalysisGuidance',
    prompt,
    requestId,
    dataOverviewType: dataOverview?.type
  };
  
  // 异步缓存检查和设置，但同步返回结果
  (async () => {
    try {
      const cachedGuidance = await cacheManager.getCachedResult(cacheKey);
      if (cachedGuidance) {
        return cachedGuidance;
      }
    } catch (error) {
      // 忽略缓存错误，继续生成新的分析指引
    }
  })();
  
  // 获取专业的系统提示
  const customSystemPrompt = queryConfig?.systemPrompt;
  const isAggregateAnalysis = Array.isArray(dataOverview?.queryNames) || dataOverview?.type === 'aggregate-analysis';
  
  // 获取数据类型专项指导
  const dataTypeGuidance = getDataTypeSpecificGuidance(dataOverview?.type || 'default');
  
  // 生成分析报告模板
  const analysisTemplate = generateAnalysisTemplate(isAggregateAnalysis);

  const guidance = `# 🔬 Grafana数据专业分析任务

## 🎯 分析目标
${prompt}

## 👨‍💻 专家角色定位
${customSystemPrompt || DEFAULT_SYSTEM_PROMPT}

${dataTypeGuidance}

## 📋 数据资源信息
- **请求ID**: ${requestId}
- **数据类型**: ${dataOverview.type || '未知'}
- **有效数据**: ${dataOverview.hasData ? '是' : '否'}
- **HTTP状态**: ${dataOverview.status || '未知'}
- **采集时间**: ${dataOverview.timestamp || '未知'}
- **数据规模**: ${dataOverview.stats ? JSON.stringify(dataOverview.stats, null, 2) : '统计信息不可用'}
${isAggregateAnalysis ? `- **分析类型**: 🔄 综合分析 (${dataOverview.queryNames?.join(', ') || '多数据源'})` : '- **分析类型**: 📊 单项分析'}

## 🔗 数据访问资源
**重要：必须通过以下ResourceLinks获取完整的原始数据进行分析**
${resourceLinks.map(link => `- 📊 ${link}`).join('\n')}

${analysisTemplate}`;

  // 异步缓存结果，但不等待
  (async () => {
    try {
      // 缓存5分钟
      await cacheManager.setCachedResult(cacheKey, guidance, 5 * 60 * 1000);
    } catch (error) {
      // 忽略缓存错误
    }
  })();
  
  return guidance;
}
