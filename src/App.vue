// 页面加载时的初始化
onMounted(() => {
  // 设置页面标题
  document.title = 'AI舌诊健康分析'
  
  // 注意：在artifacts环境中localStorage不可用，这里只是示例代码
  // 在实际部署环境中可以使用localStorage
  console.log('应用已初始化')
})<template>
  <div class="app min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
    <!-- 头部 -->
    <div class="header bg-white shadow-sm px-4 py-3 flex items-center justify-center">
      <h1 class="text-xl font-bold text-gray-800">AI舌诊健康分析</h1>
    </div>

    <!-- 主要内容区域 -->
    <div class="main flex-1 px-4 py-6">
      <!-- 初始状态：上传界面 -->
      <CameraUpload 
        v-if="currentState === 'upload'"
        @image-selected="handleImageSelected"
      />

      <!-- 预览状态 -->
      <ImagePreview 
        v-else-if="currentState === 'preview'"
        :image-url="selectedImage"
        @confirm="startAnalysis"
        @retake="resetToUpload"
      />

      <!-- 分析中状态 -->
      <LoadingAnimation 
        v-else-if="currentState === 'analyzing'"
      />

      <!-- 结果展示状态 -->
      <AnalysisResult 
        v-else-if="currentState === 'result'"
        :result="analysisResult"
        @restart="resetToUpload"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Toast } from 'vant'
import CameraUpload from './components/CameraUpload.vue'
import ImagePreview from './components/ImagePreview.vue'
import LoadingAnimation from './components/LoadingAnimation.vue'
import AnalysisResult from './components/AnalysisResult.vue'
import { analyzeImage } from './utils/aiAnalysis.js'

// 应用状态管理
const currentState = ref('upload') // upload | preview | analyzing | result
const selectedImage = ref('')
const analysisResult = ref(null)

// 处理图片选择
const handleImageSelected = (imageData) => {
  console.log('收到图片数据，长度:', imageData.length)
  selectedImage.value = imageData
  currentState.value = 'preview'
}

// 开始分析
const startAnalysis = async () => {
  console.log('开始AI分析流程')
  currentState.value = 'analyzing'
  
  try {
    // 调用豆包AI分析
    console.log('调用AI分析接口...')
    const result = await analyzeImage(selectedImage.value)
    console.log('AI分析完成:', result)
    
    analysisResult.value = result
    
    // 分析完成后跳转到结果页面
    setTimeout(() => {
      currentState.value = 'result'
    }, 500)
    
  } catch (error) {
    console.error('分析失败:', error)
    showMessage(`分析失败: ${error.message || '请重试'}`)
    currentState.value = 'preview'
  }
}

// 重置到上传界面
const resetToUpload = () => {
  currentState.value = 'upload'
  selectedImage.value = ''
  analysisResult.value = null
}

// 页面加载时的初始化
onMounted(() => {
  // 设置页面标题
  document.title = 'AI舌诊健康分析'
  
  // 检查是否有之前保存的结果
  try {
    const savedResult = JSON.parse(localStorage.getItem('lastAnalysisResult') || '{}')
    const savedImage = localStorage.getItem('lastAnalysisImage')
    
    if (savedResult.score && savedImage) {
      // 可以选择是否自动恢复上次的结果
      console.log('发现上次的分析结果')
    }
  } catch (error) {
    console.log('没有之前的分析记录')
  }
})
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* iOS安全区域适配 */
@supports (padding-top: env(safe-area-inset-top)) {
  .header {
    padding-top: calc(env(safe-area-inset-top) + 12px);
  }
}

@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .main {
    padding-bottom: calc(env(safe-area-inset-bottom) + 24px);
  }
}
</style>