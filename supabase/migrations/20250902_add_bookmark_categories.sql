-- 북마크 카테고리 테이블 생성
CREATE TABLE IF NOT EXISTS bookmark_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6', -- 기본 파란색
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 북마크에 카테고리 필드 추가
ALTER TABLE prompt_bookmarks 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES bookmark_categories(id) ON DELETE SET NULL;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bookmark_categories_user_id ON bookmark_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_bookmarks_category_id ON prompt_bookmarks(category_id);

-- updated_at 트리거 추가
CREATE TRIGGER update_bookmark_categories_updated_at BEFORE UPDATE ON bookmark_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 활성화
ALTER TABLE bookmark_categories ENABLE ROW LEVEL SECURITY;

-- 북마크 카테고리 정책
CREATE POLICY "Users can view their own bookmark categories" ON bookmark_categories
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage their own bookmark categories" ON bookmark_categories
  FOR ALL USING (auth.uid()::text = user_id::text);
