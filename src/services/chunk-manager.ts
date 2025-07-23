/**
 * 严格分块管理器
 * 实现结构感知的严格分块方案，默认50KB，支持环境变量配置
 */

export interface Chunk {
  index: number;
  totalChunks: number;
  type: string;
  path: string[];
  content: any;
  size: number;
  metadata?: any;
}

export interface ChunkingResult {
  chunks: Chunk[];
  metadata: {
    totalSize: number;
    chunkCount: number;
    dataType: string;
    structure: any;
  };
}

/**
 * 获取最大分块大小，支持环境变量配置
 */
export function getMaxChunkSize(): number {
  const envSize = process.env.MAX_CHUNK_SIZE;
  if (envSize) {
    const parsedSize = Number(envSize);
    if (!isNaN(parsedSize) && parsedSize > 0) {
      return parsedSize;
    }
  }
  return 50 * 1024; // 默认50KB
}

/**
 * 检测Grafana数据类型
 */
export function detectGrafanaDataType(data: any): string {
  // 检查包装后的 ExtractedData 结构
  if (data?.data?.results && typeof data.data.results === 'object') {
    return 'grafana-query';
  }
  // 检查直接的查询结果结构
  if (data?.results && (Array.isArray(data.results) || typeof data.results === 'object')) {
    return 'grafana-query';
  }
  if (data?.series && Array.isArray(data.series)) {
    return 'timeseries';
  }
  if (data?.tables && Array.isArray(data.tables)) {
    return 'table';
  }
  // 检查Elasticsearch数据结构
  if (data?.data?.responses || data?.responses) {
    return 'elasticsearch';
  }
  // 检查其他可能的Elasticsearch结构
  if (data?.hits || data?.aggregations || (data?.data && (data.data.hits || data.data.aggregations))) {
    return 'elasticsearch';
  }
  // 检查嵌套的Elasticsearch结构（通过ExtractedData包装）
  if (data?.type === 'elasticsearch' || (data?.data && Array.isArray(data.data.responses))) {
    return 'elasticsearch';
  }
  if (Array.isArray(data)) {
    return 'array';
  }
  if (typeof data === 'object' && data !== null) {
    return 'object';
  }
  return 'generic';
}

/**
 * 计算数据大小
 */
export function calculateDataSize(data: any): number {
  return Buffer.byteLength(JSON.stringify(data), 'utf8');
}

/**
 * 创建分块
 */
function createChunk(
  content: any, 
  path: string[], 
  index: number, 
  totalChunks: number, 
  chunkType: string
): Chunk {
  const size = calculateDataSize(content);
  return {
    index,
    totalChunks,
    type: chunkType,
    path,
    content,
    size
  };
}

/**
 * 分割超长字符串
 */
function splitLongString(data: string, path: string[], maxChunkSize: number): Chunk[] {
  const chunks: Chunk[] = [];
  const totalSize = Buffer.byteLength(data, 'utf8');
  
  // 计算每个字符的平均字节数
  const avgBytesPerChar = totalSize / data.length;
  const charsPerChunk = Math.floor(maxChunkSize / avgBytesPerChar);
  const chunkCount = Math.ceil(data.length / charsPerChunk);
  
  for (let i = 0; i < chunkCount; i++) {
    const start = i * charsPerChunk;
    const end = Math.min(start + charsPerChunk, data.length);
    const chunkContent = data.substring(start, end);
    
    // 验证分块大小
    const chunkSize = Buffer.byteLength(chunkContent, 'utf8');
    if (chunkSize > maxChunkSize) {
      // 如果仍然超限，进一步缩小
      const reducedCharsPerChunk = Math.floor(charsPerChunk * 0.8);
      const newStart = i * reducedCharsPerChunk;
      const newEnd = Math.min(newStart + reducedCharsPerChunk, data.length);
      const newChunkContent = data.substring(newStart, newEnd);
      
      chunks.push(createChunk(
        newChunkContent,
        path,
        i + 1,
        chunkCount,
        'string_chunk'
      ));
    } else {
      chunks.push(createChunk(
        chunkContent,
        path,
        i + 1,
        chunkCount,
        'string_chunk'
      ));
    }
  }
  
  return chunks;
}

/**
 * 分割数组数据 - 更精确的大小控制
 */
function chunkArrayData(
  data: any[], 
  path: string[], 
  maxChunkSize: number
): Chunk[] {
  const chunks: Chunk[] = [];
  let currentChunk: any[] = [];
  let chunkIndex = 1;
  
  for (const item of data) {
    const itemSize = calculateDataSize(item);
    
    // 如果单个元素超过最大分块大小
    if (itemSize > maxChunkSize) {
      // 先保存当前块
      if (currentChunk.length > 0) {
        chunks.push(createChunk(
          currentChunk,
          path,
          chunkIndex,
          0, // 临时值，后面更新
          'array'
        ));
        chunkIndex++;
        currentChunk = [];
      }
      
      // 递归处理超大元素
      const subChunks = chunkData(item, [...path, 'oversize_item'], maxChunkSize);
      chunks.push(...subChunks);
      continue;
    }
    
    // 创建临时块来测试大小
    const testChunk = [...currentChunk, item];
    const testSize = calculateDataSize(testChunk);
    
    // 如果添加当前元素会超过限制
    if (testSize > maxChunkSize && currentChunk.length > 0) {
      chunks.push(createChunk(
        currentChunk,
        path,
        chunkIndex,
        0, // 临时值，后面更新
        'array'
      ));
      chunkIndex++;
      currentChunk = [];
    }
    
    currentChunk.push(item);
  }
  
  // 保存最后一个块
  if (currentChunk.length > 0) {
    chunks.push(createChunk(
      currentChunk,
      path,
      chunkIndex,
      0, // 临时值，后面更新
      'array'
    ));
  }
  
  // 更新总块数
  const totalChunks = chunks.length;
  chunks.forEach(chunk => {
    chunk.totalChunks = totalChunks;
  });
  
  return chunks;
}

/**
 * 分割对象数据
 */
function chunkObjectData(
  data: any, 
  path: string[], 
  maxChunkSize: number
): Chunk[] {
  const chunks: Chunk[] = [];
  const entries = Object.entries(data);
  
  // 检查是否有大数组字段需要优先分块
  const largeArrayFields: Array<[string, any[]]> = [];
  const smallFields: Array<[string, any]> = [];
  
  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      const arraySize = calculateDataSize(value);
      if (arraySize > maxChunkSize) {
        largeArrayFields.push([key, value]);
      } else {
        smallFields.push([key, value]);
      }
    } else {
      smallFields.push([key, value]);
    }
  }
  
  // 处理大数组字段
  for (const [key, value] of largeArrayFields) {
    const arrayChunks = chunkArrayData(value, [...path, key], maxChunkSize);
    chunks.push(...arrayChunks);
  }
  
  // 处理小字段，尝试合并到一个块
  if (smallFields.length > 0) {
    const smallObject: any = {};
    let totalSize = 0;
    
    for (const [key, value] of smallFields) {
      const fieldSize = calculateDataSize({ [key]: value });
      if (totalSize + fieldSize <= maxChunkSize) {
        smallObject[key] = value;
        totalSize += fieldSize;
      } else {
        // 当前字段放不下，先保存当前对象
        if (Object.keys(smallObject).length > 0) {
          chunks.push(createChunk(
            smallObject,
            path,
            chunks.length + 1,
            0, // 临时值
            'object'
          ));
        }
        
        // 递归处理当前字段
        const fieldChunks = chunkData(value, [...path, key], maxChunkSize);
        chunks.push(...fieldChunks);
        
        // 重置
        Object.keys(smallObject).forEach(k => delete smallObject[k]);
        totalSize = 0;
      }
    }
    
    // 保存剩余的小字段
    if (Object.keys(smallObject).length > 0) {
      chunks.push(createChunk(
        smallObject,
        path,
        chunks.length + 1,
        0, // 临时值
        'object'
      ));
    }
  }
  
  // 更新总块数
  const totalChunks = chunks.length;
  chunks.forEach(chunk => {
    chunk.totalChunks = totalChunks;
  });
  
  return chunks;
}

/**
 * 主分块函数
 */
export function chunkData(data: any, path: string[] = [], maxChunkSize?: number): Chunk[] {
  const chunkSize = maxChunkSize || getMaxChunkSize();
  
  // 基本类型处理
  if (typeof data === 'string') {
    const size = Buffer.byteLength(data, 'utf8');
    if (size <= chunkSize) {
      return [createChunk(data, path, 1, 1, 'string')];
    } else {
      return splitLongString(data, path, chunkSize);
    }
  }
  
  if (typeof data === 'number' || typeof data === 'boolean' || data === null) {
    return [createChunk(data, path, 1, 1, typeof data)];
  }
  
  // 数组处理
  if (Array.isArray(data)) {
    return chunkArrayData(data, path, chunkSize);
  }
  
  // 对象处理
  if (typeof data === 'object' && data !== null) {
    return chunkObjectData(data, path, chunkSize);
  }
  
  // 其他类型
  return [createChunk(data, path, 1, 1, typeof data)];
}

/**
 * 智能分块主函数
 */
export function createIntelligentChunks(data: any): ChunkingResult {
  const maxChunkSize = getMaxChunkSize();
  const dataType = detectGrafanaDataType(data);
  
  // 创建元数据块
  const metadata = {
    dataType,
    maxChunkSize,
    totalSize: calculateDataSize(data),
    timestamp: new Date().toISOString(),
    structure: extractDataStructure(data)
  };
  
  // 生成分块
  const chunks = chunkData(data, [], maxChunkSize);
  
  // 添加元数据到第一个块
  if (chunks.length > 0) {
    chunks[0].metadata = metadata;
  }
  
  return {
    chunks,
    metadata: {
      totalSize: metadata.totalSize,
      chunkCount: chunks.length,
      dataType,
      structure: metadata.structure
    }
  };
}

/**
 * 提取数据结构信息
 */
function extractDataStructure(data: any): any {
  if (Array.isArray(data)) {
    return {
      type: 'array',
      length: data.length,
      sample: data.slice(0, 3)
    };
  }
  
  if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    return {
      type: 'object',
      keyCount: keys.length,
      keys: keys.slice(0, 10), // 只显示前10个键
      sample: Object.fromEntries(
        Object.entries(data).slice(0, 3).map(([k, v]) => [
          k, 
          Array.isArray(v) ? `array(${v.length})` : typeof v
        ])
      )
    };
  }
  
  return {
    type: typeof data,
    value: String(data).substring(0, 100)
  };
}

/**
 * 验证分块结果
 */
export function validateChunks(chunks: Chunk[], maxChunkSize?: number): boolean {
  const chunkSize = maxChunkSize || getMaxChunkSize();
  
  for (const chunk of chunks) {
    if (chunk.size > chunkSize) {
      console.error(`分块 ${chunk.index} 超过大小限制: ${chunk.size} > ${chunkSize}`);
      return false;
    }
  }
  
  return true;
}

/**
 * 生成分块分析指导
 */
export function generateChunkingGuidance(chunks: Chunk[]): string {
  if (chunks.length === 0) {
    return '没有数据需要分块';
  }
  
  const metadata = chunks[0].metadata;
  const dataType = metadata?.dataType || 'unknown';
  
  return `
## 数据分块信息
- **数据类型**: ${dataType}
- **总块数**: ${chunks.length}
- **总大小**: ${Math.round(metadata?.totalSize / 1024)}KB
- **分块大小**: ${Math.round(getMaxChunkSize() / 1024)}KB

## 分析指导
1. **读取元数据**: 从第1块获取数据概览
2. **顺序读取**: 按块号顺序读取所有数据块
3. **逐步分析**: 每块分析后累积结果
4. **整合结论**: 基于所有块的分析结果生成最终报告

## 分块详情
${chunks.map(chunk => 
  `- 块${chunk.index}: ${chunk.type} (${Math.round(chunk.size / 1024)}KB) ${chunk.path.length > 0 ? `[${chunk.path.join('.')}]` : ''}`
).join('\n')}

**重要**: 请按顺序读取所有分块，确保分析完整性。
  `;
} 