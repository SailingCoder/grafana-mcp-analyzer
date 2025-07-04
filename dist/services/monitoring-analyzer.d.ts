import type { ExtractedData } from '../types/index.js';
/**
 * 生成数据概览
 * 提供数据统计信息而非完整数据内容
 */
export declare function generateDataOverview(data: ExtractedData): any;
/**
 * 为AI提供分析指引，结合查询配置的systemPrompt
 * AI将通过ResourceLinks访问完整数据
 */
export declare function buildAnalysisGuidance(prompt: string, requestId: string, dataOverview: any, resourceLinks: string[], queryConfig?: any): string;
