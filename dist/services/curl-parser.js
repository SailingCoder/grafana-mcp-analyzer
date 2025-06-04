/**
 * curl命令解析器
 * 将curl命令转换为HttpRequest对象
 */
/**
 * 解析curl命令并转换为HttpRequest对象
 *
 * @param curlCommand curl命令字符串
 * @returns 解析后的HttpRequest对象
 */
export function parseCurlCommand(curlCommand) {
    // 移除开头的curl命令和多余空格
    let command = curlCommand.trim();
    if (command.startsWith('curl ')) {
        command = command.substring(5);
    }
    const request = {
        url: '',
        method: 'GET', // 默认方法
        headers: {},
        data: undefined,
        params: {},
        timeout: undefined
    };
    // 使用正则表达式解析各个参数
    // 这里需要处理引号和转义字符
    const tokens = tokenizeCurlCommand(command);
    let i = 0;
    while (i < tokens.length) {
        const token = tokens[i];
        if (token === '-X' || token === '--request') {
            // 请求方法
            if (i + 1 < tokens.length) {
                const method = tokens[i + 1].toUpperCase();
                if (isValidHttpMethod(method)) {
                    request.method = method;
                }
                i += 2;
            }
            else {
                i++;
            }
        }
        else if (token === '-H' || token === '--header') {
            // 请求头
            if (i + 1 < tokens.length) {
                const headerStr = tokens[i + 1];
                const colonIndex = headerStr.indexOf(':');
                if (colonIndex > 0) {
                    const headerName = headerStr.substring(0, colonIndex).trim();
                    const headerValue = headerStr.substring(colonIndex + 1).trim();
                    request.headers[headerName] = headerValue;
                }
                i += 2;
            }
            else {
                i++;
            }
        }
        else if (token === '-d' || token === '--data' || token === '--data-raw') {
            // 请求体数据
            if (i + 1 < tokens.length) {
                const dataStr = tokens[i + 1];
                // 尝试解析为JSON，如果失败则作为字符串
                try {
                    request.data = JSON.parse(dataStr);
                }
                catch {
                    request.data = dataStr;
                }
                // 如果有数据，默认方法改为POST
                if (request.method === 'GET') {
                    request.method = 'POST';
                }
                i += 2;
            }
            else {
                i++;
            }
        }
        else if (token === '--connect-timeout' || token === '--max-time') {
            // 超时设置
            if (i + 1 < tokens.length) {
                const timeoutStr = tokens[i + 1];
                const timeout = parseInt(timeoutStr, 10);
                if (!isNaN(timeout)) {
                    request.timeout = timeout * 1000; // 转换为毫秒
                }
                i += 2;
            }
            else {
                i++;
            }
        }
        else if (token === '-u' || token === '--user') {
            // 用户认证
            if (i + 1 < tokens.length) {
                const userStr = tokens[i + 1];
                const encodedAuth = Buffer.from(userStr).toString('base64');
                request.headers['Authorization'] = `Basic ${encodedAuth}`;
                i += 2;
            }
            else {
                i++;
            }
        }
        else if (token === '-A' || token === '--user-agent') {
            // User-Agent
            if (i + 1 < tokens.length) {
                request.headers['User-Agent'] = tokens[i + 1];
                i += 2;
            }
            else {
                i++;
            }
        }
        else if (token === '-e' || token === '--referer') {
            // Referer
            if (i + 1 < tokens.length) {
                request.headers['Referer'] = tokens[i + 1];
                i += 2;
            }
            else {
                i++;
            }
        }
        else if (token.startsWith('-')) {
            // 跳过其他不支持的选项
            i++;
        }
        else if (!request.url) {
            // 第一个不以-开头的参数作为URL
            request.url = token;
            i++;
        }
        else {
            // 跳过其他参数
            i++;
        }
    }
    // 如果没有设置Content-Type但有数据，则设置默认值
    if (request.data && !request.headers['Content-Type'] && !request.headers['content-type']) {
        if (typeof request.data === 'object') {
            request.headers['Content-Type'] = 'application/json';
        }
        else {
            request.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
    }
    return request;
}
/**
 * 将curl命令字符串分解为标记数组
 * 正确处理引号和转义字符
 */
function tokenizeCurlCommand(command) {
    const tokens = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let escaped = false;
    for (let i = 0; i < command.length; i++) {
        const char = command[i];
        if (escaped) {
            current += char;
            escaped = false;
            continue;
        }
        if (char === '\\') {
            escaped = true;
            continue;
        }
        if (inQuotes) {
            if (char === quoteChar) {
                inQuotes = false;
                quoteChar = '';
            }
            else {
                current += char;
            }
        }
        else {
            if (char === '"' || char === "'") {
                inQuotes = true;
                quoteChar = char;
            }
            else if (char === ' ' || char === '\t' || char === '\n') {
                if (current.length > 0) {
                    tokens.push(current);
                    current = '';
                }
            }
            else {
                current += char;
            }
        }
    }
    if (current.length > 0) {
        tokens.push(current);
    }
    return tokens;
}
/**
 * 验证HTTP方法是否有效
 */
function isValidHttpMethod(method) {
    return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(method);
}
/**
 * 将HttpRequest对象转换为curl命令（用于调试和日志）
 *
 * @param request HttpRequest对象
 * @param baseUrl 基础URL（可选）
 * @returns curl命令字符串
 */
export function httpRequestToCurl(request, baseUrl) {
    let curlCommand = 'curl';
    // URL
    let url = request.url;
    if (baseUrl && !url.startsWith('http')) {
        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
        const cleanUrl = url.replace(/^\//, '');
        url = `${cleanBaseUrl}/${cleanUrl}`;
    }
    curlCommand += ` '${url}'`;
    // 方法
    if (request.method && request.method !== 'GET') {
        curlCommand += ` -X ${request.method}`;
    }
    // 请求头
    if (request.headers) {
        for (const [key, value] of Object.entries(request.headers)) {
            curlCommand += ` -H '${key}: ${value}'`;
        }
    }
    // 请求体数据
    if (request.data) {
        const dataStr = typeof request.data === 'string'
            ? request.data
            : JSON.stringify(request.data);
        curlCommand += ` -d '${dataStr}'`;
    }
    // 超时
    if (request.timeout) {
        const timeoutSeconds = Math.ceil(request.timeout / 1000);
        curlCommand += ` --connect-timeout ${timeoutSeconds}`;
    }
    return curlCommand;
}
//# sourceMappingURL=curl-parser.js.map