const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tlytjitkokavfhwzedml.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_2CZGFNFXMtQZO8XaOYWukg_7t3vc6Nx';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  console.log('현재 데이터베이스 테이블 확인중...\n');
  
  try {
    // 현재 존재하는 테이블 목록 가져오기
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (error) {
      console.error('테이블 목록 조회 오류:', error);
      
      // 대체 방법: 각 테이블 직접 확인
      console.log('\n대체 방법으로 테이블 확인...');
      
      const tablesToCheck = [
        'profiles',
        'prompts',
        'likes',
        'bookmarks',
        'admin_users',
        'admin_logs',
        'reports',
        'system_announcements',
        'system_settings',
        'system_backups'
      ];
      
      console.log('\n=== 테이블 존재 여부 ===');
      for (const table of tablesToCheck) {
        const { error: checkError } = await supabase
          .from(table)
          .select('*')
          .limit(0);
        
        if (!checkError || checkError.code !== '42P01') {
          console.log(`✅ ${table}: 존재함`);
        } else {
          console.log(`❌ ${table}: 존재하지 않음`);
        }
      }
      
      return;
    }
    
    console.log('=== 현재 존재하는 테이블 ===');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // 필요한 어드민 테이블 확인
    const requiredAdminTables = [
      'admin_users',
      'admin_logs',
      'reports',
      'system_announcements',
      'system_settings',
      'system_backups'
    ];
    
    const existingTableNames = tables.map(t => t.table_name);
    const missingTables = requiredAdminTables.filter(t => !existingTableNames.includes(t));
    
    console.log('\n=== 어드민 기능에 필요한 테이블 ===');
    requiredAdminTables.forEach(table => {
      if (existingTableNames.includes(table)) {
        console.log(`✅ ${table}: 이미 존재`);
      } else {
        console.log(`❌ ${table}: 생성 필요`);
      }
    });
    
    if (missingTables.length > 0) {
      console.log('\n누락된 테이블:', missingTables.join(', '));
      console.log('\n테이블 생성을 위해 create-missing-tables.js를 실행하세요.');
    } else {
      console.log('\n모든 필요한 테이블이 이미 존재합니다!');
    }
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

checkTables();