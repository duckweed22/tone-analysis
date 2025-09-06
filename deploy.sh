#!/bin/bash

# 舌诊应用部署脚本

echo "🚀 开始部署舌诊应用..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 构建前端
echo "📦 构建前端..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 前端构建成功"
else
    echo "❌ 前端构建失败"
    exit 1
fi

# 检查构建结果
if [ -d "dist" ]; then
    echo "✅ 构建文件已生成在 dist 目录"
    echo "📁 构建文件列表："
    ls -la dist/
else
    echo "❌ 构建目录不存在"
    exit 1
fi

echo ""
echo "🎉 部署准备完成！"
echo ""
echo "📋 下一步操作："
echo "1. 将代码上传到 GitHub"
echo "2. 在 Vercel 中导入项目"
echo "3. 在 Railway 中部署后端"
echo "4. 配置环境变量"
echo ""
echo "📖 详细步骤请参考 DEPLOYMENT.md 文件"
