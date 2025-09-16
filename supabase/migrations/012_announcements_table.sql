-- 공지사항 테이블 생성
CREATE TABLE IF NOT EXISTS announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 활성 공지사항을 볼 수 있음
CREATE POLICY "Everyone can view active announcements" 
ON announcements FOR SELECT 
USING (is_active = true);

-- 관리자만 모든 공지사항을 볼 수 있음
CREATE POLICY "Admins can view all announcements" 
ON announcements FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND email = 'prompot7@gmail.com'
    )
);

-- 관리자만 공지사항을 생성할 수 있음
CREATE POLICY "Admins can create announcements" 
ON announcements FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND email = 'prompot7@gmail.com'
    )
);

-- 관리자만 공지사항을 수정할 수 있음
CREATE POLICY "Admins can update announcements" 
ON announcements FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND email = 'prompot7@gmail.com'
    )
);

-- 관리자만 공지사항을 삭제할 수 있음
CREATE POLICY "Admins can delete announcements" 
ON announcements FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND email = 'prompot7@gmail.com'
    )
);

-- 인덱스 추가
CREATE INDEX idx_announcements_is_active ON announcements(is_active);
CREATE INDEX idx_announcements_created_at ON announcements(created_at);