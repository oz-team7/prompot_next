const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'prompot7@gmail.com';
const PASSWORD = 'prompot0820^^';

async function testAdminAPIs() {
  console.log('=== Admin API 테스트 시작 ===\n');
  
  let sessionCookie = '';
  
  // 1. 먼저 로그인하여 세션 쿠키 획득
  console.log('1. 로그인 시도...');
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    
    const loginData = await loginRes.json();
    console.log('로그인 응답:', loginRes.status, loginData);
    
    // 쿠키 추출
    const setCookie = loginRes.headers.get('set-cookie');
    if (setCookie) {
      sessionCookie = setCookie;
      console.log('✅ 세션 쿠키 획득됨');
    }
  } catch (error) {
    console.error('❌ 로그인 에러:', error.message);
  }
  
  // 2. /api/admin/stats 테스트
  console.log('\n2. /api/admin/stats 테스트...');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: {
        'Cookie': sessionCookie,
      },
      credentials: 'include',
    });
    
    console.log('응답 상태:', res.status);
    console.log('응답 헤더:', res.headers.raw());
    
    const data = await res.json();
    console.log('응답 데이터:', JSON.stringify(data, null, 2));
    
    if (res.ok) {
      console.log('✅ Stats API 성공');
    } else {
      console.log('❌ Stats API 실패:', data.message);
    }
  } catch (error) {
    console.error('❌ Stats API 에러:', error);
  }
  
  // 3. /api/admin/users 테스트
  console.log('\n3. /api/admin/users 테스트...');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/users?page=1&limit=5`, {
      headers: {
        'Cookie': sessionCookie,
      },
      credentials: 'include',
    });
    
    console.log('응답 상태:', res.status);
    
    const data = await res.json();
    console.log('응답 데이터:', JSON.stringify(data, null, 2));
    
    if (res.ok) {
      console.log('✅ Users API 성공');
      console.log(`- 총 사용자 수: ${data.totalCount}`);
      console.log(`- 현재 페이지 사용자 수: ${data.users?.length || 0}`);
    } else {
      console.log('❌ Users API 실패:', data.message);
    }
  } catch (error) {
    console.error('❌ Users API 에러:', error);
  }
  
  // 4. /api/admin/prompts 테스트
  console.log('\n4. /api/admin/prompts 테스트...');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/prompts?page=1&limit=5`, {
      headers: {
        'Cookie': sessionCookie,
      },
      credentials: 'include',
    });
    
    console.log('응답 상태:', res.status);
    
    const data = await res.json();
    console.log('응답 데이터:', JSON.stringify(data, null, 2));
    
    if (res.ok) {
      console.log('✅ Prompts API 성공');
      console.log(`- 총 프롬프트 수: ${data.totalCount}`);
      console.log(`- 현재 페이지 프롬프트 수: ${data.prompts?.length || 0}`);
    } else {
      console.log('❌ Prompts API 실패:', data.message);
    }
  } catch (error) {
    console.error('❌ Prompts API 에러:', error);
  }
  
  // 5. /api/admin/reports 테스트
  console.log('\n5. /api/admin/reports 테스트...');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/reports?page=1&limit=5`, {
      headers: {
        'Cookie': sessionCookie,
      },
      credentials: 'include',
    });
    
    console.log('응답 상태:', res.status);
    
    const data = await res.json();
    console.log('응답 데이터:', JSON.stringify(data, null, 2));
    
    if (res.ok) {
      console.log('✅ Reports API 성공');
      console.log(`- 총 신고 수: ${data.totalCount}`);
      console.log(`- 현재 페이지 신고 수: ${data.reports?.length || 0}`);
    } else {
      console.log('❌ Reports API 실패:', data.message);
    }
  } catch (error) {
    console.error('❌ Reports API 에러:', error);
  }
  
  // 6. /api/admin/logs 테스트
  console.log('\n6. /api/admin/logs 테스트...');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/logs?page=1&limit=5`, {
      headers: {
        'Cookie': sessionCookie,
      },
      credentials: 'include',
    });
    
    console.log('응답 상태:', res.status);
    
    const data = await res.json();
    console.log('응답 데이터:', JSON.stringify(data, null, 2));
    
    if (res.ok) {
      console.log('✅ Logs API 성공');
      console.log(`- 총 로그 수: ${data.totalCount}`);
      console.log(`- 현재 페이지 로그 수: ${data.logs?.length || 0}`);
    } else {
      console.log('❌ Logs API 실패:', data.message);
    }
  } catch (error) {
    console.error('❌ Logs API 에러:', error);
  }
  
  // 7. /api/admin/system 테스트
  console.log('\n7. /api/admin/system 테스트...');
  try {
    const res = await fetch(`${BASE_URL}/api/admin/system`, {
      headers: {
        'Cookie': sessionCookie,
      },
      credentials: 'include',
    });
    
    console.log('응답 상태:', res.status);
    
    const data = await res.json();
    console.log('응답 데이터:', JSON.stringify(data, null, 2));
    
    if (res.ok) {
      console.log('✅ System API 성공');
      console.log(`- Node 버전: ${data.nodeVersion}`);
      console.log(`- 업타임: ${data.uptime}초`);
    } else {
      console.log('❌ System API 실패:', data.message);
    }
  } catch (error) {
    console.error('❌ System API 에러:', error);
  }
  
  // 8. Supabase 직접 쿼리 테스트
  console.log('\n8. Supabase 직접 쿼리 테스트...');
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    'https://tlytjitkokavfhwzedml.supabase.co',
    'sb_secret_2CZGFNFXMtQZO8XaOYWukg_7t3vc6Nx'
  );
  
  try {
    // 간단한 쿼리
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .limit(5);
      
    if (error) {
      console.log('❌ Supabase 직접 쿼리 실패:', error);
    } else {
      console.log('✅ Supabase 직접 쿼리 성공');
      console.log(`- 조회된 프로필 수: ${profiles.length}`);
    }
  } catch (error) {
    console.error('❌ Supabase 에러:', error);
  }
  
  console.log('\n=== 테스트 완료 ===');
}

// 서버가 실행 중인지 확인
fetch(BASE_URL)
  .then(() => {
    console.log('서버가 실행 중입니다. 테스트를 시작합니다.\n');
    testAdminAPIs();
  })
  .catch(() => {
    console.log('❌ 서버가 실행되고 있지 않습니다. npm run dev로 서버를 먼저 실행하세요.');
  });