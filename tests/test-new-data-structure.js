/**
 * 新数据存储结构测试
 */
import {
  generateRequestId,
  storeRequestMetadata,
  getRequestMetadata,
  storeResponseData,
  getResponseData,
  listDataFiles,
  storeAnalysis,
  getAnalysis,
  listAllRequests,
  listRequestsBySession,
  deleteRequest,
  requestExists,
  getRequestStats
} from '../dist/services/data-store.js';

// 测试数据
const TEST_DATA = {
  small: {
    type: 'timeseries',
    hasData: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    data: {
      series: [
        {
          name: 'cpu_usage',
          fields: [
            { name: 'time', values: [1, 2, 3] },
            { name: 'value', values: [25, 30, 35] }
          ],
          length: 3
        }
      ]
    }
  },
  large: {
    type: 'timeseries',
    hasData: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    data: {
      series: Array.from({ length: 100 }, (_, i) => ({
        name: `series_${i}`,
        fields: [
          { name: 'time', values: Array.from({ length: 1000 }, (_, j) => j) },
          { name: 'value', values: Array.from({ length: 1000 }, () => Math.random() * 100) }
        ],
        length: 1000
      }))
    }
  }
};

/**
 * 运行测试
 */
async function runTest() {
  console.log('开始测试新的数据存储结构...');
  
  try {
    // 1. 测试小数据存储
    console.log('\n1. 测试小数据存储...');
    const smallRequestId = generateRequestId();
    console.log(`生成请求ID: ${smallRequestId}`);
    
    // 存储请求元数据
    await storeRequestMetadata(smallRequestId, {
      timestamp: new Date().toISOString(),
      url: 'api/ds/query',
      method: 'POST',
      data: { targets: [{ refId: 'A', expr: 'cpu' }] },
      prompt: '分析CPU使用率',
      sessionId: 'session-test'
    });
    
    // 存储响应数据
    const smallStorageResult = await storeResponseData(smallRequestId, TEST_DATA.small);
    console.log(`小数据存储结果:`, smallStorageResult);
    
    // 获取元数据
    const smallMetadata = await getRequestMetadata(smallRequestId);
    console.log(`元数据:`, smallMetadata);
    
    // 获取响应数据
    const smallData = await getResponseData(smallRequestId);
    console.log(`响应数据大小: ${JSON.stringify(smallData).length} 字符`);
    
    // 存储分析结果
    await storeAnalysis(smallRequestId, {
      prompt: '分析CPU使用率',
      timestamp: new Date().toISOString(),
      result: 'CPU使用率正常，平均值为30%'
    });
    
    // 获取分析结果
    const smallAnalysis = await getAnalysis(smallRequestId);
    console.log(`分析结果:`, smallAnalysis.result);
    
    // 2. 测试大数据存储
    console.log('\n2. 测试大数据存储...');
    const largeRequestId = generateRequestId();
    console.log(`生成请求ID: ${largeRequestId}`);
    
    // 存储请求元数据
    await storeRequestMetadata(largeRequestId, {
      timestamp: new Date().toISOString(),
      url: 'api/ds/query',
      method: 'POST',
      data: { targets: [{ refId: 'A', expr: 'metrics' }] },
      prompt: '分析大量监控数据',
      sessionId: 'session-test'
    });
    
    // 存储响应数据（大数据）
    const largeStorageResult = await storeResponseData(largeRequestId, TEST_DATA.large, 100 * 1024); // 100KB分块
    console.log(`大数据存储结果:`, largeStorageResult);
    
    // 列出数据文件
    const dataFiles = await listDataFiles(largeRequestId);
    console.log(`数据文件列表:`, dataFiles);
    
    // 获取数据块
    if (dataFiles.includes('chunk-0.json')) {
      const chunk0 = await getResponseData(largeRequestId, 'chunk-0');
      console.log(`第一个数据块大小: ${chunk0.length} 字符`);
    }
    
    // 获取完整数据（自动组合分块）
    const largeData = await getResponseData(largeRequestId);
    console.log(`完整数据大小: ${JSON.stringify(largeData).length} 字符`);
    
    // 3. 测试请求列表功能
    console.log('\n3. 测试请求列表功能...');
    
    // 列出所有请求
    const allRequests = await listAllRequests();
    console.log(`所有请求数量: ${allRequests.length}`);
    console.log(`请求ID列表: ${allRequests.map(r => r.id)}`);
    
    // 按会话列出请求
    const sessionRequests = await listRequestsBySession('session-test');
    console.log(`会话请求数量: ${sessionRequests.length}`);
    
    // 4. 测试请求统计
    console.log('\n4. 测试请求统计...');
    
    const smallStats = await getRequestStats(smallRequestId);
    console.log(`小数据统计:`, smallStats);
    
    const largeStats = await getRequestStats(largeRequestId);
    console.log(`大数据统计:`, largeStats);
    
    // 5. 测试请求存在性检查
    console.log('\n5. 测试请求存在性检查...');
    
    const exists1 = await requestExists(smallRequestId);
    const exists2 = await requestExists('non-existent-id');
    console.log(`${smallRequestId} 存在: ${exists1}`);
    console.log(`non-existent-id 存在: ${exists2}`);
    
    console.log('\n测试完成！');
    
    // 清理测试数据
    if (process.env.KEEP_TEST_DATA !== 'true') {
      console.log('\n清理测试数据...');
      await deleteRequest(smallRequestId);
      await deleteRequest(largeRequestId);
      console.log('测试数据已清理');
    } else {
      console.log(`\n保留测试数据:`);
      console.log(`- 小数据请求ID: ${smallRequestId}`);
      console.log(`- 大数据请求ID: ${largeRequestId}`);
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
runTest().catch(console.error); 