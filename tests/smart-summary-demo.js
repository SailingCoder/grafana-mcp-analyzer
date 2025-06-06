#!/usr/bin/env node

import { formatDataForClientAI } from '../dist/services/monitoring-analyzer.js';

console.log('🚀 智能摘要配置Demo测试\n');

// 模拟不同大小的Grafana监控数据
function createMockGrafanaData(size) {
  const baseData = {
    results: [],
    series: [],
    query: 'cpu_usage_percent',
    datasource: 'prometheus',
    status: 'success'
  };

  if (size === 'small') {
    // 小数据：约2KB
    baseData.results = Array.from({length: 10}, (_, i) => ({
      metric: {__name__: 'cpu_usage', instance: `server-${i}`},
      value: [Date.now() / 1000, Math.random() * 100],
      timestamp: Date.now()
    }));
  } else if (size === 'medium') {
    // 中等数据：约50KB  
    baseData.results = Array.from({length: 200}, (_, i) => ({
      metric: {__name__: 'cpu_usage', instance: `server-${i}`, job: 'monitoring'},
      values: Array.from({length: 50}, (_, j) => [
        Date.now() / 1000 - j * 60, 
        Math.random() * 100
      ]),
      timestamp: Date.now()
    }));
  } else if (size === 'large') {
    // 大数据：约800KB，会触发智能摘要
    baseData.results = Array.from({length: 300}, (_, i) => ({
      metric: {
        __name__: 'detailed_metrics',
        instance: `server-${i}`,
        job: 'monitoring',
        region: `us-west-${i % 3}`,
        service: `service-${i % 10}`
      },
      values: Array.from({length: 50}, (_, j) => [
        Date.now() / 1000 - j * 60,
        Math.random() * 100
      ]),
      timestamp: Date.now(),
      labels: {
        severity: i % 2 ? 'high' : 'low',
        team: `team-${i % 5}`
      }
    }));
  }

  return baseData;
}

function createMockExtractedData(size) {
  return {
    hasData: true,
    type: 'grafana',
    data: createMockGrafanaData(size),
    status: 200,
    timestamp: new Date().toISOString(),
    metadata: {
      responseSize: JSON.stringify(createMockGrafanaData(size)).length,
      contentType: 'application/json'
    }
  };
}

// 测试场景
const scenarios = [
  {
    name: '场景1：无配置（默认无限制）',
    config: undefined, // 无配置
    dataSize: 'large',
    description: '信任AI处理能力，直接发送完整数据'
  },
  {
    name: '场景2：启用智能摘要（500KB阈值）',
    config: {
      dataProcessing: {
        enableSummary: true,
        maxDataLength: 500000  // 500KB
      }
    },
    dataSize: 'large',
    description: '大数据触发智能摘要和友好提示'
  },
  {
    name: '场景3：严格限制（100KB阈值）',
    config: {
      dataProcessing: {
        enableSummary: true,
        maxDataLength: 100000  // 100KB
      }
    },
    dataSize: 'medium',
    description: '中等数据也会触发摘要'
  },
  {
    name: '场景4：小数据（任意配置）',
    config: {
      dataProcessing: {
        enableSummary: true,
        maxDataLength: 50000   // 50KB
      }
    },
    dataSize: 'small',
    description: '小数据永远不会被摘要'
  }
];

// 执行测试
scenarios.forEach((scenario, index) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 ${scenario.name}`);
  console.log(`📝 ${scenario.description}`);
  console.log(`${'='.repeat(60)}`);

  const mockData = createMockExtractedData(scenario.dataSize);
  const originalSize = JSON.stringify(mockData.data).length;
  
  console.log(`\n🔍 输入数据信息：`);
  console.log(`   数据大小: ${Math.round(originalSize/1024)}KB (${originalSize.toLocaleString()} 字符)`);
  console.log(`   配置状态: ${scenario.config ? '已配置智能摘要' : '无配置（默认无限制）'}`);
  
  if (scenario.config?.dataProcessing) {
    const threshold = scenario.config.dataProcessing.maxDataLength;
    console.log(`   摘要阈值: ${Math.round(threshold/1024)}KB`);
    console.log(`   是否超过: ${originalSize > threshold ? '✅ 是，将触发摘要' : '❌ 否，发送完整数据'}`);
  }

  // 执行格式化
  console.log(`\n⚙️ 处理过程：`);
  const startTime = Date.now();
  
  try {
    const result = formatDataForClientAI(
      '分析这个Grafana监控数据，识别CPU使用率异常模式',
      mockData,
      scenario.config
    );
    
    const processTime = Date.now() - startTime;
    const resultSize = result.length;
    
    console.log(`   处理时间: ${processTime}ms`);
    console.log(`   输出大小: ${Math.round(resultSize/1024)}KB (${resultSize.toLocaleString()} 字符)`);
    console.log(`   压缩比率: ${Math.round((1 - resultSize/originalSize) * 100)}%`);
    
    // 检查是否包含摘要标识
    const hasSummary = result.includes('[监控数据摘要]');
    const hasWarning = result.includes('⚠️ 数据量警告');
    
    console.log(`\n📋 输出特征：`);
    console.log(`   智能摘要: ${hasSummary ? '✅ 已启用' : '❌ 未启用'}`);
    console.log(`   用户警告: ${hasWarning ? '✅ 已显示' : '❌ 未显示'}`);
    
    // 显示输出片段
    console.log(`\n📄 输出预览（前200字符）：`);
    console.log(`   ${result.substring(0, 200)}...`);
    
    if (hasWarning) {
      console.log(`\n⚠️ 友好提示内容：`);
      const warningStart = result.indexOf('⚠️ 数据量警告');
      const warningSection = result.substring(warningStart, warningStart + 400);
      console.log(`   ${warningSection}...`);
    }
    
  } catch (error) {
    console.error(`   ❌ 处理失败: ${error.message}`);
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`🎯 Demo总结`);
console.log(`${'='.repeat(60)}`);
console.log(`
✅ 功能验证：
1. 默认无限制：大数据直接发送给AI，获得最佳分析效果
2. 智能摘要：超过阈值时启用摘要，提供友好的优化建议
3. 灵活配置：用户可自定义阈值，满足不同场景需求
4. 用户体验：明确提示数据处理状态和优化建议

💡 推荐使用：
- 🚀 默认无限制：大多数场景，信任AI处理能力
- 🛡️ 智能保护：网络或性能有限时启用

🔧 配置方法：
// 无限制（推荐）
export default { baseUrl: 'https://grafana.com' };

// 智能保护
export default {
  dataProcessing: {
    enableSummary: true,
    maxDataLength: 500000  // 500KB阈值
  }
};
`);

console.log('\n🎉 Demo测试完成！'); 