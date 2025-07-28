import fs from 'fs';
import path from 'path';
import os from 'os';

// 使用用户家目录，与data-store.ts保持一致
const BASE_STORAGE_DIR = path.join(os.homedir(), '.grafana-mcp-analyzer', 'data-store');
const CACHE_DIR = path.join(BASE_STORAGE_DIR, 'cache');
const CACHE_INDEX_FILE = path.join(CACHE_DIR, 'cache-index.json');

/**
 * 确保缓存目录和索引文件存在
 */
function ensureCacheSystem(): void {
  try {
    // 确保基础存储目录存在
    if (!fs.existsSync(BASE_STORAGE_DIR)) {
      fs.mkdirSync(BASE_STORAGE_DIR, { recursive: true });
      console.error('📁 创建基础存储目录:', BASE_STORAGE_DIR);
    }
    
    // 确保缓存目录存在
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      console.error('📁 创建缓存目录:', CACHE_DIR);
    }
    
    // 确保缓存索引文件存在
    if (!fs.existsSync(CACHE_INDEX_FILE)) {
      const initialIndex = {};
      fs.writeFileSync(CACHE_INDEX_FILE, JSON.stringify(initialIndex, null, 2), 'utf-8');
      console.error('📄 创建缓存索引文件:', CACHE_INDEX_FILE);
    }
  } catch (error) {
    console.error('❌ 缓存系统初始化失败:', error);
    throw new Error(`缓存系统初始化失败: ${error}`);
  }
}

// 在模块加载时确保缓存系统存在
ensureCacheSystem();

/**
 * 检查并初始化缓存系统
 * 供其他模块调用的公开函数
 */
export function checkAndInitializeCache(): void {
  try {
    ensureCacheSystem();
    console.error('✅ 缓存系统检查完成');
  } catch (error) {
    console.error('❌ 缓存系统检查失败:', error);
    throw error;
  }
}

export interface CacheEntry {
  id: string;
  queryName: string;
  queryConfig: any;
  requestId: string;
  dataSize: number;
  chunks: number;
  created: string;
  lastAccessed: string;
  accessCount: number;
  expiresAt: string;
  metadata: {
    prompt?: string;
    sessionId?: string;
    dataType: string;
    storageType: string;
  };
}

export interface CacheIndex {
  [cacheId: string]: CacheEntry;
}

/**
 * 生成缓存ID
 * 确保不同查询名称生成不同的缓存ID，即使配置相似
 */
function generateCacheId(queryName: string, queryConfig: any): string {
  // 将查询名称作为缓存ID的一部分，确保不同查询名称生成不同的缓存
  const configHash = JSON.stringify(queryConfig).replace(/[^a-zA-Z0-9]/g, '');
  const queryNameHash = queryName.replace(/[^a-zA-Z0-9]/g, '');
  return `cache-${queryNameHash}-${configHash.substring(0, 8)}`;
}

/**
 * 检查缓存是否有效
 */
function isCacheValid(entry: CacheEntry): boolean {
  const now = new Date();
  const expiresAt = new Date(entry.expiresAt);
  return now < expiresAt;
}

/**
 * 获取缓存索引
 */
async function getCacheIndex(): Promise<CacheIndex> {
  try {
    // 确保缓存系统存在
    ensureCacheSystem();
    
    if (!fs.existsSync(CACHE_INDEX_FILE)) {
      console.error('⚠️ 缓存索引文件不存在，创建新索引');
      return {};
    }
    
    const data = await fs.promises.readFile(CACHE_INDEX_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ 读取缓存索引失败，创建新索引:', error);
    // 尝试重新创建索引文件
    try {
      const initialIndex = {};
      await fs.promises.writeFile(CACHE_INDEX_FILE, JSON.stringify(initialIndex, null, 2), 'utf-8');
      console.error('✅ 重新创建缓存索引文件成功');
      return initialIndex;
    } catch (writeError) {
      console.error('❌ 重新创建缓存索引文件失败:', writeError);
      return {};
    }
  }
}

/**
 * 保存缓存索引
 */
async function saveCacheIndex(index: CacheIndex): Promise<void> {
  try {
    // 确保缓存系统存在
    ensureCacheSystem();
    
    await fs.promises.writeFile(CACHE_INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
  } catch (error) {
    console.error('❌ 保存缓存索引失败:', error);
    throw new Error(`保存缓存索引失败: ${error}`);
  }
}

/**
 * 查找有效缓存
 */
export async function findValidCache(queryName: string, queryConfig: any): Promise<CacheEntry | null> {
  const cacheId = generateCacheId(queryName, queryConfig);
  const index = await getCacheIndex();
  
  const entry = index[cacheId];
  if (!entry) {
    return null;
  }
  
  if (!isCacheValid(entry)) {
    // 缓存已过期，删除
    await deleteCache(cacheId);
    return null;
  }
  
  // 更新访问信息
  entry.lastAccessed = new Date().toISOString();
  entry.accessCount += 1;
  index[cacheId] = entry;
  await saveCacheIndex(index);
  
  return entry;
}

/**
 * 创建缓存条目
 */
export async function createCache(
  queryName: string, 
  queryConfig: any, 
  requestId: string, 
  dataSize: number, 
  chunks: number,
  metadata: any
): Promise<string> {
  const cacheId = generateCacheId(queryName, queryConfig);
  const now = new Date();
  
  // 设置缓存过期时间（默认24小时）
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  const entry: CacheEntry = {
    id: cacheId,
    queryName,
    queryConfig,
    requestId,
    dataSize,
    chunks,
    created: now.toISOString(),
    lastAccessed: now.toISOString(),
    accessCount: 1,
    expiresAt: expiresAt.toISOString(),
    metadata: {
      ...metadata,
      dataType: metadata.dataType || 'unknown',
      storageType: metadata.storageType || 'unknown'
    }
  };
  
  const index = await getCacheIndex();
  index[cacheId] = entry;
  await saveCacheIndex(index);
  
  return cacheId;
}

/**
 * 删除缓存
 */
export async function deleteCache(cacheId: string): Promise<boolean> {
  try {
    const index = await getCacheIndex();
    if (index[cacheId]) {
      delete index[cacheId];
      await saveCacheIndex(index);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`删除缓存 ${cacheId} 失败:`, error);
    return false;
  }
}

/**
 * 清理过期缓存
 */
export async function cleanupExpiredCache(): Promise<number> {
  const index = await getCacheIndex();
  let cleanedCount = 0;
  
  for (const [cacheId, entry] of Object.entries(index)) {
    if (!isCacheValid(entry)) {
      delete index[cacheId];
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    await saveCacheIndex(index);
  }
  
  return cleanedCount;
}

/**
 * 列出所有缓存
 */
export async function listCache(limit: number = 20): Promise<CacheEntry[]> {
  const index = await getCacheIndex();
  
  return Object.values(index)
    .filter(entry => isCacheValid(entry))
    .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
    .slice(0, limit);
}

/**
 * 获取缓存统计信息
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  validEntries: number;
  totalSize: number;
  averageAccessCount: number;
}> {
  const index = await getCacheIndex();
  const validEntries = Object.values(index).filter(entry => isCacheValid(entry));
  
  const totalSize = validEntries.reduce((sum, entry) => sum + entry.dataSize, 0);
  const averageAccessCount = validEntries.length > 0 
    ? validEntries.reduce((sum, entry) => sum + entry.accessCount, 0) / validEntries.length 
    : 0;
  
  return {
    totalEntries: Object.keys(index).length,
    validEntries: validEntries.length,
    totalSize,
    averageAccessCount: Math.round(averageAccessCount * 100) / 100
  };
} 