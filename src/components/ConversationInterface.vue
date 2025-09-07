<template>
  <div class="conversation-interface">
    <!-- 对话消息列表 -->
    <div class="messages-container" ref="messagesContainer">
      <div class="messages-list">
        <div
          v-for="message in messages"
          :key="message.id || message.timestamp"
          :class="[
            'message',
            message.sender === 'user' ? 'message-user' : 'message-ai'
          ]"
        >
          <!-- 用户消息 -->
          <div v-if="message.sender === 'user'" class="message-content user-message">
            <div class="message-bubble">
              <p>{{ message.content }}</p>
              <div v-if="message.data?.imageUploaded" class="image-indicator">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span class="text-sm text-green-600">已上传舌头照片</span>
              </div>
            </div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>

          <!-- AI消息 -->
          <div v-else class="message-content ai-message">
            <div class="ai-avatar">
              <div class="avatar-circle">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
              </div>
              <span class="ai-name">AI健康顾问</span>
            </div>
            
            <div class="message-bubble ai-bubble">
              <!-- 分析类型消息 -->
              <div v-if="message.type === 'analysis'" class="analysis-message">
                <p>{{ message.content }}</p>
                <div v-if="message.data" class="analysis-summary mt-3 p-4 bg-green-50 rounded-lg">
                  <div class="flex items-center justify-between mb-3">
                    <span class="font-medium text-green-800">分析结果</span>
                    <span class="text-2xl font-bold text-green-600">{{ message.data.score }}分</span>
                  </div>
                  
                  <!-- 舌质分析 -->
                  <div class="mb-3">
                    <div class="text-sm font-medium text-gray-700 mb-1">舌质分析</div>
                    <div class="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>颜色：{{ message.data.tongueColor }}</div>
                      <div>形态：{{ message.data.tongueShape }}</div>
                    </div>
                  </div>

                  <!-- 舌苔分析 -->
                  <div class="mb-3">
                    <div class="text-sm font-medium text-gray-700 mb-1">舌苔分析</div>
                    <div class="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>颜色：{{ message.data.coatingColor }}</div>
                      <div>厚度：{{ message.data.coatingThickness }}</div>
                      <div v-if="message.data.coatingMoisture">润燥：{{ message.data.coatingMoisture }}</div>
                    </div>
                  </div>

                  <!-- 体质分析 -->
                  <div v-if="message.data.constitutionType || message.data.pathologyPattern" class="mb-3">
                    <div class="text-sm font-medium text-gray-700 mb-1">体质分析</div>
                    <div class="text-sm text-gray-600">
                      <div v-if="message.data.constitutionType">体质类型：{{ message.data.constitutionType }}</div>
                      <div v-if="message.data.pathologyPattern">主要病机：{{ message.data.pathologyPattern }}</div>
                    </div>
                  </div>

                  <!-- 脏腑功能状态 -->
                  <div v-if="message.data.organStatus" class="mb-3">
                    <div class="text-sm font-medium text-gray-700 mb-2">脏腑功能状态</div>
                    <div class="space-y-1">
                      <div v-for="(organ, key) in message.data.organStatus" :key="key" class="flex items-center justify-between text-sm">
                        <span class="text-gray-600">{{ getOrganName(key) }}：</span>
                        <div class="flex items-center">
                          <span class="mr-2">{{ organ.status }}</span>
                          <div class="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              class="h-full transition-all duration-500"
                              :style="{ 
                                width: organ.score + '%',
                                backgroundColor: getScoreColor(organ.score)
                              }"
                            ></div>
                          </div>
                          <span class="text-xs text-gray-500 ml-1">{{ organ.score }}分</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 主要健康隐患 -->
                  <div v-if="message.data.primaryConcerns && message.data.primaryConcerns.length > 0" class="mb-3">
                    <div class="text-sm font-medium text-gray-700 mb-1">主要健康隐患</div>
                    <div class="space-y-1">
                      <div 
                        v-for="(concern, index) in message.data.primaryConcerns" 
                        :key="index"
                        class="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded"
                      >
                        {{ index + 1 }}. {{ concern }}
                      </div>
                    </div>
                  </div>

                  <!-- 风险区域 -->
                  <div v-if="message.data.riskAreas && message.data.riskAreas.length > 0">
                    <div class="text-sm font-medium text-gray-700 mb-1">风险区域</div>
                    <div class="flex flex-wrap gap-1">
                      <span 
                        v-for="(risk, index) in message.data.riskAreas" 
                        :key="index"
                        class="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
                      >
                        {{ risk }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 问诊类型消息 -->
              <div v-else-if="message.type === 'question'" class="question-message">
                <p>{{ message.content }}</p>
                <div v-if="message.data && !questionsAnswered" class="questions-container mt-4">
                  <div 
                    v-for="(question, index) in message.data.questions" 
                    :key="question.id"
                    class="question-item mb-4"
                  >
                    <h4 class="question-text mb-2 font-medium">{{ question.question }}</h4>
                    <div class="options-grid">
                      <button
                        v-for="(option, optionIndex) in question.options"
                        :key="optionIndex"
                        @click="selectAnswer(question.id, option, optionIndex)"
                        :class="[
                          'option-button',
                          selectedAnswers[question.id]?.answerIndex === optionIndex ? 'selected' : ''
                        ]"
                      >
                        {{ option }}
                      </button>
                    </div>
                  </div>
                  
                  <div class="mt-4 flex justify-between">
                    <button
                      @click="skipQuestions"
                      class="skip-button"
                    >
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
                      </svg>
                      跳过问诊
                    </button>
                    
                    <button
                      @click="submitAnswers"
                      :disabled="!allQuestionsAnswered"
                      :class="[
                        'submit-button',
                        allQuestionsAnswered ? 'active' : 'disabled'
                      ]"
                    >
                      提交答案 ({{ Object.keys(selectedAnswers).length }}/{{ message.data.questions.length }})
                    </button>
                  </div>
                </div>
                <div v-else-if="questionsAnswered" class="mt-3 text-sm text-gray-500">
                  ✅ 已完成问诊
                </div>
              </div>

              <!-- 报告类型消息 -->
              <div v-else-if="message.type === 'report'" class="report-message">
                <p>{{ message.content }}</p>
                <div v-if="message.data" class="report-summary mt-3">
                  <div class="final-score mb-3 p-3 bg-blue-50 rounded-lg text-center">
                    <div class="text-sm text-gray-600">综合健康评分</div>
                    <div class="text-3xl font-bold text-blue-600">{{ message.data.finalScore }}分</div>
                    <div class="text-sm text-gray-600">{{ getScoreLevel(message.data.finalScore) }}</div>
                  </div>
                  
                  <button 
                    @click="viewDetailedReport"
                    class="view-report-button w-full mt-3"
                  >
                    查看详细报告
                  </button>
                </div>
              </div>

              <!-- 普通消息 -->
              <div v-else>
                <p>{{ message.content }}</p>
              </div>
            </div>
            
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>

        <!-- 分析中状态 -->
        <div v-if="isAnalyzing" class="message message-ai">
          <div class="message-content ai-message">
            <div class="ai-avatar">
              <div class="avatar-circle analyzing">
                <div class="loading-spinner"></div>
              </div>
              <span class="ai-name">AI健康顾问</span>
            </div>
            <div class="message-bubble ai-bubble">
              <div class="analyzing-content">
                <p>{{ analyzingText }}</p>
                <div class="progress-bar mt-2">
                  <div class="progress-fill" :style="{ width: `${analyzingProgress}%` }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作区域 -->
    <div class="bottom-actions" v-if="showActions">
      <div class="action-buttons">
        <!-- 重新检测按钮 -->
        <button @click="handleRestart" class="action-button secondary">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          重新检测
        </button>

        <!-- 分享结果按钮 -->
        <button @click="handleShare" class="action-button primary" v-if="hasResults">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
          </svg>
          分享结果
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { analysisAPI, conversationAPI } from '../utils/apiService.js'

const props = defineProps({
  sessionId: {
    type: String,
    required: true
  },
  initialAnalysis: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['restart', 'view-report', 'share'])

// 响应式数据
const messages = ref([])
const isAnalyzing = ref(false)
const analyzingText = ref('正在分析您的舌象...')
const analyzingProgress = ref(0)
const questionsAnswered = ref(false)
const selectedAnswers = ref({})
const messagesContainer = ref(null)
const questionsGenerated = ref(false) // 防止重复生成问题

// 计算属性
const allQuestionsAnswered = computed(() => {
  const currentQuestions = getCurrentQuestions()
  if (!currentQuestions) return false
  
  return currentQuestions.every(q => selectedAnswers.value[q.id])
})

const showActions = computed(() => {
  return messages.value.length > 0 && !isAnalyzing.value
})

const hasResults = computed(() => {
  return messages.value.some(m => m.type === 'report')
})

// 方法
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const getScoreLevel = (score) => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '一般'
  return '需改善'
}

const getCurrentQuestions = () => {
  const questionMessage = messages.value.find(m => m.type === 'question')
  return questionMessage?.data?.questions || null
}

const selectAnswer = (questionId, answer, answerIndex) => {
  selectedAnswers.value[questionId] = {
    answer,
    answerIndex
  }
}

const submitAnswers = async () => {
  if (!allQuestionsAnswered.value) return

  try {
    isAnalyzing.value = true
    analyzingText.value = '正在生成您的健康报告...'
    analyzingProgress.value = 0

    // 模拟进度
    const progressInterval = setInterval(() => {
      if (analyzingProgress.value < 90) {
        analyzingProgress.value += Math.random() * 10
      }
    }, 300)

    // 转换答案格式
    const answers = Object.entries(selectedAnswers.value).map(([questionId, answerData]) => ({
      questionId: parseInt(questionId),
      answer: answerData.answer,
      answerIndex: answerData.answerIndex
    }))

    // 提交答案
    const response = await analysisAPI.submitAnswers(props.sessionId, answers)
    
    clearInterval(progressInterval)
    analyzingProgress.value = 100

    if (response.success) {
      questionsAnswered.value = true
      
      // 添加用户提交答案的消息
      messages.value.push({
        id: Date.now(),
        type: 'user',
        sender: 'user',
        content: '我已经完成了所有问题的回答。',
        timestamp: new Date().toISOString(),
        data: { answers }
      })

      // 添加AI报告消息
      messages.value.push({
        id: Date.now() + 1,
        type: 'report',
        sender: 'ai',
        content: response.data.report.summary,
        timestamp: new Date().toISOString(),
        data: response.data.report
      })

      await scrollToBottom()
    }
  } catch (error) {
    console.error('提交答案失败:', error)
    showMessage('提交失败，请重试', 'error')
  } finally {
    isAnalyzing.value = false
    analyzingProgress.value = 0
  }
}

// 跳过问诊，直接生成报告
const skipQuestions = async () => {
  try {
    isAnalyzing.value = true
    analyzingText.value = '正在生成您的健康报告...'
    analyzingProgress.value = 0

    // 模拟进度
    const progressInterval = setInterval(() => {
      if (analyzingProgress.value < 90) {
        analyzingProgress.value += Math.random() * 10
      }
    }, 300)

    // 提交空的答案数组表示跳过
    const response = await analysisAPI.submitAnswers(props.sessionId, [])
    
    clearInterval(progressInterval)
    analyzingProgress.value = 100

    if (response.success) {
      questionsAnswered.value = true
      
      // 添加用户跳过问诊的消息
      messages.value.push({
        id: Date.now(),
        type: 'user',
        sender: 'user',
        content: '我选择跳过问诊，直接查看报告。',
        timestamp: new Date().toISOString(),
        data: { skipped: true }
      })

      // 添加AI报告消息
      messages.value.push({
        id: Date.now() + 1,
        type: 'report',
        sender: 'ai',
        content: response.data.report.summary,
        timestamp: new Date().toISOString(),
        data: response.data.report
      })

      await scrollToBottom()
    }
  } catch (error) {
    console.error('跳过问诊失败:', error)
    showMessage('生成报告失败，请重试', 'error')
  } finally {
    isAnalyzing.value = false
    analyzingProgress.value = 0
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const loadConversationHistory = async () => {
  try {
    const response = await conversationAPI.getHistory(props.sessionId)
    if (response.success) {
      messages.value = response.data.messages
      
      // 检查是否已经完成问诊
      const hasQuestionMessage = messages.value.some(m => m.type === 'question')
      const hasReportMessage = messages.value.some(m => m.type === 'report')
      
      if (hasQuestionMessage && hasReportMessage) {
        questionsAnswered.value = true
      }
      
      await scrollToBottom()
    }
  } catch (error) {
    console.error('加载对话历史失败:', error)
    
    // 如果是新会话，添加初始消息
    if (props.initialAnalysis) {
      addInitialMessages()
    }
  }
}

const addInitialMessages = () => {
  // 添加用户上传图片消息
  messages.value.push({
    id: Date.now(),
    type: 'user',
    sender: 'user',
    content: '我已经上传了舌头照片，请帮我分析一下健康状况。',
    timestamp: new Date().toISOString(),
    data: { imageUploaded: true }
  })

  // 添加AI分析结果消息
  messages.value.push({
    id: Date.now() + 1,
    type: 'analysis',
    sender: 'ai',
    content: `我已经仔细观察了您的舌象。您的健康评分是 ${props.initialAnalysis.score} 分，舌质呈${props.initialAnalysis.tongueColor}色，舌苔为${props.initialAnalysis.coatingColor}${props.initialAnalysis.coatingThickness}。为了给您更准确的健康建议，我想进一步了解您的具体感受。`,
    timestamp: new Date().toISOString(),
    data: props.initialAnalysis
  })
}

const generateQuestions = async () => {
  // 防止重复调用
  if (questionsGenerated.value) {
    console.log('问题已生成，跳过重复调用')
    return
  }
  
  try {
    questionsGenerated.value = true
    isAnalyzing.value = true
    analyzingText.value = '正在为您生成个性化问题...'
    
    const response = await analysisAPI.generateQuestions(props.sessionId)
    
    if (response.success) {
      // 添加AI问诊消息
      messages.value.push({
        id: Date.now(),
        type: 'question',
        sender: 'ai',
        content: `基于您的舌诊结果，我想了解一些具体情况，这将帮助我为您提供更精准的健康建议。预计需要${response.data.estimatedTime}。`,
        timestamp: new Date().toISOString(),
        data: response.data
      })
      
      await scrollToBottom()
    }
  } catch (error) {
    console.error('生成问题失败:', error)
    showMessage('生成问题失败，请重试', 'error')
  } finally {
    isAnalyzing.value = false
  }
}

const viewDetailedReport = () => {
  emit('view-report')
}

const handleRestart = () => {
  if (confirm('确定要重新开始舌诊分析吗？')) {
    emit('restart')
  }
}

const handleShare = () => {
  emit('share')
}

const showMessage = (message, type = 'info') => {
  // 简单的消息提示
  const toast = document.createElement('div')
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'error' ? '#ff4444' : '#10B981'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-size: 14px;
  `
  
  document.body.appendChild(toast)
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast)
    }
  }, 3000)
}

// 监听初始分析数据变化
watch(() => props.initialAnalysis, (newAnalysis) => {
  if (newAnalysis && messages.value.length === 0) {
    addInitialMessages()
    // 延迟生成问诊问题
    setTimeout(() => {
      generateQuestions()
    }, 2000)
  }
}, { immediate: true })

// 组件挂载时加载对话历史
onMounted(async () => {
  if (props.sessionId) {
    await loadConversationHistory()
    
    // 如果没有消息且有初始分析，添加初始消息
    if (messages.value.length === 0 && props.initialAnalysis) {
      addInitialMessages()
      // 注意：问题生成由 watch 监听器处理，这里不需要重复调用
    } else {
    // 如果已有分析但没有问题，生成问题
    const hasAnalysis = messages.value.some(m => m.type === 'analysis')
    const hasQuestions = messages.value.some(m => m.type === 'question')
    
      if (hasAnalysis && !hasQuestions && !questionsAnswered.value && !questionsGenerated.value) {
      setTimeout(() => {
        generateQuestions()
      }, 1000)
      }
    }
  }
})

// 获取脏腑名称
const getOrganName = (key) => {
  const organNames = {
    spleen: '脾胃',
    liver: '肝胆',
    heart: '心',
    lung: '肺',
    kidney: '肾'
  }
  return organNames[key] || key
}

// 获取分数对应的颜色
const getScoreColor = (score) => {
  if (score >= 85) return '#10B981'  // 绿色 - 优秀
  if (score >= 75) return '#F59E0B'  // 黄色 - 良好
  if (score >= 65) return '#F97316'  // 橙色 - 一般
  return '#EF4444'                   // 红色 - 较差
}
</script>

<style scoped>
.conversation-interface {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(to bottom, #f8fafc, #e2e8f0);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
  scroll-behavior: smooth;
}

.messages-list {
  max-width: 600px;
  margin: 0 auto;
}

.message {
  margin-bottom: 20px;
}

.message-content {
  display: flex;
  flex-direction: column;
}

/* 用户消息样式 */
.user-message {
  align-items: flex-end;
}

.user-message .message-bubble {
  background: linear-gradient(135deg, #10B981, #059669);
  color: white;
  padding: 12px 16px;
  border-radius: 18px 18px 4px 18px;
  max-width: 80%;
  margin-left: auto;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}

.image-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

/* AI消息样式 */
.ai-message {
  align-items: flex-start;
}

.ai-avatar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.avatar-circle {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #10B981, #059669);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.avatar-circle.analyzing {
  animation: pulse 2s infinite;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.ai-name {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.ai-bubble {
  background: white;
  border: 1px solid #e5e7eb;
  padding: 16px;
  border-radius: 4px 18px 18px 18px;
  max-width: 85%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.message-time {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
  text-align: right;
}

.ai-message .message-time {
  text-align: left;
}

/* 分析消息特殊样式 */
.analysis-summary {
  border-left: 3px solid #10B981;
}

/* 问诊相关样式 */
.question-item {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.question-text {
  color: #374151;
  font-size: 16px;
  line-height: 1.5;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
}

.option-button {
  padding: 10px 16px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.option-button:hover {
  border-color: #10B981;
  background: #f0fdf4;
}

.option-button.selected {
  border-color: #10B981;
  background: #10B981;
  color: white;
}

.submit-button {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.submit-button.active {
  background: linear-gradient(135deg, #10B981, #059669);
  color: white;
}

.submit-button.disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

.skip-button {
  padding: 12px 20px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  color: #64748b;
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.skip-button:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #475569;
}

.skip-button:active {
  background: #e2e8f0;
  transform: translateY(1px);
}

/* 报告样式 */
.final-score {
  border-left: 3px solid #3b82f6;
}

.view-report-button {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-report-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* 分析中状态 */
.analyzing-content {
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10B981, #34D399);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* 底部操作区域 */
.bottom-actions {
  padding: 16px;
  background: white;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.action-buttons {
  display: flex;
  gap: 12px;
  max-width: 600px;
  margin: 0 auto;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.action-button.primary {
  background: linear-gradient(135deg, #10B981, #059669);
  color: white;
}

.action-button.secondary {
  background: white;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.action-button:hover {
  transform: translateY(-1px);
}

.action-button.primary:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.action-button.secondary:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

/* 动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 640px) {
  .messages-container {
    padding: 16px 12px;
  }
  
  .user-message .message-bubble,
  .ai-bubble {
    max-width: 95%;
  }
  
  .options-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>