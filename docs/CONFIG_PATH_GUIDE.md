# 配置文件路径指南

## 🎯 概述

`CONFIG_PATH` 环境变量支持多种配置文件路径格式，让你可以灵活管理Grafana MCP分析器的配置。

## 📁 支持的路径格式

### 1. 相对路径
相对于当前工作目录的路径：

```bash
# 项目内配置
CONFIG_PATH="./grafana-config.js"
CONFIG_PATH="./config/production.js"

# 上级目录
CONFIG_PATH="../shared/grafana-config.js"
```

**使用场景**：本地开发、项目内配置文件

### 2. 绝对路径
系统的完整路径：

```bash
# Linux/macOS
CONFIG_PATH="/etc/grafana-mcp/config.js"
CONFIG_PATH="/opt/grafana-mcp/production.js"

# Windows
CONFIG_PATH="C:\configs\grafana-config.js"
```

**使用场景**：生产环境部署、系统级配置、多项目共享

### 3. 远程URL
通过HTTP/HTTPS访问的配置文件：

```bash
# GitHub Raw文件
CONFIG_PATH="https://raw.githubusercontent.com/user/repo/main/config.js"

# 公司配置服务器
CONFIG_PATH="https://config.company.com/grafana/production.js"
```

**使用场景**：团队共享配置、集中化配置管理、CI/CD环境

## 🔧 实际使用示例

### 开发环境
```bash
# 使用项目内的简化配置
export CONFIG_PATH="./config/query-config.simple.js"
npm run dev
```

### 生产环境
```bash
# 使用生产环境配置
export CONFIG_PATH="/etc/grafana-mcp/production-config.js"
grafana-mcp-analyzer
```

### AI助手配置
```json
{
  "mcpServers": {
    "grafana": {
      "command": "grafana-mcp-analyzer",
      "env": {
        "CONFIG_PATH": "./config/query-config.simple.js"
      }
    }
  }
}
```

## 🔒 安全考虑

### 远程配置安全
1. **HTTPS Only**: 始终使用HTTPS URL
2. **可信来源**: 确保配置来源可信
3. **访问控制**: 限制配置文件的访问权限

```bash
# ✅ 安全的远程配置
CONFIG_PATH="https://secure-config.company.com/grafana/v1.js"

# ❌ 不安全的配置
CONFIG_PATH="http://public-server.com/config.js"
```

## 💡 最佳实践

1. **环境变量**: 敏感信息使用环境变量
2. **版本控制**: 远程配置使用版本化URL
4. **权限控制**: 设置适当的文件权限

```javascript
// 推荐的配置文件结构
const config = {
  baseUrl: process.env.GRAFANA_URL,
  token: process.env.GRAFANA_TOKEN,
  queries: {
    // 查询配置
  }
};

module.exports = config;
```