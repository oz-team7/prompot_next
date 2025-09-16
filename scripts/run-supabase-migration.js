const { execSync } = require('child_process');
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

// 패스워드 URL 인코딩
const password = 'prompot123^^';
const encodedPassword = encodeURIComponent(password);
const dbUrl = `postgresql://postgres:${encodedPassword}@db.tlytjitkokavfhwzedml.supabase.co:5432/postgres`;

console.log('Supabase 마이그레이션 실행 중...\n');

try {
  // 먼저 개별 마이그레이션 파일을 supabase/migrations 디렉토리에 복사
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  
  // execute_migrations.sql을 999_execute_all.sql로 복사
  const sourcePath = path.join(__dirname, '..', 'execute_migrations.sql');
  const targetPath = path.join(migrationsDir, '999_execute_all.sql');
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log('마이그레이션 파일을 복사했습니다: 999_execute_all.sql');
  }

  // db push 실행
  console.log('\nnpx supabase db push 실행 중...');
  const result = execSync(`npx supabase db push --db-url "${dbUrl}"`, {
    encoding: 'utf8',
    stdio: 'inherit'
  });

  console.log('\n마이그레이션 완료!');
  
  // 복사한 파일 삭제
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
    console.log('임시 마이그레이션 파일을 삭제했습니다.');
  }

} catch (error) {
  console.error('마이그레이션 실행 중 오류:', error.message);
  
  // 대안 제시
  console.log('\n=== 대안: 수동 실행 ===');
  console.log('1. Supabase 대시보드에서 SQL Editor 열기');
  console.log('2. execute_migrations.sql 파일 내용 복사/붙여넣기');
  console.log('3. Run 버튼 클릭');
}