import fp from 'fastify-plugin'
import pg from 'pg'

const { Pool } = pg

// 数据库插件 - 简化版（仅产品库）
async function dbPlugin(fastify, options) {
  // 创建数据库连接池
  const pool = new Pool({
    host: fastify.config.DB_HOST,
    port: fastify.config.DB_PORT,
    database: fastify.config.DB_NAME,
    user: fastify.config.DB_USER,
    password: fastify.config.DB_PASSWORD,
    max: 20, // 最大连接数
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })

  // 测试数据库连接
  try {
    const client = await pool.connect()
    await client.query('SELECT NOW()')
    client.release()
    fastify.log.info('✅ 数据库连接成功')
  } catch (err) {
    fastify.log.warn('⚠️ 数据库连接失败，使用模拟模式:', err.message)
    // 不抛出错误，继续启动服务
  }

  // 数据库操作类 - 简化版
  class Database {
    constructor(pool) {
      this.pool = pool
    }

    // 执行查询
    async query(text, params = []) {
      const start = Date.now()
      try {
        const result = await this.pool.query(text, params)
        const duration = Date.now() - start
        fastify.log.debug('数据库查询执行', { 
          query: text.substring(0, 100) + '...', 
          duration: `${duration}ms`,
          rows: result.rowCount 
        })
        return result
      } catch (err) {
        fastify.log.error('数据库查询失败:', err)
        throw err
      }
    }

    // 获取单行数据
    async queryOne(text, params = []) {
      const result = await this.query(text, params)
      return result.rows[0] || null
    }

    // 获取多行数据
    async queryMany(text, params = []) {
      const result = await this.query(text, params)
      return result.rows
    }

    // 事务处理
    async transaction(callback) {
      const client = await this.pool.connect()
      try {
        await client.query('BEGIN')
        const result = await callback(client)
        await client.query('COMMIT')
        return result
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
      }
    }

    // ============ 产品相关操作 ============
    
    // 搜索产品（按关键词）
    async searchProducts(keywords, limit = 10) {
      const query = `
        SELECT * FROM search_products_by_keywords($1)
        LIMIT $2
      `
      return await this.queryMany(query, [keywords, limit])
    }

    // 根据ID获取产品
    async getProductsByIds(productIds) {
      const query = `
        SELECT * FROM products 
        WHERE id = ANY($1) AND is_active = true
        ORDER BY ARRAY_POSITION($1, id)
      `
      return await this.queryMany(query, [productIds])
    }

    // 根据类别获取产品
    async getProductsByCategory(category, limit = 20) {
      const query = `
        SELECT * FROM products 
        WHERE category = $1 AND is_active = true
        ORDER BY rating DESC, name
        LIMIT $2
      `
      return await this.queryMany(query, [category, limit])
    }

    // 获取所有产品类别
    async getAllCategories() {
      const query = `
        SELECT category, COUNT(*) as product_count
        FROM products 
        WHERE is_active = true
        GROUP BY category
        ORDER BY category
      `
      return await this.queryMany(query)
    }

    // 获取热门产品
    async getPopularProducts(limit = 10) {
      const query = `
        SELECT * FROM products 
        WHERE is_active = true 
        ORDER BY 
          (rating * review_count) DESC,
          rating DESC,
          review_count DESC
        LIMIT $1
      `
      return await this.queryMany(query, [limit])
    }

    // 获取单个产品详情
    async getProductById(productId) {
      const query = `
        SELECT * FROM products 
        WHERE id = $1 AND is_active = true
      `
      return await this.queryOne(query, [productId])
    }

    // 获取相关产品（同类别）
    async getRelatedProducts(category, excludeId, limit = 4) {
      const query = `
        SELECT id, name, price, image_url, rating 
        FROM products 
        WHERE category = $1 AND id != $2 AND is_active = true 
        ORDER BY rating DESC 
        LIMIT $3
      `
      return await this.queryMany(query, [category, excludeId, limit])
    }

    // 模糊搜索产品
    async searchProductsByText(searchText, limit = 20) {
      const query = `
        SELECT *, 
               CASE 
                 WHEN name ILIKE $1 THEN 3
                 WHEN description ILIKE $1 THEN 2
                 WHEN array_to_string(benefits, ' ') ILIKE $1 THEN 1
                 ELSE 0
               END as relevance_score
        FROM products 
        WHERE is_active = true 
          AND (
            name ILIKE $1 
            OR description ILIKE $1 
            OR array_to_string(benefits, ' ') ILIKE $1
            OR array_to_string(keywords, ' ') ILIKE $1
          )
        ORDER BY relevance_score DESC, rating DESC
        LIMIT $2
      `
      const searchPattern = `%${searchText}%`
      return await this.queryMany(query, [searchPattern, limit])
    }

    // 获取产品统计信息
    async getProductStats() {
      const totalQuery = 'SELECT COUNT(*) as total FROM products WHERE is_active = true'
      const categoryQuery = `
        SELECT 
          category,
          COUNT(*) as count,
          AVG(price) as avg_price,
          MIN(price) as min_price,
          MAX(price) as max_price
        FROM products 
        WHERE is_active = true
        GROUP BY category
        ORDER BY count DESC
      `
      
      const [totalResult, categoryStats] = await Promise.all([
        this.queryOne(totalQuery),
        this.queryMany(categoryQuery)
      ])

      return {
        total: parseInt(totalResult.total),
        categories: categoryStats.map(cat => ({
          name: cat.category,
          count: parseInt(cat.count),
          avgPrice: parseFloat(cat.avg_price).toFixed(2),
          minPrice: parseFloat(cat.min_price),
          maxPrice: parseFloat(cat.max_price)
        }))
      }
    }

    // 健康检查
    async healthCheck() {
      try {
        const query = 'SELECT NOW() as timestamp, version() as db_version'
        const result = await this.queryOne(query)
        return {
          status: 'healthy',
          timestamp: result.timestamp,
          db_version: result.db_version
        }
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  // 注册数据库实例
  const db = new Database(pool)
  fastify.decorate('db', db)

  // 在服务器关闭时关闭数据库连接池
  fastify.addHook('onClose', async (instance) => {
    await pool.end()
    instance.log.info('数据库连接池已关闭')
  })
}

export { dbPlugin }
export default fp(dbPlugin)