-- Supabase SQL Editor에서 실행할 SQL 쿼리
-- 프롬프트 테이블에 video_url 필드 추가

ALTER TABLE prompts 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 필드에 대한 설명 추가
COMMENT ON COLUMN prompts.video_url IS 'URL of video content related to the prompt';

-- 인덱스 추가 (선택사항)
CREATE INDEX IF NOT EXISTS idx_prompts_video_url ON prompts(video_url) WHERE video_url IS NOT NULL;
