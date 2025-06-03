import type { ExtractedData, QueryConfig } from '../types/index.js';
/**
 * 使用AI分析监控数据
 */
export declare function analyzeWithAI(prompt: string, data: ExtractedData, globalConfig?: QueryConfig, queryConfig?: {
    systemPrompt?: string;
    aiService?: any;
}): Promise<string | null>;
/**
 * 为客户端AI格式化分析上下文
 */
export declare function formatDataForClientAI(prompt: string, data: ExtractedData): string;
