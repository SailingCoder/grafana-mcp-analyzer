/**
 * 存储请求信息
 */
export declare function storeRequestInfo(sessionId: string, requestId: string, requestInfo: Record<string, any>): Promise<string>;
/**
 * 获取请求信息
 */
export declare function getRequestInfo(sessionId: string, requestId: string): Promise<Record<string, any>>;
/**
 * 列出会话中的所有请求
 */
export declare function listSessionRequests(sessionId: string): Promise<Array<Record<string, any>>>;
/**
 * 删除请求
 */
export declare function deleteRequest(sessionId: string, requestId: string): Promise<boolean>;
