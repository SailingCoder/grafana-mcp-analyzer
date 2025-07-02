import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// 数据存储根目录
const DATA_STORE_ROOT = path.join(os.homedir(), '.grafana-mcp-analyzer', 'data-store');

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
  maxChunkSize = 1024 * 1024 // 1MB
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
    return { type: 'full', size: dataSize };
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
    
    return { type: 'chunked', totalChunks, size: dataSize };
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
    
    if (dataFiles.length > 0) {
      const dataDir = path.join(DATA_STORE_ROOT, requestId, 'data');
      
      if (dataFiles.includes('full.json')) {
        dataType = 'full';
        const stat = await fs.stat(path.join(dataDir, 'full.json'));
        totalSize = stat.size;
      } else {
        const chunkFiles = dataFiles.filter(f => f.startsWith('chunk-'));
        if (chunkFiles.length > 0) {
          dataType = 'chunked';
          for (const file of chunkFiles) {
            const stat = await fs.stat(path.join(dataDir, file));
            totalSize += stat.size;
          }
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
      hasAnalysis
    };
  } catch (error) {
    throw new Error(`Failed to get request stats: ${requestId}`);
  }
} 