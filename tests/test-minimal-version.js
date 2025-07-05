import { loadConfig } from '../dist/services/config-manager.js';
import fs from 'fs';
import path from 'path';

// 基本功能测试
async function testBasicFunctionality() {
  console.log('🧪 开始基本功能测试...');
  
  // 创建临时配置文件（使用.cjs扩展名避免被项目的"type": "module"影响）
  const testConfigPath = path.join(process.cwd(), 'tests', 'temp-config.cjs');
  const testConfig = `const config = {
  baseUrl: 'https://test-grafana.com',
  defaultHeaders: {
    'Content-Type': 'application/json'
  },
  queries: {
    test_query: {
      url: 'api/test',
      method: 'GET'
    }
  }
};

module.exports = config;`;
  
  try {
    // 写入测试配置文件
    fs.writeFileSync(testConfigPath, testConfig);
    
    // 测试配置加载
    const config = await loadConfig(testConfigPath);
    
    // 验证配置
    if (!config || !config.queries || !config.queries.test_query) {
      throw new Error('配置加载失败或格式不正确');
    }
    
    console.log('✅ 配置加载测试通过');
    console.log('✅ 包含查询数量:', Object.keys(config.queries).length);
    
    // 清理测试文件
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
    
    console.log('🎉 所有测试通过！');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    // 清理测试文件
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
    
    process.exit(1);
  }
}

testBasicFunctionality(); 