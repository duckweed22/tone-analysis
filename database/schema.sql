-- AI舌诊健康分析系统 - 简化版数据库结构
-- 仅包含产品库，其他数据存储在前端/内存中

-- 产品表
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    keywords TEXT[] NOT NULL, -- 用于AI匹配推荐
    description TEXT,
    benefits TEXT[], -- 健康功效
    price DECIMAL(10,2),
    original_price DECIMAL(10,2),
    image_url VARCHAR(500),
    detail_url VARCHAR(500),
    stock INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    brand VARCHAR(100),
    specifications JSONB, -- 产品规格信息
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_keywords ON products USING GIN(keywords);
CREATE INDEX idx_products_active ON products(is_active);

-- 插入示例产品数据
INSERT INTO products (name, category, subcategory, keywords, description, benefits, price, original_price, image_url, brand, specifications) VALUES
-- 补气血类
('复合维生素B族片', '营养补充', '维生素', ARRAY['补气血', '维生素B', '疲劳', '气血不足'], '高品质复合维生素B族，有效缓解疲劳，改善气血不足', ARRAY['缓解疲劳', '改善气色', '增强体力'], 58.00, 78.00, '/images/vitamin-b.jpg', '健康堂', '{"spec": "60片/瓶", "usage": "每日1-2片"}'),

('阿胶固元膏', '中医调理', '补血', ARRAY['补气血', '阿胶', '贫血', '气血两虚'], '传统阿胶配方，温和补血益气，适合气血虚弱人群', ARRAY['补血养颜', '调理气血', '增强免疫'], 128.00, 168.00, '/images/ejiao.jpg', '同仁堂', '{"spec": "250g/盒", "usage": "每日2次，每次10g"}'),

('当归补血口服液', '中医调理', '补血', ARRAY['补气血', '当归', '贫血', '月经不调'], '精选当归等名贵中药材，专为女性调理气血', ARRAY['调理月经', '补血养颜', '改善面色'], 89.00, 120.00, '/images/danggui.jpg', '太极集团', '{"spec": "10ml×12支", "usage": "每日2次，每次1支"}'),

-- 健脾胃类
('山楂陈皮茶', '茶饮', '调理茶', ARRAY['健脾胃', '山楂', '陈皮', '消化不良'], '天然山楂陈皮配方，温和调理脾胃，改善消化', ARRAY['助消化', '健脾胃', '去湿气'], 45.00, 65.00, '/images/hawthorn-tea.jpg', '养生谷', '{"spec": "30包/盒", "usage": "每日1-2包，温水冲泡"}'),

('茯苓白术丸', '中医调理', '健脾', ARRAY['健脾胃', '茯苓', '白术', '脾虚', '湿气'], '经典健脾祛湿方，改善脾胃虚弱，祛除体内湿气', ARRAY['健脾祛湿', '改善食欲', '调理肠胃'], 89.00, 120.00, '/images/fuling-pills.jpg', '老字号', '{"spec": "200丸/瓶", "usage": "每日3次，每次6-8丸"}'),

('猴头菇养胃粉', '食疗', '养胃', ARRAY['健脾胃', '猴头菇', '养胃', '胃炎'], '纯天然猴头菇制作，温和养胃护胃', ARRAY['养胃护胃', '修复胃黏膜', '改善胃炎'], 68.00, 88.00, '/images/houtou-powder.jpg', '食养堂', '{"spec": "200g/罐", "usage": "每日冲调1-2次"}'),

-- 安神助眠类
('酸枣仁安神茶', '茶饮', '安神茶', ARRAY['安神', '助眠', '酸枣仁', '失眠', '心神不宁'], '纯天然酸枣仁配方，温和安神助眠，无依赖性', ARRAY['改善睡眠', '安神定志', '缓解焦虑'], 68.00, 88.00, '/images/jujube-tea.jpg', '安神堂', '{"spec": "20包/盒", "usage": "睡前1小时冲服"}'),

('百合莲子安神汤', '食疗', '安神', ARRAY['安神', '助眠', '百合', '莲子', '心烦'], '传统安神食疗方，百合莲子温和安神', ARRAY['安神助眠', '清心除烦', '滋阴润燥'], 52.00, 72.00, '/images/lily-lotus-soup.jpg', '食疗坊', '{"spec": "150g/包", "usage": "煲汤或煮粥食用"}'),

('甘麦大枣汤', '中医调理', '安神', ARRAY['安神', '甘草', '小麦', '大枣', '心神不宁'], '经典安神方剂，调理心神不宁', ARRAY['安神定志', '缓解抑郁', '改善情绪'], 45.00, 65.00, '/images/ganmai-soup.jpg', '本草堂', '{"spec": "25包/盒", "usage": "每日1包，开水冲泡"}'),

-- 清热降火类
('菊花决明子茶', '茶饮', '清热茶', ARRAY['清热', '降火', '菊花', '决明子', '肝火旺'], '清热明目，降肝火，适合肝火旺盛人群', ARRAY['清热降火', '明目护肝', '润肠通便'], 38.00, 52.00, '/images/chrysanthemum-tea.jpg', '清心堂', '{"spec": "25包/盒", "usage": "每日1-2包"}'),

('金银花露', '茶饮', '清热', ARRAY['清热', '降火', '金银花', '咽喉肿痛'], '纯天然金银花提取，清热解毒效果显著', ARRAY['清热解毒', '消炎降火', '缓解咽痛'], 28.00, 38.00, '/images/honeysuckle.jpg', '清热堂', '{"spec": "250ml×6瓶", "usage": "每日2-3次"}'),

('夏枯草降火茶', '茶饮', '清热茶', ARRAY['清热', '降火', '夏枯草', '头痛', '目赤'], '专门针对肝火上炎，头痛目赤', ARRAY['平肝降火', '清热散结', '明目止痛'], 42.00, 58.00, '/images/xiakucao-tea.jpg', '草本堂', '{"spec": "30包/盒", "usage": "每日1-2包"}'),

-- 滋阴润燥类
('百合莲子汤料', '食疗', '滋阴', ARRAY['滋阴', '润燥', '百合', '莲子', '干燥'], '天然百合莲子配方，滋阴润燥，适合阴虚体质', ARRAY['滋阴润肺', '安神养心', '美容养颜'], 55.00, 75.00, '/images/lily-lotus.jpg', '食疗坊', '{"spec": "150g/包", "usage": "煲汤或煮粥食用"}'),

('银耳雪梨膏', '食疗', '润燥', ARRAY['滋阴', '润燥', '银耳', '雪梨', '咳嗽'], '银耳雪梨精制而成，润肺止咳', ARRAY['润肺止咳', '滋阴清热', '美容养颜'], 78.00, 98.00, '/images/yiner-pear.jpg', '润肺堂', '{"spec": "300g/瓶", "usage": "每日2次，每次15g"}'),

-- 调理肝气类
('玫瑰花茶', '茶饮', '理气茶', ARRAY['疏肝', '理气', '玫瑰花', '肝郁', '情绪'], '精选玫瑰花瓣，疏肝理气，调节情绪', ARRAY['疏肝解郁', '美容养颜', '调节内分泌'], 42.00, 58.00, '/images/rose-tea.jpg', '花草语', '{"spec": "50g/罐", "usage": "每日泡茶饮用"}'),

('柴胡疏肝丸', '中医调理', '疏肝', ARRAY['疏肝', '理气', '柴胡', '肝郁气滞'], '经典疏肝理气方，改善肝郁气滞', ARRAY['疏肝理气', '调和脾胃', '缓解胸闷'], 65.00, 85.00, '/images/chaihu-pills.jpg', '老字号', '{"spec": "60g/瓶", "usage": "每日3次，每次6g"}'),

-- 增强免疫类
('黄芪党参茶', '茶饮', '补气茶', ARRAY['补气', '增强免疫', '黄芪', '党参', '体虚'], '经典补气配方，增强体质，提高免疫力', ARRAY['补中益气', '增强免疫', '改善体质'], 72.00, 95.00, '/images/astragalus-tea.jpg', '本草堂', '{"spec": "40包/盒", "usage": "每日1-2包"}'),

('灵芝孢子粉', '营养补充', '免疫', ARRAY['增强免疫', '灵芝', '抗疲劳', '体虚'], '破壁灵芝孢子粉，全面提升免疫力', ARRAY['增强免疫', '抗疲劳', '改善睡眠'], 188.00, 238.00, '/images/lingzhi-powder.jpg', '仙草堂', '{"spec": "100g/盒", "usage": "每日2次，每次2g"}'),

('人参蜂王浆', '营养补充', '滋补', ARRAY['补气', '增强免疫', '人参', '蜂王浆', '体虚'], '人参蜂王浆复合配方，全面滋补强身', ARRAY['大补元气', '增强免疫', '抗衰老'], 158.00, 198.00, '/images/ginseng-royal.jpg', '补益堂', '{"spec": "10ml×30支", "usage": "每日1支，空腹服用"}');

-- 创建视图：活跃产品
CREATE VIEW active_products AS
SELECT * FROM products WHERE is_active = true ORDER BY category, name;

-- 创建函数：搜索产品
CREATE OR REPLACE FUNCTION search_products_by_keywords(search_keywords TEXT[])
RETURNS TABLE (
    id INTEGER,
    name VARCHAR(255),
    category VARCHAR(100),
    keywords TEXT[],
    description TEXT,
    price DECIMAL(10,2),
    image_url VARCHAR(500),
    match_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.category,
        p.keywords,
        p.description,
        p.price,
        p.image_url,
        (
            SELECT COUNT(*)::INTEGER 
            FROM unnest(p.keywords) AS keyword 
            WHERE keyword = ANY(search_keywords)
        ) AS match_score
    FROM products p
    WHERE p.is_active = true 
      AND p.keywords && search_keywords
    ORDER BY match_score DESC, p.rating DESC, p.name;
END;
$$ LANGUAGE plpgsql;