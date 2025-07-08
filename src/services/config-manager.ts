import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import axios from 'axios';
import os from 'os';
import crypto from 'crypto';
import type { QueryConfig } from '../types/index.js';

// 配置缓存存储目录
const CACHE_DIR = path.join(os.homedir(), '.grafana-mcp-analyzer', 'config-cache');

// 确保缓存目录存在
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * 获取缓存最大年龄（毫秒）
 */
function getCacheMaxAge(): number {
  const cacheMaxAge = parseInt(process.env.CONFIG_MAX_AGE || '300', 10); // 默认5分钟
  return cacheMaxAge * 1000; // 转换为毫秒
}

/**
 * 检查是否禁用缓存
 */
function isCacheDisabled(): boolean {
  return getCacheMaxAge() === 0;
}

/**
 * 清理过期的缓存文件
 */
function cleanupExpiredCache(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    return;
  }
  
  const maxAge = getCacheMaxAge();
  if (maxAge === 0) {
    // 如果禁用缓存，清空所有缓存文件
    const files = fs.readdirSync(CACHE_DIR);
    files.forEach(file => {
      const filePath = path.join(CACHE_DIR, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    });
    console.error('🗑️ 缓存已禁用，清空所有缓存文件');
    return;
  }
  
  // 清理过期的缓存文件
  const files = fs.readdirSync(CACHE_DIR);
  let cleanedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(CACHE_DIR, file);
    if (fs.statSync(filePath).isFile()) {
      const stats = fs.statSync(filePath);
      const cacheAge = Date.now() - stats.mtime.getTime();
      
      if (cacheAge > maxAge) {
        fs.unlinkSync(filePath);
        cleanedCount++;
      }
    }
  });
  
  if (cleanedCount > 0) {
    console.error(`🗑️ 清理了 ${cleanedCount} 个过期缓存文件`);
  }
}

/**
 * 启动时清理缓存
 */
export function initializeCacheCleanup(): void {
  try {
    const cacheMaxAge = parseInt(process.env.CONFIG_MAX_AGE || '300', 10);
    
    if (cacheMaxAge === 0) {
      console.error('⚠️ 配置缓存已禁用 (CONFIG_MAX_AGE=0)');
    } else {
      console.error(`⏰ 配置缓存时间: ${cacheMaxAge}秒`);
    }
    
    cleanupExpiredCache();
  } catch (error) {
    console.error('❌ 缓存清理失败:', error);
  }
}

/**
 * 检查是否为远程URL
 */
function isRemoteUrl(configPath: string): boolean {
  return configPath.startsWith('http://') || configPath.startsWith('https://');
}

/**
 * 验证远程URL的安全性
 */
function validateRemoteUrl(url: string): void {
  // 安全检查：只允许HTTPS
  if (!url.startsWith('https://')) {
    throw new Error('远程配置只支持HTTPS URL，请使用https://协议');
  }
  
  // 检查URL格式
  try {
    new URL(url);
  } catch (error) {
    throw new Error(`无效的URL格式: ${url}`);
  }
}

/**
 * 获取缓存文件路径
 */
function getCacheFilePath(configPath: string): string {
  let hash: string;
  
  if (isRemoteUrl(configPath)) {
    // 远程URL使用URL作为hash源
    hash = crypto.createHash('md5').update(configPath).digest('hex');
  } else {
    // 本地路径使用绝对路径作为hash源
    const absolutePath = path.resolve(configPath);
    hash = crypto.createHash('md5').update(absolutePath).digest('hex');
  }
  
  return path.join(CACHE_DIR, `config-${hash}.js`);
}

/**
 * 检查缓存是否有效
 */
function isCacheValid(cacheFilePath: string): boolean {
  // 如果缓存被禁用，返回false
  if (isCacheDisabled()) {
    return false;
  }
  
  if (!fs.existsSync(cacheFilePath)) {
    return false;
  }
  
  const stats = fs.statSync(cacheFilePath);
  const cacheAge = Date.now() - stats.mtime.getTime();
  const maxAge = getCacheMaxAge();
  
  return cacheAge < maxAge;
}

/**
 * 检查源文件是否比缓存新
 */
function isSourceNewer(sourcePath: string, cacheFilePath: string): boolean {
  if (!fs.existsSync(sourcePath) || !fs.existsSync(cacheFilePath)) {
    return true;
  }
  
  const sourceStats = fs.statSync(sourcePath);
  const cacheStats = fs.statSync(cacheFilePath);
  
  return sourceStats.mtime.getTime() > cacheStats.mtime.getTime();
}

/**
 * 从远程URL获取配置
 */
async function fetchRemoteConfig(url: string): Promise<QueryConfig> {
  validateRemoteUrl(url);
  
  const cacheFilePath = getCacheFilePath(url);
  
  // 检查缓存
  if (isCacheValid(cacheFilePath)) {
    console.error('📦 使用缓存的远程配置');
    return loadConfigFromCache(cacheFilePath);
  }
  
  try {
    console.error('🌐 正在从远程URL获取配置...');
    
    const response = await axios.get(url, {
      timeout: 30000, // 30秒超时
      headers: {
        'User-Agent': 'grafana-mcp-analyzer',
        'Accept': 'application/javascript, text/javascript, */*'
      },
      // 限制响应大小（10MB）
      maxContentLength: 10 * 1024 * 1024,
      maxBodyLength: 10 * 1024 * 1024
    });
    
    if (response.status !== 200) {
      throw new Error(`HTTP请求失败: ${response.status} ${response.statusText}`);
    }
    
    const configContent = response.data;
    if (typeof configContent !== 'string') {
      throw new Error('远程配置必须是JavaScript文本格式');
    }
    
    // 验证配置内容是否看起来像JavaScript
    if (!configContent.includes('module.exports') && !configContent.includes('export')) {
      throw new Error('远程配置文件格式无效，必须是有效的JavaScript文件');
    }
    
    // 如果缓存未禁用，保存到缓存
    if (!isCacheDisabled()) {
      ensureCacheDir();
      fs.writeFileSync(cacheFilePath, configContent, 'utf-8');
      console.error('✅ 远程配置获取成功，已缓存');
    } else {
      console.error('✅ 远程配置获取成功（缓存已禁用）');
    }
    
    // 加载配置
    return loadConfigFromCache(cacheFilePath);
    
  } catch (error: any) {
    // 如果获取失败，尝试使用缓存（即使过期）
    if (fs.existsSync(cacheFilePath)) {
      console.warn('⚠️ 远程配置获取失败，使用过期缓存:', error.message);
      return loadConfigFromCache(cacheFilePath);
    }
    
    throw new Error(`远程配置获取失败: ${error.message}`);
  }
}

/**
 * 从本地路径获取配置（使用缓存）
 */
async function fetchLocalConfig(configPath: string): Promise<QueryConfig> {
  const resolvedPath = path.resolve(process.cwd(), configPath);
  
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`配置文件不存在: ${resolvedPath}`);
  }
  
  const cacheFilePath = getCacheFilePath(configPath);
  
  // 检查缓存是否有效且源文件未更新
  if (isCacheValid(cacheFilePath) && !isSourceNewer(resolvedPath, cacheFilePath)) {
    console.error('📦 使用缓存的本地配置');
    return loadConfigFromCache(cacheFilePath);
  }
  
  try {
    console.error('📁 正在从本地路径加载配置...');
    
    // 读取源文件内容
    const configContent = fs.readFileSync(resolvedPath, 'utf-8');
    
    // 如果缓存未禁用，保存到缓存并从缓存加载
    if (!isCacheDisabled()) {
      ensureCacheDir();
      fs.writeFileSync(cacheFilePath, configContent, 'utf-8');
      console.error('✅ 本地配置加载成功，已缓存');
      return loadConfigFromCache(cacheFilePath);
    } else {
      // 如果缓存被禁用，直接从源文件加载
      console.error('✅ 本地配置加载成功（缓存已禁用）');
      return loadConfigFromSource(resolvedPath);
    }
    
  } catch (error: any) {
    throw new Error(`本地配置加载失败: ${error.message}`);
  }
}

/**
 * 从源文件直接加载配置
 */
async function loadConfigFromSource(sourcePath: string): Promise<QueryConfig> {
  // 使用require加载配置文件（支持用户的CommonJS格式配置）
  // 在ES模块中创建require函数
  const require = createRequire(import.meta.url);
  // 清除require缓存，确保获取最新配置
  delete require.cache[sourcePath];
  
  let loadedConfig;
  try {
    loadedConfig = require(sourcePath);
  } catch (error: any) {
    throw new Error(`配置文件格式错误: ${error.message}。请确保配置文件使用 CommonJS 格式 (module.exports = config)`);
  }
  
  if (!loadedConfig || typeof loadedConfig !== 'object') {
    throw new Error('配置文件格式无效');
  }
  
  return loadedConfig;
}

/**
 * 从缓存文件加载配置
 */
async function loadConfigFromCache(cacheFilePath: string): Promise<QueryConfig> {
  // 使用require加载配置文件（支持用户的CommonJS格式配置）
  // 在ES模块中创建require函数
  const require = createRequire(import.meta.url);
  // 清除require缓存，确保获取最新配置
  delete require.cache[cacheFilePath];
  
  let loadedConfig;
  try {
    loadedConfig = require(cacheFilePath);
  } catch (error: any) {
    throw new Error(`配置文件格式错误: ${error.message}。请确保配置文件使用 CommonJS 格式 (module.exports = config)`);
  }
  
  if (!loadedConfig || typeof loadedConfig !== 'object') {
    throw new Error('配置文件格式无效');
  }
  
  return loadedConfig;
}

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
    
    let loadedConfig: QueryConfig;
    
    // 检查是否为远程URL
    if (isRemoteUrl(configFilePath)) {
      loadedConfig = await fetchRemoteConfig(configFilePath);
    } else {
      // 本地路径也使用缓存机制
      loadedConfig = await fetchLocalConfig(configFilePath);
    }
    
    console.error('✅ 配置加载成功，包含查询:', Object.keys(loadedConfig.queries || {}).length, '个');
    return loadedConfig;
    
  } catch (error: any) {
    // 如果是配置路径相关的错误，直接抛出
    if (error.message.includes('请指定配置文件路径') || 
        error.message.includes('配置文件不存在') ||
        error.message.includes('远程配置获取失败') ||
        error.message.includes('本地配置加载失败') ||
        error.message.includes('远程配置只支持HTTPS')) {
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
    const configContent = `const config = ${JSON.stringify(config, null, 2)};\n\nmodule.exports = config;`;
    
    // 确保目录存在
    const configDir = path.dirname(resolvedPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // 写入配置文件
    await fs.promises.writeFile(resolvedPath, configContent, 'utf-8');
    
    // 清理对应的缓存文件，强制重新加载
    const cacheFilePath = getCacheFilePath(configFilePath);
    if (fs.existsSync(cacheFilePath)) {
      fs.unlinkSync(cacheFilePath);
    }
    
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