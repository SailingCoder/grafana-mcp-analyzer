import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// 数据存储根目录
const DATA_STORE_ROOT = process.env.DATA_STORE_ROOT || 
  path.join(os.homedir(), '.grafana-mcp-analyzer', 'data-store');

// 确保目录存在
async function ensureDir(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// 生成请求ID
export function generateRequestId(): string {
  return `request-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 存储请求元数据
export async function storeRequestMetadata(
  requestId: string, 
  metadata: {
    timestamp: string;
    url: string;
    method?: string;
    params?: Record<string, any>;
    data?: any;
    prompt?: string;
    sessionId?: string;
  }
) {
  const requestDir = path.join(DATA_STORE_ROOT, requestId);
  await ensureDir(requestDir);
  
  const metadataPath = path.join(requestDir, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify({
    id: requestId,
    ...metadata
  }, null, 2));
}

// 获取请求元数据
export async function getRequestMetadata(requestId: string) {
  const metadataPath = path.join(DATA_STORE_ROOT, requestId, 'metadata.json');
  try {
    const content = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Request metadata not found: ${requestId}`);
  }
}

// 存储响应数据
export async function storeResponseData(
  requestId: string,
  data: any,
  maxChunkSize = 500 * 1024 // 500KB - 降低阈值以支持更好的分块
) {
  const requestDir = path.join(DATA_STORE_ROOT, requestId);
  const dataDir = path.join(requestDir, 'data');
  await ensureDir(dataDir);
  
  const dataStr = JSON.stringify(data, null, 2);
  const dataSize = Buffer.byteLength(dataStr, 'utf8');
  
  if (dataSize <= maxChunkSize) {
    // 数据较小，直接存储为完整文件
    const fullPath = path.join(dataDir, 'full.json');
    await fs.writeFile(fullPath, dataStr);
    return { 
      type: 'full', 
      size: dataSize,
      chunks: 1,
      resourceUri: `monitoring-data://${requestId}/data`
    };
  } else {
    // 数据较大，分块存储
    const chunkSize = maxChunkSize;
    const totalChunks = Math.ceil(dataSize / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, dataSize);
      const chunk = dataStr.slice(start, end);
      
      const chunkPath = path.join(dataDir, `chunk-${i}.json`);
      await fs.writeFile(chunkPath, chunk);
    }
    
    return { 
      type: 'chunked', 
      totalChunks, 
      size: dataSize,
      resourceUris: Array.from({ length: totalChunks }, (_, i) => 
        `monitoring-data://${requestId}/chunk-${i}`
      )
    };
  }
}

// 获取响应数据
export async function getResponseData(requestId: string, chunkId?: string) {
  const dataDir = path.join(DATA_STORE_ROOT, requestId, 'data');
  
  if (chunkId) {
    // 获取特定数据块
    const chunkPath = path.join(dataDir, `${chunkId}.json`);
    try {
      const content = await fs.readFile(chunkPath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Data chunk not found: ${requestId}/${chunkId}`);
    }
  } else {
    // 尝试获取完整数据
    const fullPath = path.join(dataDir, 'full.json');
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // 如果没有完整数据，尝试组合分块数据
      try {
        const files = await fs.readdir(dataDir);
        const chunkFiles = files
          .filter(f => f.startsWith('chunk-') && f.endsWith('.json'))
          .sort((a, b) => {
            const aNum = parseInt(a.match(/chunk-(\d+)\.json$/)?.[1] || '0');
            const bNum = parseInt(b.match(/chunk-(\d+)\.json$/)?.[1] || '0');
            return aNum - bNum;
          });
        
        if (chunkFiles.length === 0) {
          throw new Error(`No data found for request: ${requestId}`);
        }
        
        let fullData = '';
        for (const chunkFile of chunkFiles) {
          const chunkPath = path.join(dataDir, chunkFile);
          const chunkContent = await fs.readFile(chunkPath, 'utf-8');
          fullData += chunkContent;
        }
        
        return JSON.parse(fullData);
      } catch (combineError) {
        throw new Error(`Failed to get response data: ${requestId}`);
      }
    }
  }
}

// 列出数据文件
export async function listDataFiles(requestId: string) {
  const dataDir = path.join(DATA_STORE_ROOT, requestId, 'data');
  try {
    const files = await fs.readdir(dataDir);
    return files.filter(f => f.endsWith('.json'));
  } catch (error) {
    return [];
  }
}

// 存储分析结果
export async function storeAnalysis(requestId: string, analysis: any) {
  const requestDir = path.join(DATA_STORE_ROOT, requestId);
  await ensureDir(requestDir);
  
  const analysisPath = path.join(requestDir, 'analysis.json');
  await fs.writeFile(analysisPath, JSON.stringify(analysis, null, 2));
}

/**
 * 安全存储分析结果，确保写入后可读取
 * @param requestId 请求ID
 * @param analysis 分析数据
 * @param timeout 超时时间(毫秒)
 * @returns 存储的分析数据
 */
export async function safeStoreAnalysis(requestId: string, analysis: any, timeout = 15000) {
  // 先存储数据
  await storeAnalysis(requestId, analysis);
  
  // 带超时的验证函数
  const validateWithTimeout = async () => {
    return Promise.race([
      // 验证尝试
      getAnalysis(requestId),
      
      // 超时Promise
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`验证超时: ${timeout}ms内无法读取分析数据`)), timeout)
      )
    ]);
  };
  
  // 执行验证
  try {
    const verifiedData = await validateWithTimeout();
    console.log(`✅ 分析数据已成功存储并验证: ${requestId}`);
    return verifiedData;
  } catch (error: any) {
    throw new Error(`分析数据存储验证失败: ${error.message}`);
  }
}

// 获取分析结果
export async function getAnalysis(requestId: string) {
  const analysisPath = path.join(DATA_STORE_ROOT, requestId, 'analysis.json');
  try {
    const content = await fs.readFile(analysisPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Analysis not found: ${requestId}`);
  }
}

// 列出所有请求
export async function listAllRequests() {
  try {
    await ensureDir(DATA_STORE_ROOT);
    const dirs = await fs.readdir(DATA_STORE_ROOT);
    const requests = [];
    
    for (const dir of dirs) {
      if (dir.startsWith('request-')) {
        try {
          const metadata = await getRequestMetadata(dir);
          requests.push(metadata);
        } catch (error) {
          // 跳过无效的请求目录
        }
      }
    }
    
    return requests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    return [];
  }
}

// 按会话ID列出请求
export async function listRequestsBySession(sessionId: string) {
  const allRequests = await listAllRequests();
  return allRequests.filter(req => req.sessionId === sessionId);
}

// 删除请求数据
export async function deleteRequest(requestId: string) {
  const requestDir = path.join(DATA_STORE_ROOT, requestId);
  try {
    await fs.rm(requestDir, { recursive: true });
    return true;
  } catch (error) {
    return false;
  }
}

// 检查请求是否存在
export async function requestExists(requestId: string) {
  const requestDir = path.join(DATA_STORE_ROOT, requestId);
  try {
    await fs.access(requestDir);
    return true;
  } catch {
    return false;
  }
}

// 获取请求统计信息
export async function getRequestStats(requestId: string) {
  try {
    const metadata = await getRequestMetadata(requestId);
    const dataFiles = await listDataFiles(requestId);
    
    let totalSize = 0;
    let dataType = 'none';
    let resourceUris: string[] = [];
    
    if (dataFiles.length > 0) {
      const dataDir = path.join(DATA_STORE_ROOT, requestId, 'data');
      
      if (dataFiles.includes('full.json')) {
        dataType = 'full';
        const stat = await fs.stat(path.join(dataDir, 'full.json'));
        totalSize = stat.size;
        resourceUris = [`monitoring-data://${requestId}/data`];
      } else {
        const chunkFiles = dataFiles.filter(f => f.startsWith('chunk-'));
        if (chunkFiles.length > 0) {
          dataType = 'chunked';
          for (const file of chunkFiles) {
            const stat = await fs.stat(path.join(dataDir, file));
            totalSize += stat.size;
          }
          resourceUris = chunkFiles.map(f => {
            const chunkNum = f.match(/chunk-(\d+)\.json$/)?.[1];
            return `monitoring-data://${requestId}/chunk-${chunkNum}`;
          });
        }
      }
    }
    
    const hasAnalysis = await fs.access(path.join(DATA_STORE_ROOT, requestId, 'analysis.json'))
      .then(() => true)
      .catch(() => false);
    
    return {
      requestId,
      timestamp: metadata.timestamp,
      prompt: metadata.prompt,
      sessionId: metadata.sessionId,
      dataType,
      dataFiles: dataFiles.length,
      totalSize,
      hasAnalysis,
      resourceUris
    };
  } catch (error) {
    throw new Error(`Failed to get request stats: ${requestId}`);
  }
}

/**
 * 初始化数据清理
 */
export async function initializeDataCleanup(): Promise<void> {
  try {
    const dataExpiryHours = parseInt(process.env.DATA_EXPIRY_HOURS || '24', 10);
    console.error(`⏰ 数据清理配置: ${dataExpiryHours}小时后自动清理`);
    
    // 启动时立即执行一次清理
    const initialCleanup = await cleanupExpiredData(false, dataExpiryHours);
    if (initialCleanup > 0) {
      console.error(`🗑️ 服务启动清理完成，删除了 ${initialCleanup} 个过期请求`);
    }
    
    // 设置定时清理任务，每小时执行一次
    setInterval(async () => {
      try {
        const deletedCount = await cleanupExpiredData(false, dataExpiryHours);
        if (deletedCount > 0) {
          console.error(`🗑️ 定时清理完成，删除了 ${deletedCount} 个过期请求`);
        }
      } catch (error) {
        console.error('❌ 定时数据清理失败:', error);
      }
    }, 60 * 60 * 1000); // 1小时 = 60 * 60 * 1000毫秒
    
  } catch (error) {
    console.error('❌ 数据清理初始化失败:', error);
  }
}

// 清理过期数据
export async function cleanupExpiredData(forceCleanAll = false, maxAgeHours = 24) {
  try {
    await ensureDir(DATA_STORE_ROOT);
    const dirs = await fs.readdir(DATA_STORE_ROOT);
    let deletedCount = 0;
    
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000; // 转换为毫秒
    
    for (const dir of dirs) {
      if (dir.startsWith('request-')) {
        const requestDir = path.join(DATA_STORE_ROOT, dir);
        
        try {
          if (forceCleanAll) {
            // 强制清理所有数据
            await fs.rm(requestDir, { recursive: true });
            deletedCount++;
            console.log(`🗑️ 删除请求目录: ${dir}`);
          } else {
            // 根据时间清理过期数据
            const metadata = await getRequestMetadata(dir);
            const requestTime = new Date(metadata.timestamp).getTime();
            
            if (now - requestTime > maxAge) {
              await fs.rm(requestDir, { recursive: true });
              deletedCount++;
              console.log(`🗑️ 删除过期请求: ${dir} (${metadata.timestamp})`);
            }
          }
        } catch (error) {
          console.warn(`⚠️ 清理请求 ${dir} 失败:`, error);
        }
      }
    }
    
    return deletedCount;
  } catch (error) {
    console.error('❌ 数据清理失败:', error);
    return 0;
  }
}

// 获取数据存储统计信息
export async function getDataStoreStats() {
  try {
    await ensureDir(DATA_STORE_ROOT);
    const dirs = await fs.readdir(DATA_STORE_ROOT);
    
    let totalRequests = 0;
    let totalSize = 0;
    let oldestRequest: string | null = null;
    let newestRequest: string | null = null;
    let oldestTime = Infinity;
    let newestTime = 0;
    
    for (const dir of dirs) {
      if (dir.startsWith('request-')) {
        totalRequests++;
        
        try {
          const requestDir = path.join(DATA_STORE_ROOT, dir);
          
          // 计算目录大小
          const dirSize = await getDirSize(requestDir);
          totalSize += dirSize;
          
          // 获取请求时间
          const metadata = await getRequestMetadata(dir);
          const requestTime = new Date(metadata.timestamp).getTime();
          
          if (requestTime < oldestTime) {
            oldestTime = requestTime;
            oldestRequest = dir;
          }
          
          if (requestTime > newestTime) {
            newestTime = requestTime;
            newestRequest = dir;
          }
        } catch (error) {
          // 跳过无效的请求目录
        }
      }
    }
    
    return {
      totalRequests,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      oldestRequest: oldestRequest ? {
        id: oldestRequest,
        timestamp: new Date(oldestTime).toISOString()
      } : null,
      newestRequest: newestRequest ? {
        id: newestRequest,
        timestamp: new Date(newestTime).toISOString()
      } : null,
      storageRoot: DATA_STORE_ROOT
    };
  } catch (error) {
    console.error('❌ 获取数据存储统计失败:', error);
    return {
      totalRequests: 0,
      totalSize: 0,
      totalSizeMB: '0.00',
      oldestRequest: null,
      newestRequest: null,
      storageRoot: DATA_STORE_ROOT
    };
  }
}

// 计算目录大小的辅助函数
async function getDirSize(dirPath: string): Promise<number> {
  let totalSize = 0;
  
  try {
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        totalSize += await getDirSize(itemPath);
      } else {
        totalSize += stat.size;
      }
    }
  } catch (error) {
    // 忽略错误，返回当前累计大小
  }
  
  return totalSize;
} 