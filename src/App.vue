<template>
  <div class="app">
    <!-- 头部 -->
    <div class="header bg-white shadow-sm px-4 py-3 flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-800">AI舌诊健康分析</h1>
      <div class="header-actions">
        <button 
          v-if="currentState !== 'upload'"
          @click="backToHome"
          class="back-button"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          返回首页
        </button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main">
      <!-- 上传界面 -->
      <CameraUpload 
        v-if="currentState === 'upload'"
        @image-selected="handleImageSelected"
      />

      <!-- 对话界面 -->
      <ConversationInterface 
        v-else-if="currentState === 'conversation'"
        :session-id="currentSessionId"
        :initial-analysis="analysisResult"
        @restart="resetToUpload"
        @view-report="viewDetailedReport"
        @share="shareResults"
      />

      <!-- 详细报告界面 -->
      <DetailedReport 
        v-else-if="currentState === 'report'"
        :session-id="currentSessionId"
        @back="backToConversation"
        @restart="resetToUpload"
        @share="shareResults"
      />
    </div>

    <!-- 全局加载状态 -->
    <div v-if="isGlobalLoading" class="global-loading">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">{{ loadingText }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import CameraUpload from './components/CameraUpload.vue'
import ConversationInterface from './components/ConversationInterface.vue'
import DetailedReport from './components/DetailedReport.vue'
import { analysisAPI, apiUtils } from './utils/apiService.js'

// 应用状态管理
const currentState = ref('upload') // upload | conversation | report
const currentSessionId = ref('')
const analysisResult = ref(null)
const isGlobalLoading = ref(false)
const loadingText = ref('处理中...')

// 显示消息提示
const showMessage = (message, type = 'info') => {
  const toast = document.createElement('div')
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#10B981' : '#3b82f6'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `
  
  document.body.appendChild(toast)
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast)
    }
  }, 3000)
}

// 处理图片选择
const handleImageSelected = async (imageData) => {
  try {
    isGlobalLoading.value = true
    loadingText.value = '正在分析您的舌象，请稍候...'
    
    console.log('开始AI分析流程，图片大小:', imageData.length)
    
    // 调用后端API进行舌诊分析
    const response = await analysisAPI.analyze(imageData)
    
    if (response.success) {
      console.log('AI分析完成:', response.data)
      
      // 保存分析结果和会话ID
      currentSessionId.value = response.data.sessionId
      analysisResult.value = response.data.analysis
      
      // 切换到对话界面
      currentState.value = 'conversation'
      
      showMessage('舌诊分析完成，开始智能问诊', 'success')
    } else {
      throw new Error(response.message || '分析失败')
    }
  } catch (error) {
    console.error('分析失败:', error)
    showMessage(`分析失败: ${apiUtils.formatError(error)}`, 'error')
  } finally {
    isGlobalLoading.value = false
  }
}

// 查看详细报告
const viewDetailedReport = () => {
  currentState.value = 'report'
}

// 从报告页面返回对话
const backToConversation = () => {
  currentState.value = 'conversation'
}

// 返回首页
const backToHome = () => {
  if (confirm('确定要返回首页吗？当前对话将被保留。')) {
    resetToUpload()
  }
}

// 重置到上传界面
const resetToUpload = () => {
  currentState.value = 'upload'
  currentSessionId.value = ''
  analysisResult.value = null
}

// 分享结果
const shareResults = async () => {
  try {
    if (!currentSessionId.value) {
      showMessage('没有可分享的结果', 'error')
      return
    }

    // 获取分析记录
    const record = await analysisAPI.getRecord(currentSessionId.value)
    
    if (!record.success) {
      throw new Error('获取分析记录失败')
    }

    const analysisData = record.data
    const finalReport = analysisData.final_report
    
    // 创建分享内容
    let shareText = `🏥 AI舌诊健康分析报告\n\n`
    
    if (finalReport) {
      shareText += `📊 综合健康评分：${finalReport.finalScore}分\n`
      shareText += `📝 分析总结：${finalReport.summary}\n\n`
      
      if (finalReport.recommendations?.lifestyle?.length > 0) {
        shareText += `💡 健康建议：\n`
        finalReport.recommendations.lifestyle.slice(0, 2).forEach((suggestion, index) => {
          shareText += `${index + 1}. ${suggestion}\n`
        })
      }
    } else {
      const tongueAnalysis = analysisData.tongue_analysis
      shareText += `📊 健康评分：${tongueAnalysis.score}分\n`
      shareText += `👅 舌质：${tongueAnalysis.tongueColor}\n`
      shareText += `🔍 舌苔：${tongueAnalysis.coatingColor}${tongueAnalysis.coatingThickness}\n\n`
      
      if (tongueAnalysis.suggestions?.length > 0) {
        shareText += `💡 健康建议：\n`
        tongueAnalysis.suggestions.slice(0, 2).forEach((suggestion, index) => {
          shareText += `${index + 1}. ${suggestion}\n`
        })
      }
    }
    
    shareText += `\n📱 AI舌诊健康分析 - 智能健康管理助手`

    // 尝试使用Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI舌诊健康分析报告',
          text: shareText
        })
        return
      } catch (shareError) {
        console.log('Web Share API失败，尝试剪贴板')
      }
    }

    // 使用剪贴板API
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText)
      showMessage('分析结果已复制到剪贴板', 'success')
    } else {
      // 创建临时文本区域进行复制
      const textArea = document.createElement('textarea')
      textArea.value = shareText
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      
      try {
        document.execCommand('copy')
        showMessage('分析结果已复制', 'success')
      } catch (error) {
        showMessage('复制失败，请手动保存', 'error')
      } finally {
        document.body.removeChild(textArea)
      }
    }
  } catch (error) {
    console.error('分享失败:', error)
    showMessage(`分享失败: ${apiUtils.formatError(error)}`, 'error')
  }
}

// 检查API连接
const checkApiConnection = async () => {
  try {
    const isConnected = await apiUtils.checkConnection()
    if (!isConnected) {
      showMessage('无法连接到服务器，请检查网络', 'error')
    }
  } catch (error) {
    console.warn('API连接检查失败:', error)
  }
}

// 页面加载时的初始化
onMounted(async () => {
  // 设置页面标题
  document.title = 'AI舌诊健康分析'
  
  // 检查API连接
  await checkApiConnection()
  
  // 获取用户ID（如果需要的话）
  const userId = apiUtils.getUserId()
  console.log('当前用户ID:', userId)
  
  // 可以在这里加载用户的历史会话等
})
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f8fafc;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid #e5e7eb;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: #e5e7eb;
  color: #111827;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 全局加载状态 */
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  background: white;
  padding: 32px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  min-width: 200px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #10B981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.loading-text {
  color: #374151;
  font-size: 16px;
  font-weight: 500;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* iOS安全区域适配 */
@supports (padding-top: env(safe-area-inset-top)) {
  .header {
    padding-top: calc(env(safe-area-inset-top) + 12px);
  }
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .main {
    padding-bottom: env(safe-area-inset-bottom);
  }
}

/* 响应式设计 */
@media (max-width: 640px) {
  .header {
    padding: 12px 16px;
  }
  
  .header h1 {
    font-size: 18px;
  }
  
  .back-button {
    padding: 6px 10px;
    font-size: 13px;
  }
}
</style>