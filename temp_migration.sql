-- admin_notifications 테이블 생성 (이미 없는 경우에만)
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notification_types JSONB DEFAULT '{"new_inquiry": true, "new_user": false, "new_prompt": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 추가 (없는 경우에만)
CREATE INDEX IF NOT EXISTS idx_admin_notifications_email ON admin_notifications(email);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_active ON admin_notifications(is_active);

-- RLS 활성화
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- 기본 관리자 추가
INSERT INTO admin_notifications (email, name, is_active, notification_types)
VALUES ('prompot7@gmail.com', '관리자', true, '{"new_inquiry": true, "new_user": true, "new_prompt": true}'::jsonb)
ON CONFLICT (email) DO NOTHING;-- inquiries 테이블에 누락된 컬럼 추가
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

-- 인덱스 추가 (없는 경우에만)
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
CREATE INDEX IF NOT EXISTS idx_inquiries_priority ON inquiries(priority);