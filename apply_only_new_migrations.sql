-- ===================================
-- 013_admin_notifications_table.sql만 실행
-- ===================================

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
ON CONFLICT (email) DO NOTHING;

-- ===================================
-- 014_inquiries_table.sql만 실행
-- ===================================

-- inquiries 테이블이 이미 있는지 확인하고, email과 priority 컬럼만 추가
DO $$ 
BEGIN
    -- inquiries 테이블이 없으면 생성
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inquiries') THEN
        CREATE TABLE inquiries (
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
    ELSE
        -- 테이블이 있으면 누락된 컬럼만 추가
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'inquiries' AND column_name = 'email') THEN
            ALTER TABLE inquiries ADD COLUMN email TEXT NOT NULL DEFAULT 'unknown@example.com';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'inquiries' AND column_name = 'priority') THEN
            ALTER TABLE inquiries ADD COLUMN priority TEXT DEFAULT 'normal' 
            CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
        END IF;
    END IF;
END $$;

-- 인덱스 추가 (없는 경우에만)
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
CREATE INDEX IF NOT EXISTS idx_inquiries_priority ON inquiries(priority);