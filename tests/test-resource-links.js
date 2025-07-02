import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 模拟data-store.js的功能，因为直接导入会有模块路径问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORAGE_DIR = path.resolve(__dirname, '../.data-store');

// 确保存储目录存在
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * 存储监控数据
 */
async function storeMonitoringData(id, data) {
  const filePath = path.join(STORAGE_DIR, `${id}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 获取监控数据
 */
async function getMonitoringData(id) {
  const filePath = path.join(STORAGE_DIR, `${id}.json`);
  
  try {
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`无法获取监控数据: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 将大型数据分割成多个块
 */
function splitDataIntoChunks(data, maxChunkSize = 100000) {
  if (typeof data !== 'object' || data === null) {
    return [data];
  }
  
  // 处理数组类型数据
  if (Array.isArray(data)) {
    const chunks = [];
    let currentChunk = [];
    let currentSize = 0;
    
    for (const item of data) {
      const itemSize = JSON.stringify(item).length;
      
      if (currentSize + itemSize > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentSize = 0;
      }
      
      currentChunk.push(item);
      currentSize += itemSize;
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }
  
  // 处理时间序列数据
  if (data.series && Array.isArray(data.series)) {
    const result = [];
    
    // 每个系列单独作为一个块
    for (let i = 0; i < data.series.length; i++) {
      const seriesData = {
        ...data,
        series: [data.series[i]],
        _meta: {
          partIndex: i,
          totalParts: data.series.length,
          seriesName: data.series[i].name || `Series ${i+1}`
        }
      };
      result.push(seriesData);
    }
    
    return result;
  }
  
  // 处理Elasticsearch类型的数据
  if (data.responses && Array.isArray(data.responses)) {
    const result = [];
    
    // 每个响应作为一个块
    for (let i = 0; i < data.responses.length; i++) {
      const responseData = {
        responses: [data.responses[i]],
        _meta: {
          partIndex: i,
          totalParts: data.responses.length,
          responseName: `Response ${i+1}`
        }
      };
      result.push(responseData);
    }
    
    return result;
  }
  
  // 其他对象类型，按属性分组
  const keys = Object.keys(data);
  if (keys.length <= 5) {
    return [data]; // 属性少于5个，直接返回
  }
  
  // 按属性分组
  const chunks = [];
  let currentChunk = {};
  let currentSize = 0;
  
  for (const key of keys) {
    const value = data[key];
    const valueSize = JSON.stringify(value).length;
    
    if (currentSize + valueSize > maxChunkSize && Object.keys(currentChunk).length > 0) {
      chunks.push(currentChunk);
      currentChunk = {};
      currentSize = 0;
    }
    
    currentChunk[key] = value;
    currentSize += valueSize;
  }
  
  if (Object.keys(currentChunk).length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

// 生成测试数据
const testData = {
  series: Array.from({ length: 5 }, (_, i) => ({
    name: `Series ${i+1}`,
    fields: [
      { name: 'time', values: Array.from({ length: 1000 }, (_, j) => Date.now() + j * 60000) },
      { name: 'value', values: Array.from({ length: 1000 }, () => Math.random() * 100) }
    ]
  }))
};

// 测试Elasticsearch类型数据
const testElasticsearchData = {
  responses: Array.from({ length: 3 }, (_, i) => ({
    took: Math.floor(Math.random() * 100),
    timed_out: false,
    _shards: {
      total: 10,
      successful: 10,
      failed: 0
    },
    hits: {
      total: 1000,
      max_score: null,
      hits: []
    },
    aggregations: {
      [`agg_${i+1}`]: {
        buckets: Array.from({ length: 24 }, (_, j) => ({
          key_as_string: new Date(Date.now() + j * 3600000).toISOString(),
          key: Date.now() + j * 3600000,
          doc_count: Math.floor(Math.random() * 100),
          avg_value: {
            value: Math.random() * 100
          }
        }))
      }
    }
  }))
};

async function runTest() {
  console.log('测试数据大小:');
  console.log('- 时间序列数据:', JSON.stringify(testData).length, '字节');
  console.log('- Elasticsearch数据:', JSON.stringify(testElasticsearchData).length, '字节');
  
  console.log('\n测试1: 分割时间序列数据...');
  const seriesChunks = splitDataIntoChunks(testData);
  console.log(`数据被分割成 ${seriesChunks.length} 个块`);
  
  console.log('\n测试2: 分割Elasticsearch数据...');
  const esChunks = splitDataIntoChunks(testElasticsearchData);
  console.log(`数据被分割成 ${esChunks.length} 个块`);
  
  const sessionId = Date.now().toString();
  console.log('\n测试3: 存储数据块...');
  
  // 存储时间序列数据
  for (let i = 0; i < seriesChunks.length; i++) {
    const chunkId = `${sessionId}-series-${i}`;
    await storeMonitoringData(chunkId, seriesChunks[i]);
    console.log(`- 已存储时间序列块 ${i+1}/${seriesChunks.length}`);
  }
  
  // 存储Elasticsearch数据
  for (let i = 0; i < esChunks.length; i++) {
    const chunkId = `${sessionId}-es-${i}`;
    await storeMonitoringData(chunkId, esChunks[i]);
    console.log(`- 已存储Elasticsearch块 ${i+1}/${esChunks.length}`);
  }
  
  console.log('\n测试4: 读取数据...');
  const retrievedSeriesData = await getMonitoringData(`${sessionId}-series-0`);
  console.log('- 读取时间序列数据成功:', !!retrievedSeriesData);
  
  const retrievedEsData = await getMonitoringData(`${sessionId}-es-0`);
  console.log('- 读取Elasticsearch数据成功:', !!retrievedEsData);
  
  console.log('\n测试5: 验证元数据...');
  if (retrievedSeriesData._meta) {
    console.log('- 时间序列元数据:', retrievedSeriesData._meta);
  } else {
    console.log('- 时间序列元数据不存在');
  }
  
  if (retrievedEsData._meta) {
    console.log('- Elasticsearch元数据:', retrievedEsData._meta);
  } else {
    console.log('- Elasticsearch元数据不存在');
  }
  
  console.log('\n测试完成!');
}

runTest().catch(console.error); 