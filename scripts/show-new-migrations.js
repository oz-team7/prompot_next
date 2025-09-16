const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('                    새로운 마이그레이션만 실행하는 SQL                         ');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

console.log('📋 실행 방법:');
console.log('1. Supabase 대시보드 접속: https://app.supabase.com');
console.log('2. 프로젝트 선택');
console.log('3. SQL Editor 클릭');
console.log('4. 아래 SQL 복사하여 붙여넣기');
console.log('5. Run 버튼 클릭\n');

console.log('⚠️  이 SQL은 다음만 실행합니다:');
console.log('- admin_notifications 테이블 생성 (없는 경우)');
console.log('- inquiries 테이블에 email, priority 컬럼 추가 (없는 경우)');
console.log('- 기존 데이터는 전혀 건드리지 않습니다\n');

console.log('═══════════════════════════════════════════════════════════════════════════════\n');

// SQL 파일 읽기
const sqlPath = path.join(__dirname, '..', 'apply_only_new_migrations.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');
console.log(sqlContent);

console.log('\n═══════════════════════════════════════════════════════════════════════════════');
console.log('                                    SQL 끝                                      ');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');