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
 * @param prompt 用户的分析需求描述
 * @param data 从Grafana提取的监控数据
 * @param config 查询配置，包含数据处理策略
 * @returns 格式化后的分析上下文字符串
 */
export declare function formatDataForClientAI(prompt: string, data: ExtractedData, config?: QueryConfig): string;
