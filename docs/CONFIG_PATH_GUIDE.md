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

### 3. 远程URL（⭐ 新功能）
通过HTTPS访问的配置文件，支持OSS、CDN、配置服务器等：

```bash
# 阿里云OSS
CONFIG_PATH="https://your-bucket.oss-cn-hangzhou.aliyuncs.com/configs/grafana-config.js"

# 腾讯云COS
CONFIG_PATH="https://your-bucket-1234567890.cos.ap-shanghai.myqcloud.com/config/grafana.js"

# AWS S3
CONFIG_PATH="https://your-bucket.s3.amazonaws.com/configs/grafana-config.js"

# GitHub Raw文件（推荐 - 真实可用）
CONFIG_PATH="https://raw.githubusercontent.com/SailingCoder/grafana-mcp-analyzer/main/config/grafana-config-play.js"

# 其他GitHub示例
CONFIG_PATH="https://raw.githubusercontent.com/user/repo/main/config/grafana-config.js"

# 公司配置服务器
CONFIG_PATH="https://config.company.com/grafana/production.js"

# GitLab Raw文件
CONFIG_PATH="https://gitlab.company.com/api/v4/projects/123/repository/files/config%2Fgrafana-config.js/raw?ref=main"
```

**使用场景**：团队共享配置、集中化配置管理、CI/CD环境、多环境部署

## 🚀 OSS配置详细示例

### 阿里云OSS配置

1. **上传配置文件到OSS**：
   ```bash
   # 使用阿里云CLI上传
   ossutil cp ./grafana-config.js oss://your-bucket/configs/grafana-config.js
   
   # 设置公共读权限
   ossutil set-acl oss://your-bucket/configs/grafana-config.js public-read
   ```

2. **配置文件内容示例**：
   ```javascript
   // grafana-config.js
   const config = {
     baseUrl: process.env.GRAFANA_URL || 'https://your-grafana.company.com',
     defaultHeaders: {
       'Authorization': `Bearer ${process.env.GRAFANA_TOKEN}`,
       'Content-Type': 'application/json'
     },
     healthCheck: {
       url: 'api/health'
     },
     queries: {
       cpu_usage: {
         url: 'api/ds/query',
         method: 'POST',
         data: {
           queries: [{
             refId: 'A',
             expr: 'cpu_usage_percent',
             range: { from: 'now-1h', to: 'now' }
           }]
         },
         systemPrompt: '您是系统监控专家，请分析CPU使用率数据...'
       }
     }
   };
   
   module.exports = config;
   ```

3. **使用远程配置**：
   ```bash
   # 设置环境变量
   export CONFIG_PATH="https://your-bucket.oss-cn-hangzhou.aliyuncs.com/configs/grafana-config.js"
   
   # 启动服务
   grafana-mcp-analyzer
   ```

### 腾讯云COS配置

```bash
# 上传配置文件
coscmd upload grafana-config.js configs/grafana-config.js

# 设置公共读权限
coscmd putobjectacl configs/grafana-config.js --grant-read uri=http://cam.qcloud.com/groups/global/AllUsers

# 使用配置
export CONFIG_PATH="https://your-bucket-1234567890.cos.ap-shanghai.myqcloud.com/configs/grafana-config.js"
```

### AWS S3配置

```bash
# 上传配置文件
aws s3 cp grafana-config.js s3://your-bucket/configs/grafana-config.js

# 设置公共读权限
aws s3api put-object-acl --bucket your-bucket --key configs/grafana-config.js --acl public-read

# 使用配置
export CONFIG_PATH="https://your-bucket.s3.amazonaws.com/configs/grafana-config.js"
```

### GitHub配置（免费推荐）

GitHub是最简单免费的远程配置托管方案：

1. **创建配置文件**：
   ```bash
   # 在你的GitHub仓库中创建配置文件
   mkdir config
   cp grafana-config.js config/grafana-config-play.js
   git add config/grafana-config-play.js
   git commit -m "Add Grafana MCP configuration"
   git push
   ```

2. **获取Raw文件URL**：
   - GitHub页面：`https://github.com/SailingCoder/grafana-mcp-analyzer/blob/main/config/grafana-config-play.js`
   - Raw文件URL：`https://raw.githubusercontent.com/SailingCoder/grafana-mcp-analyzer/main/config/grafana-config-play.js`

3. **真实可用示例**：
   ```bash
   # 使用已经可用的狗狗币数据分析配置
   export CONFIG_PATH="https://raw.githubusercontent.com/SailingCoder/grafana-mcp-analyzer/main/config/grafana-config-play.js"
   
   # 启动分析器
   grafana-mcp-analyzer
   ```

4. **配置文件特点**：
   - ✅ 完全免费
   - ✅ 全球CDN加速
   - ✅ 版本控制
   - ✅ 无需认证
   - ✅ 真实可用的狗狗币OHLC数据
   - ✅ 连接Grafana Play演示实例

## 🔧 实际使用示例

### 快速体验（推荐）
```bash
# 使用真实可用的GitHub远程配置（狗狗币OHLC数据分析）
export CONFIG_PATH="https://raw.githubusercontent.com/SailingCoder/grafana-mcp-analyzer/main/config/grafana-config-play.js"
grafana-mcp-analyzer
```

### 开发环境
```bash
# 使用项目内的简化配置
export CONFIG_PATH="./config/grafana-config.simple.js"
npm run dev
```

### 测试环境
```bash
# 使用OSS上的测试配置
export CONFIG_PATH="https://your-bucket.oss-cn-hangzhou.aliyuncs.com/configs/test-config.js"
grafana-mcp-analyzer
```

### 生产环境
```bash
# 使用生产环境的OSS配置
export CONFIG_PATH="https://your-bucket.oss-cn-hangzhou.aliyuncs.com/configs/production-config.js"
grafana-mcp-analyzer
```

### AI助手配置
```json
{
  "mcpServers": {
    "grafana-play": {
      "command": "grafana-mcp-analyzer",
      "env": {
        "CONFIG_PATH": "https://raw.githubusercontent.com/SailingCoder/grafana-mcp-analyzer/main/config/grafana-config-play.js"
      }
    },
    "grafana-dev": {
      "command": "grafana-mcp-analyzer",
      "env": {
        "CONFIG_PATH": "./config/grafana-config.simple.js"
      }
    },
    "grafana-prod": {
      "command": "grafana-mcp-analyzer",
      "env": {
        "CONFIG_PATH": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/configs/production-config.js"
      }
    }
  }
}
```

## 💡 缓存机制

远程配置支持智能缓存，提高性能并提供容错能力：

### 缓存特性
- **缓存位置**：`~/.grafana-mcp-analyzer/config-cache/`
- **缓存时间**：5分钟（首次加载后5分钟内使用缓存）
- **容错机制**：网络失败时自动使用过期缓存
- **自动清理**：系统会自动管理缓存文件

### 缓存行为
```bash
# 首次加载
🌐 正在从远程URL获取配置...
✅ 远程配置获取成功，已缓存

# 5分钟内再次加载
📦 使用缓存的远程配置

# 网络失败时
⚠️ 远程配置获取失败，使用过期缓存: 网络错误
```

## 🔒 安全考虑

### 远程配置安全
1. **HTTPS Only**: 仅支持HTTPS URL，拒绝HTTP请求
2. **大小限制**: 配置文件最大10MB
3. **超时设置**: 30秒请求超时
4. **内容验证**: 验证JavaScript文件格式
5. **用户代理**: 使用标识的User-Agent

```bash
# ✅ 安全的远程配置
CONFIG_PATH="https://secure-config.company.com/grafana/v1.js"

# ❌ 不安全的配置（会被拒绝）
CONFIG_PATH="http://public-server.com/config.js"
```

### OSS安全配置建议

1. **使用专用bucket**：
   ```bash
   # 创建专用配置bucket
   ossutil mb oss://your-config-bucket
   ```

2. **最小权限原则**：
   ```json
   {
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["oss:GetObject"],
         "Resource": "acs:oss:*:*:your-config-bucket/configs/*"
       }
     ]
   }
   ```

3. **使用CDN加速**：
   ```bash
   # 配置CDN域名
   CONFIG_PATH="https://config-cdn.company.com/grafana-config.js"
   ```

## 💡 最佳实践

1. **环境变量管理**：敏感信息使用环境变量
2. **版本控制**：远程配置使用版本化路径
3. **多环境配置**：不同环境使用不同的配置文件
4. **权限控制**：设置适当的访问权限
5. **监控告警**：监控配置文件的访问和更新

### 推荐的配置文件结构
```javascript
// 生产环境配置示例
const config = {
  baseUrl: process.env.GRAFANA_URL || 'https://grafana.company.com',
  defaultHeaders: {
    'Authorization': `Bearer ${process.env.GRAFANA_TOKEN}`,
    'Content-Type': 'application/json'
  },
  healthCheck: {
    url: 'api/health',
    expectedStatus: 200
  },
  queries: {
    // 基础设施监控
    cpu_usage: {
      url: 'api/ds/query',
      method: 'POST',
      data: { /* 查询配置 */ },
      systemPrompt: '您是基础设施监控专家...'
    },
    
    // 应用性能监控
    app_performance: {
      url: 'api/ds/query',
      method: 'POST',
      data: { /* 查询配置 */ },
      systemPrompt: '您是应用性能专家...'
    },
    
    // 业务指标监控
    business_metrics: {
      url: 'api/ds/query',
      method: 'POST',
      data: { /* 查询配置 */ },
      systemPrompt: '您是业务数据分析专家...'
    }
  }
};

module.exports = config;
```

### 多环境配置管理

```bash
# 开发环境
export CONFIG_PATH="https://config-bucket.oss-cn-hangzhou.aliyuncs.com/dev/grafana-config.js"

# 测试环境
export CONFIG_PATH="https://config-bucket.oss-cn-hangzhou.aliyuncs.com/test/grafana-config.js"

# 生产环境
export CONFIG_PATH="https://config-bucket.oss-cn-hangzhou.aliyuncs.com/prod/grafana-config.js"
```