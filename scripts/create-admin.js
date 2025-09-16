// 어드민 계정 생성 스크립트
// 사용법: node scripts/create-admin.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tlytjitkokavfhwzedml.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_2CZGFNFXMtQZO8XaOYWukg_7t3vc6Nx';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createAdmin() {
  try {
    console.log('어드민 계정 생성을 시작합니다...');

    // 어드민 정보
    const adminEmail = 'admin@prompot.com';
    const adminPassword = 'Admin@123!';
    const adminName = 'PROMPOT Admin';

    // 이미 존재하는지 확인
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (existingProfile) {
      console.log('어드민 계정이 이미 존재합니다.');
      
      // 이미 어드민이므로 추가 작업 불필요
      console.log('관리자 이메일:', adminEmail);
      console.log('비밀번호를 잊으셨다면 비밀번호 재설정을 이용하세요.');
      return;
    }

    // Supabase Auth로 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        name: adminName,
        role: 'admin'
      }
    });

    if (authError) {
      console.error('Auth 사용자 생성 실패:', authError);
      return;
    }

    console.log('Auth 사용자 생성 완료:', authData.user.id);

    // profiles 테이블에 추가
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: adminEmail,
        name: adminName,
        created_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Profile 생성 실패:', profileError);
      // Auth 사용자 삭제
      await supabase.auth.admin.deleteUser(authData.user.id);
      return;
    }

    console.log('✅ 어드민 계정 생성 완료!');
    console.log('이메일:', adminEmail);
    console.log('비밀번호:', adminPassword);
    console.log('⚠️  보안을 위해 즉시 비밀번호를 변경하세요!');

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

// 스크립트 실행
createAdmin();