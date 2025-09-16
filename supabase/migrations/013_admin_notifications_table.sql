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
CREATE INDEX idx_admin_notifications_email ON admin_notifications(email);

-- is_active 필드에 인덱스 추가
CREATE INDEX idx_admin_notifications_active ON admin_notifications(is_active);

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
CREATE TRIGGER update_admin_notifications_updated_at 
BEFORE UPDATE ON admin_notifications 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();