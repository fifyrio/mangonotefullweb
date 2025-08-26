# MangoNote 部署和安装指南

## 概述

本指南详细介绍了如何在不同环境中部署 MangoNote 应用程序，包括本地开发环境、生产环境和云平台部署。

## 系统要求

### 最低要求
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 或 **yarn**: >= 1.22.0
- **PostgreSQL**: >= 14.0
- **内存**: 至少 2GB RAM
- **存储**: 至少 5GB 可用空间

### 推荐配置
- **Node.js**: 20.x LTS
- **PostgreSQL**: 15.x
- **内存**: 4GB+ RAM
- **存储**: SSD，10GB+ 可用空间
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / macOS 12+

## 本地开发环境搭建

### 1. 环境准备

#### 安装 Node.js
```bash
# 使用 nvm (推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# 或直接下载安装
# https://nodejs.org/
```

#### 安装 PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (使用 Homebrew)
brew install postgresql
brew services start postgresql

# CentOS/RHEL
sudo dnf install postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. 数据库配置

#### 创建数据库和用户
```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 在 PostgreSQL 命令行中执行
CREATE DATABASE mangonoteweb;
CREATE USER mangouser WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE mangonoteweb TO mangouser;

# 给用户创建扩展的权限
ALTER USER mangouser CREATEDB;

\q
```

#### 数据库模式设置
```sql
-- 连接到数据库
\c mangonoteweb

-- 创建必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 创建表结构 (参考 database.sql)
```

### 3. 项目初始化

#### 克隆和安装
```bash
# 克隆项目 (如果从版本控制)
git clone <repository-url>
cd mangoNoteweb

# 或者如果是现有项目目录
cd /path/to/mangoNoteweb

# 安装依赖
npm install
```

#### 环境变量配置
```bash
# 创建环境变量文件
cp .env.example .env.local

# 编辑环境变量
vim .env.local
```

`.env.local` 配置示例：
```env
# 数据库配置
DATABASE_URL=postgresql://mangouser:your_secure_password@localhost:5432/mangonoteweb

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# AI 服务配置 (可选)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# 文件上传配置
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads

# 日志配置
LOG_LEVEL=debug
```

### 4. 启动开发服务器

```bash
# 启动开发服务器
npm run dev

# 或者使用 yarn
yarn dev
```

访问 `http://localhost:3000` 查看应用程序。

### 5. 数据库迁移 (如果需要)

```bash
# 创建数据库迁移脚本 (未来功能)
npm run db:migrate

# 填充测试数据
npm run db:seed
```

## 生产环境部署

### 1. 服务器准备

#### 系统更新和基础软件
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential

# 安装 Node.js (生产版本)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PM2 (进程管理器)
sudo npm install -g pm2
```

#### 创建应用用户
```bash
# 创建专用用户
sudo adduser --system --shell /bin/bash --home /var/lib/mangonoteweb --group mangonoteweb

# 创建应用目录
sudo mkdir -p /var/www/mangonoteweb
sudo chown mangonoteweb:mangonoteweb /var/www/mangonoteweb
```

### 2. 数据库配置

#### PostgreSQL 生产配置
```bash
# 编辑 PostgreSQL 配置
sudo vim /etc/postgresql/15/main/postgresql.conf
```

推荐的生产配置：
```conf
# postgresql.conf
listen_addresses = 'localhost'
port = 5432
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100

# 日志配置
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_min_duration_statement = 1000  # 记录慢查询
```

#### 备份和恢复策略
```bash
# 创建备份脚本
sudo vim /usr/local/bin/backup-mangonoteweb.sh
```

备份脚本内容：
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mangonoteweb"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="mangonoteweb"

mkdir -p $BACKUP_DIR

# 数据库备份
pg_dump -U mangouser -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 保留最近 30 天的备份
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

# 应用文件备份 (可选)
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /var/www mangonoteweb --exclude=node_modules --exclude=.next
```

```bash
# 设置执行权限和定时任务
sudo chmod +x /usr/local/bin/backup-mangonoteweb.sh
sudo crontab -e

# 添加每日凌晨 2 点备份
0 2 * * * /usr/local/bin/backup-mangonoteweb.sh
```

### 3. 应用部署

#### 代码部署
```bash
# 切换到应用用户
sudo -u mangonoteweb -i

# 进入应用目录
cd /var/www/mangonoteweb

# 克隆代码 (或从构建服务器复制)
git clone <repository-url> .

# 安装依赖 (仅生产依赖)
npm ci --only=production

# 构建应用
npm run build
```

#### 环境配置
```bash
# 创建生产环境配置
vim .env.production
```

`.env.production` 示例：
```env
# 数据库配置
DATABASE_URL=postgresql://mangouser:strong_password@localhost:5432/mangonoteweb

# 应用配置
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# 安全配置
NEXTAUTH_SECRET=your-very-long-random-secret-key
NEXTAUTH_URL=https://your-domain.com

# AI 服务配置
OPENAI_API_KEY=sk-your-production-openai-key
ANTHROPIC_API_KEY=your-production-anthropic-key

# 日志配置
LOG_LEVEL=info
LOG_FILE=/var/log/mangonoteweb/app.log

# 性能配置
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/var/lib/mangonoteweb/uploads
```

#### PM2 配置
```bash
# 创建 PM2 配置文件
vim ecosystem.config.js
```

`ecosystem.config.js` 内容：
```javascript
module.exports = {
  apps: [{
    name: 'mangonoteweb',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/mangonoteweb',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 'max',  // 或指定数量，如 2
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    error_file: '/var/log/mangonoteweb/error.log',
    out_file: '/var/log/mangonoteweb/output.log',
    log_file: '/var/log/mangonoteweb/combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
```

#### 启动应用
```bash
# 创建日志目录
sudo mkdir -p /var/log/mangonoteweb
sudo chown mangonoteweb:mangonoteweb /var/log/mangonoteweb

# 创建上传目录
sudo mkdir -p /var/lib/mangonoteweb/uploads
sudo chown mangonoteweb:mangonoteweb /var/lib/mangonoteweb/uploads

# 启动应用
pm2 start ecosystem.config.js --env production

# 保存 PM2 配置
pm2 save

# 设置开机启动
pm2 startup
# 按照提示执行相应命令
```

### 4. 反向代理配置

#### Nginx 配置
```bash
# 安装 Nginx
sudo apt install nginx

# 创建站点配置
sudo vim /etc/nginx/sites-available/mangonoteweb
```

Nginx 配置示例：
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL 证书配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # 文件上传大小限制
    client_max_body_size 10M;
    
    # 代理到 Next.js 应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # 静态文件缓存
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }
    
    # API 路由
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 日志配置
    access_log /var/log/nginx/mangonoteweb_access.log;
    error_log /var/log/nginx/mangonoteweb_error.log;
}
```

#### 启用站点
```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/mangonoteweb /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx
```

### 5. SSL 证书配置

#### 使用 Let's Encrypt (免费)
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

## 云平台部署

### 1. Vercel 部署

#### 准备工作
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login
```

#### 部署配置
创建 `vercel.json`：
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "OPENAI_API_KEY": "@openai_api_key"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

#### 部署命令
```bash
# 初始化项目
vercel

# 设置环境变量
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add OPENAI_API_KEY

# 部署到生产环境
vercel --prod
```

### 2. AWS 部署

#### 使用 AWS Amplify
```bash
# 安装 Amplify CLI
npm install -g @aws-amplify/cli

# 配置 Amplify
amplify configure
amplify init

# 添加托管
amplify add hosting
amplify publish
```

#### 使用 EC2 + RDS
1. 创建 RDS PostgreSQL 实例
2. 启动 EC2 实例 (Ubuntu 20.04)
3. 按照生产环境部署步骤配置

### 3. Google Cloud Platform 部署

#### 使用 Cloud Run
```bash
# 创建 Dockerfile
vim Dockerfile
```

Dockerfile 内容：
```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

```bash
# 构建和部署
gcloud builds submit --tag gcr.io/PROJECT_ID/mangonoteweb
gcloud run deploy --image gcr.io/PROJECT_ID/mangonoteweb --platform managed
```

## 监控和维护

### 1. 应用监控

#### PM2 监控
```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs mangonoteweb

# 重启应用
pm2 restart mangonoteweb

# 监控面板
pm2 monit
```

#### 系统监控
```bash
# 安装系统监控工具
sudo apt install htop iotop nethogs

# 监控脚本
vim /usr/local/bin/system-monitor.sh
```

监控脚本：
```bash
#!/bin/bash
LOG_FILE="/var/log/system-monitor.log"

echo "$(date): System Monitor Check" >> $LOG_FILE

# CPU 使用率
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
echo "CPU Usage: $CPU_USAGE%" >> $LOG_FILE

# 内存使用率
MEM_USAGE=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
echo "Memory Usage: $MEM_USAGE%" >> $LOG_FILE

# 磁盘使用率
DISK_USAGE=$(df -h / | awk '/\// {print $5}')
echo "Disk Usage: $DISK_USAGE" >> $LOG_FILE

# 检查应用进程
PM2_STATUS=$(pm2 jlist | jq '.[0].pm2_env.status' -r)
echo "App Status: $PM2_STATUS" >> $LOG_FILE

echo "---" >> $LOG_FILE
```

### 2. 日志管理

#### 日志轮转配置
```bash
sudo vim /etc/logrotate.d/mangonoteweb
```

```conf
/var/log/mangonoteweb/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 mangonoteweb mangonoteweb
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. 性能优化

#### 数据库优化
```sql
-- 分析查询性能
EXPLAIN ANALYZE SELECT * FROM notes WHERE user_id = 'user-id';

-- 创建必要索引
CREATE INDEX CONCURRENTLY idx_notes_user_created ON notes(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_content_blocks_note_sort ON content_blocks(note_id, sort_order);

-- 更新表统计信息
ANALYZE notes;
ANALYZE content_blocks;
ANALYZE flashcards;
```

#### 应用优化
```javascript
// next.config.js
module.exports = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['example.com'],
  },
  // 启用压缩
  compress: true,
  // PWA 配置
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
  }
}
```

## 故障排除

### 常见问题和解决方案

#### 1. 应用无法启动
```bash
# 检查端口占用
sudo lsof -i :3000

# 检查环境变量
pm2 env mangonoteweb

# 查看详细错误
pm2 logs mangonoteweb --err
```

#### 2. 数据库连接问题
```bash
# 检查数据库状态
sudo systemctl status postgresql

# 测试数据库连接
psql -U mangouser -d mangonoteweb -h localhost

# 检查连接数
SELECT count(*) FROM pg_stat_activity;
```

#### 3. 文件上传失败
```bash
# 检查上传目录权限
ls -la /var/lib/mangonoteweb/uploads

# 检查磁盘空间
df -h

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/mangonoteweb_error.log
```

#### 4. 性能问题
```bash
# 检查内存使用
free -m

# 检查 CPU 使用
top

# 分析慢查询
sudo tail -f /var/log/postgresql/postgresql-*.log | grep "duration"
```

### 紧急恢复程序

#### 数据库恢复
```bash
# 停止应用
pm2 stop mangonoteweb

# 恢复数据库
gunzip < /var/backups/mangonoteweb/db_YYYYMMDD_HHMMSS.sql.gz | psql -U mangouser -d mangonoteweb

# 重启应用
pm2 start mangonoteweb
```

#### 应用回滚
```bash
# 切换到上一个版本
cd /var/www/mangonoteweb
git checkout previous-stable-tag

# 重新构建和部署
npm ci --only=production
npm run build
pm2 restart mangonoteweb
```

---

本部署指南涵盖了 MangoNote 应用程序的完整部署流程，从开发环境到生产环境的各个方面。请根据实际需求选择合适的部署方案，并定期维护和监控系统状态。