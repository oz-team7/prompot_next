-- ===================================
-- 013_admin_notifications_table.sql
-- ===================================

-- admin_notifications 테이블 생성
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notification_types JSONB DEFAULT '{"new_inquiry": true, "new_user": false, "new_prompt": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- email 필드에 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_admin_notifications_email ON admin_notifications(email);

-- is_active 필드에 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_admin_notifications_active ON admin_notifications(is_active);

-- RLS 정책 설정 (서비스 역할만 접근 가능)
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- 기본 관리자 알림 설정 삽입
INSERT INTO admin_notifications (email, name, is_active, notification_types)
VALUES ('prompot7@gmail.com', '관리자', true, '{"new_inquiry": true, "new_user": true, "new_prompt": true}'::jsonb)
ON CONFLICT (email) DO NOTHING;

-- updated_at 자동 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS update_admin_notifications_updated_at ON admin_notifications;
CREATE TRIGGER update_admin_notifications_updated_at 
BEFORE UPDATE ON admin_notifications 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- 014_inquiries_table.sql
-- ===================================

-- inquiries 테이블 생성
CREATE TABLE IF NOT EXISTS inquiries (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_priority ON inquiries(priority);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);

-- RLS 정책 설정
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Users can view own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Users can create own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Service role can view all inquiries" ON inquiries;

-- 사용자는 자신의 문의만 볼 수 있음
CREATE POLICY "Users can view own inquiries" ON inquiries
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 문의를 생성할 수 있음
CREATE POLICY "Users can create own inquiries" ON inquiries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 문의를 볼 수 있음 (서비스 역할 사용)
CREATE POLICY "Service role can view all inquiries" ON inquiries
  FOR ALL USING (auth.role() = 'service_role');

-- updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_inquiries_updated_at ON inquiries;
CREATE TRIGGER update_inquiries_updated_at 
BEFORE UPDATE ON inquiries 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- 추가 보완 사항
-- ===================================

-- inquiries 테이블에 누락된 컬럼이 있을 경우 추가
DO $$ 
BEGIN
    -- email 컬럼이 없으면 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'inquiries' AND column_name = 'email') THEN
        ALTER TABLE inquiries ADD COLUMN email TEXT NOT NULL DEFAULT 'unknown@example.com';
    END IF;
    
    -- priority 컬럼이 없으면 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'inquiries' AND column_name = 'priority') THEN
        ALTER TABLE inquiries ADD COLUMN priority TEXT DEFAULT 'normal' 
        CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    END IF;
END $$;