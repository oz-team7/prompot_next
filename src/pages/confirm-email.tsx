import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '@/components/Header';

const ConfirmEmailPage = () => {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // URL에서 이메일과 토큰 파라미터 확인
    const { email, token, type } = router.query;
    
    if (email) {
      // 이메일 인증 완료 처리
      setStatus('success');
      setMessage(`${email} 계정의 이메일 인증이 완료되었습니다!`);
      
      // 5초 카운트다운 후 로그인 페이지로 이동
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // 현재 도메인을 기반으로 로그인 페이지 URL 생성
            const loginUrl = `${window.location.origin}/login?email_confirmed=true&email=${encodeURIComponent(email as string)}`;
            router.push(loginUrl);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setStatus('error');
      setMessage('잘못된 접근입니다.');
    }
  }, [router.query, router]);

  const handleGoToLogin = () => {
    const { email } = router.query;
    // 현재 도메인을 기반으로 로그인 페이지 URL 생성
    const loginUrl = `${window.location.origin}/login?email_confirmed=true&email=${encodeURIComponent(email as string)}`;
    router.push(loginUrl);
  };

  if (status === 'loading') {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">이메일 인증 확인 중...</h2>
              <p className="text-gray-600">잠시만 기다려주세요.</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            
            {/* 성공 메시지 */}
            {status === 'success' && (
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">이메일 인증 완료! 🎉</h1>
                <p className="text-gray-700 mb-4">{message}</p>
                
                {/* 자동 이동 안내 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800 text-sm">
                    <strong>{countdown}초 후</strong> 로그인 페이지로 자동 이동합니다.
                  </p>
                </div>
              </div>
            )}

            {/* 오류 메시지 */}
            {status === 'error' && (
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-red-900 mb-2">인증 오류</h1>
                <p className="text-red-700">{message}</p>
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="space-y-3">
              {status === 'success' && (
                <button
                  onClick={handleGoToLogin}
                  className="w-full py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  지금 로그인 페이지로 이동
                </button>
              )}
              
              <div className="text-center">
                <Link href="/" className="text-primary hover:text-orange-600 text-sm">
                  홈페이지로 돌아가기
                </Link>
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
};

export default ConfirmEmailPage;
