import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { SessionInfo } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_STORAGE_DIR = path.resolve(__dirname, '../../.data-store');
const SESSIONS_DIR = path.join(BASE_STORAGE_DIR, 'sessions');
const INDEXES_DIR = path.join(BASE_STORAGE_DIR, 'indexes');

// 确保目录存在
[SESSIONS_DIR, INDEXES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * 创建新会话
 */
export async function createSession(metadata: Record<string, any> = {}): Promise<string> {
  const sessionId = `session-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  const sessionDir = path.join(SESSIONS_DIR, sessionId);
  
  fs.mkdirSync(sessionDir);
  fs.mkdirSync(path.join(sessionDir, 'requests'));
  fs.mkdirSync(path.join(sessionDir, 'responses'));
  
  const sessionMetadata: SessionInfo = {
    id: sessionId,
    created: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    requestCount: 0,
    ...metadata
  };
  
  await fs.promises.writeFile(
    path.join(sessionDir, 'metadata.json'),
    JSON.stringify(sessionMetadata, null, 2),
    'utf-8'
  );
  
  // 更新会话索引
  await updateSessionIndex(sessionId, sessionMetadata);
  
  return sessionId;
}

/**
 * 更新会话索引
 */
async function updateSessionIndex(sessionId: string, metadata: SessionInfo): Promise<void> {
  const indexPath = path.join(INDEXES_DIR, 'sessions-index.json');
  let index: Record<string, Partial<SessionInfo>> = {};
  
  try {
    if (fs.existsSync(indexPath)) {
      const data = await fs.promises.readFile(indexPath, 'utf-8');
      index = JSON.parse(data);
    }
  } catch (error) {
    console.error('读取会话索引失败，创建新索引', error);
  }
  
  index[sessionId] = {
    created: metadata.created,
    lastUpdated: metadata.lastUpdated,
    requestCount: metadata.requestCount,
    description: metadata.description
  };
  
  await fs.promises.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
}

/**
 * 获取会话信息
 */
export async function getSessionInfo(sessionId: string): Promise<SessionInfo> {
  const metadataPath = path.join(SESSIONS_DIR, sessionId, 'metadata.json');
  
  try {
    const data = await fs.promises.readFile(metadataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`无法获取会话信息: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 更新会话信息
 */
export async function updateSessionInfo(sessionId: string, updates: Partial<SessionInfo>): Promise<SessionInfo> {
  const metadataPath = path.join(SESSIONS_DIR, sessionId, 'metadata.json');
  
  try {
    const data = await fs.promises.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(data) as SessionInfo;
    
    const updatedMetadata: SessionInfo = {
      ...metadata,
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    await fs.promises.writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2), 'utf-8');
    await updateSessionIndex(sessionId, updatedMetadata);
    
    return updatedMetadata;
  } catch (error) {
    throw new Error(`无法更新会话信息: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 列出所有会话
 */
export async function listSessions(limit: number = 10): Promise<Array<SessionInfo>> {
  const indexPath = path.join(INDEXES_DIR, 'sessions-index.json');
  
  try {
    if (!fs.existsSync(indexPath)) {
      return [];
    }
    
    const data = await fs.promises.readFile(indexPath, 'utf-8');
    const index: Record<string, Partial<SessionInfo>> = JSON.parse(data);
    
    return Object.entries(index)
      .map(([id, metadata]) => ({ 
        id, 
        created: metadata.created || new Date(0).toISOString(),
        lastUpdated: metadata.lastUpdated || new Date(0).toISOString(),
        requestCount: metadata.requestCount || 0,
        description: metadata.description
      } as SessionInfo))
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('列出会话失败', error);
    return [];
  }
}

/**
 * 删除会话
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  const sessionDir = path.join(SESSIONS_DIR, sessionId);
  const indexPath = path.join(INDEXES_DIR, 'sessions-index.json');
  
  try {
    // 检查会话是否存在
    if (!fs.existsSync(sessionDir)) {
      throw new Error(`会话不存在: ${sessionId}`);
    }
    
    // 删除会话目录
    await fs.promises.rm(sessionDir, { recursive: true, force: true });
    
    // 更新索引
    if (fs.existsSync(indexPath)) {
      const data = await fs.promises.readFile(indexPath, 'utf-8');
      const index: Record<string, any> = JSON.parse(data);
      
      if (index[sessionId]) {
        delete index[sessionId];
        await fs.promises.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
      }
    }
    
    return true;
  } catch (error) {
    console.error(`删除会话 ${sessionId} 失败:`, error);
    return false;
  }
} 