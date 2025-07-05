#!/usr/bin/env node

/**
 * 构建优化脚本
 * 
 * 使用esbuild对TypeScript编译后的代码进行进一步优化：
 * 1. 代码压缩
 * 2. 去除注释
 * 3. 保留源码映射
 */

import { build } from 'esbuild';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

/**
 * 递归获取目录中的所有JS文件
 */
async function getJsFiles(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  const jsFiles = [];

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      const subDirFiles = await getJsFiles(fullPath);
      jsFiles.push(...subDirFiles);
    } else if (file.name.endsWith('.js')) {
      jsFiles.push(fullPath);
    }
  }

  return jsFiles;
}

/**
 * 优化单个JS文件
 */
async function optimizeFile(filePath) {
  try {
    // 获取优化前的文件大小
    const statBefore = await fs.stat(filePath);
    const sizeBefore = statBefore.size;
    
    const sourceMapPath = `${filePath}.map`;
    const hasSourceMap = await fs.access(sourceMapPath).then(() => true).catch(() => false);
    
    const result = await build({
      entryPoints: [filePath],
      outfile: filePath,
      platform: 'node',
      format: 'esm',
      minify: true,
      sourcemap: hasSourceMap ? 'external' : false,
      bundle: false,
      write: true,
      target: ['node18'],
      logLevel: 'error',
      allowOverwrite: true
    });
    
    // 获取优化后的文件大小
    const statAfter = await fs.stat(filePath);
    const sizeAfter = statAfter.size;
    
    // 计算减少的百分比
    const reduction = ((sizeBefore - sizeAfter) / sizeBefore * 100).toFixed(2);
    
    return { 
      filePath, 
      success: true,
      sizeBefore,
      sizeAfter,
      reduction
    };
  } catch (error) {
    return { filePath, success: false, error: error.message };
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('🔍 查找JS文件...');
    const jsFiles = await getJsFiles(distDir);
    console.log(`📄 找到 ${jsFiles.length} 个JS文件`);
    
    // 获取优化前的总大小
    let totalSizeBefore = 0;
    for (const file of jsFiles) {
      const stat = await fs.stat(file);
      totalSizeBefore += stat.size;
    }
    
    console.log('🔧 开始优化...');
    const results = await Promise.all(jsFiles.map(optimizeFile));
    
    // 统计结果
    const succeeded = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    // 计算总的优化结果
    let totalSizeAfter = 0;
    let totalReduction = 0;
    
    console.log('\n📊 优化详情:');
    console.log('------------------------------------------------------');
    console.log('文件                                  优化前    优化后   减少');
    console.log('------------------------------------------------------');
    
    for (const result of succeeded) {
      const relativePath = path.relative(distDir, result.filePath);
      const beforeKB = (result.sizeBefore / 1024).toFixed(1);
      const afterKB = (result.sizeAfter / 1024).toFixed(1);
      
      totalSizeAfter += result.sizeAfter;
      
      console.log(
        `${relativePath.padEnd(36)} ${beforeKB.padStart(6)}KB ${afterKB.padStart(6)}KB ${result.reduction.padStart(5)}%`
      );
    }
    
    console.log('------------------------------------------------------');
    const totalBeforeKB = (totalSizeBefore / 1024).toFixed(1);
    const totalAfterKB = (totalSizeAfter / 1024).toFixed(1);
    const totalReductionPercent = ((totalSizeBefore - totalSizeAfter) / totalSizeBefore * 100).toFixed(2);
    
    console.log(
      `总计                                   ${totalBeforeKB.padStart(6)}KB ${totalAfterKB.padStart(6)}KB ${totalReductionPercent.padStart(5)}%`
    );
    console.log('------------------------------------------------------');
    
    console.log(`\n✅ 优化完成: ${succeeded.length}/${jsFiles.length} 个文件成功`);
    
    if (failed.length > 0) {
      console.log(`❌ ${failed.length} 个文件失败:`);
      failed.forEach(f => console.log(`   - ${path.relative(distDir, f.filePath)}: ${f.error}`));
    }
    
    console.log(`\n📦 最终打包大小: ${(totalSizeAfter / 1024).toFixed(2)} KB (优化前: ${(totalSizeBefore / 1024).toFixed(2)} KB)`);
    console.log(`🚀 减少: ${totalReductionPercent}%`);
    
  } catch (error) {
    console.error('❌ 优化失败:', error);
    process.exit(1);
  }
}

main(); 