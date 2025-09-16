const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tlytjitkokavfhwzedml.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_2CZGFNFXMtQZO8XaOYWukg_7t3vc6Nx';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupAdminDirectly() {
  console.log('어드민 설정을 직접 시도합니다...\n');
  
  try {
    // 1. 먼저 admin_users 테이블에서 현재 상태 확인
    console.log('1. admin_users 테이블 확인...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('*');
    
    if (adminError) {
      console.log('admin_users 테이블을 읽을 수 없습니다:', adminError.message);
      console.log('\n테이블이 캐시에 없을 수 있습니다. Supabase 대시보드를 통해 다음 SQL을 실행하세요:\n');
      
      console.log(`-- admin_users 테이블에 어드민 추가
INSERT INTO admin_users (id, role, permissions)
VALUES ('7b03565d-b472-477c-9321-75bb442ae60e', 'super_admin', '{"full_access": true, "manage_admins": true}'::jsonb)
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin',
    permissions = '{"full_access": true, "manage_admins": true}'::jsonb;`);
      
      console.log('\n또는 다음 스크립트를 실행하여 자동 설정을 시도해보세요:');
      console.log('node scripts/setup-admin-via-api.js');
      
      return;
    }
    
    console.log('✅ admin_users 테이블에 접근 가능');
    console.log('현재 어드민 사용자:', adminUsers);
    
    // 2. prompot7@gmail.com 사용자가 어드민인지 확인
    const adminUser = adminUsers?.find(u => u.id === '7b03565d-b472-477c-9321-75bb442ae60e');
    
    if (adminUser) {
      console.log('\n✅ prompot7@gmail.com은 이미 어드민입니다!');
      console.log('Role:', adminUser.role);
      console.log('Permissions:', adminUser.permissions);
    } else {
      console.log('\n❌ prompot7@gmail.com은 아직 어드민이 아닙니다.');
      
      // 어드민 추가 시도
      console.log('\n어드민 권한 추가 중...');
      const { data: newAdmin, error: insertError } = await supabase
        .from('admin_users')
        .insert({
          id: '7b03565d-b472-477c-9321-75bb442ae60e',
          role: 'super_admin',
          permissions: {
            full_access: true,
            manage_admins: true
          }
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('어드민 추가 실패:', insertError);
      } else {
        console.log('✅ 어드민 권한이 성공적으로 추가되었습니다!');
        console.log('Admin:', newAdmin);
      }
    }
    
    // 3. 다른 테이블들도 확인
    console.log('\n\n=== 기타 테이블 상태 확인 ===');
    
    // admin_logs 확인
    const { count: logCount } = await supabase
      .from('admin_logs')
      .select('*', { count: 'exact', head: true });
    console.log(`admin_logs: ${logCount !== null ? logCount + '개 레코드' : '접근 불가'}`);
    
    // reports 확인
    const { count: reportCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });
    console.log(`reports: ${reportCount !== null ? reportCount + '개 레코드' : '접근 불가'}`);
    
    // system_settings 확인
    const { data: settings } = await supabase
      .from('system_settings')
      .select('*')
      .single();
    console.log(`system_settings: ${settings ? '설정 존재' : '설정 없음 또는 접근 불가'}`);
    
    console.log('\n\n완료! 이제 http://localhost:3000/admin 에서 로그인할 수 있습니다.');
    console.log('Email: prompot7@gmail.com');
    console.log('Password: prompot0820^^');
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

setupAdminDirectly();