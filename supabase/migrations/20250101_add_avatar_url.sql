-- profiles 테이블에 avatar_url 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 프로필 업데이트를 위한 RLS 정책 추가 (이미 있다면 생략)
CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 프로필 조회를 위한 RLS 정책 추가 (이미 있다면 생략)
CREATE POLICY IF NOT EXISTS "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);
