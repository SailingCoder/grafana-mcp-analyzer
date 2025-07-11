import crypto from 'crypto';

/**
 * 查询缓存管理器
 * 提供内存缓存功能，减少重复查询，提高性能
 */
export class QueryCacheManager {
  private cache = new Map<string, { data: any, timestamp: number, ttl: number }>();
  private maxCacheSize: number;
  private debug: boolean;

  constructor(maxCacheSize: number = 100, debug: boolean = false) {
    this.maxCacheSize = maxCacheSize;
    this.debug = debug;
  }

  /**
   * 获取缓存的查询结果
   * @param queryConfig 查询配置
   * @returns 缓存的结果或null
   */
  async getCachedResult(queryConfig: any): Promise<any | null> {
    const cacheKey = this.generateCacheKey(queryConfig);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      if (this.debug) {
        console.log(`🔍 缓存命中: ${cacheKey.substring(0, 8)}...`);
      }
      return cached.data;
    }
    
    if (this.debug && cached) {
      console.log(`⏱️ 缓存过期: ${cacheKey.substring(0, 8)}...`);
    }
    
    return null;
  }

  /**
   * 设置缓存的查询结果
   * @param queryConfig 查询配置
   * @param data 查询结果数据
   * @param ttl 缓存有效期（毫秒）
   */
  async setCachedResult(queryConfig: any, data: any, ttl: number = 300000): Promise<void> {
    const cacheKey = this.generateCacheKey(queryConfig);
    
    // 缓存清理：如果达到最大缓存大小，删除最旧的项
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldestCache();
    }
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    if (this.debug) {
      console.log(`💾 缓存设置: ${cacheKey.substring(0, 8)}...`);
    }
  }

  /**
   * 清除特定查询的缓存
   * @param queryConfig 查询配置
   */
  invalidateCache(queryConfig: any): void {
    const cacheKey = this.generateCacheKey(queryConfig);
    this.cache.delete(cacheKey);
    
    if (this.debug) {
      console.log(`🗑️ 缓存失效: ${cacheKey.substring(0, 8)}...`);
    }
  }

  /**
   * 清除所有缓存
   */
  clearAllCache(): void {
    this.cache.clear();
    if (this.debug) {
      console.log('🧹 已清除所有缓存');
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { size: number, keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()).map(key => key.substring(0, 8) + '...')
    };
  }

  /**
   * 生成缓存键
   * @param queryConfig 查询配置
   * @returns 缓存键
   */
  private generateCacheKey(queryConfig: any): string {
    // 规范化查询配置：移除可能变化但不影响结果的字段
    const normalizedConfig = this.normalizeQueryConfig(queryConfig);
    
    // 使用SHA-256生成一致的哈希
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(normalizedConfig));
    return hash.digest('hex');
  }

  /**
   * 规范化查询配置，移除不相关字段
   * @param queryConfig 查询配置
   * @returns 规范化的查询配置
   */
  private normalizeQueryConfig(queryConfig: any): any {
    // 深拷贝以避免修改原始对象
    const config = JSON.parse(JSON.stringify(queryConfig));
    
    // 移除不影响查询结果的字段
    if (config.timestamp) delete config.timestamp;
    if (config.sessionId) delete config.sessionId;
    if (config.requestId) delete config.requestId;
    
    return config;
  }

  /**
   * 驱逐最旧的缓存项
   */
  private evictOldestCache(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    // 找到最旧的缓存项
    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }
    
    // 删除最旧的缓存项
    if (oldestKey) {
      this.cache.delete(oldestKey);
      if (this.debug) {
        console.log(`♻️ 缓存清理: ${oldestKey.substring(0, 8)}...`);
      }
    }
  }
}

// 创建单例实例
export const cacheManager = new QueryCacheManager(
  parseInt(process.env.MAX_CACHE_SIZE || '100'),
  process.env.DEBUG_CACHE === 'true'
); 