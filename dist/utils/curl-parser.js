/**
 * curl命令解析器
 * 将curl命令字符串转换为HttpRequest对象
 */
export function parseCurlCommand(curlCommand) {
    // 清理命令字符串
    const command = curlCommand.trim().replace(/\\\s*\n\s*/g, ' ');
    // 初始化默认请求对象
    const request = {
        url: '',
        method: 'GET',
        headers: {},
        data: undefined,
        params: {}
    };
    // 改进的URL解析 - 支持各种引号格式和参数位置
    let urlMatch = command.match(/curl\s+(?:.*?\s+)?["']([^"']+)["']/);
    if (!urlMatch) {
        // 尝试匹配没有引号的URL
        urlMatch = command.match(/curl\s+(?:.*?\s+)?(\S+)/);
    }
    if (!urlMatch) {
        // 最后尝试：查找https://或http://开头的URL
        urlMatch = command.match(/(https?:\/\/[^\s]+)/);
    }
    if (urlMatch) {
        request.url = urlMatch[1];
    }
    // 解析HTTP方法
    const methodMatch = command.match(/-X\s+([A-Z]+)|--request\s+([A-Z]+)/i);
    if (methodMatch) {
        const method = (methodMatch[1] || methodMatch[2]).toUpperCase();
        if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(method)) {
            request.method = method;
        }
    }
    // 解析请求头 -H "header: value" 或 --header "header: value"
    const headerRegex = /(?:-H|--header)\s+['"]([^'"]+)['"]/g;
    let headerMatch;
    while ((headerMatch = headerRegex.exec(command)) !== null) {
        const headerLine = headerMatch[1];
        const colonIndex = headerLine.indexOf(':');
        if (colonIndex > 0) {
            const key = headerLine.substring(0, colonIndex).trim();
            const value = headerLine.substring(colonIndex + 1).trim();
            request.headers[key] = value;
        }
    }
    // 解析请求体数据 -d "data" 或 --data "data"
    // 首先查找所有-d参数的位置
    const dataTokens = [];
    const tokens = ['-d', '--data', '--data-raw'];
    for (const token of tokens) {
        let startIndex = 0;
        while (true) {
            const tokenIndex = command.indexOf(token, startIndex);
            if (tokenIndex === -1)
                break;
            // 确保这是一个独立的参数（前面是空格或开头）
            const prevChar = tokenIndex > 0 ? command[tokenIndex - 1] : ' ';
            if (prevChar === ' ' || tokenIndex === 0) {
                dataTokens.push(tokenIndex + token.length);
            }
            startIndex = tokenIndex + 1;
        }
    }
    const dataValues = [];
    for (const tokenEnd of dataTokens) {
        // 跳过空格
        let dataStart = tokenEnd;
        while (dataStart < command.length && command[dataStart] === ' ') {
            dataStart++;
        }
        if (dataStart >= command.length)
            continue;
        const quote = command[dataStart]; // ' 或 "
        if (quote !== '"' && quote !== "'")
            continue;
        // 查找匹配的结束引号
        let dataEnd = dataStart + 1;
        let escaped = false;
        while (dataEnd < command.length) {
            const char = command[dataEnd];
            if (escaped) {
                escaped = false;
            }
            else if (char === '\\') {
                escaped = true;
            }
            else if (char === quote) {
                break;
            }
            dataEnd++;
        }
        if (dataEnd < command.length) {
            const dataValue = command.substring(dataStart + 1, dataEnd);
            dataValues.push(dataValue);
        }
    }
    if (dataValues.length > 0) {
        // 如果有多个-d参数，用&连接
        const dataString = dataValues.join('&');
        // 尝试解析为JSON
        try {
            request.data = JSON.parse(dataString);
        }
        catch {
            // 如果不是JSON，检查是否是form data
            if (dataString.includes('=') && !dataString.includes('{')) {
                // 解析为form data
                const formData = {};
                dataString.split('&').forEach(pair => {
                    const [key, value] = pair.split('=');
                    if (key && value !== undefined) {
                        formData[decodeURIComponent(key)] = decodeURIComponent(value);
                    }
                });
                request.data = formData;
            }
            else {
                // 原始字符串
                request.data = dataString;
            }
        }
        // 如果有数据且没有明确指定方法，默认使用POST
        if (request.method === 'GET') {
            request.method = 'POST';
        }
    }
    // 解析URL参数（从URL中提取查询参数）
    try {
        const urlObj = new URL(request.url);
        urlObj.searchParams.forEach((value, key) => {
            request.params[key] = value;
        });
        // 清理URL，移除查询参数
        request.url = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    }
    catch {
        // URL解析失败，保持原样
    }
    // 解析超时设置 --max-time 或 --connect-timeout
    const timeoutMatch = command.match(/(?:--max-time|--connect-timeout)\s+(\d+)/);
    if (timeoutMatch) {
        request.timeout = parseInt(timeoutMatch[1]) * 1000; // 转换为毫秒
    }
    // 解析用户代理
    const userAgentMatch = command.match(/(?:-A|--user-agent)\s+['"]([^'"]+)['"]/);
    if (userAgentMatch) {
        request.headers['User-Agent'] = userAgentMatch[1];
    }
    // 解析认证信息 -u username:password
    const authMatch = command.match(/(?:-u|--user)\s+['"]([^'"]+)['"]/);
    if (authMatch) {
        const authString = authMatch[1];
        const encoded = Buffer.from(authString).toString('base64');
        request.headers['Authorization'] = `Basic ${encoded}`;
    }
    // 解析Bearer token
    const bearerMatch = command.match(/(?:-H|--header)\s+['"]Authorization:\s*Bearer\s+([^'"]+)['"]/i);
    if (bearerMatch) {
        request.headers['Authorization'] = `Bearer ${bearerMatch[1]}`;
    }
    return request;
}
/**
 * 验证curl命令格式
 */
export function validateCurlCommand(curlCommand) {
    const trimmed = curlCommand.trim();
    if (!trimmed.startsWith('curl')) {
        return { valid: false, error: 'curl命令必须以"curl"开头' };
    }
    // 检查是否包含URL - 改进的URL检测
    let hasUrl = false;
    // 检查引号包围的URL
    const quotedUrlMatch = trimmed.match(/["']([^"']+)["']/);
    if (quotedUrlMatch) {
        hasUrl = true;
    }
    else {
        // 检查http://或https://开头的URL
        const httpUrlMatch = trimmed.match(/(https?:\/\/[^\s]+)/);
        if (httpUrlMatch) {
            hasUrl = true;
        }
    }
    if (!hasUrl) {
        return { valid: false, error: 'curl命令必须包含URL' };
    }
    return { valid: true };
}
//# sourceMappingURL=curl-parser.js.map