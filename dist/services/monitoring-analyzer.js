import axios from 'axios';
const DEFAULT_TIMEOUT = 30000;
const MAX_DATA_LENGTH = 2000;
const DEFAULT_SYSTEM_PROMPT = `你是专业的Grafana监控数据分析专家。请基于提供的监控数据进行分析，给出专业洞察和建议。

数据格式说明：
- hasData: 是否有有效数据
- type: 数据类型
- data: 实际响应数据
- status: HTTP状态码
- timestamp: 数据时间戳

请提供：
1. 数据概览和趋势分析
2. 异常检测和告警建议  
3. 性能优化建议
4. 具体行动项`;
/**
 * 使用AI分析监控数据
 */
export async function analyzeWithAI(prompt, data, globalConfig, queryConfig) {
    // 获取AI配置
    const aiConfig = queryConfig?.aiService || globalConfig?.aiService;
    if (!aiConfig?.url) {
        return null; // 无AI配置，使用客户端AI
    }
    try {
        // 获取系统提示词
        const systemPrompt = queryConfig?.systemPrompt ||
            globalConfig?.systemPrompt ||
            DEFAULT_SYSTEM_PROMPT;
        const userMessage = `${prompt}\n\n监控数据：\n${JSON.stringify(data, null, 2)}`;
        // 构建请求体
        let requestBody;
        if (aiConfig.bodyTemplate) {
            // 使用自定义模板
            const template = JSON.stringify(aiConfig.bodyTemplate);
            const replaced = template
                .replace(/\{\{systemPrompt\}\}/g, systemPrompt.replace(/"/g, '\\"'))
                .replace(/\{\{userMessage\}\}/g, userMessage.replace(/"/g, '\\"'));
            requestBody = JSON.parse(replaced);
        }
        else {
            // 默认OpenAI格式
            requestBody = {
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ]
            };
        }
        // 发送请求
        const response = await axios.post(aiConfig.url, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                ...aiConfig.headers
            },
            timeout: aiConfig.timeout || DEFAULT_TIMEOUT
        });
        // 解析响应
        if (aiConfig.responseParser?.contentPath) {
            // 自定义解析路径
            const paths = aiConfig.responseParser.contentPath.split('.');
            let result = response.data;
            for (const path of paths) {
                result = result?.[path];
            }
            return typeof result === 'string' ? result : null;
        }
        else {
            // 默认OpenAI格式
            return response.data?.choices?.[0]?.message?.content || null;
        }
    }
    catch (error) {
        console.error('外部AI分析失败:', error.message);
        return null; // 失败时回退到客户端AI
    }
}
/**
 * 为客户端AI格式化分析上下文
 */
export function formatDataForClientAI(prompt, data) {
    // 截断过长的数据
    let formattedData = data.data;
    if (typeof formattedData === 'object') {
        const jsonStr = JSON.stringify(formattedData, null, 2);
        if (jsonStr.length > MAX_DATA_LENGTH) {
            formattedData = `${jsonStr.substring(0, MAX_DATA_LENGTH)}...`;
        }
        else {
            formattedData = jsonStr;
        }
    }
    return `请基于以下Grafana监控数据进行专业分析：

用户需求：${prompt}

数据概览：
- 数据类型：${data.type}
- 有效数据：${data.hasData ? '是' : '否'}
- HTTP状态：${data.status}
- 时间戳：${data.timestamp}

原始数据：
${data.hasData ? formattedData : '无有效数据'}

请提供：数据解读、异常检测、趋势分析和优化建议。`;
}
//# sourceMappingURL=monitoring-analyzer.js.map