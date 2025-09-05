<template>
  <div class="image-preview">
    <!-- 预览卡片 -->
    <div class="preview-card bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
      <div class="p-4 border-b border-gray-100">
        <h2 class="text-lg font-semibold text-gray-800 text-center">图片预览</h2>
        <p class="text-sm text-gray-500 text-center mt-1">请确认图片清晰完整后开始分析</p>
      </div>
      
      <!-- 图片展示区域 -->
      <div class="image-container p-4">
        <div class="relative mx-auto max-w-sm">
          <van-image
            :src="imageUrl"
            fit="cover"
            class="w-full rounded-xl shadow-md"
            style="aspect-ratio: 4/3;"
            :show-loading="true"
            :show-error="true"
            loading-icon="photo"
            error-icon="photo-fail"
          />
          
          <!-- 图片质量检测提示 -->
          <div class="absolute top-2 right-2">
            <div 
              :class="[
                'px-2 py-1 rounded-full text-xs font-medium',
                imageQuality.color
              ]"
            >
              {{ imageQuality.text }}
            </div>
          </div>
        </div>
        
        <!-- 图片信息 -->
        <div class="mt-4 text-center text-sm text-gray-500">
          <p>{{ imageInfo.size }} | {{ imageInfo.dimensions }}</p>
        </div>
      </div>
    </div>

    <!-- 质量检测提示 -->
    <div 
      v-if="!imageQuality.isGood"
      class="quality-alert bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6"
    >
      <div class="flex items-start">
        <svg class="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
        <div>
          <h3 class="text-sm font-medium text-orange-800 mb-1">图片质量提示</h3>
          <p class="text-sm text-orange-700">{{ imageQuality.message }}</p>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons space-y-3">
      <!-- 开始分析按钮 -->
      <van-button 
        type="primary" 
        size="large" 
        block 
        round
        @click="handleConfirm"
        class="h-14 text-lg font-medium shadow-lg"
      >
        <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
        开始AI分析
      </van-button>

      <!-- 重新拍摄按钮 -->
      <van-button 
        type="default" 
        size="large" 
        block 
        round
        @click="handleRetake"
        class="h-12 text-base border-2 border-gray-300 text-gray-600"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        重新拍摄
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  imageUrl: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['confirm', 'retake'])

// 图片信息状态
const imageInfo = ref({
  size: '',
  dimensions: '',
  fileSize: 0
})

// 计算图片质量评估
const imageQuality = computed(() => {
  const { fileSize } = imageInfo.value
  
  if (fileSize < 50 * 1024) { // 小于50KB
    return {
      isGood: false,
      text: '质量较低',
      color: 'bg-red-100 text-red-600',
      message: '图片文件较小，可能影响分析准确性，建议重新拍摄更清晰的图片'
    }
  } else if (fileSize < 200 * 1024) { // 50KB-200KB
    return {
      isGood: true,
      text: '质量良好',
      color: 'bg-yellow-100 text-yellow-600',
      message: '图片质量一般，建议确保光线充足且对焦清晰'
    }
  } else { // 大于200KB
    return {
      isGood: true,
      text: '质量优秀',
      color: 'bg-green-100 text-green-600',
      message: '图片质量很好，可以进行准确分析'
    }
  }
})

// 处理确认分析
const handleConfirm = () => {
  emit('confirm')
}

// 处理重新拍摄
const handleRetake = () => {
  emit('retake')
}

// 分析图片信息
const analyzeImageInfo = () => {
  // 从base64获取文件大小（估算）
  const base64Length = props.imageUrl.length
  const sizeInBytes = Math.round((base64Length * 3) / 4)
  
  // 格式化文件大小
  let sizeText
  if (sizeInBytes < 1024) {
    sizeText = `${sizeInBytes}B`
  } else if (sizeInBytes < 1024 * 1024) {
    sizeText = `${Math.round(sizeInBytes / 1024)}KB`
  } else {
    sizeText = `${(sizeInBytes / (1024 * 1024)).toFixed(1)}MB`
  }
  
  imageInfo.value = {
    size: sizeText,
    dimensions: '自动压缩至800x800以内',
    fileSize: sizeInBytes
  }
}

// 组件挂载时分析图片信息
onMounted(() => {
  analyzeImageInfo()
})
</script>

<style scoped>
.image-preview {
  max-width: 400px;
  margin: 0 auto;
  padding: 0 4px;
}

.preview-card {
  border: 1px solid rgba(16, 185, 129, 0.1);
}

.image-container {
  background: linear-gradient(145deg, #f8fafc, #e2e8f0);
}

.quality-alert {
  animation: slideInUp 0.3s ease-out;
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
  background: rgba(107, 114, 128, 0.05);
}

/* 图片加载动画 */
:deep(.van-image) {
  transition: all 0.3s ease;
}

:deep(.van-image:hover) {
  transform: scale(1.02);
}

/* 动画效果 */
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

/* 响应式调整 */
@media (max-width: 375px) {
  .image-preview {
    padding: 0 2px;
  }
  
  .action-buttons {
    padding: 0 4px;
  }
}
</style>