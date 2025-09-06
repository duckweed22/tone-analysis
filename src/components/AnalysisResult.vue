<template>
  <div class="analysis-result">
    <!-- 健康评分卡片 -->
    <div class="score-card bg-white rounded-2xl shadow-sm p-6 mb-6 text-center">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">健康评分</h2>
      
      <!-- 圆形进度条 -->
      <div class="score-circle-container mb-4">
        <van-circle
          v-model:current-rate="animatedScore"
          :rate="result.score"
          :speed="100"
          :stroke-width="8"
          :size="120"
          layer-color="#f0f0f0"
          :color="scoreColor"
          :clockwise="true"
        >
          <div class="score-content">
            <div class="text-3xl font-bold" :style="{ color: scoreColor }">
              {{ Math.round(animatedScore) }}
            </div>
            <div class="text-sm text-gray-500">分</div>
          </div>
        </van-circle>
      </div>
      
      <!-- 评分描述 -->
      <div class="score-description">
        <h3 class="text-lg font-medium mb-2" :style="{ color: scoreColor }">
          {{ scoreLevel.text }}
        </h3>
        <p class="text-sm text-gray-600">
          {{ scoreLevel.description }}
        </p>
      </div>
    </div>

    <!-- 分析详情 -->
    <div class="analysis-details space-y-4 mb-6">
      <!-- 舌质分析 -->
      <div class="detail-card bg-white rounded-xl shadow-sm p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-medium text-gray-800 flex items-center">
            <div class="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
            舌质分析
          </h3>
        </div>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">颜色：</span>
            <span class="font-medium">{{ result.tongueColor }}</span>
          </div>
          <div>
            <span class="text-gray-500">形态：</span>
            <span class="font-medium">{{ result.tongueShape }}</span>
          </div>
        </div>
      </div>

      <!-- 舌苔分析 -->
      <div class="detail-card bg-white rounded-xl shadow-sm p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-medium text-gray-800 flex items-center">
            <div class="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
            舌苔分析
          </h3>
        </div>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">颜色：</span>
            <span class="font-medium">{{ result.coatingColor }}</span>
          </div>
          <div>
            <span class="text-gray-500">厚度：</span>
            <span class="font-medium">{{ result.coatingThickness }}</span>
          </div>
          <div v-if="result.coatingMoisture">
            <span class="text-gray-500">润燥：</span>
            <span class="font-medium">{{ result.coatingMoisture }}</span>
          </div>
        </div>
      </div>

      <!-- 脏腑功能状态 -->
      <div v-if="result.organStatus" class="detail-card bg-white rounded-xl shadow-sm p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-medium text-gray-800 flex items-center">
            <div class="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
            脏腑功能状态
          </h3>
        </div>
        <div class="space-y-3">
          <div v-for="(organ, key) in result.organStatus" :key="key" class="flex items-center justify-between">
            <span class="text-gray-600 text-sm">{{ getOrganName(key) }}：</span>
            <div class="flex items-center">
              <span class="text-sm font-medium mr-2">{{ organ.status }}</span>
              <div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  class="h-full transition-all duration-500"
                  :style="{ 
                    width: organ.score + '%',
                    backgroundColor: getScoreColor(organ.score)
                  }"
                ></div>
              </div>
              <span class="text-xs text-gray-500 ml-2">{{ organ.score }}分</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 体质分析 -->
      <div v-if="result.constitutionType || result.pathologyPattern" class="detail-card bg-white rounded-xl shadow-sm p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-medium text-gray-800 flex items-center">
            <div class="w-3 h-3 bg-purple-400 rounded-full mr-2"></div>
            体质分析
          </h3>
        </div>
        <div class="space-y-2 text-sm">
          <div v-if="result.constitutionType">
            <span class="text-gray-500">体质类型：</span>
            <span class="font-medium text-purple-600">{{ result.constitutionType }}</span>
          </div>
          <div v-if="result.pathologyPattern">
            <span class="text-gray-500">主要病机：</span>
            <span class="font-medium text-red-600">{{ result.pathologyPattern }}</span>
          </div>
        </div>
      </div>

      <!-- 主要健康隐患 -->
      <div v-if="result.primaryConcerns && result.primaryConcerns.length > 0" class="detail-card bg-white rounded-xl shadow-sm p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-medium text-gray-800 flex items-center">
            <div class="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
            主要健康隐患
          </h3>
        </div>
        <div class="space-y-2">
          <div 
            v-for="(concern, index) in result.primaryConcerns" 
            :key="index"
            class="flex items-start p-2 bg-orange-50 rounded-lg"
          >
            <div class="w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3 flex-shrink-0 mt-0.5">
              {{ index + 1 }}
            </div>
            <p class="text-gray-700 text-sm">{{ concern }}</p>
          </div>
        </div>
      </div>

      <!-- 风险区域 -->
      <div v-if="result.riskAreas && result.riskAreas.length > 0" class="detail-card bg-white rounded-xl shadow-sm p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-medium text-gray-800 flex items-center">
            <div class="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
            风险区域
          </h3>
        </div>
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="(risk, index) in result.riskAreas" 
            :key="index"
            class="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full"
          >
            {{ risk }}
          </span>
        </div>
      </div>
    </div>

    <!-- 健康建议 -->
    <div class="suggestions-card bg-white rounded-2xl shadow-sm p-6 mb-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <svg class="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
        健康建议
      </h3>
      
      <div class="space-y-3">
        <div 
          v-for="(suggestion, index) in result.suggestions" 
          :key="index"
          class="flex items-start p-3 bg-green-50 rounded-lg"
        >
          <div class="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium mr-3 flex-shrink-0 mt-0.5">
            {{ index + 1 }}
          </div>
          <p class="text-gray-700 text-sm leading-relaxed">{{ suggestion }}</p>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons space-y-3">
      <!-- 截图分享按钮 -->
      <van-button 
        type="primary" 
        size="large" 
        block 
        round
        @click="shareResult"
        class="h-14 text-lg font-medium shadow-lg"
      >
        <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
        </svg>
        截图分享
      </van-button>

      <!-- 重新检测按钮 -->
      <van-button 
        type="default" 
        size="large" 
        block 
        round
        @click="handleRestart"
        class="h-12 text-base border-2 border-primary text-primary"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        重新检测
      </van-button>
    </div>

    <!-- 免责声明 -->
    <div class="disclaimer mt-6 p-4 bg-gray-50 rounded-xl">
      <p class="text-xs text-gray-500 leading-relaxed">
        <strong>免责声明：</strong>本分析结果仅供参考，不能替代专业医疗建议。如有健康问题，请咨询专业医生。
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Toast, Dialog } from 'vant'

const props = defineProps({
  result: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['restart'])

// 动画分数状态
const animatedScore = ref(0)

// 计算分数对应的颜色和等级
const scoreColor = computed(() => {
  const score = props.result.score
  if (score >= 90) return '#10B981'  // 绿色 - 优秀
  if (score >= 80) return '#F59E0B'  // 黄色 - 良好
  if (score >= 70) return '#F97316'  // 橙色 - 一般
  return '#EF4444'                   // 红色 - 较差
})

const scoreLevel = computed(() => {
  const score = props.result.score
  if (score >= 90) {
    return {
      text: '优秀',
      description: '您的舌象表现很好，请继续保持健康的生活方式'
    }
  }
  if (score >= 80) {
    return {
      text: '良好',
      description: '整体健康状况不错，注意保持规律作息'
    }
  }
  if (score >= 70) {
    return {
      text: '一般',
      description: '健康状况一般，建议调整生活习惯'
    }
  }
  return {
    text: '需改善',
    description: '建议及时调整生活方式，必要时咨询医生'
  }
})

// 分享结果
const shareResult = async () => {
  try {
    Toast.loading({
      message: '生成分享图片中...',
      duration: 0
    })

    // 创建分享内容
    let shareText = `我的AI舌诊健康分析结果：\n健康评分：${props.result.score}分\n\n舌质分析：\n- 颜色：${props.result.tongueColor}\n- 形态：${props.result.tongueShape}`
    
    shareText += `\n\n舌苔分析：\n- 颜色：${props.result.coatingColor}\n- 厚度：${props.result.coatingThickness}`
    
    if (props.result.coatingMoisture) {
      shareText += `\n- 润燥：${props.result.coatingMoisture}`
    }
    
    if (props.result.constitutionType) {
      shareText += `\n\n体质分析：\n- 体质类型：${props.result.constitutionType}`
    }
    
    if (props.result.pathologyPattern) {
      shareText += `\n- 主要病机：${props.result.pathologyPattern}`
    }
    
    if (props.result.primaryConcerns && props.result.primaryConcerns.length > 0) {
      shareText += `\n\n主要健康隐患：\n${props.result.primaryConcerns.map((concern, index) => `${index + 1}. ${concern}`).join('\n')}`
    }
    
    if (props.result.suggestions && props.result.suggestions.length > 0) {
      shareText += `\n\n健康建议：\n${props.result.suggestions.map((suggestion, index) => `${index + 1}. ${suggestion}`).join('\n')}`
    }

    Toast.clear()

    // 检查是否支持Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI舌诊健康分析结果',
          text: shareText
        })
      } catch (error) {
        // 分享被取消或失败，复制到剪贴板
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareText)
          Toast.success('结果已复制到剪贴板')
        } else {
          Toast.success('分享功能需要在HTTPS环境下使用')
        }
      }
    } else {
      // 不支持分享API，复制到剪贴板
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText)
        Toast.success('结果已复制到剪贴板')
      } else {
        Toast.success('请手动保存分析结果')
      }
    }

  } catch (error) {
    Toast.clear()
    Toast.fail('分享失败，请重试')
    console.error('分享失败:', error)
  }
}

// 重新检测
const handleRestart = () => {
  if (confirm('是否要重新进行舌诊分析？')) {
    emit('restart')
  }
}

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

// 组件挂载时启动分数动画
onMounted(() => {
  // 启动分数动画
  setTimeout(() => {
    animatedScore.value = props.result.score
  }, 500)
})
</script>

<style scoped>
.analysis-result {
  max-width: 400px;
  margin: 0 auto;
  padding: 0 4px;
}

.score-card {
  border: 1px solid rgba(16, 185, 129, 0.1);
  background: linear-gradient(145deg, #ffffff, #f8fafc);
}

.score-circle-container {
  display: flex;
  justify-content: center;
}

.score-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.detail-card {
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.detail-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.suggestions-card {
  border: 1px solid rgba(16, 185, 129, 0.1);
  background: linear-gradient(145deg, #ffffff, #f0fdf4);
}

.action-buttons {
  padding: 0 8px;
}

/* 自定义按钮样式 */
:deep(.van-button--primary) {
  background: linear-gradient(135deg, #10B981, #059669);
  border: none;
  transform: translateY(0);
  transition: all 0.2s ease;
}

:deep(.van-button--primary:active) {
  transform: translateY(1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
}

:deep(.van-button--default) {
  background: white;
  transition: all 0.2s ease;
}

:deep(.van-button--default:active) {
  transform: translateY(1px);
  background: rgba(16, 185, 129, 0.05);
}

/* 圆形进度条自定义样式 */
:deep(.van-circle) {
  transform: rotate(-90deg);
}

:deep(.van-circle__layer) {
  transition: stroke-dasharray 1.5s ease-in-out;
}

/* 建议卡片动画 */
.suggestions-card .space-y-3 > div {
  animation: slideInLeft 0.5s ease-out;
  animation-fill-mode: both;
}

.suggestions-card .space-y-3 > div:nth-child(1) {
  animation-delay: 0.1s;
}

.suggestions-card .space-y-3 > div:nth-child(2) {
  animation-delay: 0.2s;
}

.suggestions-card .space-y-3 > div:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 详情卡片动画 */
.analysis-details .detail-card {
  animation: slideInUp 0.6s ease-out;
  animation-fill-mode: both;
}

.analysis-details .detail-card:nth-child(1) {
  animation-delay: 0.2s;
}

.analysis-details .detail-card:nth-child(2) {
  animation-delay: 0.3s;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 分数卡片动画 */
.score-card {
  animation: zoomIn 0.8s ease-out;
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 免责声明样式 */
.disclaimer {
  border: 1px solid rgba(107, 114, 128, 0.2);
}

/* 响应式调整 */
@media (max-width: 375px) {
  .analysis-result {
    padding: 0 2px;
  }
  
  .action-buttons {
    padding: 0 4px;
  }
  
  .score-card, .suggestions-card {
    padding: 4px;
  }
  
  :deep(.van-circle) {
    width: 100px !important;
    height: 100px !important;
  }
  
  .score-content .text-3xl {
    font-size: 1.5rem;
  }
}

/* 打印样式 */
@media print {
  .action-buttons {
    display: none;
  }
  
  .analysis-result {
    max-width: 100%;
    margin: 0;
    padding: 20px;
  }
}
</style>