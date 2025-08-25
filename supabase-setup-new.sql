-- 새로운 Supabase 테이블 구조 (profiles 기반)

-- 1. 기존 테이블들 삭제 (순서 중요)
DROP TABLE IF EXISTS public.prompt_bookmarks CASCADE;
DROP TABLE IF EXISTS public.prompt_likes CASCADE;
DROP TABLE IF EXISTS public.prompts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. 새로운 profiles 테이블 생성
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 프롬프트 테이블 생성
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  ai_model TEXT NOT NULL,
  preview_image TEXT,
  is_public BOOLEAN DEFAULT true,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 좋아요 테이블 생성
CREATE TABLE IF NOT EXISTS public.prompt_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

-- 5. 북마크 테이블 생성
CREATE TABLE IF NOT EXISTS public.prompt_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

-- 6. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_prompts_author_id ON public.prompts(author_id);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON public.prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON public.prompts(created_at);
CREATE INDEX IF NOT EXISTS idx_prompt_likes_prompt_id ON public.prompt_likes(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_bookmarks_prompt_id ON public.prompt_bookmarks(prompt_id);

-- 7. RLS (Row Level Security) 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_bookmarks ENABLE ROW LEVEL SECURITY;

-- 8. RLS 정책 설정

-- profiles 테이블: 사용자는 자신의 프로필만 관리 가능
CREATE POLICY "Users can manage own profile"
ON profiles FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- prompts 테이블: 모든 사용자가 공개 프롬프트를 볼 수 있음
CREATE POLICY "Anyone can view public prompts" ON public.prompts
  FOR SELECT USING (is_public = true OR auth.uid() = author_id);

-- prompts 테이블: 인증된 사용자만 프롬프트 생성 가능
CREATE POLICY "Authenticated users can create prompts" ON public.prompts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- prompts 테이블: 작성자만 자신의 프롬프트 수정/삭제 가능
CREATE POLICY "Authors can update own prompts" ON public.prompts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own prompts" ON public.prompts
  FOR DELETE USING (auth.uid() = author_id);

-- prompt_likes 테이블: 모든 사용자가 좋아요를 볼 수 있음
CREATE POLICY "Users can view likes" ON public.prompt_likes
  FOR SELECT USING (true);

-- prompt_likes 테이블: 사용자는 자신의 좋아요만 생성/삭제 가능
CREATE POLICY "Users can create own likes" ON public.prompt_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.prompt_likes
  FOR DELETE USING (auth.uid() = user_id);

-- prompt_bookmarks 테이블: 모든 사용자가 북마크를 볼 수 있음
CREATE POLICY "Users can view bookmarks" ON public.prompt_bookmarks
  FOR SELECT USING (true);

-- prompt_bookmarks 테이블: 사용자는 자신의 북마크만 생성/삭제 가능
CREATE POLICY "Users can create own bookmarks" ON public.prompt_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON public.prompt_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

