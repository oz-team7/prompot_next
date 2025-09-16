// 어드민 계정 삭제 스크립트
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tlytjitkokavfhwzedml.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_2CZGFNFXMtQZO8XaOYWukg_7t3vc6Nx';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function deleteAdmin() {
  try {
    // 특정 사용자 ID로 삭제
    const userId = 'c5d38a9f-f287-40b2-b5e1-912557e284b2';
    
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      console.error('삭제 실패:', error);
    } else {
      console.log('사용자 삭제 완료');
    }
  } catch (error) {
    console.error('오류:', error);
  }
}

deleteAdmin();