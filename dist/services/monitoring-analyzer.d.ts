import type { ExtractedData, QueryConfig } from '../types/index.js';
/**
 * 使用AI服务分析监控数据
 */
export declare function analyzeWithAI(prompt: string, extractedData: ExtractedData, globalConfig?: QueryConfig, queryConfig?: {
    systemPrompt?: string;
    aiService?: any;
}): Promise<string | null>;
/**
 * 格式化数据供客户端AI使用
 */
export declare function formatDataForClientAI(prompt: string, extractedData: ExtractedData): string;
