import Joi from 'joi'
import { sessionStore } from './analysis.js'

// 产品路由
async function productRoutes(fastify, options) {
  // 请求验证模式
  const getProductsSchema = {
    querystring: Joi.object({
      category: Joi.string().optional(),
      keywords: Joi.string().optional(),
      limit: Joi.number().integer().min(1).max(50).default(20),
      offset: Joi.number().integer().min(0).default(0)
    })
  }

  const getRecommendationsSchema = {
    params: Joi.object({
      sessionId: Joi.string().required()
    }),
    querystring: Joi.object({
      limit: Joi.number().integer().min(1).max(20).default(6)
    })
  }

  // 1. 获取产品列表
  fastify.get('/products', async (request, reply) => {
    try {
      const { category, keywords, limit, offset } = request.query

      let products = []
      let totalCount = 0

      if (keywords) {
        // 关键词搜索
        const searchKeywords = keywords.split(/[,，\s]+/).filter(k => k.trim())
        products = await fastify.db.searchProducts(searchKeywords, limit)
        totalCount = products.length
        
        // 如果有offset，手动分页
        if (offset > 0) {
          products = products.slice(offset, offset + limit)
        }
      } else if (category) {
        // 按类别查询
        products = await fastify.db.getProductsByCategory(category, limit)
        
        // 获取该类别的总数
        const countResult = await fastify.db.queryOne(
          'SELECT COUNT(*) as total FROM products WHERE category = $1 AND is_active = true',
          [category]
        )
        totalCount = parseInt(countResult.total)
      } else {
        // 获取所有产品
        const query = `
          SELECT * FROM products 
          WHERE is_active = true 
          ORDER BY rating DESC, created_at DESC
          LIMIT $1 OFFSET $2
        `
        products = await fastify.db.queryMany(query, [limit, offset])
        
        // 获取总数
        const countResult = await fastify.db.queryOne(
          'SELECT COUNT(*) as total FROM products WHERE is_active = true'
        )
        totalCount = parseInt(countResult.total)
      }

      // 格式化产品数据
      const formattedProducts = products.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        subcategory: product.subcategory,
        description: product.description,
        benefits: product.benefits,
        price: parseFloat(product.price),
        originalPrice: product.original_price ? parseFloat(product.original_price) : null,
        imageUrl: product.image_url,
        detailUrl: product.detail_url,
        brand: product.brand,
        rating: parseFloat(product.rating || 0),
        reviewCount: product.review_count || 0,
        specifications: product.specifications,
        matchScore: product.match_score || null // 仅在关键词搜索时有效
      }))

      return {
        success: true,
        data: {
          products: formattedProducts,
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: (offset + limit) < totalCount
          },
          searchInfo: keywords ? {
            keywords: keywords.split(/[,，\s]+/).filter(k => k.trim()),
            matchedCount: formattedProducts.length
          } : null
        }
      }
    } catch (error) {
      fastify.log.error('获取产品列表失败:', error)
      return reply.status(500).send({
        success: false,
        error: 'Products retrieval failed',
        message: `获取产品失败: ${error.message}`
      })
    }
  })

  // 2. 获取单个产品详情
  fastify.get('/products/:id', async (request, reply) => {
    try {
      const productId = parseInt(request.params.id)

      const product = await fastify.db.queryOne(
        'SELECT * FROM products WHERE id = $1 AND is_active = true',
        [productId]
      )

      if (!product) {
        return reply.status(404).send({
          success: false,
          error: 'Product not found',
          message: '产品不存在'
        })
      }

      // 获取相关产品（同类别）
      const relatedProducts = await fastify.db.queryMany(
        `SELECT id, name, price, image_url, rating 
         FROM products 
         WHERE category = $1 AND id != $2 AND is_active = true 
         ORDER BY rating DESC 
         LIMIT 4`,
        [product.category, productId]
      )

      const formattedProduct = {
        id: product.id,
        name: product.name,
        category: product.category,
        subcategory: product.subcategory,
        keywords: product.keywords,
        description: product.description,
        benefits: product.benefits,
        price: parseFloat(product.price),
        originalPrice: product.original_price ? parseFloat(product.original_price) : null,
        imageUrl: product.image_url,
        detailUrl: product.detail_url,
        brand: product.brand,
        rating: parseFloat(product.rating || 0),
        reviewCount: product.review_count || 0,
        specifications: product.specifications,
        stock: product.stock,
        relatedProducts: relatedProducts.map(rp => ({
          id: rp.id,
          name: rp.name,
          price: parseFloat(rp.price),
          imageUrl: rp.image_url,
          rating: parseFloat(rp.rating || 0)
        }))
      }

      return {
        success: true,
        data: formattedProduct
      }
    } catch (error) {
      fastify.log.error('获取产品详情失败:', error)
      return reply.status(500).send({
        success: false,
        error: 'Product retrieval failed',
        message: `获取产品详情失败: ${error.message}`
      })
    }
  })

  // 3. 获取产品类别
  fastify.get('/products/categories', async (request, reply) => {
    try {
      const categories = await fastify.db.getAllCategories()

      const formattedCategories = categories.map(cat => ({
        name: cat.category,
        productCount: parseInt(cat.product_count),
        displayName: getCategoryDisplayName(cat.category)
      }))

      return {
        success: true,
        data: formattedCategories
      }
    } catch (error) {
      fastify.log.error('获取产品类别失败:', error)
      return reply.status(500).send({
        success: false,
        error: 'Categories retrieval failed',
        message: `获取类别失败: ${error.message}`
      })
    }
  })

  // 4. 根据分析结果获取推荐产品
  fastify.get('/products/recommendations/:sessionId', async (request, reply) => {
    try {
      const { sessionId } = request.params
      const { limit } = request.query
      const userId = request.userId

      // 从内存获取分析记录
      const record = sessionStore.get(sessionId)
      if (!record) {
        return reply.status(404).send({
          success: false,
          error: 'Session not found',
          message: '会话不存在'
        })
      }

      let recommendedProducts = []

      // 如果已有推荐产品，直接返回
      if (record.recommendedProducts && record.recommendedProducts.length > 0) {
        recommendedProducts = record.recommendedProducts
      } else {
        // 基于分析结果生成推荐
        const tongueAnalysis = record.tongueAnalysis
        const finalReport = record.finalReport

        // 生成推荐关键词
        const recommendationKeywords = generateRecommendationKeywords(tongueAnalysis, finalReport)
        
        // 搜索相关产品
        if (recommendationKeywords.length > 0) {
          const products = await fastify.db.searchProducts(recommendationKeywords, limit)
          recommendedProducts = products.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            description: p.description,
            benefits: p.benefits,
            price: parseFloat(p.price),
            originalPrice: p.original_price ? parseFloat(p.original_price) : null,
            imageUrl: p.image_url,
            brand: p.brand,
            rating: parseFloat(p.rating || 0),
            matchScore: p.match_score || null,
            recommendationReason: generateRecommendationReason(p, tongueAnalysis)
          }))
        }
      }

      // 格式化推荐产品
      const formattedProducts = recommendedProducts.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        description: product.description,
        benefits: product.benefits,
        price: parseFloat(product.price),
        originalPrice: product.original_price ? parseFloat(product.original_price) : null,
        imageUrl: product.image_url,
        brand: product.brand,
        rating: parseFloat(product.rating || 0),
        matchScore: product.match_score || null,
        recommendationReason: generateRecommendationReason(product, record.tongue_analysis)
      }))

      return {
        success: true,
        data: {
          sessionId,
          products: formattedProducts,
          totalRecommendations: formattedProducts.length,
          analysisScore: record.tongue_analysis?.score,
          recommendationBasis: record.final_report?.productRecommendations || []
        }
      }
    } catch (error) {
      fastify.log.error('获取推荐产品失败:', error)
      return reply.status(500).send({
        success: false,
        error: 'Recommendations retrieval failed',
        message: `获取推荐失败: ${error.message}`
      })
    }
  })

  // 5. 热门产品
  fastify.get('/products/popular', async (request, reply) => {
    try {
      const limit = parseInt(request.query.limit) || 10

      const query = `
        SELECT * FROM products 
        WHERE is_active = true 
        ORDER BY 
          (rating * review_count) DESC,
          rating DESC,
          review_count DESC
        LIMIT $1
      `

      const products = await fastify.db.queryMany(query, [limit])

      const formattedProducts = products.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        description: product.description,
        price: parseFloat(product.price),
        originalPrice: product.original_price ? parseFloat(product.original_price) : null,
        imageUrl: product.image_url,
        brand: product.brand,
        rating: parseFloat(product.rating || 0),
        reviewCount: product.review_count || 0,
        popularityScore: Math.round((product.rating || 0) * (product.review_count || 0))
      }))

      return {
        success: true,
        data: formattedProducts
      }
    } catch (error) {
      fastify.log.error('获取热门产品失败:', error)
      return reply.status(500).send({
        success: false,
        error: 'Popular products retrieval failed',
        message: `获取热门产品失败: ${error.message}`
      })
    }
  })
}

// 辅助函数：获取类别显示名称
function getCategoryDisplayName(category) {
  const categoryMap = {
    '营养补充': '营养补充',
    '中医调理': '中医调理',
    '茶饮': '养生茶饮',
    '食疗': '食疗养生'
  }
  return categoryMap[category] || category
}

// 辅助函数：基于分析结果生成推荐关键词
function generateRecommendationKeywords(tongueAnalysis, finalReport) {
  const keywords = []

  if (!tongueAnalysis) return keywords

  // 数据库中实际存在的关键词映射
  const colorMap = {
    '淡白': ['补气血', '气血不足', '补气', '体虚', '疲劳'],
    '红': ['清热', '降火', '肝火旺'],
    '深红': ['清热', '降火', '滋阴'],
    '紫暗': ['补气血', '气血不足', '气血两虚']
  }

  if (colorMap[tongueAnalysis.tongueColor]) {
    keywords.push(...colorMap[tongueAnalysis.tongueColor])
  }

  // 基于舌苔推荐
  if (tongueAnalysis.coatingColor === '黄') {
    keywords.push('清热', '湿气')
  }
  
  if (tongueAnalysis.coatingThickness === '厚苔') {
    keywords.push('健脾胃', '健脾', '脾虚')
  } else if (tongueAnalysis.coatingThickness === '无苔') {
    keywords.push('滋阴', '润燥')
  }

  // 基于舌质形态推荐
  if (tongueAnalysis.tongueShape && tongueAnalysis.tongueShape.includes('齿痕')) {
    keywords.push('健脾', '健脾胃', '脾虚')
  }

  // 基于风险区域推荐
  if (tongueAnalysis.riskAreas) {
    tongueAnalysis.riskAreas.forEach(risk => {
      switch(risk) {
        case '脾胃虚弱':
          keywords.push('健脾', '健脾胃', '脾虚')
          break
        case '湿热内蕴':
          keywords.push('清热', '湿气')
          break
        case '气血不足':
          keywords.push('补气血', '气血不足', '补气')
          break
        case '肝郁气滞':
          keywords.push('疏肝', '肝郁', '理气')
          break
        case '肾阳不足':
          keywords.push('补气', '增强免疫')
          break
        case '心火亢盛':
          keywords.push('清热', '降火', '安神')
          break
        case '肺气虚弱':
          keywords.push('补气', '润燥')
          break
      }
    })
  }

  // 基于最终报告的产品推荐
  if (finalReport && finalReport.productRecommendations) {
    finalReport.productRecommendations.forEach(rec => {
      if (rec.keywords) {
        keywords.push(...rec.keywords)
      }
    })
  }

  // 去重并返回
  return [...new Set(keywords)]
}

// 辅助函数：生成推荐理由
function generateRecommendationReason(product, tongueAnalysis) {
  if (!tongueAnalysis) return '基于健康分析推荐'

  const reasons = []

  // 基于舌诊结果生成理由
  if (tongueAnalysis.tongueColor === '淡白' && product.keywords.includes('补气血')) {
    reasons.push('您的舌质偏淡白，适合补气血类产品')
  }

  if (tongueAnalysis.coatingColor === '黄' && product.keywords.includes('清热')) {
    reasons.push('您的舌苔偏黄，适合清热类产品')
  }

  if (tongueAnalysis.score < 80 && product.keywords.includes('增强免疫')) {
    reasons.push('建议适当增强体质')
  }

  return reasons.length > 0 ? reasons[0] : `适合您的${product.category}产品`
}

export { productRoutes }