-- profiles 테이블에 avatar_url 컬럼 추가
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' 
                   AND column_name = 'avatar_url') THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column to profiles';
    END IF;
END $$;

-- 프로필 업데이트를 위한 RLS 정책 추가 (이미 있다면 생략)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" ON profiles
            FOR UPDATE USING (auth.uid() = id);
        RAISE NOTICE 'Created policy: Users can update their own profile';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Policy already exists: Users can update their own profile';
END $$;

-- 프로필 조회를 위한 RLS 정책 추가 (이미 있다면 생략)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Public profiles are viewable by everyone'
    ) THEN
        CREATE POLICY "Public profiles are viewable by everyone" ON profiles
            FOR SELECT USING (true);
        RAISE NOTICE 'Created policy: Public profiles are viewable by everyone';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Policy already exists: Public profiles are viewable by everyone';
END $$;
