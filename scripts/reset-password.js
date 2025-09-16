// 비밀번호 재설정
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tlytjitkokavfhwzedml.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_2CZGFNFXMtQZO8XaOYWukg_7t3vc6Nx';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function resetPassword() {
  try {
    const email = 'prompot7@gmail.com';
    const newPassword = 'prompot0820^^';
    
    // 먼저 사용자 찾기
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('사용자 목록 조회 실패:', listError);
      return;
    }
    
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.log('사용자를 찾을 수 없습니다. 새로 생성합니다...');
      
      // 사용자 생성
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          name: 'PROMPOT Admin'
        }
      });
      
      if (createError) {
        console.error('사용자 생성 실패:', createError);
        return;
      }
      
      console.log('✅ 사용자 생성 완료!');
      console.log('ID:', newUser.user.id);
      console.log('이메일:', email);
      
      // profiles 테이블에 추가
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUser.user.id,
          email: email,
          name: 'PROMPOT Admin',
          created_at: new Date().toISOString()
        });
        
      if (profileError) {
        console.error('프로필 생성 실패:', profileError);
      } else {
        console.log('프로필 생성 완료!');
      }
      
    } else {
      // 비밀번호 업데이트
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );
      
      if (updateError) {
        console.error('비밀번호 업데이트 실패:', updateError);
        return;
      }
      
      console.log('✅ 비밀번호가 업데이트되었습니다!');
      console.log('이메일:', email);
    }
    
    console.log('비밀번호:', newPassword);
    console.log('');
    console.log('이제 http://localhost:3000/admin 에서 로그인할 수 있습니다.');
    
  } catch (error) {
    console.error('오류:', error);
  }
}

resetPassword();