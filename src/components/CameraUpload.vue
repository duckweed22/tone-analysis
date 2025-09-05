<template>
  <div class="camera-upload">
    <!-- 使用说明 -->
    <div class="instruction-card bg-white rounded-2xl shadow-sm mb-6 p-6">
      <div class="text-center mb-4">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-3">
          <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2 class="text-lg font-semibold text-gray-800 mb-2">拍摄指引</h2>
      </div>
      
      <div class="space-y-3 text-sm text-gray-600">
        <div class="flex items-center">
          <div class="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></div>
          <span>请在光线充足的环境下拍摄</span>
        </div>
        <div class="flex items-center">
          <div class="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></div>
          <span>尽量张开嘴巴，完整露出舌头</span>
        </div>
        <div class="flex items-center">
          <div class="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></div>
          <span>保持手机稳定，避免模糊</span>
        </div>
        <div class="flex items-center">
          <div class="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></div>
          <span>建议距离20-30厘米拍摄</span>
        </div>
      </div>
    </div>

    <!-- 拍照按钮区域 -->
    <div class="upload-actions space-y-4">
      <!-- 拍照按钮 -->
      <van-button 
        type="primary" 
        size="large" 
        block 
        round
        @click="openCamera"
        :loading="isProcessing"
        class="h-14 text-lg font-medium shadow-lg"
      >
        <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        拍照检测
      </van-button>

      <!-- 上传按钮 -->
      <van-button 
        type="default" 
        size="large" 
        block 
        round
        @click="openGallery"
        :loading="isProcessing"
        class="h-14 text-lg font-medium border-2 border-primary text-primary"
      >
        <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        相册选择
      </van-button>
    </div>

    <!-- 隐藏的文件输入框 -->
    <input 
      ref="fileInput" 
      type="file" 
      accept="image/*" 
      capture="environment"
      @change="handleFileSelect" 
      class="hidden"
    >
    
    <input 
      ref="galleryInput" 
      type="file" 
      accept="image/*" 
      @change="handleFileSelect" 
      class="hidden"
    >

    <!-- 示例图片区域 -->
    <div class="example-section mt-8">
      <h3 class="text-center text-gray-500 text-sm mb-4">拍摄示例</h3>
      <div class="flex justify-center">
        <div class="w-32 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- 加载状态显示 -->
    <div v-if="loadingMessage" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">⏳</div>
        <div class="loading-text">{{ loadingMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { compressImage } from '../utils/imageCompress.js'

const emit = defineEmits(['image-selected'])

// 状态管理
const isProcessing = ref(false)
const fileInput = ref(null)
const galleryInput = ref(null)
const loadingMessage = ref('')

// 显示消息
const showMessage = (message, type = 'info') => {
  // 创建消息元素
  const messageEl = document.createElement('div')
  messageEl.textContent = message
  messageEl.className = `message-toast ${type}`
  messageEl.style.cssText = `
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
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `
  
  document.body.appendChild(messageEl)
  
  // 3秒后移除
  setTimeout(() => {
    if (document.body.contains(messageEl)) {
      document.body.removeChild(messageEl)
    }
  }, 3000)
}

// 显示加载状态
const showLoading = (message) => {
  loadingMessage.value = message
}

// 隐藏加载状态
const hideLoading = () => {
  loadingMessage.value = ''
}

// 打开相机拍照
const openCamera = () => {
  if (isProcessing.value) return
  
  // 检查是否支持相机
  if (!navigator.mediaDevices && !navigator.getUserMedia) {
    showMessage('您的设备不支持相机功能', 'error')
    return
  }
  
  fileInput.value.click()
}

// 打开相册
const openGallery = () => {
  if (isProcessing.value) return
  galleryInput.value.click()
}

// 处理文件选择
const handleFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // 重置输入框值，确保可以重复选择同一文件
  event.target.value = ''
  
  try {
    isProcessing.value = true
    
    console.log('开始处理文件:', file.name, file.size, file.type)
    
    // 文件类型检查
    if (!file.type.startsWith('image/')) {
      showMessage('请选择图片文件', 'error')
      return
    }
    
    // 文件大小检查（10MB限制）
    if (file.size > 10 * 1024 * 1024) {
      showMessage('图片文件过大，请选择小于10MB的图片', 'error')
      return
    }
    
    showLoading('处理图片中...')
    
    // 压缩图片
    console.log('开始压缩图片...')
    const compressedImage = await compressImage(file, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.8
    })
    
    console.log('压缩完成，开始转换为base64...')
    
    // 将压缩后的图片转换为base64
    const reader = new FileReader()
    
    reader.onload = (e) => {
      hideLoading()
      const base64Data = e.target.result
      console.log('图片处理完成，base64长度:', base64Data.length)
      showMessage('图片处理成功', 'success')
      emit('image-selected', base64Data)
    }
    
    reader.onerror = (e) => {
      hideLoading()
      console.error('FileReader错误:', e)
      showMessage('图片读取失败，请重试', 'error')
    }
    
    reader.readAsDataURL(compressedImage)
    
  } catch (error) {
    console.error('图片处理失败:', error)
    hideLoading()
    showMessage(`图片处理失败: ${error.message}`, 'error')
  } finally {
    isProcessing.value = false
  }
}
</script>

<style scoped>
.camera-upload {
  max-width: 400px;
  margin: 0 auto;
  padding: 0 4px;
}

.instruction-card {
  border: 1px solid rgba(16, 185, 129, 0.1);
}

.upload-actions {
  padding: 0 8px;
}

/* 加载状态覆盖层 */
.loading-overlay {
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
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.loading-spinner {
  font-size: 24px;
  margin-bottom: 10px;
  animation: pulse 1.5s ease-in-out infinite;
}

.loading-text {
  font-size: 14px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
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
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

:deep(.van-button--default) {
  background: white;
  transition: all 0.2s ease;
}

:deep(.van-button--default:active) {
  transform: translateY(1px);
  background: rgba(16, 185, 129, 0.05);
}

.example-section {
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.example-section:hover {
  opacity: 1;
}

/* 响应式调整 */
@media (max-width: 375px) {
  .camera-upload {
    padding: 0 2px;
  }
  
  .upload-actions {
    padding: 0 4px;
  }
}
</style>