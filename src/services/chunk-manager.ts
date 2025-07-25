import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import os from 'os';

// 严格分块大小：完全通过环境变量配置
// 支持的环境变量：
// - MAX_CHUNK_SIZE: 分块大小（KB），默认50KB
// - DEFAULT_CHUNK_SIZE: 默认分块大小（KB），默认50KB

// 分块类型定义
export interface DataChunk {
  id: string;
  index: number;
  totalChunks: number;
  type: 'metadata' | 'data' | 'oversize';
  contentType: string;
  content: any;
  size: number;
  metadata?: {
    startIndex?: number;
    endIndex?: number;
    timeRange?: { start: string; end: string };
    dataType?: string;
  };
}

// 分块结果
export interface ChunkingResult {
  chunks: DataChunk[];
  metadata: {
    totalSize: number;
    totalChunks: number;
    dataType: string;
    chunkingStrategy: string;
  };
}

/**
 * 获取最大分块大小，完全通过环境变量配置
 */
export function getMaxChunkSize(): number {
  // 首先尝试 MAX_CHUNK_SIZE
  const maxChunkSize = process.env.MAX_CHUNK_SIZE;
  if (maxChunkSize) {
    const parsedSize = Number(maxChunkSize);
    if (!isNaN(parsedSize) && parsedSize > 0) {
      return parsedSize * 1024; // 转换为字节
    }
  }
  
  // 然后尝试 DEFAULT_CHUNK_SIZE
  const defaultChunkSize = process.env.DEFAULT_CHUNK_SIZE;
  if (defaultChunkSize) {
    const parsedSize = Number(defaultChunkSize);
    if (!isNaN(parsedSize) && parsedSize > 0) {
      return parsedSize * 1024; // 转换为字节
    }
  }
  
  // 最后使用硬编码默认值 50KB
  return 50 * 1024;
}

/**
 * 严格分块器 - 确保每个分块不超过配置的大小限制
 */
export class StrictChunker {
  private maxChunkSize: number;

  constructor(maxChunkSize?: number) {
    this.maxChunkSize = maxChunkSize || getMaxChunkSize();
  }

  /**
   * 检测数据类型
   */
  private detectDataType(data: any): string {
    // Grafana查询结果
    if (data?.data?.results && typeof data.data.results === 'object') {
      return 'grafana-query';
    }
    
    // Elasticsearch数据
    if (data?.responses || data?.hits || data?.aggregations) {
      return 'elasticsearch';
    }
    
    // 时间序列数据
    if (data?.series && Array.isArray(data.series)) {
      return 'timeseries';
    }
    
    // 表格数据
    if (data?.tables && Array.isArray(data.tables)) {
      return 'tables';
    }
    
    // 数组数据
    if (Array.isArray(data)) {
      return 'array';
    }
    
    // 对象数据
    if (typeof data === 'object' && data !== null) {
      return 'object';
    }
    
    return 'unknown';
  }

  /**
   * 计算JSON大小
   */
  private calculateSize(obj: any): number {
    return Buffer.byteLength(JSON.stringify(obj), 'utf8');
  }

  /**
   * 检查是否在大小限制内
   */
  private isWithinLimit(obj: any): boolean {
    return this.calculateSize(obj) <= this.maxChunkSize;
  }

  /**
   * 分块Elasticsearch数据
   */
  private chunkElasticsearchData(data: any): DataChunk[] {
    const chunks: DataChunk[] = [];
    let chunkIndex = 1;

    // 1. 元数据分块
    const metadata = this.extractESMetadata(data);
    if (this.isWithinLimit(metadata)) {
      chunks.push({
        id: 'metadata',
        index: chunkIndex++,
        totalChunks: 0, // 稍后更新
        type: 'metadata',
        contentType: 'elasticsearch-metadata',
        content: metadata,
        size: this.calculateSize(metadata)
      });
    }

    // 2. 处理responses
    const responses = data.responses || [data];
    
    for (let responseIndex = 0; responseIndex < responses.length; responseIndex++) {
      const response = responses[responseIndex];
      
      // 处理hits数据
      if (response.hits?.hits && Array.isArray(response.hits.hits)) {
        const hitChunks = this.chunkArray(
          response.hits.hits,
          `hits-${responseIndex}`,
          chunkIndex,
          'elasticsearch-hits'
        );
        chunks.push(...hitChunks);
        chunkIndex += hitChunks.length;
      }
      
      // 处理aggregations数据
      if (response.aggregations) {
        const aggChunks = this.chunkAggregations(
          response.aggregations,
          `aggregations-${responseIndex}`,
          chunkIndex
        );
        chunks.push(...aggChunks);
        chunkIndex += aggChunks.length;
      }
    }

    // 更新总块数
    chunks.forEach(chunk => {
      chunk.totalChunks = chunks.length;
    });

    return chunks;
  }

  /**
   * 分块Grafana查询数据
   */
  private chunkGrafanaQueryData(data: any): DataChunk[] {
    const chunks: DataChunk[] = [];
    let chunkIndex = 1;

    const results = data?.data?.results || data?.results || {};
    const resultKeys = Object.keys(results);

    // 1. 元数据分块
    const metadata = {
      queryCount: resultKeys.length,
      queryNames: resultKeys,
      timestamp: new Date().toISOString()
    };

    if (this.isWithinLimit(metadata)) {
      chunks.push({
        id: 'metadata',
        index: chunkIndex++,
        totalChunks: 0,
        type: 'metadata',
        contentType: 'grafana-metadata',
        content: metadata,
        size: this.calculateSize(metadata)
      });
    }

    // 2. 处理每个查询结果
    for (const resultKey of resultKeys) {
      const result = results[resultKey];
      const frames = result?.frames || [];

      for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
        const frame = frames[frameIndex];
        const frameChunks = this.chunkFrame(
          frame,
          `${resultKey}-frame-${frameIndex}`,
          chunkIndex
        );
        chunks.push(...frameChunks);
        chunkIndex += frameChunks.length;
      }
    }

    // 更新总块数
    chunks.forEach(chunk => {
      chunk.totalChunks = chunks.length;
    });

    return chunks;
  }

  /**
   * 分块Frame数据
   */
  private chunkFrame(frame: any, baseId: string, startIndex: number): DataChunk[] {
    const chunks: DataChunk[] = [];
    let chunkIndex = startIndex;

    const fields = frame?.schema?.fields || frame?.fields || [];
    const frameData = frame?.data || {};
    const dataValues = frameData.values || [];

    // 1. Frame元数据
    const frameMetadata = {
      name: frame?.schema?.name || frame?.name || 'unknown',
      fieldCount: fields.length,
      fieldNames: fields.map((f: any) => f.name),
      meta: frame?.meta
    };

    if (this.isWithinLimit(frameMetadata)) {
      chunks.push({
        id: `${baseId}-metadata`,
        index: chunkIndex++,
        totalChunks: 0,
        type: 'metadata' as const,
        contentType: 'frame-metadata',
        content: frameMetadata,
        size: this.calculateSize(frameMetadata)
      });
    }

    // 2. 分块字段数据
    for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
      const field = fields[fieldIndex];
      const fieldValues = dataValues[fieldIndex] || [];

      const fieldChunks = this.chunkArray(
        fieldValues,
        `${baseId}-field-${fieldIndex}`,
        chunkIndex,
        'field-data',
        {
          fieldName: field.name,
          fieldType: field.type,
          fieldIndex: fieldIndex
        }
      );
      chunks.push(...fieldChunks);
      chunkIndex += fieldChunks.length;
    }

    return chunks;
  }

  /**
   * 分块聚合数据
   */
  private chunkAggregations(aggregations: any, baseId: string, startIndex: number): DataChunk[] {
    const chunks: DataChunk[] = [];
    let chunkIndex = startIndex;

    for (const [aggName, aggData] of Object.entries(aggregations)) {
      if (aggData && typeof aggData === 'object' && 'buckets' in aggData) {
        const buckets = (aggData as any).buckets;
        if (Array.isArray(buckets)) {
          const bucketChunks = this.chunkArray(
            buckets,
            `${baseId}-${aggName}`,
            chunkIndex,
            'aggregation-buckets',
            {
              aggregationName: aggName,
              aggregationType: 'bucket'
            }
          );
          chunks.push(...bucketChunks);
          chunkIndex += bucketChunks.length;
        }
      } else {
        // 非bucket聚合（如stats、value等）
        const aggContent = { [aggName]: aggData };
        if (this.isWithinLimit(aggContent)) {
          chunks.push({
            id: `${baseId}-${aggName}`,
            index: chunkIndex++,
            totalChunks: 0,
            type: 'data',
            contentType: 'aggregation-stats',
            content: aggContent,
            size: this.calculateSize(aggContent)
          });
        }
      }
    }

    return chunks;
  }

  /**
   * 分块数组数据
   */
  private chunkArray(
    array: any[],
    baseId: string,
    startIndex: number,
    contentType: string,
    metadata?: any
  ): DataChunk[] {
    const chunks: DataChunk[] = [];
    let chunkIndex = startIndex;
    let buffer: any[] = [];

    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      
      // 检查单个项目是否超过限制
      const itemSize = this.calculateSize(item);
      if (itemSize > this.maxChunkSize) {
        // 单个项目过大，需要特殊处理
        const oversizedChunk = this.handleOversizedItem(item, `${baseId}-item-${i}`, chunkIndex);
        chunks.push(oversizedChunk);
        chunkIndex++;
        continue;
      }

      // 尝试添加项目到当前缓冲区
      const testBuffer = [...buffer, item];
      const testChunk = {
        id: `${baseId}-chunk-${chunks.length + 1}`,
        index: chunkIndex,
        totalChunks: 0,
        type: 'data' as const,
        contentType,
        content: testBuffer,
        size: 0,
        metadata: {
          ...metadata,
          startIndex: i - testBuffer.length + 1,
          endIndex: i
        }
      };
      
      const testChunkSize = this.calculateSize(testChunk);

      // 如果添加后超过限制，创建新块
      if (testChunkSize > this.maxChunkSize && buffer.length > 0) {
        const finalChunk = {
          id: `${baseId}-chunk-${chunks.length + 1}`,
          index: chunkIndex++,
          totalChunks: 0,
          type: 'data' as const,
          contentType,
          content: buffer,
          size: this.calculateSize({
            id: `${baseId}-chunk-${chunks.length + 1}`,
            index: chunkIndex - 1,
            totalChunks: 0,
            type: 'data' as const,
            contentType,
            content: buffer,
            size: 0,
            metadata: {
              ...metadata,
              startIndex: i - buffer.length,
              endIndex: i - 1
            }
          }),
          metadata: {
            ...metadata,
            startIndex: i - buffer.length,
            endIndex: i - 1
          }
        };
        
        chunks.push(finalChunk);
        buffer = [item]; // 开始新的缓冲区
      } else {
        buffer = testBuffer; // 添加到当前缓冲区
      }
    }

    // 添加最后一个块
    if (buffer.length > 0) {
      const finalChunk = {
        id: `${baseId}-chunk-${chunks.length + 1}`,
        index: chunkIndex++,
        totalChunks: 0,
        type: 'data' as const,
        contentType,
        content: buffer,
        size: this.calculateSize({
          id: `${baseId}-chunk-${chunks.length + 1}`,
          index: chunkIndex - 1,
          totalChunks: 0,
          type: 'data' as const,
          contentType,
          content: buffer,
          size: 0,
          metadata: {
            ...metadata,
            startIndex: array.length - buffer.length,
            endIndex: array.length - 1
          }
        }),
        metadata: {
          ...metadata,
          startIndex: array.length - buffer.length,
          endIndex: array.length - 1
        }
      };
      
      chunks.push(finalChunk);
    }

    return chunks;
  }

  /**
   * 处理过大的单个项目
   */
  private handleOversizedItem(item: any, itemId: string, index: number): DataChunk {
    // 尝试提取关键信息
    const summary = this.extractItemSummary(item);
    
    return {
      id: itemId,
      index,
      totalChunks: 0,
      type: 'oversize',
      contentType: 'oversized-item',
      content: {
        originalSize: this.calculateSize(item),
        summary,
        note: '项目过大，已提取关键信息'
      },
      size: this.calculateSize(summary)
    };
  }

  /**
   * 提取项目摘要
   */
  private extractItemSummary(item: any): any {
    if (typeof item === 'object' && item !== null) {
      const keys = Object.keys(item);
      const summary: any = {};
      
      // 保留关键字段
      const priorityKeys = ['key', 'key_as_string', 'doc_count', 'value', 'timestamp', 'name'];
      
      for (const key of priorityKeys) {
        if (key in item) {
          summary[key] = item[key];
        }
      }
      
      // 如果关键字段太少，添加一些其他字段
      if (Object.keys(summary).length < 3) {
        for (const key of keys.slice(0, 5)) {
          if (!(key in summary)) {
            summary[key] = item[key];
          }
        }
      }
      
      return summary;
    }
    
    return item;
  }

  /**
   * 提取ES元数据
   */
  private extractESMetadata(data: any): any {
    const responses = data.responses || [data];
    const firstResponse = responses[0];
    
    return {
      responseCount: responses.length,
      totalHits: firstResponse?.hits?.total?.value || firstResponse?.hits?.total || 0,
      maxScore: firstResponse?.hits?.max_score,
      took: firstResponse?.took,
      timedOut: firstResponse?.timed_out,
      aggregationCount: firstResponse?.aggregations ? Object.keys(firstResponse.aggregations).length : 0,
      aggregationNames: firstResponse?.aggregations ? Object.keys(firstResponse.aggregations) : [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 主分块函数
   */
  public chunk(data: any): ChunkingResult {
    const dataType = this.detectDataType(data);
    let chunks: DataChunk[] = [];

    switch (dataType) {
      case 'elasticsearch':
        chunks = this.chunkElasticsearchData(data);
        break;
      case 'grafana-query':
        chunks = this.chunkGrafanaQueryData(data);
        break;
      case 'timeseries':
        chunks = this.chunkArray(data.series || [], 'timeseries', 1, 'timeseries-data');
        break;
      case 'tables':
        chunks = this.chunkTableData(data);
        break;
      case 'array':
        chunks = this.chunkArray(data, 'array', 1, 'array-data');
        break;
      default:
        chunks = this.chunkGenericData(data);
        break;
    }

    // 更新所有块的总块数
    chunks.forEach(chunk => {
      chunk.totalChunks = chunks.length;
    });

    return {
      chunks,
      metadata: {
        totalSize: this.calculateSize(data),
        totalChunks: chunks.length,
        dataType,
        chunkingStrategy: 'strict-chunking'
      }
    };
  }

  /**
   * 分块表格数据
   */
  private chunkTableData(data: any): DataChunk[] {
    const chunks: DataChunk[] = [];
    let chunkIndex = 1;

    const tables = data.tables || [];
    
    for (let tableIndex = 0; tableIndex < tables.length; tableIndex++) {
      const table = tables[tableIndex];
      const rows = table.rows || [];
      const columns = table.columns || [];

      // 表格元数据
      const tableMetadata = {
        tableIndex,
        rowCount: rows.length,
        columnCount: columns.length,
        columns: columns.map((col: any) => col.text || col.name)
      };

      if (this.isWithinLimit(tableMetadata)) {
        chunks.push({
          id: `table-${tableIndex}-metadata`,
          index: chunkIndex++,
          totalChunks: 0,
          type: 'metadata',
          contentType: 'table-metadata',
          content: tableMetadata,
          size: this.calculateSize(tableMetadata)
        });
      }

      // 分块行数据
      const rowChunks = this.chunkArray(
        rows,
        `table-${tableIndex}-rows`,
        chunkIndex,
        'table-rows'
      );
      chunks.push(...rowChunks);
      chunkIndex += rowChunks.length;
    }

    return chunks;
  }

  /**
   * 分块通用数据
   */
  private chunkGenericData(data: any): DataChunk[] {
    const chunks: DataChunk[] = [];
    let chunkIndex = 1;

    if (typeof data === 'object' && data !== null) {
      const entries = Object.entries(data);
      let buffer: any = {};
      let bufferSize = 0;

      for (const [key, value] of entries) {
        const fieldSize = this.calculateSize({ [key]: value });

        if (fieldSize > this.maxChunkSize) {
          // 单个字段过大
          chunks.push({
            id: `generic-oversized-${key}`,
            index: chunkIndex++,
            totalChunks: 0,
            type: 'oversize',
            contentType: 'oversized-field',
            content: {
              fieldName: key,
              fieldType: typeof value,
              summary: this.extractItemSummary(value)
            },
            size: this.calculateSize({ fieldName: key, summary: this.extractItemSummary(value) })
          });
          continue;
        }

        if (bufferSize + fieldSize > this.maxChunkSize && Object.keys(buffer).length > 0) {
          chunks.push({
            id: `generic-chunk-${chunks.length + 1}`,
            index: chunkIndex++,
            totalChunks: 0,
            type: 'data',
            contentType: 'generic-object',
            content: buffer,
            size: bufferSize
          });
          buffer = {};
          bufferSize = 0;
        }

        buffer[key] = value;
        bufferSize += fieldSize;
      }

      if (Object.keys(buffer).length > 0) {
        chunks.push({
          id: `generic-chunk-${chunks.length + 1}`,
          index: chunkIndex++,
          totalChunks: 0,
          type: 'data',
          contentType: 'generic-object',
          content: buffer,
          size: bufferSize
        });
      }
    } else {
      // 基本类型
      const content = { value: data };
      chunks.push({
        id: 'generic-single',
        index: 1,
        totalChunks: 1,
        type: 'data',
        contentType: 'generic-single',
        content,
        size: this.calculateSize(content)
      });
    }

    return chunks;
  }
}

/**
 * 创建严格分块器实例
 */
export function createStrictChunker(maxChunkSize?: number): StrictChunker {
  return new StrictChunker(maxChunkSize);
}

/**
 * 分块数据并保存到文件
 */
export async function chunkAndSave(
  data: any,
  requestId: string,
  maxChunkSize?: number
): Promise<ChunkingResult> {
  const chunker = createStrictChunker(maxChunkSize);
  const result = chunker.chunk(data);

  // 使用与data-store.ts相同的路径
  const DATA_STORE_ROOT = process.env.DATA_STORE_ROOT || 
    path.join(os.homedir(), '.grafana-mcp-analyzer', 'data-store');
  const requestDir = path.join(DATA_STORE_ROOT, requestId);
  const dataDir = path.join(requestDir, 'data');
  
  // 确保目录存在
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 保存分块元数据
  const metadataPath = path.join(dataDir, 'chunking-metadata.json');
  await fs.promises.writeFile(metadataPath, JSON.stringify({
    totalChunks: result.chunks.length,
    metadata: result.metadata,
    guidance: generateChunkingGuidance(result.chunks),
    chunkFiles: result.chunks.map((_, index) => `chunk-${index + 1}.json`)
  }, null, 2));

  // 保存每个分块
  for (let i = 0; i < result.chunks.length; i++) {
    const chunk = result.chunks[i];
    const chunkPath = path.join(dataDir, `chunk-${i + 1}.json`);
    await fs.promises.writeFile(chunkPath, JSON.stringify(chunk, null, 2));
  }

  return result;
}

/**
 * 从文件加载分块
 */
export async function loadChunks(requestId: string): Promise<ChunkingResult> {
  const DATA_STORE_ROOT = process.env.DATA_STORE_ROOT || 
    path.join(os.homedir(), '.grafana-mcp-analyzer', 'data-store');
  const requestDir = path.join(DATA_STORE_ROOT, requestId);
  const dataDir = path.join(requestDir, 'data');
  
  // 检查是否存在分块元数据文件
  const metadataPath = path.join(dataDir, 'chunking-metadata.json');
  
  try {
    // 尝试加载分块元数据
    const metadata = JSON.parse(await fsPromises.readFile(metadataPath, 'utf8'));

    // 加载所有分块
    const chunks: DataChunk[] = [];
    const files = fs.readdirSync(dataDir).filter(f => f.startsWith('chunk-') && f.endsWith('.json'));
    
    for (const file of files.sort()) {
      const chunkPath = path.join(dataDir, file);
      const chunk = JSON.parse(await fsPromises.readFile(chunkPath, 'utf8'));
      chunks.push(chunk);
    }

    return { chunks, metadata };
  } catch (error) {
    // 如果没有分块元数据，检查是否有完整数据文件
    const fullDataPath = path.join(dataDir, 'full.json');
    try {
      const fullData = JSON.parse(await fsPromises.readFile(fullDataPath, 'utf8'));
      
      // 创建虚拟分块结果
      const chunks: DataChunk[] = [{
        id: 'full-data',
        index: 1,
        totalChunks: 1,
        type: 'data',
        contentType: 'full-data',
        content: fullData,
        size: JSON.stringify(fullData).length
      }];
      
      const metadata = {
        totalSize: JSON.stringify(fullData).length,
        totalChunks: 1,
        dataType: 'full-data',
        chunkingStrategy: 'full'
      };
      
      return { chunks, metadata };
    } catch (fullDataError) {
      throw new Error(`无法找到请求ID ${requestId} 的分块或完整数据`);
    }
  }
}

/**
 * 验证分块结果
 */
export function validateChunks(chunks: DataChunk[], maxChunkSize?: number): boolean {
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
export function generateChunkingGuidance(chunks: DataChunk[]): string {
  if (chunks.length === 0) {
    return '没有数据需要分块';
  }
  
  const metadata = chunks[0].metadata;
  const dataType = metadata?.dataType || 'unknown';
  
  return `
## 数据分块信息
- **数据类型**: ${dataType}
- **总块数**: ${chunks.length}
- **总大小**: ${Math.round((metadata as any)?.totalSize / 1024)}KB
- **分块大小**: ${Math.round(getMaxChunkSize() / 1024)}KB

## 分析指导
1. **读取元数据**: 从第1块获取数据概览
2. **顺序读取**: 按块号顺序读取所有数据块
3. **逐步分析**: 每块分析后累积结果
4. **整合结论**: 基于所有块的分析结果生成最终报告

## 分块详情
${chunks.map(chunk => 
  `- 块${chunk.index}: ${chunk.type} (${Math.round(chunk.size / 1024)}KB) ${chunk.contentType}`
).join('\n')}

**重要**: 请按顺序读取所有分块，确保分析完整性。
  `;
} 