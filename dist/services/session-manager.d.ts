import type { SessionInfo } from '../types/index.js';
/**
 * 创建新会话
 */
export declare function createSession(metadata?: Record<string, any>): Promise<string>;
/**
 * 获取会话信息
 */
export declare function getSessionInfo(sessionId: string): Promise<SessionInfo>;
/**
 * 更新会话信息
 */
export declare function updateSessionInfo(sessionId: string, updates: Partial<SessionInfo>): Promise<SessionInfo>;
/**
 * 列出所有会话
 */
export declare function listSessions(limit?: number): Promise<Array<SessionInfo>>;
/**
 * 删除会话
 */
export declare function deleteSession(sessionId: string): Promise<boolean>;
