// 기존 사용자에게 어드민 권한 부여
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tlytjitkokavfhwzedml.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_2CZGFNFXMtQZO8XaOYWukg_7t3vc6Nx';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setAdminRole() {
  try {
    const adminEmail = 'prompot7@gmail.com';
    
    // 먼저 해당 이메일의 프로필 찾기
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', adminEmail)
      .single();
    
    if (profileError || !profile) {
      console.error('사용자를 찾을 수 없습니다:', profileError);
      return;
    }
    
    console.log('사용자 찾음:', profile.id, profile.email);
    
    // 현재는 role 컬럼이 없으므로 admin@prompot.com 이메일로 어드민 구분
    // 대신 이메일을 admin@prompot.com으로 변경하거나
    // 또는 admin_users 테이블을 별도로 만들어 관리
    
    console.log('✅ 현재 시스템은 admin@prompot.com 이메일로 어드민을 구분합니다.');
    console.log('📌 prompot7@gmail.com 계정을 어드민으로 인식하려면:');
    console.log('1. src/pages/api/admin/stats.ts의 29번째 줄 수정');
    console.log('2. src/pages/api/admin/users.ts의 29번째 줄 수정');
    console.log('3. src/pages/admin.tsx의 75번째 줄 수정');
    console.log('');
    console.log('이메일을 다음과 같이 변경하세요:');
    console.log("if (error || !profile || profile.email !== 'prompot7@gmail.com') {");
    
  } catch (error) {
    console.error('오류:', error);
  }
}

setAdminRole();