import type { QueryConfig } from '../types/index.js';
/**
 * 加载配置
 */
export declare function loadConfig(configPath?: string): Promise<QueryConfig>;
/**
 * 保存配置
 */
export declare function saveConfig(config: QueryConfig, configPath?: string): Promise<boolean>;
/**
 * 获取配置文件路径
 */
export declare function getConfigPath(): string;
/**
 * 验证配置
 */
export declare function validateConfig(config: QueryConfig): {
    valid: boolean;
    errors: string[];
};
