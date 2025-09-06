/**
 * API服务 - 与后端通信的统一接口
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

// 用户ID管理
let currentUserId = null

// 从localStorage获取或生成用户ID
function getUserId() {
  if (currentUserId) return currentUserId
  
  try {
    currentUserId = localStorage.getItem('userId')
    if (!currentUserId) {
      currentUserId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('userId', currentUserId)
    }
  } catch (error) {
    // 如果localStorage不可用（如在artifacts环境），使用内存中的ID
    currentUserId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  return currentUserId
}

// 通用请求函数
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const userId = getUserId()
  
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId
    }
  }

  // 合并选项
  const requestOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  }

  // 如果是POST/PUT请求且body不是FormData，确保JSON序列化
  if ((requestOptions.method === 'POST' || requestOptions.method === 'PUT') && 
      requestOptions.body && 
      typeof requestOptions.body === 'object' && 
      !(requestOptions.body instanceof FormData)) {
    requestOptions.body = JSON.stringify(requestOptions.body)
  }

  try {
    console.log(`🚀 API请求: ${requestOptions.method} ${url}`, {
      userId,
      body: requestOptions.body
    })

    const response = await fetch(url, requestOptions)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    console.log(`✅ API响应: ${requestOptions.method} ${url}`, data)
    return data

  } catch (error) {
    console.error(`❌ API错误: ${requestOptions.method} ${url}`, error)
    throw error
  }
}

// 分析相关API
export const analysisAPI = {
  // 舌诊分析
  async analyze(imageData) {
    return await apiRequest('/analyze', {
      method: 'POST',
      body: {
        imageData,
        userId: getUserId()
      }
    })
  },

  // 生成问诊问题
  async generateQuestions(sessionId) {
    return await apiRequest('/generate-questions', {
      method: 'POST',
      body: {
        sessionId,
        userId: getUserId()
      }
    })
  },

  // 提交问诊答案
  async submitAnswers(sessionId, answers) {
    return await apiRequest('/submit-answers', {
      method: 'POST',
      body: {
        sessionId,
        answers,
        userId: getUserId()
      }
    })
  },

  // 获取分析历史
  async getHistory(limit = 10) {
    return await apiRequest(`/history?limit=${limit}`)
  },

  // 获取具体分析记录
  async getRecord(sessionId) {
    return await apiRequest(`/record/${sessionId}`)
  }
}

// 对话相关API
export const conversationAPI = {
  // 获取对话历史
  async getHistory(sessionId) {
    return await apiRequest(`/conversation/${sessionId}`)
  },

  // 发送消息
  async sendMessage(sessionId, messageType, content, data = null) {
    return await apiRequest('/conversation/message', {
      method: 'POST',
      body: {
        sessionId,
        messageType,
        content,
        data
      }
    })
  },

  // 获取会话状态
  async getStatus(sessionId) {
    return await apiRequest(`/conversation/${sessionId}/status`)
  },

  // 获取用户所有会话
  async getConversations(limit = 20, offset = 0) {
    return await apiRequest(`/conversations?limit=${limit}&offset=${offset}`)
  },

  // 搜索会话
  async searchConversations(keyword, limit = 20) {
    return await apiRequest(`/conversations/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`)
  },

  // 删除会话
  async deleteConversation(sessionId) {
    return await apiRequest(`/conversation/${sessionId}`, {
      method: 'DELETE'
    })
  }
}

// 产品相关API
export const productAPI = {
  // 获取产品列表
  async getProducts(options = {}) {
    const params = new URLSearchParams()
    if (options.category) params.append('category', options.category)
    if (options.keywords) params.append('keywords', options.keywords)
    if (options.limit) params.append('limit', options.limit)
    if (options.offset) params.append('offset', options.offset)

    return await apiRequest(`/products?${params.toString()}`)
  },

  // 获取产品详情
  async getProduct(productId) {
    return await apiRequest(`/products/${productId}`)
  },

  // 获取产品类别
  async getCategories() {
    return await apiRequest('/products/categories')
  },

  // 获取推荐产品
  async getRecommendations(sessionId, limit = 6) {
    return await apiRequest(`/products/recommendations/${sessionId}?limit=${limit}`)
  },

  // 获取热门产品
  async getPopular(limit = 10) {
    return await apiRequest(`/products/popular?limit=${limit}`)
  }
}

// 健康检查API
export const healthAPI = {
  // 基础健康检查
  async check() {
    return await apiRequest('/health')
  },

  // 详细健康检查
  async detailed() {
    return await apiRequest('/health/detailed')
  }
}

// 工具函数
export const apiUtils = {
  // 获取当前用户ID
  getUserId,

  // 重置用户ID（用于测试）
  resetUserId() {
    currentUserId = null
    try {
      localStorage.removeItem('userId')
    } catch (error) {
      // 忽略localStorage错误
    }
    return getUserId()
  },

  // 检查API连接
  async checkConnection() {
    try {
      await healthAPI.check()
      return true
    } catch (error) {
      return false
    }
  },

  // 格式化错误消息
  formatError(error) {
    if (error.message) {
      return error.message
    }
    
    if (typeof error === 'string') {
      return error
    }
    
    return '网络错误，请检查连接'
  }
}

// 导出默认对象，包含所有API
export default {
  analysis: analysisAPI,
  conversation: conversationAPI,
  product: productAPI,
  health: healthAPI,
  utils: apiUtils
}