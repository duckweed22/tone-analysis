import Fastify from 'fastify'
  import cors from '@fastify/cors'
  import multipart from '@fastify/multipart'
  import staticFiles from '@fastify/static'
  import env from '@fastify/env'
  import path from 'path'
  import { fileURLToPath } from 'url'
  import { dbPlugin } from './plugins/database.js'
  import { authPlugin } from './plugins/auth.js'
  import { analysisRoutes } from './routes/analysis.js'
  import { productRoutes } from './routes/products.js'
  import { conversationRoutes } from './routes/conversation.js'
  import { healthRoutes } from './routes/health.js'
  
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  
  // 环境变量配置
  const envSchema = {
    type: 'object',
    required: ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'],
    properties: {
      PORT: { type: 'integer', default: 3001 },
      NODE_ENV: { type: 'string', default: 'development' },
      DB_HOST: { type: 'string' },
      DB_PORT: { type: 'integer', default: 5432 },
      DB_NAME: { type: 'string' },
      DB_USER: { type: 'string' },
      DB_PASSWORD: { type: 'string' },
      DOUBAO_API_URL: { type: 'string' },
      DOUBAO_API_KEY: { type: 'string' },
      DOUBAO_MODEL: { type: 'string' },
      JWT_SECRET: { type: 'string', default: 'your-jwt-secret-key' }
    }
  }
  
  // 创建Fastify实例
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      } : undefined
    }
  })
  
  // 错误处理器
  fastify.setErrorHandler(async (error, request, reply) => {
    fastify.log.error(error)
    
    // 数据库错误
    if (error.code?.startsWith('23')) {
      return reply.status(400).send({
        success: false,
        error: 'Database constraint violation',
        message: '数据验证失败'
      })
    }
    
    // 验证错误
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: 'Validation failed',
        message: '请求参数无效',
        details: error.validation
      })
    }
    
    // API调用错误
    if (error.code === 'API_ERROR') {
      return reply.status(502).send({
        success: false,
        error: 'External API error',
        message: 'AI服务暂时不可用，请稍后重试'
      })
    }
    
    // 默认错误
    const statusCode = error.statusCode || 500
    reply.status(statusCode).send({
      success: false,
      error: error.name || 'Internal Server Error',
      message: statusCode === 500 ? '服务器内部错误' : error.message
    })
  })
  
  // 404处理器
  fastify.setNotFoundHandler(async (request, reply) => {
    reply.status(404).send({
      success: false,
      error: 'Not Found',
      message: '请求的资源不存在'
    })
  })
  
  async function start() {
    try {
      // 注册环境变量插件
      await fastify.register(env, {
        schema: envSchema,
        dotenv: true
      })
  
      // 注册CORS
      await fastify.register(cors, {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://yourdomain.com'] 
          : true,
        credentials: true
      })
  
      // 注册文件上传
      await fastify.register(multipart, {
        limits: {
          fileSize: 10 * 1024 * 1024 // 10MB
        }
      })
  
      // 注册静态文件服务
      await fastify.register(staticFiles, {
        root: path.join(__dirname, '../public'),
        prefix: '/static/'
      })
  
      // 注册自定义插件
      await fastify.register(dbPlugin)
      await fastify.register(authPlugin)
  
      // 注册路由
      await fastify.register(healthRoutes, { prefix: '/api' })
      await fastify.register(analysisRoutes, { prefix: '/api' })
      await fastify.register(productRoutes, { prefix: '/api' })
      await fastify.register(conversationRoutes, { prefix: '/api' })
  
      // 注册根路由
      fastify.get('/', async (request, reply) => {
        return {
          service: 'AI舌诊健康分析后端服务',
          version: '0.2.0',
          status: 'running',
          timestamp: new Date().toISOString()
        }
      })
  
      // 启动服务器
      const address = await fastify.listen({
        port: fastify.config.PORT,
        host: '0.0.0.0'
      })
  
      fastify.log.info(`🚀 服务器启动成功`)
      fastify.log.info(`📍 地址: ${address}`)
      fastify.log.info(`🌍 环境: ${fastify.config.NODE_ENV}`)
      fastify.log.info(`🗄️  数据库: ${fastify.config.DB_HOST}:${fastify.config.DB_PORT}/${fastify.config.DB_NAME}`)
  
    } catch (err) {
      fastify.log.error('❌ 服务器启动失败:', err)
      console.error('详细错误信息:', err)
      process.exit(1)
    }
  }
  
  // 优雅关闭
  process.on('SIGTERM', async () => {
    fastify.log.info('收到SIGTERM信号，正在关闭服务器...')
    await fastify.close()
    process.exit(0)
  })
  
  process.on('SIGINT', async () => {
    fastify.log.info('收到SIGINT信号，正在关闭服务器...')
    await fastify.close()
    process.exit(0)
  })
  
  // 未捕获的异常处理
  process.on('uncaughtException', (err) => {
    fastify.log.error('未捕获的异常:', err)
    process.exit(1)
  })
  
  process.on('unhandledRejection', (reason, promise) => {
    fastify.log.error('未处理的Promise拒绝:', reason, 'at:', promise)
    process.exit(1)
  })
  
  // 启动应用
  start()