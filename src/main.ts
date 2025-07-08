#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createMcpServer } from './server/mcp-server.js';
import { loadConfig, initializeCacheCleanup } from './services/config-manager.js';
import { initializeDataCleanup } from './services/data-store.js';

// 读取版本号
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// 处理命令行参数
function processCommandLineArgs(): boolean {
  const args = process.argv.slice(2);
  
  // 检测系统语言环境
  const lang = process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL || 'en';
  const isChinese = lang.toLowerCase().includes('zh');
  
  // 版本参数
  if (args.includes('-v') || args.includes('--version')) {
    console.log(`grafana-mcp-analyzer v${packageJson.version}`);
    return false; // 不继续执行
  }
  
  // 帮助参数
  if (args.includes('-h') || args.includes('--help') || args.includes('-help')) {
    if (isChinese) {
      console.log(`
grafana-mcp-analyzer v${packageJson.version}

用法:
  grafana-mcp-analyzer [选项]

选项:
  -v, --version     显示版本信息
  -h, --help        显示帮助信息

环境变量:
  CONFIG_PATH       配置文件路径（本地路径或HTTPS URL）
  CONFIG_MAX_AGE    远程配置缓存时间（秒，默认300）
  DATA_EXPIRY_HOURS 数据过期时间（小时，默认24）

示例:
  CONFIG_PATH=/Users/username/grafana-config.js grafana-mcp-analyzer
  
更多信息请访问: https://github.com/SailingCoder/grafana-mcp-analyzer
      `);
    } else {
      console.log(`
grafana-mcp-analyzer v${packageJson.version}

Usage:
  grafana-mcp-analyzer [options]

Options:
  -v, --version     Show version information
  -h, --help        Show help information

Environment Variables:
  CONFIG_PATH       Configuration file path (local path or HTTPS URL)
  CONFIG_MAX_AGE    Remote config cache time in seconds (default: 300)
  DATA_EXPIRY_HOURS Data expiration time in hours (default: 24)

Example:
  CONFIG_PATH=/Users/username/grafana-config.js grafana-mcp-analyzer
  
For more information, visit: https://github.com/SailingCoder/grafana-mcp-analyzer
      `);
    }
    return false; // 不继续执行
  }
  
  return true; // 继续执行
}

// 启动服务器
async function main(): Promise<void> {
  // 首先处理命令行参数
  if (!processCommandLineArgs()) {
    return; // 如果处理了特殊参数，则不继续执行
  }
  
  try {
    // 初始化缓存清理
    initializeCacheCleanup();
    
    // 初始化数据清理
    await initializeDataCleanup();
    
    // 加载配置
    const config = await loadConfig(process.env.CONFIG_PATH);
    
    // 创建MCP服务器
    const server = createMcpServer(packageJson, config);
    
    // 连接传输层
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('✅ Grafana查询分析MCP服务器已启动');
    console.error(`📊 服务器信息: grafana-mcp-analyzer v${packageJson.version}`);
    console.error(`🔧 配置状态: ${Object.keys(config.queries || {}).length} 个查询`);
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动应用
main().catch((error) => {
  console.error('❌ 未处理的错误:', error);
  process.exit(1);
}); 