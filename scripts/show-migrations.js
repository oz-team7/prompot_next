const fs = require('fs');
const path = require('path');

console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    Supabase 마이그레이션 SQL 실행 가이드                      ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');

console.log('📋 실행 단계:');
console.log('1. Supabase 대시보드 접속: https://app.supabase.com');
console.log('2. 프로젝트 선택');
console.log('3. 왼쪽 메뉴에서 "SQL Editor" 클릭');
console.log('4. 아래 SQL 코드를 복사하여 붙여넣기');
console.log('5. "Run" 버튼 클릭\n');

console.log('⚠️  주의사항:');
console.log('- 이미 존재하는 테이블은 자동으로 건너뜁니다');
console.log('- 정책이 중복되면 에러가 발생할 수 있지만 무시해도 됩니다\n');

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('                              복사할 SQL 코드 시작                              ');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

// execute_migrations.sql 파일 읽기
const sqlPath = path.join(__dirname, '..', 'execute_migrations.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');
console.log(sqlContent);

console.log('\n═══════════════════════════════════════════════════════════════════════════════');
console.log('                              복사할 SQL 코드 끝                                ');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

console.log('✅ 실행 완료 후 확인사항:');
console.log('1. admin_notifications 테이블 생성 확인');
console.log('2. inquiries 테이블 생성 및 email, priority 컬럼 확인');
console.log('3. 트리거 및 인덱스 생성 확인');
console.log('4. Vercel 배포 사이트에서 admin 페이지 동작 확인\n');

console.log('🔗 관련 파일:');
console.log('- supabase/migrations/013_admin_notifications_table.sql');
console.log('- supabase/migrations/014_inquiries_table.sql');
console.log('- execute_migrations.sql (통합 파일)\n');