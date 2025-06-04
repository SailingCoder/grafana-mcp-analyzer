/**
 * curl解析器功能测试
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { parseCurlCommand, httpRequestToCurl } from '../dist/datasources/curl-parser.js';

console.log('🧪 开始测试curl解析器功能...\n');

// 测试用例
const testCases = [
  {
    name: '简单GET请求',
    curl: "curl 'https://api.example.com/health'",
    expected: {
      url: 'https://api.example.com/health',
      method: 'GET'
    }
  },
  {
    name: 'POST请求带JSON数据',
    curl: `curl 'https://api.example.com/query' -X POST -H 'Content-Type: application/json' -d '{"query": "test"}'`,
    expected: {
      url: 'https://api.example.com/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: { query: 'test' }
    }
  },
  {
    name: '带认证头的请求',
    curl: `curl 'api/ds/query' -H 'Authorization: Bearer token123' -H 'Content-Type: application/json' -X POST`,
    expected: {
      url: 'api/ds/query',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer token123',
        'Content-Type': 'application/json'
      }
    }
  },
  {
    name: '复杂的多行curl命令',
    curl: `curl 'api/ds/es/query' \\
      -X POST \\
      -H 'Content-Type: application/json' \\
      -H 'Authorization: Bearer token' \\
      -d '{
        "query": {
          "bool": {
            "filter": [
              {"range": {"@timestamp": {"gte": "now-1h"}}}
            ]
          }
        }
      }'`,
    expected: {
      url: 'api/ds/es/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token'
      }
    }
  },
  {
    name: '带超时设置的请求',
    curl: `curl 'api/health' --connect-timeout 30 --max-time 60`,
    expected: {
      url: 'api/health',
      method: 'GET',
      timeout: 30000 // 转换为毫秒
    }
  },
  {
    name: '基础认证',
    curl: `curl 'api/admin' -u 'user:pass'`,
    expected: {
      url: 'api/admin',
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from('user:pass').toString('base64')
      }
    }
  }
];

// 执行测试
let passedTests = 0;
let totalTests = testCases.length;

for (const testCase of testCases) {
  console.log(`📋 测试: ${testCase.name}`);
  console.log(`💬 输入: ${testCase.curl}`);
  
  try {
    const result = parseCurlCommand(testCase.curl);
    console.log(`✅ 解析结果:`, JSON.stringify(result, null, 2));
    
    // 简单验证
    let isValid = true;
    
    if (testCase.expected.url && result.url !== testCase.expected.url) {
      console.log(`❌ URL不匹配: 期望 ${testCase.expected.url}, 实际 ${result.url}`);
      isValid = false;
    }
    
    if (testCase.expected.method && result.method !== testCase.expected.method) {
      console.log(`❌ 方法不匹配: 期望 ${testCase.expected.method}, 实际 ${result.method}`);
      isValid = false;
    }
    
    if (testCase.expected.headers) {
      for (const [key, value] of Object.entries(testCase.expected.headers)) {
        if (result.headers?.[key] !== value) {
          console.log(`❌ 请求头不匹配: ${key}: 期望 ${value}, 实际 ${result.headers?.[key]}`);
          isValid = false;
        }
      }
    }
    
    if (isValid) {
      console.log(`✅ 测试通过\n`);
      passedTests++;
    } else {
      console.log(`❌ 测试失败\n`);
    }
    
  } catch (error) {
    console.log(`❌ 解析失败:`, error.message);
    console.log(`❌ 测试失败\n`);
  }
}

// 测试curl转换功能
console.log('🔄 测试HttpRequest转curl功能...\n');

const httpRequest = {
  url: 'api/ds/query',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer test-token',
    'Content-Type': 'application/json'
  },
  data: { query: 'test query' },
  timeout: 5000
};

try {
  const curlCommand = httpRequestToCurl(httpRequest, 'https://grafana.example.com');
  console.log('✅ 生成的curl命令:');
  console.log(curlCommand);
  console.log('');
} catch (error) {
  console.log('❌ curl生成失败:', error.message);
}

// 测试总结
console.log('📊 测试总结:');
console.log(`✅ 通过: ${passedTests}/${totalTests} 个测试`);
console.log(`📈 成功率: ${Math.round(passedTests / totalTests * 100)}%`);

if (passedTests === totalTests) {
  console.log('🎉 所有测试通过！curl解析器功能正常。');
  process.exit(0);
} else {
  console.log('⚠️ 部分测试失败，请检查curl解析器实现。');
  process.exit(1);
} 