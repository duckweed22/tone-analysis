# 🚀 舌诊应用部署指南

## 📋 部署方案

### 方案一：Vercel (前端) + Railway (后端) - 推荐

#### 前端部署到 Vercel

1. **注册 Vercel 账号**
   - 访问 https://vercel.com
   - 使用 GitHub 账号登录

2. **上传代码到 GitHub**
   ```bash
   # 在项目根目录执行
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/ai-tongue-analysis.git
   git push -u origin main
   ```

3. **在 Vercel 中导入项目**
   - 点击 "New Project"
   - 选择 GitHub 仓库
   - 框架预设选择 "Vite"
   - 环境变量设置：
     ```
     VITE_API_BASE_URL = https://你的后端域名.railway.app
     ```

#### 后端部署到 Railway

1. **注册 Railway 账号**
   - 访问 https://railway.app
   - 使用 GitHub 账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择后端代码仓库

3. **配置环境变量**
   ```
   DB_HOST = 你的PostgreSQL主机
   DB_PORT = 5432
   DB_NAME = tone_analysis
   DB_USER = 你的数据库用户名
   DB_PASSWORD = 你的数据库密码
   PORT = 3001
   NODE_ENV = production
   DOUBAO_API_URL = https://ark.cn-beijing.volces.com/api/v3/chat/completions
   DOUBAO_API_KEY = 你的豆包API密钥
   DOUBAO_MODEL = 你的豆包模型
   JWT_SECRET = 你的JWT密钥
   ```

4. **添加 PostgreSQL 数据库**
   - 在 Railway 项目中点击 "New"
   - 选择 "Database" -> "PostgreSQL"
   - 导入 schema.sql 文件

### 方案二：Netlify (前端) + Heroku (后端)

#### 前端部署到 Netlify

1. **注册 Netlify 账号**
   - 访问 https://netlify.com
   - 使用 GitHub 账号登录

2. **部署步骤**
   - 连接 GitHub 仓库
   - 构建命令：`npm run build`
   - 发布目录：`dist`
   - 环境变量：`VITE_API_BASE_URL = 你的后端URL`

#### 后端部署到 Heroku

1. **注册 Heroku 账号**
   - 访问 https://heroku.com
   - 创建新应用

2. **配置步骤**
   - 连接 GitHub 仓库
   - 添加 PostgreSQL 插件
   - 设置环境变量
   - 部署应用

## 🔧 本地测试部署

### 构建前端
```bash
cd /Users/leiyu/Desktop/合理营养/舌诊应用/tone-analysis
npm run build
```

### 测试构建结果
```bash
npm run preview
```

## 📱 访问方式

部署完成后，你可以通过以下方式访问：

- **电脑浏览器**：直接访问部署的URL
- **手机浏览器**：直接访问部署的URL
- **微信内置浏览器**：直接访问部署的URL

## 🛠️ 故障排除

### 常见问题

1. **CORS 错误**
   - 确保后端设置了正确的 CORS 配置
   - 检查前端 API 基础 URL 是否正确

2. **数据库连接失败**
   - 检查数据库环境变量配置
   - 确保数据库服务正常运行

3. **API 调用失败**
   - 检查 AI API 密钥是否正确
   - 确保网络连接正常

## 📞 技术支持

如果遇到问题，请检查：
1. 控制台错误信息
2. 网络请求状态
3. 环境变量配置
4. 数据库连接状态
