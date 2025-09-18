-- 프롬프트 조회 기록 테이블 생성
CREATE TABLE IF NOT EXISTS prompt_views (
    id BIGSERIAL PRIMARY KEY,
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    viewer_ip TEXT NOT NULL,
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 인덱스를 위한 복합 유니크 제약조건
    -- 같은 프롬프트에 대해 (user_id 또는 ip) 중복 방지
    CONSTRAINT unique_user_view UNIQUE NULLS NOT DISTINCT (prompt_id, user_id),
    CONSTRAINT unique_ip_view UNIQUE NULLS NOT DISTINCT (prompt_id, viewer_ip, user_id)
);

-- 빠른 조회를 위한 인덱스 생성
CREATE INDEX idx_prompt_views_prompt_id ON prompt_views(prompt_id);
CREATE INDEX idx_prompt_views_user_id ON prompt_views(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_prompt_views_viewer_ip ON prompt_views(viewer_ip);
CREATE INDEX idx_prompt_views_viewed_at ON prompt_views(viewed_at);

-- RLS 정책 활성화
ALTER TABLE prompt_views ENABLE ROW LEVEL SECURITY;

-- 서비스 역할만 삽입 가능
CREATE POLICY "Service role can insert views" ON prompt_views
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- 서비스 역할만 조회 가능
CREATE POLICY "Service role can read views" ON prompt_views
    FOR SELECT
    TO service_role
    USING (true);