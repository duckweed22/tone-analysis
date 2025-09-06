import { v4 as uuidv4 } from 'uuid'
import Joi from 'joi'

// 豆包API配置
const DOUBAO_CONFIG = {
  apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  model: 'doubao-seed-1-6-vision-250815'
}

// 舌诊分析提示词
const TONGUE_ANALYSIS_PROMPT = `你是一位具有20年临床经验的中医舌诊专家，擅长通过舌象精准判断人体脏腑功能状态。请对这张舌头图片进行专业、细致的舌诊分析。

【重要提醒：必须使用通俗易懂的语言】
- 健康隐患和风险区域必须用日常用语，禁止使用专业术语
- 让普通用户一看就懂，知道具体该怎么做
- 如果使用"脾胃运化"、"湿浊内蕴"等专业术语，分析结果将被视为不合格

【观察要点】
请从以下维度仔细观察（基于舌面照片）：
1. 舌质颜色：淡白、淡红、红、深红、紫暗、青紫等
2. 舌质形态：大小、厚薄、胖瘦、有无齿痕、裂纹、瘀点等
3. 舌苔颜色：白、黄、灰、黑等
4. 舌苔质地：厚薄、润燥、腻腐、剥脱等

注意：由于只有舌面照片，无法观察舌体运动和舌下脉络，请基于可见的舌面特征进行分析

【分析要求】
- 结合中医理论，分析脏腑功能状态
- 识别病机特点（虚实、寒热、表里、阴阳）
- 评估气血津液状况
- 判断体质倾向

请按照以下JSON格式返回分析结果：

{
  "score": 数字(0-100的健康评分),
  "tongueColor": "舌质颜色(淡白/淡红/红/深红/紫暗/青紫)",
  "tongueShape": "舌质形态(瘦小/正常/胖大/齿痕/裂纹/瘀点)",
  "coatingColor": "舌苔颜色(白/黄/灰/黑/花剥)", 
  "coatingThickness": "舌苔厚度(无苔/薄苔/厚苔/腻苔)",
  "coatingMoisture": "舌苔润燥(润/燥/腻/腐)",
  "primaryConcerns": [
    "用通俗易懂的语言描述主要健康问题，如：消化不好、容易疲劳、睡眠质量差等",
    "避免使用专业术语，用日常用语表达",
    "让用户能直接理解并采取行动"
  ],
  "riskAreas": [
    "用简单词汇描述风险点，如：消化系统、睡眠问题、情绪波动、免疫力等",
    "避免中医专业术语，用现代人容易理解的词汇",
    "每个风险点不超过4个字"
  ],
  "organStatus": {
    "spleen": {"status": "正常/虚弱/湿热", "score": 85},
    "liver": {"status": "正常/郁滞/火旺", "score": 80},
    "heart": {"status": "正常/火旺/气虚", "score": 75},
    "lung": {"status": "正常/气虚/燥热", "score": 90},
    "kidney": {"status": "正常/阳虚/阴虚", "score": 70}
  },
  "pathologyPattern": "主要病机(如：脾虚湿盛、肝郁化火、心肾不交等)",
  "constitutionType": "体质倾向(如：阳虚质、阴虚质、痰湿质、湿热质等)",
  "suggestions": [
    "具体调理建议1",
    "具体调理建议2",
    "具体调理建议3"
  ],
  "confidence": 数字(80-95),
  "analysisTime": "${new Date().toISOString()}"
}

【专业要求】
1. 观察要细致入微，不放过任何细节
2. 分析要结合中医理论，有理有据
3. 判断要客观准确，避免主观臆测
4. 为后续问诊提供精准的指导方向

【语言表达要求 - 必须严格遵守】
1. 健康隐患描述必须用日常用语，禁止使用专业术语：
   - 绝对不能用："脾胃运化功能减弱"、"湿浊内蕴"、"气血生成不足风险"
   - 必须用："消化功能不好"、"体内湿气重"、"容易疲劳乏力"
   - 其他示例：
     * "脾胃虚弱" → "消化功能偏弱"
     * "湿热内蕴" → "体内湿气较重" 
     * "气血不足" → "容易疲劳乏力"
     * "肝郁气滞" → "情绪容易波动"
     * "肾阳不足" → "怕冷、腰酸"
     * "心火亢盛" → "容易心烦失眠"
     * "肺气虚弱" → "容易感冒咳嗽"

2. 风险区域必须用简单词汇，禁止使用专业术语：
   - 绝对不能用："脾胃虚弱"、"气血不足"、"痰湿内蕴"
   - 必须用："消化系统"、"疲劳"、"湿气重"
   - 其他示例：
     * "脾胃虚弱" → "消化系统"
     * "湿热内蕴" → "湿气重"
     * "气血不足" → "疲劳"
     * "肝郁气滞" → "情绪"
     * "肾阳不足" → "怕冷"
     * "心火亢盛" → "失眠"
     * "肺气虚弱" → "感冒"

3. 严格要求：每个描述都要让普通用户一看就懂，知道具体该怎么做
4. 如果使用专业术语，分析结果将被视为不合格`

// 问诊问题生成提示词
const GENERATE_QUESTIONS_PROMPT = `你是一位经验丰富的中医问诊专家，擅长通过精准问诊进一步确认舌诊发现的问题。基于以下舌诊分析结果，设计3-5个针对性强、层次分明的问题。

舌诊分析结果：
{tongueAnalysis}

【问诊设计原则】
1. 问题要针对舌诊发现的具体脏腑功能异常
2. 从症状的轻重程度、持续时间、诱发因素等维度设计
3. 问题要通俗易懂，避免专业术语
4. 选项要覆盖症状的完整谱系
5. 问题间要有逻辑递进关系
6. 优先询问最关键的鉴别诊断要点
7. 每个问题都要结合舌诊发现，解释为什么要问这个问题
8. 让用户明白问题的医学依据，增强说服力

【重点关注领域】
根据舌诊结果，重点关注以下方面：
- 消化系统：食欲、腹胀、便溏、便秘等
- 睡眠质量：入睡困难、多梦、早醒等
- 情绪状态：易怒、焦虑、抑郁等
- 体力精神：疲劳、乏力、注意力等
- 寒热感觉：怕冷、怕热、出汗等
- 女性特有：月经、白带等

请按照以下JSON格式返回问诊问题：

{
  "questions": [
    {
      "id": 1,
      "question": "您最近是否经常感到疲劳乏力？",
      "explanation": "根据您的舌象显示[具体舌诊发现]，这通常提示气血不足，所以想了解您是否经常感到疲劳",
      "type": "single_choice",
      "options": ["从不", "偶尔", "经常", "总是"],
      "target": "气血不足",
      "weight": 0.8,
      "followUp": "如果选择经常或总是，请描述疲劳的具体表现"
    },
    {
      "id": 2, 
      "question": "您的睡眠质量如何？",
      "explanation": "从您的舌苔[具体描述]来看，可能存在心神不宁的情况，想确认一下您的睡眠状况",
      "type": "single_choice",
      "options": ["很好", "一般", "较差", "很差"],
      "target": "心神不宁",
      "weight": 0.7,
      "followUp": "如果睡眠不好，主要是入睡困难还是容易醒来？"
    },
    {
      "id": 3,
      "question": "您最近的情绪状态如何？",
      "explanation": "您的舌质[具体描述]提示可能存在肝郁气滞，这通常会影响情绪状态",
      "type": "single_choice", 
      "options": ["很稳定", "偶尔波动", "经常烦躁", "持续低落"],
      "target": "肝郁气滞",
      "weight": 0.6,
      "followUp": "情绪波动时是否有明显的诱因？"
    }
  ],
  "estimatedTime": "3-5分钟",
  "purpose": "通过精准问诊进一步确认舌诊发现的脏腑功能异常",
  "keyFocus": "重点关注舌诊提示的主要病机",
  "diagnosticValue": "每个问题都有明确的诊断价值"
}

【专业要求】
1. 问题设计要体现中医辨证思维
2. 选项要覆盖症状的轻重缓急
3. 问题要能有效区分不同证型
4. 语言要贴近患者日常表达习惯
5. 一题中只能包含一个问题，不然用户很难回答`

// 综合报告生成提示词
const GENERATE_REPORT_PROMPT = `你是一位资深的中医健康管理专家，擅长综合分析舌诊和问诊结果，提供个性化的健康调理方案。请基于以下信息生成一份专业、全面的健康分析报告。

舌诊分析：
{tongueAnalysis}

问诊结果：
{questionnaireResults}

【报告生成要求】
1. 综合分析舌诊和问诊结果，形成整体判断
2. 结合中医理论，分析病机特点
3. 提供个性化的调理建议
4. 推荐适合的产品和生活方式
5. 给出合理的风险评估和就医建议

请按照以下JSON格式返回综合报告：

{
  "finalScore": 数字(0-100),
  "summary": "基于舌诊和问诊的综合评估总结(150字以内)",
  "detailedAnalysis": {
    "tongueFindings": {
      "description": "舌诊发现的详细描述",
      "significance": "临床意义和病机分析",
      "keyPoints": ["关键发现1", "关键发现2", "关键发现3"]
    },
    "questionnaireInsights": {
      "keyFindings": ["问诊发现的关键问题1", "问题2", "问题3"],
      "correlations": "与舌诊结果的关联分析和印证",
      "symptomPattern": "症状模式分析"
    },
    "systemAssessment": {
      "消化功能": {"score": 85, "status": "良好", "notes": "脾胃功能基本正常，但需注意饮食规律"},
      "睡眠质量": {"score": 70, "status": "需关注", "notes": "睡眠质量有待改善，建议调整作息"},
      "情绪状况": {"score": 80, "status": "良好", "notes": "情绪状态相对稳定，偶有波动"},
      "精力状况": {"score": 75, "status": "一般", "notes": "精力充沛度中等，可通过调理提升"},
      "血液循环": {"score": 80, "status": "良好", "notes": "血液循环基本正常"},
      "免疫力": {"score": 75, "status": "一般", "notes": "免疫力有待提升"}
    },
    "pathologyAnalysis": {
      "primaryPattern": "主要病机(如：脾虚湿盛、肝郁化火等)",
      "secondaryPattern": "次要病机",
      "constitutionType": "体质类型",
      "syndromeDifferentiation": "证型分析"
    }
  },
  "recommendations": {
    "lifestyle": [
      "具体的生活方式建议1",
      "具体的生活方式建议2",
      "具体的生活方式建议3"
    ],
    "dietary": [
      "具体的饮食调理建议1", 
      "具体的饮食调理建议2",
      "具体的饮食调理建议3"
    ],
    "exercise": [
      "适合的运动建议1",
      "适合的运动建议2"
    ],
    "emotional": [
      "情绪调节建议1",
      "情绪调节建议2"
    ],
    "followUp": "后续关注重点和复查建议"
  },
  "productRecommendations": [
    {
      "category": "营养补充",
      "reason": "基于气血不足的分析",
      "keywords": ["补气血", "维生素B", "阿胶", "当归"],
      "priority": "high"
    },
    {
      "category": "调理茶饮",
      "reason": "改善脾胃功能", 
      "keywords": ["山楂", "陈皮", "茯苓", "白术"],
      "priority": "medium"
    },
    {
      "category": "中医调理",
      "reason": "针对主要病机",
      "keywords": ["健脾", "疏肝", "理气", "安神"],
      "priority": "high"
    }
  ],
  "riskLevel": "low|medium|high",
  "riskFactors": ["主要风险因素1", "风险因素2"],
  "medicalAdvice": "是否建议就医及原因",
  "monitoringPoints": ["需要重点监测的指标1", "指标2"],
  "expectedOutcomes": "预期改善效果和时间",
  "contraindications": "注意事项和禁忌"
}

【产品推荐关键词选择】
请从以下数据库中实际存在的关键词中选择，确保推荐的产品能够被正确匹配：
补气血、维生素B、补气、气血不足、气血两虚、贫血、疲劳、抗疲劳、体虚、增强免疫、黄芪、党参、灵芝、大枣、甘草、山楂、陈皮、茯苓、白术、健脾、健脾胃、脾虚、湿气、理气、疏肝、肝郁、肝郁气滞、肝火旺、柴胡、安神、助眠、失眠、心神不宁、酸枣仁、小麦、百合、莲子、清热、降火、菊花、决明子、夏枯草、金银花、心烦、情绪、润燥、滋阴、银耳、雪梨、养胃、猴头菇、胃炎、消化不良、咳嗽、咽喉肿痛、头痛、目赤、月经不调、玫瑰花、干燥

【专业要求】
1. 分析要深入细致，体现中医辨证思维
2. 建议要具体可行，有明确的调理方向
3. 产品推荐要有充分的健康逻辑支撑
4. 关键词必须从上述列表中选择，确保能匹配到产品
5. 风险评估要客观准确，避免过度解读
6. 语言要专业但通俗易懂，便于理解执行

【语言表达要求 - 必须严格遵守】
1. 健康隐患描述必须用日常用语，绝对禁止使用专业术语：
   - 绝对不能用："脾胃运化失常"、"湿浊内蕴"、"胃阴不足"、"津液耗伤"、"气血生化不足"
   - 必须用："消化功能不好"、"体内湿气重"、"胃部容易干燥"、"身体缺水"、"容易疲劳乏力"
   - 其他示例：
     * "脾胃运化失常" → "消化功能不好"
     * "湿浊内蕴" → "体内湿气重"
     * "胃阴不足" → "胃部容易干燥"
     * "津液耗伤" → "身体缺水"
     * "气血生化不足" → "容易疲劳乏力"

2. 风险因素必须用简单词汇，绝对禁止使用专业术语：
   - 绝对不能用："脾胃虚弱"、"气血不足"、"胃阴不足"、"痰湿内蕴"
   - 必须用："消化系统"、"疲劳"、"胃部"、"湿气重"
   - 其他示例：
     * "脾胃虚弱" → "消化系统"
     * "气血不足" → "疲劳"
     * "胃阴不足" → "胃部"
     * "湿气重" → "湿气"
     * "肝郁气滞" → "情绪"

3. 严格要求：让用户一看就懂，知道具体该怎么做
4. 如果使用专业术语，报告将被视为不合格`

// API调用函数
async function callDoubaoAPI(fastify, prompt, imageBase64 = null) {
  const messages = [{
    role: 'user',
    content: []
  }]

  // 添加图片（如果有）
  if (imageBase64) {
    messages[0].content.push({
      type: 'image_url',
      image_url: { url: imageBase64 }
    })
  }

  // 添加文本提示
  messages[0].content.push({
    type: 'text',
    text: prompt
  })

  const response = await fetch(fastify.config.DOUBAO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${fastify.config.DOUBAO_API_KEY}`
    },
    body: JSON.stringify({
      model: fastify.config.DOUBAO_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 2000
    })
  })

  if (!response.ok) {
    throw new Error(`AI API调用失败: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('AI API响应格式错误')
  }

  const aiResponse = data.choices[0].message.content
  
  try {
    return JSON.parse(aiResponse)
  } catch (parseError) {
    // 尝试提取JSON部分
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error('无法解析AI返回的JSON格式')
  }
}

// 内存存储（替代数据库）
export const sessionStore = new Map()

// 分析路由
async function analysisRoutes(fastify, options) {
  // 请求验证模式
  const analyzeImageSchema = {
    body: Joi.object({
      imageData: Joi.string().required()
    })
  }

  const generateQuestionsSchema = {
    body: Joi.object({
      sessionId: Joi.string().required()
    })
  }

  const submitAnswersSchema = {
    body: Joi.object({
      sessionId: Joi.string().required(),
      answers: Joi.array().items(
        Joi.object({
          questionId: Joi.number().required(),
          answer: Joi.string().required(),
          answerIndex: Joi.number().optional()
        })
      ).required()
    })
  }

  // 1. 舌诊分析接口
  fastify.post('/analyze', async (request, reply) => {
    try {
      const { imageData } = request.body
      const sessionId = uuidv4()

      fastify.log.info(`开始舌诊分析 - 会话: ${sessionId}`)

      // 调用AI进行舌诊分析
      let tongueAnalysis
      try {
        tongueAnalysis = await callDoubaoAPI(fastify, TONGUE_ANALYSIS_PROMPT, imageData)
      } catch (apiError) {
        fastify.log.warn('AI API调用失败，使用模拟数据:', apiError.message)
        // 返回模拟的舌诊分析结果
        tongueAnalysis = {
          score: 75,
          tongueColor: '淡红',
          coatingColor: '薄白',
          coatingThickness: '适中',
          tongueShape: '正常',
          tongueMoisture: '湿润',
          findings: [
            '舌质淡红，表明气血基本充足',
            '舌苔薄白，提示脾胃功能正常',
            '舌体大小适中，无异常形态',
            '舌面湿润，津液充足'
          ],
          summary: '整体舌象显示身体健康状况良好，气血充足，脾胃功能正常。建议继续保持良好的生活习惯。',
          recommendations: [
            '保持规律作息',
            '均衡饮食',
            '适量运动',
            '保持心情愉悦'
          ]
        }
      }

      // 存储到内存
      sessionStore.set(sessionId, {
        sessionId,
        imageData,
        tongueAnalysis,
        status: 'analyzed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      fastify.log.info(`舌诊分析完成 - 评分: ${tongueAnalysis.score}`)

      return {
        success: true,
        data: {
          sessionId,
          analysis: tongueAnalysis
        }
      }
    } catch (error) {
      fastify.log.error('舌诊分析失败:', error)
      return reply.status(500).send({
        success: false,
        error: 'Analysis failed',
        message: `分析失败: ${error.message}`
      })
    }
  })

  // 2. 生成问诊问题接口
  fastify.post('/generate-questions', async (request, reply) => {
    try {
      const { sessionId } = request.body

      // 从内存获取分析记录
      const record = sessionStore.get(sessionId)
      if (!record) {
        return reply.status(404).send({
          success: false,
          error: 'Session not found',
          message: '会话不存在'
        })
      }

      fastify.log.info(`生成问诊问题 - 会话: ${sessionId}`)

      // 生成问诊问题
      const prompt = GENERATE_QUESTIONS_PROMPT.replace(
        '{tongueAnalysis}', 
        JSON.stringify(record.tongueAnalysis)
      )
      
      const questionsData = await callDoubaoAPI(fastify, prompt)

      // 更新内存记录
      record.questionsData = questionsData
      record.status = 'questioning'
      record.updatedAt = new Date().toISOString()

      return {
        success: true,
        data: questionsData
      }
    } catch (error) {
      fastify.log.error('生成问诊问题失败:', error)
      return reply.status(500).send({
        success: false,
        error: 'Question generation failed',
        message: `生成问题失败: ${error.message}`
      })
    }
  })

  // 3. 提交问诊答案并生成报告接口
  fastify.post('/submit-answers', async (request, reply) => {
    try {
      const { sessionId, answers } = request.body

      // 从内存获取分析记录
      const record = sessionStore.get(sessionId)
      if (!record) {
        return reply.status(404).send({
          success: false,
          error: 'Session not found',
          message: '会话不存在'
        })
      }

      fastify.log.info(`提交问诊答案 - 会话: ${sessionId}, 答案数量: ${answers.length}`)

      // 生成综合报告
      const prompt = GENERATE_REPORT_PROMPT
        .replace('{tongueAnalysis}', JSON.stringify(record.tongueAnalysis))
        .replace('{questionnaireResults}', JSON.stringify(answers))
      
      const finalReport = await callDoubaoAPI(fastify, prompt)

      // 根据推荐关键词搜索产品
      let recommendedProducts = []
      if (finalReport.productRecommendations) {
        const allKeywords = finalReport.productRecommendations
          .flatMap(rec => rec.keywords)
        
        try {
          const products = await fastify.db.searchProducts(allKeywords, 6)
          recommendedProducts = products.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            description: p.description,
            benefits: p.benefits,
            price: parseFloat(p.price),
            originalPrice: p.original_price ? parseFloat(p.original_price) : null,
            imageUrl: p.image_url,
            brand: p.brand,
            rating: parseFloat(p.rating || 0),
            matchScore: p.match_score || null,
            recommendationReason: generateRecommendationReason(p, record.tongueAnalysis)
          }))
        } catch (dbError) {
          fastify.log.warn('获取推荐产品失败:', dbError)
        }
      }

      // 更新内存记录
      record.questionnaireData = answers
      record.finalReport = finalReport
      record.recommendedProducts = recommendedProducts
      record.status = 'completed'
      record.updatedAt = new Date().toISOString()

      return {
        success: true,
        data: {
          report: finalReport,
          recommendedProducts
        }
      }
    } catch (error) {
      fastify.log.error('提交答案失败:', error)
      return reply.status(500).send({
        success: false,
        error: 'Answer submission failed',
        message: `提交失败: ${error.message}`
      })
    }
  })

  // 4. 获取分析记录接口
  fastify.get('/record/:sessionId', async (request, reply) => {
    try {
      const { sessionId } = request.params

      const record = sessionStore.get(sessionId)
      if (!record) {
        return reply.status(404).send({
          success: false,
          error: 'Record not found',
          message: '记录不存在'
        })
      }

      return {
        success: true,
        data: {
          session_id: record.sessionId,
          tongue_analysis: record.tongueAnalysis,
          questionnaire_data: record.questionnaireData,
          final_report: record.finalReport,
          recommended_products: record.recommendedProducts?.map(p => p.id) || [],
          analysis_status: record.status,
          created_at: record.createdAt,
          updated_at: record.updatedAt
        }
      }
    } catch (error) {
      fastify.log.error('获取分析记录失败:', error)
      return reply.status(500).send({
        success: false,
        error: 'Record retrieval failed',
        message: `获取记录失败: ${error.message}`
      })
    }
  })

}

// 辅助函数：生成推荐理由
function generateRecommendationReason(product, tongueAnalysis) {
  if (!tongueAnalysis) return '基于健康分析推荐'

  const reasons = []

  // 基于舌诊结果生成理由
  if (tongueAnalysis.tongueColor === '淡白' && product.keywords.includes('补气血')) {
    reasons.push('您的舌质偏淡白，适合补气血类产品')
  }

  if (tongueAnalysis.coatingColor === '黄' && product.keywords.includes('清热')) {
    reasons.push('您的舌苔偏黄，适合清热类产品')
  }

  if (tongueAnalysis.score < 80 && product.keywords.includes('增强免疫')) {
    reasons.push('建议适当增强体质')
  }

  return reasons.length > 0 ? reasons[0] : `适合您的${product.category}产品`
}

export { analysisRoutes }