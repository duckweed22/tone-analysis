// 健康检查路由
async function healthRoutes(fastify, options) {
    // 1. 基础健康检查
    fastify.get('/health', async (request, reply) => {
      const start = Date.now()
      
      // 简化的健康检查，不依赖数据库
      const healthStatus = {
        service: 'AI舌诊健康分析后端服务',
        version: '0.2.0',
        timestamp: new Date().toISOString(),
        status: 'healthy',
        uptime: process.uptime(),
        checks: {
          database: await checkDatabaseStatus(fastify),
          doubaoAPI: { 
            status: process.env.DOUBAO_API_KEY && process.env.DOUBAO_API_KEY !== 'your_doubao_api_key_here' ? 'available' : 'unavailable', 
            note: process.env.DOUBAO_API_KEY && process.env.DOUBAO_API_KEY !== 'your_doubao_api_key_here' ? 'API key configured' : 'API key not configured' 
          },
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            unit: 'MB'
          }
        },
        responseTime: Date.now() - start
      }
      
      return healthStatus
    })
  
    // 2. 详细健康检查
    fastify.get('/health/detailed', async (request, reply) => {
      try {
        const start = Date.now()
  
        // 数据库统计
        const dbStats = await getDBStats(fastify.db)
        
        // 系统统计
        const systemStats = getSystemStats()
        
        // API使用统计
        const apiStats = await getAPIStats(fastify.db)
  
        return {
          service: 'AI舌诊健康分析后端服务',
          version: '0.2.0',
          timestamp: new Date().toISOString(),
          status: 'healthy',
          uptime: process.uptime(),
          statistics: {
            database: dbStats,
            system: systemStats,
            api: apiStats
          },
          responseTime: Date.now() - start
        }
      } catch (error) {
        fastify.log.error('详细健康检查失败:', error)
        return reply.status(500).send({
          service: 'AI舌诊健康分析后端服务',
          status: 'unhealthy',
          error: error.message
        })
      }
    })
  
    // 3. 就绪检查
    fastify.get('/ready', async (request, reply) => {
      try {
        // 检查数据库连接
        await fastify.db.query('SELECT 1')
        
        return {
          status: 'ready',
          timestamp: new Date().toISOString()
        }
      } catch (error) {
        return reply.status(503).send({
          status: 'not ready',
          error: error.message
        })
      }
    })
  
    // 4. 存活检查
    fastify.get('/alive', async (request, reply) => {
      return {
        status: 'alive',
        timestamp: new Date().toISOString()
      }
    })
  }
  
  // 检查数据库状态
  async function checkDatabaseStatus(fastify) {
    try {
      if (!fastify.db) {
        return { status: 'unavailable', note: 'Database not configured' }
      }
      
      // 使用自定义的 Database 类方法
      await fastify.db.query('SELECT 1')
      
      return { status: 'available', note: 'Database connected successfully' }
    } catch (error) {
      return { status: 'unavailable', note: `Database connection failed: ${error.message}` }
    }
  }

  // 获取数据库统计信息
  async function getDBStats(db) {
    try {
      const results = await Promise.all([
        db.queryOne('SELECT COUNT(*) as total FROM users'),
        db.queryOne('SELECT COUNT(*) as total FROM analysis_records'),
        db.queryOne('SELECT COUNT(*) as total FROM conversation_messages'),
        db.queryOne('SELECT COUNT(*) as total FROM products WHERE is_active = true'),
        db.queryOne(`
          SELECT 
            COUNT(*) as completed_today,
            AVG((tongue_analysis->>'score')::int) as avg_score_today
          FROM analysis_records 
          WHERE DATE(created_at) = CURRENT_DATE AND analysis_status = 'completed'
        `),
        db.queryOne(`
          SELECT 
            COUNT(*) as total_week,
            AVG((tongue_analysis->>'score')::int) as avg_score_week
          FROM analysis_records 
          WHERE created_at >= NOW() - INTERVAL '7 days'
        `)
      ])
  
      return {
        users: parseInt(results[0].total),
        analysisRecords: parseInt(results[1].total),
        messages: parseInt(results[2].total),
        activeProducts: parseInt(results[3].total),
        today: {
          completedAnalyses: parseInt(results[4].completed_today || 0),
          averageScore: Math.round(results[4].avg_score_today || 0)
        },
        thisWeek: {
          totalAnalyses: parseInt(results[5].total_week || 0),
          averageScore: Math.round(results[5].avg_score_week || 0)
        }
      }
    } catch (error) {
      return { error: error.message }
    }
  }
  
  // 获取系统统计信息
  function getSystemStats() {
    const memUsage = process.memoryUsage()
    
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        unit: 'MB'
      },
      cpu: {
        usage: process.cpuUsage()
      }
    }
  }
  
  // 获取API使用统计
  async function getAPIStats(db) {
    try {
      const results = await Promise.all([
        db.queryOne(`
          SELECT COUNT(*) as total_calls
          FROM analysis_records 
          WHERE created_at >= NOW() - INTERVAL '24 hours'
        `),
        db.queryOne(`
          SELECT COUNT(*) as successful_calls
          FROM analysis_records 
          WHERE created_at >= NOW() - INTERVAL '24 hours' 
            AND analysis_status IN ('completed', 'questioning')
        `),
        db.queryOne(`
          SELECT 
            DATE_TRUNC('hour', created_at) as hour,
            COUNT(*) as calls
          FROM analysis_records 
          WHERE created_at >= NOW() - INTERVAL '24 hours'
          GROUP BY DATE_TRUNC('hour', created_at)
          ORDER BY hour DESC
          LIMIT 24
        `)
      ])
  
      const totalCalls = parseInt(results[0].total_calls || 0)
      const successfulCalls = parseInt(results[1].successful_calls || 0)
      const successRate = totalCalls > 0 ? (successfulCalls / totalCalls * 100).toFixed(2) : 0
  
      return {
        last24Hours: {
          totalCalls,
          successfulCalls,
          successRate: parseFloat(successRate)
        },
        hourlyStats: results[2] || []
      }
    } catch (error) {
      return { error: error.message }
    }
  }
  
  export { healthRoutes }