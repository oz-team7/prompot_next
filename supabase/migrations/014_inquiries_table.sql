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
CREATE INDEX idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_priority ON inquiries(priority);
CREATE INDEX idx_inquiries_email ON inquiries(email);
CREATE INDEX idx_inquiries_created_at ON inquiries(created_at DESC);

-- RLS 정책 설정
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

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
CREATE TRIGGER update_inquiries_updated_at 
BEFORE UPDATE ON inquiries 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();