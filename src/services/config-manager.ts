import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { QueryConfig } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_CONFIG_PATH = path.resolve(__dirname, '../../config/query-config.simple.js');

/**
 * 加载配置
 */
export async function loadConfig(configPath?: string): Promise<QueryConfig> {
  try {
    const resolvedPath = configPath 
      ? path.resolve(process.cwd(), configPath)
      : DEFAULT_CONFIG_PATH;
    
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`配置文件不存在: ${resolvedPath}`);
    }
    
    const fileUrl = `file://${resolvedPath}`;
    const configModule = await import(fileUrl);
    const loadedConfig = configModule.default || configModule;
    
    if (!loadedConfig || typeof loadedConfig !== 'object') {
      throw new Error('配置文件格式无效');
    }
    
    console.error('✅ 配置加载成功，包含查询:', Object.keys(loadedConfig.queries || {}).length, '个');
    return loadedConfig;
    
  } catch (error: any) {
    console.warn('⚠️ 配置文件加载失败，使用默认配置:', error.message);
    return {
      baseUrl: 'https://your-grafana-instance.com',
      defaultHeaders: { 'Content-Type': 'application/json' },
      queries: {}
    };
  }
}

/**
 * 保存配置
 */
export async function saveConfig(config: QueryConfig, configPath?: string): Promise<boolean> {
  try {
    const resolvedPath = configPath 
      ? path.resolve(process.cwd(), configPath)
      : DEFAULT_CONFIG_PATH;
    
    // 创建配置文件内容
    const configContent = `export default ${JSON.stringify(config, null, 2)};`;
    
    // 确保目录存在
    const configDir = path.dirname(resolvedPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // 写入配置文件
    await fs.promises.writeFile(resolvedPath, configContent, 'utf-8');
    
    console.error(`✅ 配置已保存至: ${resolvedPath}`);
    return true;
    
  } catch (error) {
    console.error('❌ 保存配置失败:', error);
    return false;
  }
}

/**
 * 获取配置文件路径
 */
export function getConfigPath(): string {
  return process.env['CONFIG_PATH'] || DEFAULT_CONFIG_PATH;
}

/**
 * 验证配置
 */
export function validateConfig(config: QueryConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 基本验证
  if (!config) {
    errors.push('配置不能为空');
    return { valid: false, errors };
  }
  
  // 检查必要字段
  if (!config.baseUrl) {
    errors.push('缺少baseUrl配置');
  }
  
  // 检查查询配置
  if (config.queries) {
    Object.entries(config.queries).forEach(([name, query]) => {
      if (!query.url) {
        errors.push(`查询 "${name}" 缺少url配置`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
} 