-- ===================================================================
-- MangoNote 核心数据库架构
-- 简化版本：只保留最核心的功能
-- ===================================================================

-- 开启UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================================
-- 核心用户系统
-- ===================================================================

-- 用户表（简化）
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 文件夹表
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(20),
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- 笔记和内容系统
-- ===================================================================

-- 笔记主表
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'pdf', 'audio', 'text', 'youtube'
    content_status VARCHAR(50) DEFAULT 'completed', -- 'processing', 'completed', 'failed'
    
    -- 内容字段
    markdown TEXT,
    transcription TEXT,
    url TEXT,
    image_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI生成的内容块
CREATE TABLE IF NOT EXISTS content_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'summary', 'key_points', 'questions'
    title VARCHAR(200) NOT NULL,
    content JSONB NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- ===================================================================
-- 学习系统（核心）
-- ===================================================================

-- 闪卡表
CREATE TABLE IF NOT EXISTS flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SM-2间隔重复核心表
CREATE TABLE IF NOT EXISTS spaced_repetition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- SM-2算法参数
    repetitions INTEGER NOT NULL DEFAULT 0,
    easiness_factor DECIMAL(3,2) NOT NULL DEFAULT 2.50,
    interval_days INTEGER NOT NULL DEFAULT 1,
    next_review_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_quality INTEGER CHECK (last_quality >= 0 AND last_quality <= 5),
    is_new BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(flashcard_id, user_id)
);

-- 复习会话记录（简化）
CREATE TABLE IF NOT EXISTS review_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quality INTEGER NOT NULL CHECK (quality >= 0 AND quality <= 5),
    response_time_ms INTEGER,
    reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- 测验系统（简化）
-- ===================================================================

-- 测验表
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    total_questions INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 测验问题表
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer_index INTEGER NOT NULL,
    sort_order INTEGER DEFAULT 0
);

-- 学习会话表（简化）
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL, -- 'flashcard', 'quiz'
    content_id UUID NOT NULL,
    score INTEGER,
    total_questions INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 测验答案表
CREATE TABLE IF NOT EXISTS quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    quiz_question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    user_answer_index INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- 思维导图（简化）
-- ===================================================================

-- 思维导图表
CREATE TABLE IF NOT EXISTS mind_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    
    -- React Flow数据
    nodes JSONB NOT NULL DEFAULT '[]',
    edges JSONB NOT NULL DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- 核心索引
-- ===================================================================

-- 用户相关
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id);

-- 笔记相关
CREATE INDEX IF NOT EXISTS idx_notes_user_created ON notes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_content_blocks_note ON content_blocks(note_id, sort_order);

-- 闪卡和学习
CREATE INDEX IF NOT EXISTS idx_flashcards_note_user ON flashcards(note_id, user_id);
CREATE INDEX IF NOT EXISTS idx_spaced_repetition_user_next_review 
    ON spaced_repetition(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_spaced_repetition_flashcard ON spaced_repetition(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_user_date ON review_sessions(user_id, reviewed_at DESC);

-- 测验相关
CREATE INDEX IF NOT EXISTS idx_quizzes_note ON quizzes(note_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session ON quiz_answers(study_session_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id, started_at DESC);

-- 思维导图
CREATE INDEX IF NOT EXISTS idx_mind_maps_note_user ON mind_maps(note_id, user_id);

-- ===================================================================
-- 核心触发器
-- ===================================================================

-- 更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 应用触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spaced_repetition_updated_at BEFORE UPDATE ON spaced_repetition 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mind_maps_updated_at BEFORE UPDATE ON mind_maps 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- 核心视图
-- ===================================================================

-- 到期闪卡视图（SM-2算法核心）
CREATE OR REPLACE VIEW due_flashcards AS
SELECT 
    sr.flashcard_id,
    sr.user_id,
    sr.next_review_date,
    sr.repetitions,
    sr.easiness_factor,
    sr.interval_days,
    sr.is_new,
    f.question,
    f.answer,
    f.note_id,
    n.title as note_title,
    CASE 
        WHEN sr.next_review_date::date < CURRENT_DATE THEN 'overdue'
        WHEN sr.next_review_date::date = CURRENT_DATE THEN 'due'
        ELSE 'upcoming'
    END as priority
FROM spaced_repetition sr
JOIN flashcards f ON sr.flashcard_id = f.id
JOIN notes n ON f.note_id = n.id
WHERE sr.next_review_date <= CURRENT_TIMESTAMP
ORDER BY sr.next_review_date ASC;

-- 用户学习统计视图
CREATE OR REPLACE VIEW user_learning_stats AS
SELECT 
    sr.user_id,
    COUNT(*) as total_cards,
    COUNT(*) FILTER (WHERE sr.is_new = TRUE) as new_cards,
    COUNT(*) FILTER (WHERE sr.repetitions >= 2) as review_cards,
    COUNT(*) FILTER (WHERE sr.next_review_date <= CURRENT_TIMESTAMP) as cards_due_now
FROM spaced_repetition sr
GROUP BY sr.user_id;

-- ===================================================================
-- 核心函数
-- ===================================================================

-- 初始化闪卡间隔重复跟踪
CREATE OR REPLACE FUNCTION initialize_spaced_repetition_for_flashcard(
    p_flashcard_id UUID,
    p_user_id UUID
) RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO spaced_repetition (
        flashcard_id,
        user_id,
        repetitions,
        easiness_factor,
        interval_days,
        next_review_date,
        is_new
    ) VALUES (
        p_flashcard_id,
        p_user_id,
        0,
        2.5,
        1,
        CURRENT_TIMESTAMP,
        TRUE
    ) ON CONFLICT (flashcard_id, user_id) DO NOTHING
    RETURNING id INTO new_id;
    
    RETURN COALESCE(new_id, (
        SELECT id FROM spaced_repetition 
        WHERE flashcard_id = p_flashcard_id AND user_id = p_user_id
    ));
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- 核心注释
-- ===================================================================

COMMENT ON TABLE users IS '用户基础信息';
COMMENT ON TABLE notes IS '笔记主表，支持PDF、音频、文本等多种来源';
COMMENT ON TABLE flashcards IS '从笔记生成的学习卡片';
COMMENT ON TABLE spaced_repetition IS 'SM-2间隔重复算法核心数据';
COMMENT ON TABLE mind_maps IS 'AI生成的思维导图';
COMMENT ON VIEW due_flashcards IS '到期需要复习的闪卡';

-- 架构版本：核心简化版 v1.0
-- 包含：用户管理、笔记系统、闪卡学习、SM-2算法、测验、思维导图