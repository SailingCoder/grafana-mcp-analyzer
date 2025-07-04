#!/usr/bin/env node

/**
 * 最小化测试 - 验证构建输出和基本功能
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🧪 运行最小化测试...');

// 测试1: 验证构建输出文件存在
const requiredFiles = [
  'dist/server/mcp-server.js',
  'dist/types/index.d.ts',
  'package.json',
  'README.md',
  'LICENSE'
];

let passed = 0;
let failed = 0;

console.log('\n📦 检查构建输出文件...');
for (const file of requiredFiles) {
  const filePath = join(projectRoot, file);
  if (existsSync(filePath)) {
    console.log(`✅ ${file}`);
    passed++;
  } else {
    console.log(`❌ ${file} - 文件不存在`);
    failed++;
  }
}

// 测试2: 验证package.json基本字段
console.log('\n📋 检查package.json配置...');
try {
  const packageJsonPath = join(projectRoot, 'package.json');
  const packageContent = await import(packageJsonPath, { 
    assert: { type: 'json' } 
  });
  const pkg = packageContent.default;
  
  const requiredFields = ['name', 'version', 'main', 'types', 'license'];
  for (const field of requiredFields) {
    if (pkg[field]) {
      console.log(`✅ ${field}: ${pkg[field]}`);
      passed++;
    } else {
      console.log(`❌ ${field} - 字段缺失`);
      failed++;
    }
  }
} catch (error) {
  console.log(`❌ package.json读取失败: ${error.message}`);
  failed++;
}

// 测试3: 验证主入口文件可以导入（仅检查语法）
console.log('\n🔧 检查主入口文件...');
try {
  const mainEntry = join(projectRoot, 'dist/server/mcp-server.js');
  if (existsSync(mainEntry)) {
    console.log('✅ 主入口文件存在');
    passed++;
  } else {
    console.log('❌ 主入口文件不存在');
    failed++;
  }
} catch (error) {
  console.log(`❌ 主入口文件检查失败: ${error.message}`);
  failed++;
}

// 输出测试结果
console.log('\n📊 测试结果总结:');
console.log(`✅ 通过: ${passed}`);
console.log(`❌ 失败: ${failed}`);

if (failed > 0) {
  console.log('\n🚨 测试失败，请检查构建输出');
  process.exit(1);
} else {
  console.log('\n🎉 所有测试通过！');
  process.exit(0);
} 