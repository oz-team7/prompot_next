const https = require('https');
const fs = require('fs');
const path = require('path');

// .env.local 파일 직접 읽기
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');
const env = {};

envLines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    env[key] = value;
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase 테이블 설정 스크립트');
console.log('================================\n');

// SQL 파일 내용을 읽어서 출력
const sqlFiles = [
  { 
    file: 'create_missing_tables.sql',
    description: '전체 테이블 생성 SQL'
  },
  {
    file: 'supabase/migrations/013_admin_notifications_table.sql',
    description: 'admin_notifications 테이블'
  },
  {
    file: 'supabase/migrations/014_inquiries_table.sql', 
    description: 'inquiries 테이블'
  }
];

console.log('다음 단계를 따라 테이블을 생성하세요:\n');
console.log('1. Supabase 대시보드 (https://app.supabase.com) 로그인');
console.log('2. 프로젝트 선택');
console.log('3. 왼쪽 메뉴에서 "SQL Editor" 클릭');
console.log('4. 아래 SQL 코드를 복사하여 실행\n');

sqlFiles.forEach(({ file, description }) => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`\n=== ${description} (${file}) ===\n`);
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(content);
    console.log('\n=== 끝 ===\n');
  }
});

// 추가 안내
console.log('\n실행 순서:');
console.log('1. create_missing_tables.sql 전체 실행');
console.log('2. 에러가 발생하면 개별 마이그레이션 파일 실행');
console.log('\n주의사항:');
console.log('- 이미 존재하는 테이블은 CREATE TABLE IF NOT EXISTS로 인해 건너뛰어집니다');
console.log('- RLS 정책이 중복되면 에러가 발생할 수 있지만 무시해도 됩니다');
console.log('\n완료 후 Vercel에서 다시 테스트해보세요.');