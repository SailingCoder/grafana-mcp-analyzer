import type { ExtractedData } from '../types/index.js';
/**
 * 生成数据概览
 * 提供数据统计信息而非完整数据内容
 */
export declare function generateDataOverview(data: ExtractedData): any;
/**
 * 为AI提供专业的DevOps分析指引，结合查询配置的systemPrompt
 * 针对不同数据类型和分析场景提供专门的分析方法论
 */
export declare function buildAnalysisGuidance(prompt: string, requestId: string, dataOverview: any, resourceLinks: string[], queryConfig?: any): string;
