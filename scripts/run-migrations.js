const { createClient } = require('@supabase/supabase-js');
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

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '');
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', SUPABASE_URL);

// Supabase 클라이언트 생성
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false
  }
});

async function executeSQLStatements() {
  console.log('마이그레이션 실행 시작...\n');

  // SQL 파일 읽기
  const sqlPath = path.join(__dirname, '..', 'execute_migrations.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  
  // SQL을 개별 명령으로 분리 (세미콜론 기준, DO 블록은 제외)
  const statements = [];
  let currentStatement = '';
  let inDoBlock = false;
  
  sqlContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.toUpperCase().startsWith('DO $$')) {
      inDoBlock = true;
    }
    
    currentStatement += line + '\n';
    
    if (!inDoBlock && trimmedLine.endsWith(';')) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    } else if (inDoBlock && trimmedLine === '$$;') {
      inDoBlock = false;
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  });

  // 각 명령 실행
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement || statement.startsWith('--')) continue;

    const shortStatement = statement.substring(0, 50).replace(/\n/g, ' ');
    
    try {
      // RPC를 통해 SQL 실행 시도
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: statement 
      });
      
      if (error) {
        // RPC 함수가 없을 수 있으므로 다른 방법 시도
        if (error.message.includes('exec_sql')) {
          console.log(`⚠️  RPC 함수가 없습니다. SQL을 직접 실행할 수 없습니다.`);
          console.log(`   ${shortStatement}...`);
        } else {
          console.log(`❌ 실패: ${shortStatement}...`);
          console.log(`   에러: ${error.message}`);
        }
      } else {
        console.log(`✅ 성공: ${shortStatement}...`);
      }
    } catch (err) {
      console.log(`❌ 에러: ${shortStatement}...`);
      console.log(`   ${err.message}`);
    }
  }

  // 테이블 확인
  console.log('\n테이블 확인 중...');
  
  try {
    // admin_notifications 테이블 확인
    const { data: adminData, error: adminError } = await supabase
      .from('admin_notifications')
      .select('count')
      .limit(1);
    
    if (!adminError) {
      console.log('✅ admin_notifications 테이블이 존재합니다.');
    } else {
      console.log('❌ admin_notifications 테이블을 찾을 수 없습니다.');
    }

    // inquiries 테이블 확인
    const { data: inquiryData, error: inquiryError } = await supabase
      .from('inquiries')
      .select('count')
      .limit(1);
    
    if (!inquiryError) {
      console.log('✅ inquiries 테이블이 존재합니다.');
    } else {
      console.log('❌ inquiries 테이블을 찾을 수 없습니다.');
    }
  } catch (err) {
    console.error('테이블 확인 중 에러:', err.message);
  }

  console.log('\n완료!');
  console.log('SQL 실행이 직접적으로 불가능한 경우, Supabase 대시보드에서 수동으로 실행해주세요.');
}

executeSQLStatements().catch(console.error);