<template>
    <div class="detailed-report" v-if="reportData">
      <!-- 报告头部 -->
      <div class="report-header">
        <div class="header-content">
          <h1 class="report-title">健康分析报告</h1>
          <div class="report-meta">
            <span class="report-time">{{ formatDate(reportData.analysisTime) }}</span>
            <span class="report-id">报告编号: {{ sessionId.slice(-8) }}</span>
          </div>
        </div>
        
        <!-- 综合评分 -->
        <div class="overall-score">
          <div class="score-circle">
            <van-circle
              v-model:current-rate="animatedScore"
              :rate="reportData.finalScore || reportData.score"
              :speed="50"
              :stroke-width="6"
              :size="100"
              layer-color="#f0f0f0"
              :color="getScoreColor(reportData.finalScore || reportData.score)"
            >
              <div class="score-content">
                <div class="score-number">{{ Math.round(animatedScore) }}</div>
                <div class="score-text">分</div>
              </div>
            </van-circle>
          </div>
          <div class="score-description">
            <h3 :style="{ color: getScoreColor(reportData.finalScore || reportData.score) }">
              {{ getScoreLevel(reportData.finalScore || reportData.score) }}
            </h3>
            <p class="score-summary">{{ reportData.summary || '基于舌诊分析的健康评估' }}</p>
          </div>
        </div>
      </div>
  
      <!-- 报告内容 -->
      <div class="report-content">
        <!-- 舌诊发现 -->
        <div class="report-section">
          <h2 class="section-title">
            <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            舌诊发现
          </h2>
          
          <div class="findings-grid">
            <div class="finding-item">
              <div class="finding-label">舌质颜色</div>
              <div class="finding-value">{{ getTongueAnalysis().tongueColor }}</div>
              <div class="finding-desc">{{ getTongueColorDescription(getTongueAnalysis().tongueColor) }}</div>
            </div>
            
            <div class="finding-item">
              <div class="finding-label">舌质形态</div>
              <div class="finding-value">{{ getTongueAnalysis().tongueShape }}</div>
              <div class="finding-desc">{{ getTongueShapeDescription(getTongueAnalysis().tongueShape) }}</div>
            </div>
            
            <div class="finding-item">
              <div class="finding-label">舌苔颜色</div>
              <div class="finding-value">{{ getTongueAnalysis().coatingColor }}</div>
              <div class="finding-desc">{{ getCoatingColorDescription(getTongueAnalysis().coatingColor) }}</div>
            </div>
            
            <div class="finding-item">
              <div class="finding-label">舌苔厚度</div>
              <div class="finding-value">{{ getTongueAnalysis().coatingThickness }}</div>
              <div class="finding-desc">{{ getCoatingThicknessDescription(getTongueAnalysis().coatingThickness) }}</div>
            </div>
          </div>
  
          <!-- 详细分析 -->
          <div v-if="reportData.detailedAnalysis" class="detailed-analysis">
            <h3 class="subsection-title">详细分析</h3>
            <div class="analysis-content">
              <div class="analysis-item">
                <h4>舌诊意义</h4>
                <p>{{ reportData.detailedAnalysis.tongueFindings?.significance || '基于传统中医理论的舌诊分析' }}</p>
              </div>
              
              <div v-if="reportData.detailedAnalysis.questionnaireInsights" class="analysis-item">
                <h4>问诊关联</h4>
                <p>{{ reportData.detailedAnalysis.questionnaireInsights.correlations }}</p>
                <ul v-if="reportData.detailedAnalysis.questionnaireInsights.keyFindings" class="key-findings">
                  <li v-for="finding in reportData.detailedAnalysis.questionnaireInsights.keyFindings" :key="finding">
                    {{ finding }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
  
        <!-- 系统评估 -->
        <div v-if="reportData.detailedAnalysis?.systemAssessment" class="report-section">
          <h2 class="section-title">
            <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            系统评估
          </h2>
          
          <div class="system-assessment">
            <div 
              v-for="(system, key) in reportData.detailedAnalysis.systemAssessment" 
              :key="key"
              class="system-item"
            >
              <div class="system-header">
                <h3>{{ getSystemName(key) }}</h3>
                <span :class="['system-status', getStatusClass(system.status)]">
                  {{ system.status }}
                </span>
              </div>
              <div class="system-score">
                <div class="score-bar">
                  <div 
                    class="score-fill"
                    :style="{ 
                      width: `${system.score}%`,
                      backgroundColor: getScoreColor(system.score)
                    }"
                  ></div>
                </div>
                <span class="score-value">{{ system.score }}分</span>
              </div>
              <p class="system-notes">{{ system.notes }}</p>
            </div>
          </div>
        </div>
  
        <!-- 健康建议 -->
        <div v-if="reportData.recommendations || getTongueAnalysis().suggestions" class="report-section">
          <h2 class="section-title">
            <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
            健康建议
          </h2>
          
          <div class="recommendations">
            <!-- 生活方式建议 -->
            <div v-if="reportData.recommendations?.lifestyle" class="recommendation-category">
              <h3>生活方式</h3>
              <ul class="recommendation-list">
                <li v-for="item in reportData.recommendations.lifestyle" :key="item">
                  <svg class="list-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  {{ item }}
                </li>
              </ul>
            </div>
  
            <!-- 饮食建议 -->
            <div v-if="reportData.recommendations?.dietary" class="recommendation-category">
              <h3>饮食调理</h3>
              <ul class="recommendation-list">
                <li v-for="item in reportData.recommendations.dietary" :key="item">
                  <svg class="list-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  {{ item }}
                </li>
              </ul>
            </div>
  
            <!-- 运动建议 -->
            <div v-if="reportData.recommendations?.exercise" class="recommendation-category">
              <h3>运动锻炼</h3>
              <ul class="recommendation-list">
                <li v-for="item in reportData.recommendations.exercise" :key="item">
                  <svg class="list-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  {{ item }}
                </li>
              </ul>
            </div>
  
            <!-- 基础建议（如果没有详细分类） -->
            <div v-if="!reportData.recommendations && getTongueAnalysis().suggestions" class="recommendation-category">
              <h3>健康建议</h3>
              <ul class="recommendation-list">
                <li v-for="item in getTongueAnalysis().suggestions" :key="item">
                  <svg class="list-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  {{ item }}
                </li>
              </ul>
            </div>
  
            <!-- 后续关注 -->
            <div v-if="reportData.recommendations?.followUp" class="follow-up">
              <h3>后续关注</h3>
              <p class="follow-up-text">{{ reportData.recommendations.followUp }}</p>
            </div>
          </div>
        </div>
  
        <!-- 产品推荐 -->
        <div v-if="recommendedProducts.length > 0" class="report-section">
          <h2 class="section-title">
            <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            推荐产品
          </h2>
          
          <div class="products-grid">
            <div 
              v-for="product in recommendedProducts" 
              :key="product.id"
              class="product-card"
            >
              <div class="product-image">
                <div class="placeholder-image">
                  <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                </div>
              </div>
              <div class="product-info">
                <h3 class="product-name">{{ product.name }}</h3>
                <p class="product-category">{{ product.category }}</p>
                <div class="product-price">
                  <span class="current-price">¥{{ product.price }}</span>
                  <span v-if="product.originalPrice && product.originalPrice > product.price" class="original-price">
                    ¥{{ product.originalPrice }}
                  </span>
                </div>
                <p v-if="product.recommendationReason" class="recommendation-reason">
                  {{ product.recommendationReason }}
                </p>
              </div>
            </div>
          </div>
        </div>
  
        <!-- 风险提示 -->
        <div v-if="reportData.riskLevel || reportData.medicalAdvice" class="report-section risk-section">
          <h2 class="section-title">
            <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            重要提示
          </h2>
          
          <div :class="['risk-content', getRiskClass(reportData.riskLevel)]">
            <div v-if="reportData.riskLevel" class="risk-level">
              <span>风险等级：{{ getRiskLevelText(reportData.riskLevel) }}</span>
            </div>
            
            <div v-if="reportData.medicalAdvice" class="medical-advice">
              <p>{{ reportData.medicalAdvice }}</p>
            </div>
            
            <div class="disclaimer">
              <p><strong>免责声明：</strong>本分析结果仅供参考，不能替代专业医疗建议。如有健康问题，请咨询专业医生。</p>
            </div>
          </div>
        </div>
      </div>
  
      <!-- 底部操作 -->
      <div class="report-actions">
        <button @click="$emit('back')" class="action-btn secondary">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          返回对话
        </button>
        
        <button @click="$emit('share')" class="action-btn primary">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
          </svg>
          分享报告
        </button>
        
        <button @click="$emit('restart')" class="action-btn tertiary">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          重新检测
        </button>
      </div>
    </div>
  
    <!-- 加载状态 -->
    <div v-else class="loading-state">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>正在加载报告...</p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { analysisAPI, productAPI } from '../utils/apiService.js'
  
  const props = defineProps({
    sessionId: {
      type: String,
      required: true
    }
  })
  
  const emit = defineEmits(['back', 'share', 'restart'])
  
  // 响应式数据
  const reportData = ref(null)
  const recommendedProducts = ref([])
  const animatedScore = ref(0)
  
  // 计算属性
  const getTongueAnalysis = () => {
    if (reportData.value?.detailedAnalysis?.tongueFindings) {
      return reportData.value.detailedAnalysis.tongueFindings
    }
    // 如果没有详细分析，使用基础舌诊数据
    return reportData.value || {}
  }
  
  // 方法
  const getScoreColor = (score) => {
    if (score >= 90) return '#10B981'  // 绿色 - 优秀
    if (score >= 80) return '#F59E0B'  // 黄色 - 良好
    if (score >= 70) return '#F97316'  // 橙色 - 一般
    return '#EF4444'                   // 红色 - 较差
  }
  
  const getScoreLevel = (score) => {
    if (score >= 90) return '优秀'
    if (score >= 80) return '良好'
    if (score >= 70) return '一般'
    return '需改善'
  }
  
  const getSystemName = (key) => {
    const nameMap = {
      digestive: '消化系统',
      sleep: '睡眠质量',
      emotional: '情绪状态',
      energy: '精力状态'
    }
    return nameMap[key] || key
  }

  const formatDate = (dateString) => {
    if (!dateString) return '未知时间'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return '未知时间'
    }
  }
  
  const getStatusClass = (status) => {
    const classMap = {
      '优秀': 'status-excellent',
      '良好': 'status-good',
      '一般': 'status-fair',
      '需关注': 'status-attention',
      '较差': 'status-poor'
    }
    return classMap[status] || 'status-default'
  }
  
  const getRiskClass = (riskLevel) => {
    const classMap = {
      low: 'risk-low',
      medium: 'risk-medium',
      high: 'risk-high'
    }
    return classMap[riskLevel] || 'risk-default'
  }
  
  const getRiskLevelText = (riskLevel) => {
    const textMap = {
      low: '低风险',
      medium: '中等风险',
      high: '高风险'
    }
    return textMap[riskLevel] || '未评估'
  }
  
  // 舌诊特征描述
  const getTongueColorDescription = (color) => {
    const descriptions = {
      '淡白': '可能提示气血不足',
      '淡红': '正常健康状态',
      '红': '可能有热象',
      '深红': '热象较重',
      '紫暗': '可能存在血瘀'
    }
    return descriptions[color] || ''
  }
  
  const getTongueShapeDescription = (shape) => {
    const descriptions = {
      '瘦小': '可能提示营养不良',
      '正常': '形态正常',
      '胖大': '可能提示脾虚',
      '齿痕': '提示脾气虚弱'
    }
    return descriptions[shape] || ''
  }
  
  const getCoatingColorDescription = (color) => {
    const descriptions = {
      '白': '正常或寒象',
      '黄': '可能有热象',
      '灰黑': '热象较重或病情较重'
    }
    return descriptions[color] || ''
  }
  
  const getCoatingThicknessDescription = (thickness) => {
    const descriptions = {
      '无苔': '可能阴虚或胃气不足',
      '薄苔': '正常状态',
      '厚苔': '可能有湿浊或食积'
    }
    return descriptions[thickness] || ''
  }
  
  // 加载报告数据
  const loadReportData = async () => {
    try {
      // 获取分析记录
      const response = await analysisAPI.getRecord(props.sessionId)
      
      if (response.success) {
        const record = response.data
        
        // 设置报告数据
        if (record.final_report) {
          reportData.value = record.final_report
          reportData.value.analysisTime = record.created_at
        } else {
          // 如果没有最终报告，使用舌诊分析数据
          reportData.value = {
            ...record.tongue_analysis,
            analysisTime: record.created_at
          }
        }
        
        // 启动分数动画
        setTimeout(() => {
          animatedScore.value = reportData.value.finalScore || reportData.value.score || 0
        }, 500)
        
        // 加载推荐产品
        if (record.recommended_products && record.recommended_products.length > 0) {
          await loadRecommendedProducts()
        }
      } else {
        throw new Error('获取报告数据失败')
      }
    } catch (error) {
      console.error('加载报告失败:', error)
      // 可以显示错误提示
    }
  }
  
  // 加载推荐产品
  const loadRecommendedProducts = async () => {
    try {
      const response = await productAPI.getRecommendations(props.sessionId, 6)
      
      if (response.success) {
        recommendedProducts.value = response.data.products
      }
    } catch (error) {
      console.error('加载推荐产品失败:', error)
    }
  }
  
  // 组件挂载时加载数据
  onMounted(() => {
    loadReportData()
  })
  </script>
  
  <style scoped>
  .detailed-report {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background: white;
    min-height: 100vh;
  }
  
  /* 报告头部 */
  .report-header {
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 2px solid #e5e7eb;
  }
  
  .header-content {
    margin-bottom: 24px;
  }
  
  .report-title {
    font-size: 28px;
    font-weight: bold;
    color: #111827;
    margin-bottom: 8px;
  }
  
  .report-meta {
    display: flex;
    gap: 16px;
    font-size: 14px;
    color: #6b7280;
  }
  
  .overall-score {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 24px;
    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
    border-radius: 12px;
  }
  
  .score-circle {
    flex-shrink: 0;
  }
  
  .score-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .score-number {
    font-size: 24px;
    font-weight: bold;
  }
  
  .score-text {
    font-size: 12px;
    color: #6b7280;
  }
  
  .score-description {
    flex: 1;
  }
  
  .score-description h3 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .score-summary {
    color: #6b7280;
    line-height: 1.6;
  }
  
  /* 报告内容 */
  .report-content {
    space-y: 32px;
  }
  
  .report-section {
    margin-bottom: 32px;
    padding: 24px;
    background: #fafafa;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
  }
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 20px;
  }
  
  .section-icon {
    width: 24px;
    height: 24px;
    color: #10B981;
  }
  
  /* 舌诊发现 */
  .findings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .finding-item {
    padding: 16px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
  
  .finding-label {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 4px;
  }
  
  .finding-value {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 4px;
  }
  
  .finding-desc {
    font-size: 12px;
    color: #9ca3af;
  }
  
  /* 详细分析 */
  .detailed-analysis {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #e5e7eb;
  }
  
  .subsection-title {
    font-size: 16px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 16px;
  }
  
  .analysis-content {
    space-y: 16px;
  }
  
  .analysis-item {
    padding: 16px;
    background: white;
    border-radius: 8px;
    border-left: 3px solid #10B981;
  }
  
  .analysis-item h4 {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }
  
  .analysis-item p {
    color: #6b7280;
    line-height: 1.6;
  }
  
  .key-findings {
    margin-top: 8px;
    padding-left: 16px;
  }
  
  .key-findings li {
    color: #6b7280;
    font-size: 14px;
    margin-bottom: 4px;
  }
  
  /* 系统评估 */
  .system-assessment {
    space-y: 16px;
  }
  
  .system-item {
    padding: 16px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
  
  .system-header {
    display: flex;
    justify-content: between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .system-header h3 {
    font-size: 16px;
    font-weight: 600;
    color: #374151;
  }
  
  .system-status {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }
  
  .status-excellent { background: #d1fae5; color: #065f46; }
  .status-good { background: #fef3c7; color: #92400e; }
  .status-fair { background: #fed7aa; color: #9a3412; }
  .status-attention { background: #fecaca; color: #991b1b; }
  .status-poor { background: #fecaca; color: #991b1b; }
  
  .system-score {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }
  
  .score-bar {
    flex: 1;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .score-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 1s ease-in-out;
  }
  
  .score-value {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    min-width: 40px;
  }
  
  .system-notes {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.5;
  }
  
  /* 健康建议 */
  .recommendations {
    space-y: 20px;
  }
  
  .recommendation-category {
    padding: 16px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
  
  .recommendation-category h3 {
    font-size: 16px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 12px;
  }
  
  .recommendation-list {
    space-y: 8px;
  }
  
  .recommendation-list li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 14px;
    color: #374151;
    line-height: 1.5;
  }
  
  .list-icon {
    width: 16px;
    height: 16px;
    color: #10B981;
    margin-top: 2px;
    flex-shrink: 0;
  }
  
  .follow-up {
    padding: 16px;
    background: #fffbeb;
    border: 1px solid #fbbf24;
    border-radius: 8px;
  }
  
  .follow-up h3 {
    font-size: 16px;
    font-weight: 600;
    color: #92400e;
    margin-bottom: 8px;
  }
  
  .follow-up-text {
    font-size: 14px;
    color: #92400e;
    line-height: 1.6;
  }
  
  /* 产品推荐 */
  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  
  .product-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.2s ease;
  }
  
  .product-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  .product-image {
    height: 120px;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .placeholder-image {
    width: 48px;
    height: 48px;
    background: #e5e7eb;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .product-info {
    padding: 16px;
  }
  
  .product-name {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 4px;
  }
  
  .product-category {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 8px;
  }
  
  .product-price {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  
  .current-price {
    font-size: 18px;
    font-weight: 600;
    color: #dc2626;
  }
  
  .original-price {
    font-size: 14px;
    color: #9ca3af;
    text-decoration: line-through;
  }
  
  .recommendation-reason {
    font-size: 12px;
    color: #10B981;
    background: #f0fdf4;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid #bbf7d0;
  }
  
  /* 风险提示 */
  .risk-section {
    border-left: 4px solid #f59e0b;
  }
  
  .risk-content {
    padding: 16px;
    border-radius: 8px;
  }
  
  .risk-low {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
  }
  
  .risk-medium {
    background: #fffbeb;
    border: 1px solid #fed7aa;
  }
  
  .risk-high {
    background: #fef2f2;
    border: 1px solid #fecaca;
  }
  
  .risk-level {
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .medical-advice {
    margin-bottom: 12px;
    font-size: 14px;
    line-height: 1.6;
  }
  
  .disclaimer {
    padding-top: 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    font-size: 12px;
    color: #6b7280;
  }
  
  /* 底部操作 */
  .report-actions {
    position: sticky;
    bottom: 0;
    background: white;
    padding: 16px 0;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 12px;
    margin-top: 32px;
  }
  
  .action-btn {
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
  
  .action-btn.primary {
    background: linear-gradient(135deg, #10B981, #059669);
    color: white;
  }
  
  .action-btn.secondary {
    background: white;
    color: #374151;
    border: 2px solid #e5e7eb;
  }
  
  .action-btn.tertiary {
    background: #f3f4f6;
    color: #6b7280;
  }
  
  .action-btn:hover {
    transform: translateY(-1px);
  }
  
  .action-btn.primary:hover {
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  
  /* 加载状态 */
  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }
  
  .loading-content {
    text-align: center;
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
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  /* 响应式设计 */
  @media (max-width: 768px) {
    .detailed-report {
      padding: 16px;
    }
    
    .overall-score {
      flex-direction: column;
      text-align: center;
      gap: 16px;
    }
    
    .findings-grid {
      grid-template-columns: 1fr;
    }
    
    .products-grid {
      grid-template-columns: 1fr;
    }
    
    .report-actions {
      flex-direction: column;
    }
    
    .system-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }
  
  @media (max-width: 480px) {
    .report-title {
      font-size: 24px;
    }
    
    .report-meta {
      flex-direction: column;
      gap: 4px;
    }
    
    .section-title {
      font-size: 18px;
    }
  }
  </style>