import type { ExtractedData } from '../types/index.js';

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
 * 生成结构化的分析报告模板
 */
function generateAnalysisTemplate(prompt: string, hasAggregateData: boolean = false): string {
  // 使用prompt参数，避免未使用参数的错误
  const promptLength = prompt?.length || 0;
  console.log(`生成分析模板，提示长度: ${promptLength}字符，聚合数据: ${hasAggregateData}`);
  
  const baseTemplate = `
## 📋 分析报告结构要求

### 1. 🎯 执行摘要 (Executive Summary)
- **关键洞察**：最重要的3-5个数据洞察
- **影响评估**：对业务目标和用户体验的影响分析
- **优先级建议**：按重要性和紧急程度排序的行动建议
- **量化结果**：关键指标的量化分析结果

### 2. 📊 数据概览与模式 (Data Overview & Patterns)
- **数据质量**：数据完整性、准确性、时效性评估
- **总体趋势**：整体数据趋势和发展方向
- **模式识别**：周期性模式、季节性变化、异常模式
- **关键指标**：最重要的业务指标表现

### 3. 🔍 深度分析 (Deep Analysis)
- **异常检测**：异常值、异常模式、异常时间段的识别
- **对比分析**：与历史数据、目标值、基准线的对比
- **关联分析**：不同指标间的关联关系和影响因素
- **细分分析**：按不同维度的细分表现

### 4. 💡 业务洞察 (Business Insights)
- **价值发现**：从数据中发现的业务价值和机会
- **用户行为**：用户行为模式和偏好分析
- **效率评估**：流程效率和性能表现评估
- **竞争优势**：可以转化为竞争优势的数据洞察

### 5. 📈 预测与趋势 (Forecast & Trends)
- **趋势预测**：基于历史数据的未来趋势预测
- **场景分析**：不同情况下的可能结果分析
- **风险识别**：潜在的业务风险和机会点
- **目标达成**：达成业务目标的可能性评估

### 6. 🛠️ 行动建议 (Action Recommendations)
- **立即行动**：需要立即采取的关键行动
- **短期改进**：1-4周内可实施的改进措施
- **中期规划**：1-3个月的战略规划建议
- **长期策略**：长期发展策略和投资建议

### 7. 📊 可视化建议 (Visualization Recommendations)
- **仪表盘设计**：建议的Grafana仪表盘配置
- **关键图表**：重要的图表类型和配置建议
- **告警设置**：建议的告警阈值和规则
- **定期报告**：建议的定期分析和报告机制`;

  if (hasAggregateData) {
    return baseTemplate + `

### 8. 🔄 综合关联分析 (Comprehensive Correlation)
- **数据源关联**：分析不同数据源间的关联关系
- **影响传播**：识别指标变化的影响传播路径
- **整体表现**：整体业务表现和健康度评估
- **协同优化**：多维度协同优化的建议`;
  }

  return baseTemplate;
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
  _requestId: string,
  dataOverview: any,
  resourceLinks: string[],
  queryConfig?: any
): string {
  // 获取专业的系统提示
  const customSystemPrompt = queryConfig?.systemPrompt;
  const isAggregateAnalysis = Array.isArray(dataOverview?.queryNames) || dataOverview?.type === 'aggregate-analysis';
  
  // 获取数据类型专项指导
  const dataTypeGuidance = getDataTypeSpecificGuidance(dataOverview?.type || 'default');
  
  // 生成分析报告模板
  const analysisTemplate = generateAnalysisTemplate(prompt, isAggregateAnalysis);

  // 构建数据访问指导
  const dataAccessGuide = buildDataAccessGuide(resourceLinks, dataOverview);
  
  // 构建智能分析指导
  const smartAnalysisGuide = buildSmartAnalysisGuide(prompt, dataOverview);

  return `# 🔬 智能数据分析任务

## 🎯 用户需求
${prompt}

## 👨‍💻 专家角色定位
${customSystemPrompt || DEFAULT_SYSTEM_PROMPT}

${dataTypeGuidance}

## 📊 数据概览
- **数据类型**: ${dataOverview.type || '未知'}
- **数据状态**: ${dataOverview.hasData ? '✅ 有效数据' : '❌ 无数据'}
- **数据规模**: ${formatDataStats(dataOverview.stats)}
- **时间范围**: ${dataOverview.timestamp || '未知'}
${isAggregateAnalysis ? `- **分析范围**: 🔄 综合分析 (${dataOverview.queryNames?.join(', ') || '多数据源'})` : '- **分析范围**: 📊 单项分析'}

${dataAccessGuide}

${smartAnalysisGuide}

${analysisTemplate}

## ⚡ 分析质量要求

### 🎯 核心要求
1. **数据驱动**：所有结论必须基于实际数据支撑
2. **量化分析**：提供具体的数值、百分比、变化幅度
3. **对比分析**：与历史、目标、基准对比
4. **可执行性**：提供具体的行动建议

### 📊 输出标准
- **结构清晰**：使用标题、列表、表格等结构化格式
- **重点突出**：使用emoji、加粗等方式突出重要信息
- **量化结果**：提供具体的数值分析和量化指标
- **实用建议**：提供可执行的优化建议

---
**🔥 开始分析：请基于以上指导，通过Resources获取完整数据，进行深度专业分析，输出结构化的数据分析报告。**`;
}

/**
 * 构建数据访问指导
 */
function buildDataAccessGuide(resourceLinks: string[], _dataOverview: any): string {
  const isChunked = resourceLinks.some(link => link.includes('chunk-'));
  
  if (isChunked) {
    return `## 🔗 数据访问指导
**重要：数据已分块存储，请通过以下Resources获取完整数据进行分析**

${resourceLinks.map((link, index) => `- 📊 **数据块${index + 1}**: ${link}`).join('\n')}

**数据访问建议**：
1. 首先访问所有数据块了解完整数据结构
2. 重点关注数据的时间序列、数值范围和关键字段
3. 识别数据中的趋势、异常和模式
4. 基于实际数据生成量化分析结果`;
  } else {
    return `## 🔗 数据访问
**请通过以下Resource获取数据进行分析**
- 📊 ${resourceLinks[0]}`;
  }
}

/**
 * 构建智能分析指导
 */
function buildSmartAnalysisGuide(_prompt: string, _dataOverview: any): string {
  return `## 🧠 AI自主分析指导

### 第一步：数据探索
1. **数据结构理解**：分析数据的字段、格式、类型
2. **数据质量评估**：检查完整性、准确性、一致性  
3. **数据特征识别**：识别关键指标、时间序列特征、数值范围

### 第二步：深度分析
1. **趋势分析**：识别数据趋势、周期性、季节性
2. **异常检测**：发现异常值、异常模式、异常时间段
3. **关联分析**：分析不同指标间的关联关系
4. **模式识别**：识别数据中的规律和模式

### 第三步：专业洞察
1. **业务价值挖掘**：从数据中发现业务洞察
2. **问题识别**：识别潜在问题和风险
3. **机会发现**：发现改进和优化机会
4. **预测分析**：基于历史数据预测趋势

### 第四步：行动建议
1. **立即行动**：需要立即采取的关键行动
2. **短期改进**：1-4周内可实施的改进措施
3. **长期策略**：长期发展策略和投资建议`;
}

/**
 * 格式化数据统计信息
 */
function formatDataStats(stats: any): string {
  if (!stats) return '统计信息不可用';
  
  const parts = [];
  if (stats.seriesCount) parts.push(`${stats.seriesCount}个时序`);
  if (stats.totalDataPoints) parts.push(`${stats.totalDataPoints}个数据点`);
  if (stats.totalRows) parts.push(`${stats.totalRows}行数据`);
  if (stats.totalHits) parts.push(`${stats.totalHits}条记录`);
  if (stats.tableCount) parts.push(`${stats.tableCount}个表格`);
  if (stats.columnCount) parts.push(`${stats.columnCount}个字段`);
  
  return parts.length > 0 ? parts.join(', ') : '统计信息不可用';
}
