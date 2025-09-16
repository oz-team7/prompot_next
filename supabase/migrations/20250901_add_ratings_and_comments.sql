-- 별점 테이블 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'prompt_ratings') THEN
        CREATE TABLE prompt_ratings (
            id uuid default gen_random_uuid() primary key,
            prompt_id uuid references prompts(id) on delete cascade,
            user_id uuid references profiles(id) on delete cascade,
            rating integer check (rating >= 1 and rating <= 5),
            created_at timestamptz default now(),
            unique(prompt_id, user_id)
        );
        RAISE NOTICE 'Created prompt_ratings table';
    ELSE
        RAISE NOTICE 'prompt_ratings table already exists';
    END IF;
END $$;

-- 댓글 테이블 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'prompt_comments') THEN
        CREATE TABLE prompt_comments (
            id uuid default gen_random_uuid() primary key,
            prompt_id uuid references prompts(id) on delete cascade,
            user_id uuid references profiles(id) on delete cascade,
            content text not null,
            created_at timestamptz default now(),
            updated_at timestamptz default now(),
            deleted_at timestamptz
        );
        RAISE NOTICE 'Created prompt_comments table';
    ELSE
        RAISE NOTICE 'prompt_comments table already exists';
    END IF;
END $$;

-- 인덱스 생성
create index if not exists prompt_ratings_prompt_id_idx on prompt_ratings(prompt_id);
create index if not exists prompt_comments_prompt_id_idx on prompt_comments(prompt_id);

-- RLS 정책 설정
alter table prompt_ratings enable row level security;
alter table prompt_comments enable row level security;

-- 별점 RLS 정책
DO $$
BEGIN
    -- 별점 조회 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'prompt_ratings' 
        AND policyname = '모든 사용자가 별점을 볼 수 있음'
    ) THEN
        CREATE POLICY "모든 사용자가 별점을 볼 수 있음"
            ON prompt_ratings FOR SELECT
            USING (true);
    END IF;
    
    -- 별점 생성 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'prompt_ratings' 
        AND policyname = '인증된 사용자만 별점을 줄 수 있음'
    ) THEN
        CREATE POLICY "인증된 사용자만 별점을 줄 수 있음"
            ON prompt_ratings FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- 별점 수정 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'prompt_ratings' 
        AND policyname = '자신의 별점만 수정할 수 있음'
    ) THEN
        CREATE POLICY "자신의 별점만 수정할 수 있음"
            ON prompt_ratings FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
    
    -- 별점 삭제 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'prompt_ratings' 
        AND policyname = '자신의 별점만 삭제할 수 있음'
    ) THEN
        CREATE POLICY "자신의 별점만 삭제할 수 있음"
            ON prompt_ratings FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Some policies already exist';
END $$;

-- 댓글 RLS 정책
DO $$
BEGIN
    -- 댓글 조회 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'prompt_comments' 
        AND policyname = '모든 사용자가 댓글을 볼 수 있음'
    ) THEN
        CREATE POLICY "모든 사용자가 댓글을 볼 수 있음"
            ON prompt_comments FOR SELECT
            USING (deleted_at IS NULL);
    END IF;
    
    -- 댓글 생성 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'prompt_comments' 
        AND policyname = '인증된 사용자만 댓글을 작성할 수 있음'
    ) THEN
        CREATE POLICY "인증된 사용자만 댓글을 작성할 수 있음"
            ON prompt_comments FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- 댓글 수정 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'prompt_comments' 
        AND policyname = '자신의 댓글만 수정할 수 있음'
    ) THEN
        CREATE POLICY "자신의 댓글만 수정할 수 있음"
            ON prompt_comments FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
    
    -- 댓글 삭제 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'prompt_comments' 
        AND policyname = '자신의 댓글만 삭제할 수 있음'
    ) THEN
        CREATE POLICY "자신의 댓글만 삭제할 수 있음"
            ON prompt_comments FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Some policies already exist';
END $$;
