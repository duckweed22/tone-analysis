<template>
  <div class="loading-animation">
    <!-- 主要加载区域 -->
    <div class="loading-card bg-white rounded-2xl shadow-sm p-8 text-center">
      <!-- 动画图标 -->
      <div class="loading-icon-container mb-6">
        <div class="relative inline-flex items-center justify-center">
          <!-- 外圈旋转动画 -->
          <div class="absolute w-20 h-20 border-4 border-primary/20 rounded-full animate-spin">
            <div class="absolute top-0 left-0 w-4 h-4 bg-primary rounded-full transform -translate-x-2 -translate-y-2"></div>
          </div>
          
          <!-- 内圈脉冲动画 -->
          <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
            <svg class="w-8 h-8 text-primary animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
        </div>
      </div>
      
      <!-- 加载标题 -->
      <h2 class="text-xl font-semibold text-gray-800 mb-3">AI正在分析中</h2>
      
      <!-- 动态提示文字 -->
      <p class="text-gray-600 mb-6 transition-all duration-500">
        {{ currentTip }}
      </p>
      
      <!-- 进度条 -->
      <div class="progress-container mb-6">
        <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-300 ease-out"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <p class="text-sm text-gray-500 mt-2">{{ progress }}% 已完成</p>
      </div>
      
      <!-- 分析步骤指示器 -->
      <div class="analysis-steps">
        <div class="flex justify-center space-x-4 mb-4">
          <div 
            v-for="(step, index) in analysisSteps" 
            :key="index"
            :class="[
              'flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all duration-300',
              currentStep >= index ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
            ]"
          >
            <span v-if="currentStep > index">✓</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
        </div>
        
        <div class="text-sm text-gray-500">
          <p>{{ analysisSteps[currentStep] || '分析完成' }}</p>
        </div>
      </div>
    </div>
    
    <!-- 底部提示 -->
    <div class="bottom-tip text-center mt-6">
      <p class="text-sm text-gray-400">
        首次分析需要较长时间，请耐心等待...
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 分析步骤
const analysisSteps = [
  '图像预处理',
  '特征提取',
  'AI模型分析',
  '结果生成'
]

// 提示文字列表
const tips = [
  '正在识别舌头区域...',
  '分析舌质颜色和形态...',
  '检测舌苔厚度和颜色...',
  '综合健康评估中...',
  '生成个性化建议...'
]

// 响应式状态
const currentStep = ref(0)
const progress = ref(0)
const currentTip = ref(tips[0])

// 定时器引用
let progressTimer = null
let stepTimer = null
let tipTimer = null

// 模拟分析进度
const simulateProgress = () => {
  const totalTime = 4000 // 总时间4秒
  const interval = 50 // 更新间隔50ms
  const increment = 100 / (totalTime / interval)
  
  progressTimer = setInterval(() => {
    if (progress.value < 100) {
      progress.value = Math.min(100, progress.value + increment)
    } else {
      clearInterval(progressTimer)
    }
  }, interval)
}

// 模拟分析步骤
const simulateSteps = () => {
  stepTimer = setInterval(() => {
    if (currentStep.value < analysisSteps.length) {
      currentStep.value++
    } else {
      clearInterval(stepTimer)
    }
  }, 1000) // 每1秒切换一个步骤
}

// 循环切换提示文字
const rotateTips = () => {
  let tipIndex = 0
  tipTimer = setInterval(() => {
    tipIndex = (tipIndex + 1) % tips.length
    currentTip.value = tips[tipIndex]
  }, 1200) // 每1.2秒切换提示
}

// 组件挂载时启动动画
onMounted(() => {
  simulateProgress()
  simulateSteps()
  rotateTips()
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (progressTimer) clearInterval(progressTimer)
  if (stepTimer) clearInterval(stepTimer)
  if (tipTimer) clearInterval(tipTimer)
})
</script>

<style scoped>
.loading-animation {
  max-width: 400px;
  margin: 0 auto;
  padding: 0 4px;
}

.loading-card {
  border: 1px solid rgba(16, 185, 129, 0.1);
}

.loading-icon-container {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 自定义动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translateY(0);
  }
  40%, 43% {
    transform: translateY(-8px);
  }
  70% {
    transform: translateY(-4px);
  }
  90% {
    transform: translateY(-2px);
  }
}

.animate-spin {
  animation: spin 2s linear infinite;
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}

.animate-bounce {
  animation: bounce 1.5s ease-in-out infinite;
}

/* 进度条渐变动画 */
.progress-container .bg-gradient-to-r {
  background-image: linear-gradient(
    90deg, 
    #10B981, 
    #34D399, 
    #10B981
  );
  background-size: 200% 100%;
  animation: gradient-shift 2s ease-in-out infinite;
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 0%;
  }
  100% {
    background-position: 0% 0%;
  }
}

/* 步骤指示器动画 */
.analysis-steps .bg-primary {
  animation: step-highlight 0.5s ease-out;
}

@keyframes step-highlight {
  0% {
    transform: scale(0.8);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 底部提示闪烁效果 */
.bottom-tip {
  animation: fade-in-out 3s ease-in-out infinite;
}

@keyframes fade-in-out {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* 响应式调整 */
@media (max-width: 375px) {
  .loading-animation {
    padding: 0 2px;
  }
  
  .loading-card {
    padding: 6px 4px;
  }
  
  .loading-icon-container {
    height: 100px;
  }
}
</style>