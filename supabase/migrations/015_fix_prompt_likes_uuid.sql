-- prompt_likes 테이블의 prompt_id를 INTEGER에서 TEXT로 변경
-- UUID 프롬프트 ID를 지원하기 위한 마이그레이션

-- 기존 테이블이 있다면 삭제 (개발 환경에서만)
DROP TABLE IF EXISTS prompt_likes CASCADE;

-- 새로운 구조로 테이블 재생성
CREATE TABLE prompt_likes (
  id SERIAL PRIMARY KEY,
  prompt_id TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(prompt_id, user_id) -- 한 사용자가 같은 프롬프트에 중복 좋아요 방지
);

-- 인덱스 생성
CREATE INDEX idx_prompt_likes_prompt_id ON prompt_likes(prompt_id);
CREATE INDEX idx_prompt_likes_user_id ON prompt_likes(user_id);

-- 좋아요 수를 가져오는 함수 (성능 최적화)
CREATE OR REPLACE FUNCTION get_prompt_likes_count(p_prompt_id TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM prompt_likes WHERE prompt_id = p_prompt_id);
END;
$$ LANGUAGE plpgsql;

-- prompts 뷰 업데이트 (좋아요 수 포함)
CREATE OR REPLACE VIEW prompts_with_likes AS
SELECT 
  p.*,
  get_prompt_likes_count(p.id) as likes_count,
  EXISTS(
    SELECT 1 
    FROM prompt_likes pl 
    WHERE pl.prompt_id = p.id 
    AND pl.user_id = auth.uid()
  ) as is_liked
FROM prompts p;

-- RLS(Row Level Security) 활성화
ALTER TABLE prompt_likes ENABLE ROW LEVEL SECURITY;

-- 좋아요 RLS 정책
CREATE POLICY "Users can view all likes" ON prompt_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON prompt_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON prompt_likes
  FOR DELETE USING (auth.uid() = user_id);
