import jwt from 'jsonwebtoken'

export async function authPlugin(fastify, options) {
  // JWT验证装饰器
  fastify.decorate('authenticate', async function(request, reply) {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return reply.status(401).send({
          success: false,
          error: 'No token provided',
          message: '请提供认证令牌'
        })
      }

      const decoded = jwt.verify(token, fastify.config.JWT_SECRET)
      request.user = decoded
    } catch (err) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid token',
        message: '认证令牌无效'
      })
    }
  })

  // 可选认证装饰器
  fastify.decorate('optionalAuth', async function(request, reply) {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '')
      
      if (token) {
        const decoded = jwt.verify(token, fastify.config.JWT_SECRET)
        request.user = decoded
      }
    } catch (err) {
      // 可选认证失败时不返回错误，只是不设置用户信息
      request.user = null
    }
  })
}
