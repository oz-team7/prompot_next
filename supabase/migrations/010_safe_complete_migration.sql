-- 안전한 마이그레이션 (기존 데이터 보존)
-- 모든 작업은 IF NOT EXISTS로 보호됨

-- 1. 회원 제재 시스템
-- profiles 테이블에 제재 관련 컬럼 추가
DO $$ 
BEGIN
    -- is_suspended 컬럼
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' 
                   AND column_name = 'is_suspended') THEN
        ALTER TABLE profiles ADD COLUMN is_suspended BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_suspended column to profiles';
    END IF;
    
    -- suspension_reason 컬럼
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' 
                   AND column_name = 'suspension_reason') THEN
        ALTER TABLE profiles ADD COLUMN suspension_reason TEXT;
        RAISE NOTICE 'Added suspension_reason column to profiles';
    END IF;
    
    -- suspension_end_date 컬럼
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' 
                   AND column_name = 'suspension_end_date') THEN
        ALTER TABLE profiles ADD COLUMN suspension_end_date TIMESTAMPTZ;
        RAISE NOTICE 'Added suspension_end_date column to profiles';
    END IF;
    
    -- warning_count 컬럼
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'profiles' 
                   AND column_name = 'warning_count') THEN
        ALTER TABLE profiles ADD COLUMN warning_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added warning_count column to profiles';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Error adding columns to profiles: %', SQLERRM;
END $$;

-- 회원 제재 테이블 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'user_sanctions') THEN
        CREATE TABLE user_sanctions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            sanction_type VARCHAR(50) NOT NULL,
            reason TEXT NOT NULL,
            duration INTEGER,
            start_date TIMESTAMPTZ DEFAULT NOW(),
            end_date TIMESTAMPTZ,
            is_active BOOLEAN DEFAULT true,
            created_by UUID REFERENCES profiles(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- 인덱스 생성
        CREATE INDEX idx_user_sanctions_user_id ON user_sanctions(user_id);
        CREATE INDEX idx_user_sanctions_is_active ON user_sanctions(is_active);
        CREATE INDEX idx_user_sanctions_end_date ON user_sanctions(end_date);
        
        RAISE NOTICE 'Created user_sanctions table';
    END IF;
END $$;

-- 2. 좋아요 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'likes') THEN
        CREATE TABLE likes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, prompt_id)
        );
        
        -- 인덱스 생성
        CREATE INDEX idx_likes_prompt_id ON likes(prompt_id);
        CREATE INDEX idx_likes_user_id ON likes(user_id);
        
        RAISE NOTICE 'Created likes table';
    END IF;
END $$;

-- 3. 관리자 로그 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'admin_logs') THEN
        CREATE TABLE admin_logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            admin_id UUID NOT NULL REFERENCES profiles(id),
            action VARCHAR(100) NOT NULL,
            target_type VARCHAR(50),
            target_id TEXT,
            details JSONB,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- 인덱스 생성
        CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
        CREATE INDEX idx_admin_logs_action ON admin_logs(action);
        CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);
        
        RAISE NOTICE 'Created admin_logs table';
    END IF;
END $$;

-- 4. 신고 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'reports') THEN
        CREATE TABLE reports (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            reporter_id UUID NOT NULL REFERENCES profiles(id),
            reported_type VARCHAR(50) NOT NULL,
            reported_id UUID NOT NULL,
            reason VARCHAR(100) NOT NULL,
            details TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            resolution_note TEXT,
            resolved_by UUID REFERENCES profiles(id),
            resolved_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- 인덱스 생성
        CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
        CREATE INDEX idx_reports_status ON reports(status);
        CREATE INDEX idx_reports_reported_type_id ON reports(reported_type, reported_id);
        CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
        
        RAISE NOTICE 'Created reports table';
    END IF;
END $$;

-- 5. API 키 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'api_keys') THEN
        CREATE TABLE api_keys (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            key_hash VARCHAR(255) NOT NULL UNIQUE,
            last_used_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ,
            is_active BOOLEAN DEFAULT true
        );
        
        -- 인덱스 생성
        CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
        CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
        
        RAISE NOTICE 'Created api_keys table';
    END IF;
END $$;

-- 6. API 모니터링 로그 테이블
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'api_monitor_logs') THEN
        CREATE TABLE api_monitor_logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            endpoint VARCHAR(500) NOT NULL,
            method VARCHAR(10) NOT NULL,
            status INTEGER NOT NULL,
            response_time INTEGER,
            user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
            request_body JSONB,
            response_body JSONB,
            error_message TEXT,
            api_type VARCHAR(50),
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- 인덱스 생성
        CREATE INDEX idx_api_monitor_logs_created_at ON api_monitor_logs(created_at DESC);
        CREATE INDEX idx_api_monitor_logs_endpoint ON api_monitor_logs(endpoint);
        CREATE INDEX idx_api_monitor_logs_status ON api_monitor_logs(status);
        CREATE INDEX idx_api_monitor_logs_api_type ON api_monitor_logs(api_type);
        CREATE INDEX idx_api_monitor_logs_user_id ON api_monitor_logs(user_id);
        
        RAISE NOTICE 'Created api_monitor_logs table';
    END IF;
END $$;

-- 7. prompts 테이블에 views 컬럼 추가 (조회수)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'prompts' 
                   AND column_name = 'views') THEN
        ALTER TABLE prompts ADD COLUMN views INTEGER DEFAULT 0;
        CREATE INDEX idx_prompts_views ON prompts(views DESC);
        RAISE NOTICE 'Added views column to prompts';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Error adding views column to prompts: %', SQLERRM;
END $$;

-- RLS 정책 설정 (안전하게 - 기존 정책 삭제 후 재생성)
DO $$
BEGIN
    -- user_sanctions RLS
    ALTER TABLE user_sanctions ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Admin users can manage sanctions" ON user_sanctions;
    DROP POLICY IF EXISTS "Users can view own sanctions" ON user_sanctions;
    
    CREATE POLICY "Admin users can manage sanctions" ON user_sanctions
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.email = 'prompot7@gmail.com'
            )
        );
    
    CREATE POLICY "Users can view own sanctions" ON user_sanctions
        FOR SELECT USING (auth.uid() = user_id);
    
    -- likes RLS
    ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view all likes" ON likes;
    DROP POLICY IF EXISTS "Users can manage their own likes" ON likes;
    
    CREATE POLICY "Users can view all likes" ON likes
        FOR SELECT USING (true);
    
    CREATE POLICY "Users can manage their own likes" ON likes
        FOR ALL USING (auth.uid() = user_id);
    
    -- admin_logs RLS
    ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Admin users can view admin logs" ON admin_logs;
    DROP POLICY IF EXISTS "Admin users can insert admin logs" ON admin_logs;
    
    CREATE POLICY "Admin users can view admin logs" ON admin_logs
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.email = 'prompot7@gmail.com'
            )
        );
    
    CREATE POLICY "Admin users can insert admin logs" ON admin_logs
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.email = 'prompot7@gmail.com'
            )
        );
    
    -- reports RLS
    ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can create reports" ON reports;
    DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
    DROP POLICY IF EXISTS "Admin can view all reports" ON reports;
    DROP POLICY IF EXISTS "Admin can update reports" ON reports;
    
    CREATE POLICY "Users can create reports" ON reports
        FOR INSERT WITH CHECK (auth.uid() = reporter_id);
    
    CREATE POLICY "Users can view their own reports" ON reports
        FOR SELECT USING (auth.uid() = reporter_id);
    
    CREATE POLICY "Admin can view all reports" ON reports
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.email = 'prompot7@gmail.com'
            )
        );
    
    CREATE POLICY "Admin can update reports" ON reports
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.email = 'prompot7@gmail.com'
            )
        );
    
    -- api_keys RLS
    ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can manage their own API keys" ON api_keys;
    DROP POLICY IF EXISTS "Service role can verify API keys" ON api_keys;
    
    CREATE POLICY "Users can manage their own API keys" ON api_keys
        FOR ALL USING (auth.uid() = user_id);
    
    CREATE POLICY "Service role can verify API keys" ON api_keys
        FOR SELECT USING (true);
    
    -- api_monitor_logs RLS
    ALTER TABLE api_monitor_logs ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Admin users can view API logs" ON api_monitor_logs;
    DROP POLICY IF EXISTS "Service role can insert API logs" ON api_monitor_logs;
    
    CREATE POLICY "Admin users can view API logs" ON api_monitor_logs
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.email = 'prompot7@gmail.com'
            )
        );
    
    CREATE POLICY "Service role can insert API logs" ON api_monitor_logs
        FOR INSERT WITH CHECK (true);
        
    RAISE NOTICE 'RLS policies configured';
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Error setting RLS policies: %', SQLERRM;
END $$;

-- 함수들 생성
-- 제재 적용 함수
CREATE OR REPLACE FUNCTION apply_user_sanction(
    p_user_id UUID,
    p_sanction_type VARCHAR(50),
    p_reason TEXT,
    p_duration INTEGER,
    p_created_by UUID
) RETURNS void AS $$
DECLARE
    v_end_date TIMESTAMPTZ;
BEGIN
    -- 종료일 계산
    IF p_duration IS NOT NULL THEN
        v_end_date := NOW() + (p_duration || ' days')::INTERVAL;
    ELSE
        v_end_date := NULL; -- 영구정지
    END IF;

    -- 제재 기록 추가
    INSERT INTO user_sanctions (
        user_id, sanction_type, reason, duration, 
        end_date, created_by
    ) VALUES (
        p_user_id, p_sanction_type, p_reason, p_duration, 
        v_end_date, p_created_by
    );

    -- profiles 테이블 업데이트
    IF p_sanction_type = 'warning' THEN
        UPDATE profiles 
        SET warning_count = COALESCE(warning_count, 0) + 1,
            updated_at = NOW()
        WHERE id = p_user_id;
    ELSIF p_sanction_type IN ('suspension', 'permanent_ban') THEN
        UPDATE profiles 
        SET is_suspended = true,
            suspension_reason = p_reason,
            suspension_end_date = v_end_date,
            updated_at = NOW()
        WHERE id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 제재 해제 함수
CREATE OR REPLACE FUNCTION revoke_user_sanction(
    p_user_id UUID,
    p_sanction_id UUID
) RETURNS void AS $$
BEGIN
    -- 제재 비활성화
    UPDATE user_sanctions 
    SET is_active = false,
        updated_at = NOW()
    WHERE id = p_sanction_id AND user_id = p_user_id;

    -- profiles 테이블 업데이트
    UPDATE profiles 
    SET is_suspended = false,
        suspension_reason = NULL,
        suspension_end_date = NULL,
        updated_at = NOW()
    WHERE id = p_user_id
    AND NOT EXISTS (
        SELECT 1 FROM user_sanctions
        WHERE user_id = p_user_id 
        AND is_active = true
        AND sanction_type IN ('suspension', 'permanent_ban')
        AND (end_date IS NULL OR end_date > NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- 만료된 제재 자동 해제 함수
CREATE OR REPLACE FUNCTION check_expired_sanctions() RETURNS void AS $$
BEGIN
    -- 만료된 제재 비활성화
    UPDATE user_sanctions 
    SET is_active = false,
        updated_at = NOW()
    WHERE is_active = true
    AND end_date IS NOT NULL
    AND end_date < NOW();

    -- profiles 테이블에서 만료된 정지 해제
    UPDATE profiles 
    SET is_suspended = false,
        suspension_reason = NULL,
        suspension_end_date = NULL,
        updated_at = NOW()
    WHERE is_suspended = true
    AND suspension_end_date IS NOT NULL
    AND suspension_end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- increment 함수 (조회수 증가용)
CREATE OR REPLACE FUNCTION increment(table_name text, column_name text, row_id uuid) 
RETURNS void AS $$
BEGIN
    EXECUTE format('UPDATE %I SET %I = %I + 1 WHERE id = $1', table_name, column_name, column_name) 
    USING row_id;
END;
$$ LANGUAGE plpgsql;

-- 마이그레이션 완료 메시지
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'All existing data has been preserved.';
END $$;