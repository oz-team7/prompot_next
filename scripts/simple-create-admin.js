// 간단한 어드민 계정 생성 (회원가입 API 사용)
const fetch = require('node-fetch');

async function createAdmin() {
  try {
    console.log('어드민 계정을 생성합니다...');
    
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@prompot.com',
        password: 'Admin@123!',
        name: 'PROMPOT Admin'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ 어드민 계정 생성 완료!');
      console.log('이메일: admin@prompot.com');
      console.log('비밀번호: Admin@123!');
      console.log('⚠️  보안을 위해 즉시 비밀번호를 변경하세요!');
    } else {
      console.error('생성 실패:', data.message);
    }
  } catch (error) {
    console.error('오류:', error.message);
  }
}

createAdmin();