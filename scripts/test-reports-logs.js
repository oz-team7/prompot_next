const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tlytjitkokavfhwzedml.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_2CZGFNFXMtQZO8XaOYWukg_7t3vc6Nx';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testReportsAndLogs() {
  console.log('=== Reports 및 Logs 테이블 직접 테스트 ===\n');
  
  // 1. Reports 테이블 테스트
  console.log('1. Reports 테이블 테스트...');
  try {
    const { data: reports, error: reportsError, count } = await supabase
      .from('reports')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (reportsError) {
      console.log('❌ Reports 쿼리 에러:', reportsError);
    } else {
      console.log('✅ Reports 쿼리 성공');
      console.log('- 전체 개수:', count);
      console.log('- 조회된 개수:', reports?.length || 0);
      if (reports && reports.length > 0) {
        console.log('- 첫 번째 레코드:', reports[0]);
      }
    }
  } catch (error) {
    console.error('Reports 에러:', error);
  }
  
  // 2. Admin Logs 테이블 테스트
  console.log('\n2. Admin Logs 테이블 테스트...');
  try {
    const { data: logs, error: logsError, count } = await supabase
      .from('admin_logs')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (logsError) {
      console.log('❌ Admin Logs 쿼리 에러:', logsError);
    } else {
      console.log('✅ Admin Logs 쿼리 성공');
      console.log('- 전체 개수:', count);
      console.log('- 조회된 개수:', logs?.length || 0);
      if (logs && logs.length > 0) {
        console.log('- 첫 번째 레코드:', logs[0]);
      }
    }
  } catch (error) {
    console.error('Admin Logs 에러:', error);
  }
  
  // 3. 테이블 구조 확인
  console.log('\n3. 테이블 구조 확인...');
  
  // Reports 테이블 열 확인
  try {
    const { data: reportsColumns, error } = await supabase
      .from('reports')
      .select('*')
      .limit(0);
    
    if (!error) {
      console.log('✅ Reports 테이블 접근 가능');
    }
  } catch (error) {
    console.error('Reports 구조 확인 에러:', error);
  }
  
  // Admin Logs 테이블 열 확인
  try {
    const { data: logsColumns, error } = await supabase
      .from('admin_logs')
      .select('*')
      .limit(0);
    
    if (!error) {
      console.log('✅ Admin Logs 테이블 접근 가능');
    }
  } catch (error) {
    console.error('Admin Logs 구조 확인 에러:', error);
  }
  
  console.log('\n=== 테스트 완료 ===');
}

testReportsAndLogs();