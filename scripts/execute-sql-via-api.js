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

const DATABASE_URL = env.DATABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// DATABASE_URL 파싱
const dbUrlMatch = DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!dbUrlMatch) {
  console.error('DATABASE_URL 파싱 실패');
  process.exit(1);
}

const [, user, password, host, port, database] = dbUrlMatch;

console.log('데이터베이스 연결 정보:');
console.log(`Host: ${host}`);
console.log(`Database: ${database}`);
console.log(`User: ${user}`);
console.log('\n');

// PostgreSQL REST API 대신 curl 명령어 생성
const sqlPath = path.join(__dirname, '..', 'execute_migrations.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

// Windows에서는 psql이 없으므로, 대안 제시
console.log('=== 옵션 1: Supabase 대시보드에서 실행 ===');
console.log('1. https://app.supabase.com 접속');
console.log('2. 프로젝트 선택');
console.log('3. SQL Editor 클릭');
console.log('4. 아래 파일의 내용 복사하여 실행:');
console.log(`   ${sqlPath}`);
console.log('\n');

console.log('=== 옵션 2: psql 설치 후 실행 (선택사항) ===');
console.log('PostgreSQL 클라이언트가 설치되어 있다면:');
console.log(`psql "${DATABASE_URL}" -f "${sqlPath}"`);
console.log('\n');

console.log('=== 옵션 3: DBeaver 등 GUI 도구 사용 ===');
console.log('DBeaver, pgAdmin 등의 도구에서:');
console.log(`- Host: ${host}`);
console.log(`- Port: ${port}`);
console.log(`- Database: ${database}`);
console.log(`- Username: ${user}`);
console.log(`- Password: ${password}`);
console.log('\n');

// SQL 내용 요약 표시
console.log('=== 실행할 SQL 요약 ===');
const sqlLines = sqlContent.split('\n');
sqlLines.forEach(line => {
  if (line.includes('CREATE TABLE') || line.includes('CREATE INDEX') || 
      line.includes('CREATE POLICY') || line.includes('CREATE TRIGGER')) {
    console.log(line.trim());
  }
});
console.log('\n');

console.log('현재 Node.js에서 직접 PostgreSQL에 연결할 수 없으므로,');
console.log('위의 옵션 중 하나를 선택하여 SQL을 실행해주세요.');