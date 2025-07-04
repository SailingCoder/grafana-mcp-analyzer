import fs from 'fs';
import path from 'path';
import type { QueryConfig } from '../types/index.js';

/**
 * 加载配置
 */
export async function loadConfig(configPath?: string): Promise<QueryConfig> {
  try {
    // 优先使用传入的路径，其次使用环境变量
    const configFilePath = configPath || process.env['CONFIG_PATH'];
    
    if (!configFilePath) {
      throw new Error('请指定配置文件路径。使用参数传入或设置 CONFIG_PATH 环境变量');
    }
    
    const resolvedPath = path.resolve(process.cwd(), configFilePath);
    
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
    // 如果是配置路径相关的错误，直接抛出
    if (error.message.includes('请指定配置文件路径') || 
        error.message.includes('配置文件不存在')) {
      throw error;
    }
    
    // 其他错误（如解析错误）使用默认配置
    console.warn('⚠️ 配置文件解析失败，使用默认配置:', error.message);
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
    const configFilePath = configPath || process.env['CONFIG_PATH'];
    
    if (!configFilePath) {
      throw new Error('请指定配置文件路径。使用参数传入或设置 CONFIG_PATH 环境变量');
    }
    
    const resolvedPath = path.resolve(process.cwd(), configFilePath);
    
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
  const configPath = process.env['CONFIG_PATH'];
  if (!configPath) {
    throw new Error('请设置 CONFIG_PATH 环境变量指定配置文件路径');
  }
  return configPath;
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