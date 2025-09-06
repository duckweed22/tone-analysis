export async function conversationRoutes(fastify, options) {
  // 获取对话历史
  fastify.get('/conversations', async (request, reply) => {
    try {
      const { userId } = request.user || { userId: 'demo-user' }
      const { page = 1, limit = 20 } = request.query

      const offset = (page - 1) * limit

      const conversations = await fastify.db.query(
        `SELECT id, title, created_at, updated_at 
         FROM conversations 
         WHERE user_id = $1 
         ORDER BY updated_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      )

      const total = await fastify.db.query(
        'SELECT COUNT(*) FROM conversations WHERE user_id = $1',
        [userId]
      )

      return {
        success: true,
        data: {
          conversations: conversations.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(total.rows[0].count),
            pages: Math.ceil(total.rows[0].count / limit)
          }
        }
      }
    } catch (error) {
      fastify.log.error('获取对话历史失败:', error)
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch conversations',
        message: '获取对话历史失败'
      })
    }
  })

  // 获取特定会话的对话历史（用于前端显示）
  fastify.get('/conversation/:sessionId', async (request, reply) => {
    try {
      const { sessionId } = request.params
      
      // 这里应该从内存或数据库获取会话的对话历史
      // 暂时返回空数组，因为对话历史存储在 analysis 路由的内存中
      return {
        success: true,
        data: {
          sessionId,
          messages: []
        }
      }
    } catch (error) {
      fastify.log.error('获取对话历史失败:', error)
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch conversation history',
        message: '获取对话历史失败'
      })
    }
  })

  // 获取特定对话的详细信息
  fastify.get('/conversations/:id', async (request, reply) => {
    try {
      const { userId } = request.user || { userId: 'demo-user' }
      const { id } = request.params

      const conversation = await fastify.db.query(
        `SELECT c.*, m.id as message_id, m.role, m.content, m.created_at as message_created_at
         FROM conversations c
         LEFT JOIN messages m ON c.id = m.conversation_id
         WHERE c.id = $1 AND c.user_id = $2
         ORDER BY m.created_at ASC`,
        [id, userId]
      )

      if (conversation.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Conversation not found',
          message: '对话不存在'
        })
      }

      // 组织消息数据
      const messages = conversation.rows.map(row => ({
        id: row.message_id,
        role: row.role,
        content: row.content,
        created_at: row.message_created_at
      })).filter(msg => msg.id) // 过滤掉空消息

      return {
        success: true,
        data: {
          id: conversation.rows[0].id,
          title: conversation.rows[0].title,
          created_at: conversation.rows[0].created_at,
          updated_at: conversation.rows[0].updated_at,
          messages
        }
      }
    } catch (error) {
      fastify.log.error('获取对话详情失败:', error)
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch conversation',
        message: '获取对话详情失败'
      })
    }
  })

  // 创建新对话
  fastify.post('/conversations', {
    schema: {
      body: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 100 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId } = request.user || { userId: 'demo-user' }
      const { title } = request.body

      const result = await fastify.db.query(
        'INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING *',
        [userId, title]
      )

      return {
        success: true,
        data: result.rows[0]
      }
    } catch (error) {
      fastify.log.error('创建对话失败:', error)
      return reply.status(500).send({
        success: false,
        error: 'Failed to create conversation',
        message: '创建对话失败'
      })
    }
  })

  // 发送消息
  fastify.post('/conversations/:id/messages', {
    schema: {
      body: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId } = request.user || { userId: 'demo-user' }
      const { id } = request.params
      const { content } = request.body

      // 验证对话是否存在且属于当前用户
      const conversation = await fastify.db.query(
        'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
        [id, userId]
      )

      if (conversation.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Conversation not found',
          message: '对话不存在'
        })
      }

      // 添加用户消息
      const userMessage = await fastify.db.query(
        'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3) RETURNING *',
        [id, 'user', content]
      )

      // 这里可以添加AI回复逻辑
      // 暂时返回用户消息
      return {
        success: true,
        data: {
          message: userMessage.rows[0]
        }
      }
    } catch (error) {
      fastify.log.error('发送消息失败:', error)
      return reply.status(500).send({
        success: false,
        error: 'Failed to send message',
        message: '发送消息失败'
      })
    }
  })

  // 删除对话
  fastify.delete('/conversations/:id', async (request, reply) => {
    try {
      const { userId } = request.user || { userId: 'demo-user' }
      const { id } = request.params

      const result = await fastify.db.query(
        'DELETE FROM conversations WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      )

      if (result.rows.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Conversation not found',
          message: '对话不存在'
        })
      }

      return {
        success: true,
        message: '对话已删除'
      }
    } catch (error) {
      fastify.log.error('删除对话失败:', error)
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete conversation',
        message: '删除对话失败'
      })
    }
  })
}
