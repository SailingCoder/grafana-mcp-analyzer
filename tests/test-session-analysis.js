/**
 * 会话聚合分析功能测试
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  createSession,
  updateSessionInfo,
  getSessionInfo,
  listSessions,
  deleteSession
} from '../dist/services/session-manager.js';

import {
  storeRequestInfo,
  listSessionRequests
} from '../dist/services/request-store.js';

import {
  storeMonitoringDataInSession,
  getMonitoringDataFromSession,
  listSessionResponses
} from '../dist/services/data-store.js';

// 测试数据
const TEST_DATA = {
  cpu: {
    type: 'timeseries',
    hasData: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    data: {
      series: [
        {
          name: 'cpu_usage',
          fields: [
            { name: 'time', values: [1, 2, 3, 4, 5] },
            { name: 'value', values: [25, 30, 45, 40, 35] }
          ],
          length: 5
        }
      ]
    }
  },
  memory: {
    type: 'timeseries',
    hasData: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    data: {
      series: [
        {
          name: 'memory_usage',
          fields: [
            { name: 'time', values: [1, 2, 3, 4, 5] },
            { name: 'value', values: [60, 65, 70, 75, 80] }
          ],
          length: 5
        }
      ]
    }
  },
  disk: {
    type: 'timeseries',
    hasData: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    data: {
      series: [
        {
          name: 'disk_usage',
          fields: [
            { name: 'time', values: [1, 2, 3, 4, 5] },
            { name: 'value', values: [50, 51, 52, 53, 54] }
          ],
          length: 5
        }
      ]
    }
  }
};

/**
 * 运行测试
 */
async function runTest() {
  console.log('开始测试会话聚合分析功能...');
  
  try {
    // 1. 创建测试会话
    console.log('创建测试会话...');
    const sessionId = await createSession({
      description: '性能监控测试会话',
      createdBy: 'test'
    });
    console.log(`会话创建成功: ${sessionId}`);
    
    // 2. 创建测试请求和响应
    console.log('创建测试请求和响应...');
    
    // CPU请求
    const cpuRequestId = `request-cpu-${Date.now()}`;
    await storeRequestInfo(sessionId, cpuRequestId, {
      timestamp: new Date().toISOString(),
      prompt: '分析CPU使用率',
      request: { url: 'api/ds/query', data: { targets: [{ refId: 'A', expr: 'cpu' }] } }
    });
    
    // CPU响应
    const cpuResponseId = `response-cpu-${Date.now()}`;
    await storeMonitoringDataInSession(
      sessionId,
      cpuResponseId,
      'data',
      TEST_DATA.cpu
    );
    
    // 等待一下，确保时间戳不同
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 内存请求
    const memRequestId = `request-mem-${Date.now()}`;
    await storeRequestInfo(sessionId, memRequestId, {
      timestamp: new Date().toISOString(),
      prompt: '分析内存使用率',
      request: { url: 'api/ds/query', data: { targets: [{ refId: 'A', expr: 'memory' }] } }
    });
    
    // 内存响应
    const memResponseId = `response-mem-${Date.now()}`;
    await storeMonitoringDataInSession(
      sessionId,
      memResponseId,
      'data',
      TEST_DATA.memory
    );
    
    // 等待一下，确保时间戳不同
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 磁盘请求
    const diskRequestId = `request-disk-${Date.now()}`;
    await storeRequestInfo(sessionId, diskRequestId, {
      timestamp: new Date().toISOString(),
      prompt: '分析磁盘使用率',
      request: { url: 'api/ds/query', data: { targets: [{ refId: 'A', expr: 'disk' }] } }
    });
    
    // 磁盘响应
    const diskResponseId = `response-disk-${Date.now()}`;
    await storeMonitoringDataInSession(
      sessionId,
      diskResponseId,
      'data',
      TEST_DATA.disk
    );
    
    // 3. 更新会话信息
    await updateSessionInfo(sessionId, {
      requestCount: 3,
      lastPrompt: '分析磁盘使用率'
    });
    
    // 4. 验证会话信息
    console.log('验证会话信息...');
    const sessionInfo = await getSessionInfo(sessionId);
    console.log(JSON.stringify(sessionInfo, null, 2));
    
    // 5. 验证请求列表
    console.log('验证请求列表...');
    const requests = await listSessionRequests(sessionId);
    console.log(`请求数量: ${requests.length}`);
    console.log(requests.map(req => req.id));
    
    // 6. 验证响应列表
    console.log('验证响应列表...');
    const responses = await listSessionResponses(sessionId);
    console.log(`响应数量: ${responses.length}`);
    console.log(responses.map(resp => resp.id));
    
    // 7. 模拟聚合分析
    console.log('模拟聚合分析...');
    const aggregateId = `aggregate-${Date.now()}`;
    await storeMonitoringDataInSession(
      sessionId,
      aggregateId,
      'analysis',
      {
        prompt: '综合分析系统性能',
        timestamp: new Date().toISOString(),
        result: '系统CPU使用率平均为35%，内存使用率平均为70%，磁盘使用率平均为52%。系统整体性能良好，无明显瓶颈。',
        requests: [cpuRequestId, memRequestId, diskRequestId]
      }
    );
    
    // 更新会话信息
    await updateSessionInfo(sessionId, {
      lastAggregateId: aggregateId,
      lastAggregateTimestamp: new Date().toISOString()
    });
    
    // 8. 模拟生成报告
    console.log('模拟生成报告...');
    const reportId = `report-${Date.now()}`;
    
    // 报告数据
    await storeMonitoringDataInSession(
      sessionId,
      reportId,
      'report',
      {
        sessionInfo,
        analysis: {
          prompt: '综合分析系统性能',
          result: '系统CPU使用率平均为35%，内存使用率平均为70%，磁盘使用率平均为52%。系统整体性能良好，无明显瓶颈。'
        },
        requests,
        responses,
        format: 'markdown',
        timestamp: new Date().toISOString()
      }
    );
    
    // 报告内容
    const reportContent = `# 监控数据分析报告

## 会话信息
- ID: ${sessionId}
- 创建时间: ${new Date(sessionInfo.created).toLocaleString()}
- 请求数量: ${sessionInfo.requestCount}

## 分析概要
系统CPU使用率平均为35%，内存使用率平均为70%，磁盘使用率平均为52%。系统整体性能良好，无明显瓶颈。

## 请求列表
1. 分析CPU使用率
2. 分析内存使用率
3. 分析磁盘使用率

## 详细分析
请查看完整JSON报告获取更多详细信息。

## 生成时间
${new Date().toLocaleString()}
`;
    
    await storeMonitoringDataInSession(
      sessionId,
      reportId,
      'content',
      reportContent
    );
    
    // 更新会话信息
    await updateSessionInfo(sessionId, {
      lastReportId: reportId,
      lastReportTimestamp: new Date().toISOString()
    });
    
    // 9. 验证最终会话信息
    console.log('验证最终会话信息...');
    const finalSessionInfo = await getSessionInfo(sessionId);
    console.log(JSON.stringify(finalSessionInfo, null, 2));
    
    // 10. 验证聚合分析结果
    console.log('验证聚合分析结果...');
    const analysis = await getMonitoringDataFromSession(
      sessionId,
      aggregateId,
      'analysis'
    );
    console.log(JSON.stringify(analysis, null, 2));
    
    // 11. 验证报告内容
    console.log('验证报告内容...');
    const report = await getMonitoringDataFromSession(
      sessionId,
      reportId,
      'content'
    );
    console.log(report);
    
    console.log('测试完成！');
    
    // 清理测试数据
    if (process.env.KEEP_TEST_DATA !== 'true') {
      console.log('清理测试数据...');
      await deleteSession(sessionId);
      console.log('测试数据已清理');
    } else {
      console.log(`保留测试数据，会话ID: ${sessionId}`);
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
runTest().catch(console.error); 