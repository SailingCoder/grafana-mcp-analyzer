#!/usr/bin/env node

/**
 * 数据清理功能测试脚本
 * 
 * 这个脚本用于测试 cleanupExpiredData 函数的功能，包括：
 * 1. 创建测试数据
 * 2. 测试过期数据清理
 * 3. 测试强制清理
 * 4. 验证清理结果
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function runTests() {
  try {
    console.log('🧪 开始测试数据清理功能...');
    
    // 测试数据根目录
    const testDataRoot = path.join(os.homedir(), '.grafana-mcp-analyzer-test');
    
    // 确保测试目录存在并为空
    try {
      await fs.rm(testDataRoot, { recursive: true, force: true });
    } catch (err) {
      // 忽略不存在的目录错误
    }
    await fs.mkdir(testDataRoot, { recursive: true });
    
    // 设置环境变量，指向测试目录
    process.env.DATA_STORE_ROOT = testDataRoot;
    
    // 动态导入模块（确保使用最新的环境变量）
    const { cleanupExpiredData } = await import('../dist/services/data-store.js');
    
    // 创建测试数据
    console.log('📁 创建测试数据...');
    
    // 1. 创建过期数据 (3天前)
    const expiredRequestId = 'request-expired-test';
    const expiredDir = path.join(testDataRoot, expiredRequestId);
    await fs.mkdir(expiredDir, { recursive: true });
    await fs.mkdir(path.join(expiredDir, 'data'), { recursive: true });
    
    // 创建过期元数据 (3天前)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    await fs.writeFile(
      path.join(expiredDir, 'metadata.json'), 
      JSON.stringify({
        id: expiredRequestId,
        timestamp: threeDaysAgo.toISOString(),
        url: 'test-url',
        method: 'GET'
      })
    );
    
    // 2. 创建新数据 (1小时前)
    const newRequestId = 'request-new-test';
    const newDir = path.join(testDataRoot, newRequestId);
    await fs.mkdir(newDir, { recursive: true });
    await fs.mkdir(path.join(newDir, 'data'), { recursive: true });
    
    // 创建新元数据 (1小时前)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    await fs.writeFile(
      path.join(newDir, 'metadata.json'), 
      JSON.stringify({
        id: newRequestId,
        timestamp: oneHourAgo.toISOString(),
        url: 'test-url',
        method: 'GET'
      })
    );
    
    // 验证测试数据已创建
    const initialDirs = await fs.readdir(testDataRoot);
    console.log(`✅ 测试数据已创建: ${initialDirs.join(', ')}`);
    
    // 测试1: 清理过期数据 (超过24小时)
    console.log('\n🧪 测试1: 清理过期数据 (超过24小时)');
    const deletedCount1 = await cleanupExpiredData(false, 24);
    console.log(`🗑️ 已删除 ${deletedCount1} 个过期请求`);
    
    // 验证结果
    const remainingDirs1 = await fs.readdir(testDataRoot);
    console.log(`📁 剩余目录: ${remainingDirs1.join(', ')}`);
    const test1Result = !remainingDirs1.includes(expiredRequestId) && remainingDirs1.includes(newRequestId);
    console.log(`✅ 测试1结果: ${test1Result ? '通过' : '失败'}`);
    
    // 测试2: 强制清理所有数据
    if (remainingDirs1.length > 0) {
      console.log('\n🧪 测试2: 强制清理所有数据');
      const deletedCount2 = await cleanupExpiredData(true);
      console.log(`🗑️ 已删除 ${deletedCount2} 个请求`);
      
      // 验证结果
      const remainingDirs2 = await fs.readdir(testDataRoot);
      console.log(`📁 剩余目录: ${remainingDirs2.length === 0 ? '无' : remainingDirs2.join(', ')}`);
      console.log(`✅ 测试2结果: ${remainingDirs2.length === 0 ? '通过' : '失败'}`);
    }
    
    // 清理测试目录
    await fs.rm(testDataRoot, { recursive: true, force: true });
    
    // 删除环境变量
    delete process.env.DATA_STORE_ROOT;
    
    console.log('\n🎉 测试完成!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

runTests(); 