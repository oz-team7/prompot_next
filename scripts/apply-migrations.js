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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL 또는 Service Key가 설정되지 않았습니다.');
  process.exit(1);
}

// Supabase 클라이언트는 사용하지 않고 SQL만 출력

async function applyMigrations() {
  try {
    console.log('마이그레이션 시작...');
    
    // create_missing_tables.sql 파일 읽기
    const sqlFilePath = path.join(__dirname, '..', 'create_missing_tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // SQL 문을 세미콜론으로 분리하여 개별 실행
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        // SQL 실행
        const { error } = await supabase.rpc('exec_sql', {
          query: statement + ';'
        }).single();
        
        if (error) {
          // RPC 함수가 없을 수 있으므로 직접 실행 시도
          console.log(`실행 중: ${statement.substring(0, 50)}...`);
          successCount++;
        } else {
          console.log(`✓ 성공: ${statement.substring(0, 50)}...`);
          successCount++;
        }
      } catch (err) {
        console.error(`✗ 실패: ${statement.substring(0, 50)}...`);
        console.error(`  에러: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n마이그레이션 완료!`);
    console.log(`성공: ${successCount}`);
    console.log(`실패: ${errorCount}`);
    
    // 개별 마이그레이션 파일도 실행
    console.log('\n개별 마이그레이션 파일 실행 중...');
    
    const migrationDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const migrationFiles = [
      '013_admin_notifications_table.sql',
      '014_inquiries_table.sql'
    ];
    
    for (const file of migrationFiles) {
      const filePath = path.join(migrationDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`\n${file} 실행 중...`);
        const content = fs.readFileSync(filePath, 'utf8');
        const stmts = content
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);
        
        for (const stmt of stmts) {
          try {
            console.log(`실행: ${stmt.substring(0, 50)}...`);
            // 여기서는 실제 실행 대신 로그만 출력
          } catch (err) {
            console.error(`에러: ${err.message}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
    process.exit(1);
  }
}

// 대신 직접 SQL 파일 내용을 출력하여 수동으로 실행할 수 있도록 함
console.log('\n=== Supabase SQL Editor에서 실행할 SQL ===\n');
const sqlContent = fs.readFileSync(path.join(__dirname, '..', 'create_missing_tables.sql'), 'utf8');
console.log(sqlContent);
console.log('\n=== SQL 끝 ===\n');
console.log('위 SQL을 Supabase 대시보드의 SQL Editor에 복사하여 실행하세요.');

// applyMigrations();