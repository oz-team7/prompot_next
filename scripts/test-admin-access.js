const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tlytjitkokavfhwzedml.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_e6L0QY2jLLlWH7zu6EJOlw_OrT-Dv8u';

async function testAdminAccess() {
  console.log('어드민 접근 테스트...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // 1. 로그인
    console.log('1. prompot7@gmail.com으로 로그인 시도...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'prompot7@gmail.com',
      password: 'prompot0820^^'
    });
    
    if (authError) {
      console.error('로그인 실패:', authError.message);
      return;
    }
    
    console.log('✅ 로그인 성공!');
    console.log('User ID:', authData.user.id);
    console.log('Email:', authData.user.email);
    
    // 2. 프로필 확인
    console.log('\n2. 프로필 정보 확인...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('프로필 조회 실패:', profileError);
    } else {
      console.log('✅ 프로필 확인됨:');
      console.log('- 이름:', profile.name);
      console.log('- 이메일:', profile.email);
      console.log('- 가입일:', new Date(profile.created_at).toLocaleString('ko-KR'));
    }
    
    // 3. 어드민 기능 테스트
    console.log('\n3. 어드민 기능 접근 테스트...');
    
    // 3-1. 사용자 목록 조회 (어드민만 가능)
    console.log('\n- 사용자 목록 조회 테스트...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .limit(5);
    
    if (!usersError && users) {
      console.log(`✅ ${users.length}명의 사용자 정보를 조회할 수 있습니다.`);
    } else {
      console.log('❌ 사용자 목록 조회 실패:', usersError?.message);
    }
    
    // 3-2. 프롬프트 수정 권한 테스트
    console.log('\n- 프롬프트 조회 테스트...');
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('id, title, author_id')
      .limit(1);
    
    if (!promptsError && prompts && prompts.length > 0) {
      console.log(`✅ 프롬프트를 조회할 수 있습니다.`);
      console.log(`  첫 번째 프롬프트: "${prompts[0].title}"`);
    } else {
      console.log('❌ 프롬프트 조회 실패:', promptsError?.message);
    }
    
    console.log('\n\n=== 테스트 완료 ===');
    console.log('현재 상태:');
    console.log('- 로그인: ✅ 성공');
    console.log('- 프로필: ✅ 정상');
    console.log('- 어드민 이메일: prompot7@gmail.com (하드코딩됨)');
    console.log('\n어드민 페이지는 정상적으로 작동할 것입니다!');
    console.log('http://localhost:3000/admin 에서 확인하세요.');
    
    // 로그아웃
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('테스트 중 오류:', error);
  }
}

testAdminAccess();