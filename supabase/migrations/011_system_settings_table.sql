-- 시스템 설정 테이블 생성
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    maintenance_mode BOOLEAN DEFAULT false NOT NULL,
    allow_signup BOOLEAN DEFAULT true NOT NULL,
    max_prompts_per_user INTEGER DEFAULT 100 NOT NULL,
    max_file_size_mb INTEGER DEFAULT 10 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- RLS 정책 설정
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 관리자만 읽기 가능
CREATE POLICY "Admins can view system settings" 
ON system_settings FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND email = 'prompot7@gmail.com'
    )
);

-- 관리자만 수정 가능
CREATE POLICY "Admins can update system settings" 
ON system_settings FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND email = 'prompot7@gmail.com'
    )
);

-- 시스템 설정은 하나의 행만 존재하도록 제한하는 트리거
CREATE OR REPLACE FUNCTION ensure_single_system_settings()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM system_settings) > 0 THEN
        RAISE EXCEPTION 'Only one system settings row is allowed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_system_settings_trigger ON system_settings;

CREATE TRIGGER ensure_single_system_settings_trigger
BEFORE INSERT ON system_settings
FOR EACH ROW
EXECUTE FUNCTION ensure_single_system_settings();

-- 어드민 활동 로그 테이블 (없으면 생성)
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 활동 로그 RLS 정책
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity logs" 
ON admin_activity_logs FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND email = 'prompot7@gmail.com'
    )
);

CREATE POLICY "Admins can create activity logs" 
ON admin_activity_logs FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND email = 'prompot7@gmail.com'
    )
);