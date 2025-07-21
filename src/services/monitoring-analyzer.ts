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
function generateAnalysisTemplate(prompt: string, hasAggregateData: boolean = false): string {
  // 使用prompt参数，避免未使用参数的错误
  const promptLength = prompt?.length || 0;
  console.log(`生成分析模板，提示长度: ${promptLength}字符，聚合数据: ${hasAggregateData}`);
  
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
  resourceLinks: string[],
  queryConfig?: any
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
- **数据类型**: ${dataOverview?.type || '未知'}
- **有效数据**: ${dataOverview?.hasData ? '是' : '否'}
- **HTTP状态**: ${dataOverview?.status || '未知'}
- **采集时间**: ${dataOverview?.timestamp || '未知'}
- **数据规模**: ${dataOverview?.stats ? JSON.stringify(dataOverview?.stats, null, 2) : '统计信息不可用'}
${isAggregateAnalysis ? `- **分析类型**: 综合分析 (${dataOverview?.queryNames?.join(', ') || '多数据源'})` : '- **分析类型**: 单项分析'}

  ## 数据访问资源
  **重要：必须通过ResourceLinks获取完整的原始数据进行分析**
  ${resourceLinks.map(link => `- ${link}`).join('\n')}

  **数据获取方式**：
  直接访问上述ResourceLinks获取实际数据

  **关键要求**：
  1. **必须获取实际数据**：通过ResourceLinks获取真实的数据值，不要只分析配置
  2. **基于数据回答**：所有结论必须基于实际数据进行分析
  3. **直接回答问题**：用户关心的是"现在怎么样"，不是"配置怎么样"
  4. **提供具体数值**：给出具体的百分比、数值等量化信息

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
  resourceLinks: string[],
  queryConfig?: any
): string {
  const customSystemPrompt = queryConfig?.systemPrompt;
  const promptMode = queryConfig?.promptMode || 'default'; // 默认使用专业全面的分析
  const isAggregateAnalysis = Array.isArray(dataOverview?.queryNames) || dataOverview?.type === 'aggregate-analysis';
  
  // Custom模式：用户想要自定义，简洁实用
  if (promptMode === 'custom') {
    const systemPrompt = customSystemPrompt || '您是数据分析专家，请进行专业的数据分析。';
    
    // 构建必要的数据上下文，但保持简洁
    const resourceLinksDisplay = resourceLinks.length > 0 
      ? resourceLinks.map(link => `- ${link}`).join('\n')
      : '- 暂无数据资源';
      
    return `${systemPrompt}

## 分析目标
${prompt}

## 数据信息
- **请求ID**: ${requestId}
- **数据类型**: ${dataOverview?.type || '未知'}
- **数据状态**: ${dataOverview?.hasData ? '有效数据已存储' : '无有效数据'}
- **HTTP状态**: ${dataOverview?.status || '未知'}
- **采集时间**: ${dataOverview?.timestamp || '未知'}
${isAggregateAnalysis ? '- **分析类型**: 综合分析' : '- **分析类型**: 单项分析'}

  ## 分析数据源
  **重要：必须通过ResourceLinks获取并分析完整数据**
  ${resourceLinksDisplay}

  **数据获取方式**：
  直接访问上述ResourceLinks获取实际数据

  ## 分析要求
  1. **获取数据**: 使用ResourceLinks获取完整数据
  2. **深入分析**: 基于实际数据进行全面分析
  3. **量化结论**: 提供具体的数值和量化指标
  4. **直接回答**: 针对用户需求"${prompt}"给出直接回答
  5. **避免推测**: 所有结论必须基于实际数据，不要基于配置推测

---
**开始分析**: 请通过ResourceLinks获取数据并进行专业分析。`;
  }
  
  // Default模式：专业全面的分析（使用buildFullAnalysisGuidance）
  return buildFullAnalysisGuidance(prompt, requestId, dataOverview, resourceLinks, queryConfig);
}
