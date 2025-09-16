-- profiles 테이블에 role 컬럼 추가
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- role에 인덱스 추가 (어드민 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 어드민 권한 확인을 위한 RLS 정책 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Admins can view all profiles'
    ) THEN
        CREATE POLICY "Admins can view all profiles" ON profiles
          FOR SELECT 
          USING (
            auth.uid() IN (
              SELECT id FROM profiles WHERE role = 'admin'
            )
            OR auth.uid() = id
          );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Admins can update all profiles'
    ) THEN
        CREATE POLICY "Admins can update all profiles" ON profiles
          FOR UPDATE 
          USING (
            auth.uid() IN (
              SELECT id FROM profiles WHERE role = 'admin'
            )
          );
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Some policies already exist';
END $$;

-- prompts 테이블에 대한 어드민 정책
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'prompts' 
        AND policyname = 'Admins can view all prompts'
    ) THEN
        CREATE POLICY "Admins can view all prompts" ON prompts
          FOR SELECT 
          USING (
            is_public = true 
            OR auth.uid() = author_id 
            OR auth.uid() IN (
              SELECT id FROM profiles WHERE role = 'admin'
            )
          );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'prompts' 
        AND policyname = 'Admins can update all prompts'
    ) THEN
        CREATE POLICY "Admins can update all prompts" ON prompts
          FOR UPDATE 
          USING (
            auth.uid() = author_id 
            OR auth.uid() IN (
              SELECT id FROM profiles WHERE role = 'admin'
            )
          );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'prompts' 
        AND policyname = 'Admins can delete all prompts'
    ) THEN
        CREATE POLICY "Admins can delete all prompts" ON prompts
          FOR DELETE 
          USING (
            auth.uid() = author_id 
            OR auth.uid() IN (
              SELECT id FROM profiles WHERE role = 'admin'
            )
          );
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Some policies already exist';
END $$;

-- 어드민 활동 로그 테이블 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'admin_logs') THEN
        CREATE TABLE admin_logs (
          id SERIAL PRIMARY KEY,
          admin_id UUID REFERENCES profiles(id) NOT NULL,
          action VARCHAR(100) NOT NULL,
          target_type VARCHAR(50),
          target_id VARCHAR(255),
          details JSONB,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
        );
        RAISE NOTICE 'Created admin_logs table';
    END IF;
END $$;

-- RLS 활성화
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- 어드민만 로그 조회 가능
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'admin_logs' 
        AND policyname = 'Only admins can view admin logs'
    ) THEN
        CREATE POLICY "Only admins can view admin logs" ON admin_logs
          FOR SELECT 
          USING (
            auth.uid() IN (
              SELECT id FROM profiles WHERE role = 'admin'
            )
          );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'admin_logs' 
        AND policyname = 'Only service role can insert admin logs'
    ) THEN
        CREATE POLICY "Only service role can insert admin logs" ON admin_logs
          FOR INSERT 
          WITH CHECK (false);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Some policies already exist';
END $$;