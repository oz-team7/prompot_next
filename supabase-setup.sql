-- Supabase 테이블 생성 스크립트

-- 사용자 테이블 (auth.users와 연동)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 프롬프트 테이블
CREATE TABLE IF NOT EXISTS public.prompts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  ai_model TEXT NOT NULL,
  preview_image TEXT,
  is_public BOOLEAN DEFAULT true,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 좋아요 테이블
CREATE TABLE IF NOT EXISTS public.prompt_likes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  prompt_id BIGINT REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

-- 북마크 테이블
CREATE TABLE IF NOT EXISTS public.prompt_bookmarks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  prompt_id BIGINT REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_prompts_author_id ON public.prompts(author_id);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON public.prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON public.prompts(created_at);
CREATE INDEX IF NOT EXISTS idx_prompt_likes_prompt_id ON public.prompt_likes(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_bookmarks_prompt_id ON public.prompt_bookmarks(prompt_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정
-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 프롬프트는 모든 사용자가 볼 수 있음
CREATE POLICY "Anyone can view public prompts" ON public.prompts
  FOR SELECT USING (is_public = true OR auth.uid() = author_id);

-- 인증된 사용자만 프롬프트 생성 가능
CREATE POLICY "Authenticated users can create prompts" ON public.prompts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 작성자만 자신의 프롬프트 수정/삭제 가능
CREATE POLICY "Authors can update own prompts" ON public.prompts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own prompts" ON public.prompts
  FOR DELETE USING (auth.uid() = author_id);

-- 좋아요/북마크 정책
CREATE POLICY "Users can view likes/bookmarks" ON public.prompt_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create own likes/bookmarks" ON public.prompt_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes/bookmarks" ON public.prompt_likes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view bookmarks" ON public.prompt_bookmarks
  FOR SELECT USING (true);

CREATE POLICY "Users can create own bookmarks" ON public.prompt_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON public.prompt_bookmarks
  FOR DELETE USING (auth.uid() = user_id);
