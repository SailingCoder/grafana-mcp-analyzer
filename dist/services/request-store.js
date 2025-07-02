import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_STORAGE_DIR = path.resolve(__dirname, '../../.data-store');
const SESSIONS_DIR = path.join(BASE_STORAGE_DIR, 'sessions');
// 确保存储目录存在
if (!fs.existsSync(BASE_STORAGE_DIR)) {
    fs.mkdirSync(BASE_STORAGE_DIR, { recursive: true });
}
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}
/**
 * 存储请求信息
 */
export async function storeRequestInfo(sessionId, requestId, requestInfo) {
    const sessionDir = path.join(SESSIONS_DIR, sessionId);
    const requestsDir = path.join(sessionDir, 'requests');
    if (!fs.existsSync(sessionDir)) {
        throw new Error(`会话不存在: ${sessionId}`);
    }
    if (!fs.existsSync(requestsDir)) {
        fs.mkdirSync(requestsDir, { recursive: true });
    }
    const filePath = path.join(requestsDir, `${requestId}.json`);
    // 添加时间戳
    const requestData = {
        ...requestInfo,
        timestamp: requestInfo.timestamp || new Date().toISOString()
    };
    await fs.promises.writeFile(filePath, JSON.stringify(requestData, null, 2), 'utf-8');
    return filePath;
}
/**
 * 获取请求信息
 */
export async function getRequestInfo(sessionId, requestId) {
    const filePath = path.join(SESSIONS_DIR, sessionId, 'requests', `${requestId}.json`);
    try {
        const data = await fs.promises.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        throw new Error(`无法获取请求信息: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * 列出会话中的所有请求
 */
export async function listSessionRequests(sessionId) {
    const requestsDir = path.join(SESSIONS_DIR, sessionId, 'requests');
    if (!fs.existsSync(requestsDir)) {
        return [];
    }
    try {
        const files = await fs.promises.readdir(requestsDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        const requests = await Promise.all(jsonFiles.map(async (file) => {
            const filePath = path.join(requestsDir, file);
            const data = await fs.promises.readFile(filePath, 'utf-8');
            const requestInfo = JSON.parse(data);
            return {
                id: file.replace('.json', ''),
                ...requestInfo
            };
        }));
        // 按时间戳排序，最新的在前
        return requests.sort((a, b) => {
            const timeA = new Date(a.timestamp || 0).getTime();
            const timeB = new Date(b.timestamp || 0).getTime();
            return timeB - timeA;
        });
    }
    catch (error) {
        console.error(`获取会话 ${sessionId} 的请求列表失败:`, error);
        return [];
    }
}
/**
 * 删除请求
 */
export async function deleteRequest(sessionId, requestId) {
    const filePath = path.join(SESSIONS_DIR, sessionId, 'requests', `${requestId}.json`);
    try {
        if (!fs.existsSync(filePath)) {
            return false;
        }
        await fs.promises.unlink(filePath);
        return true;
    }
    catch (error) {
        console.error(`删除请求 ${requestId} 失败:`, error);
        return false;
    }
}
//# sourceMappingURL=request-store.js.map