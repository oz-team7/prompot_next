import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '@/components/Header';

const ConfirmResetPasswordPage = () => {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');

  useEffect(() => {
    // URL에서 모든 쿼리 파라미터 확인
    console.log('Router query:', router.query);
    
    // Supabase가 사용하는 다양한 파라미터명들 확인
    const { 
      access_token, 
      refresh_token, 
      token, 
      type,
      error,
      error_description 
    } = router.query;
    
    console.log('Extracted tokens:', { access_token, refresh_token, token, type, error, error_description });
    
    if (access_token) {
      setAccessToken(access_token as string);
      console.log('Access token set:', access_token);
    }
    
    if (refresh_token) {
      setRefreshToken(refresh_token as string);
      console.log('Refresh token set:', refresh_token);
    }

    // 에러가 있는 경우 표시
    if (error) {
      setMessage(`오류: ${error_description || error}`);
    }
  }, [router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setMessage('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (!accessToken) {
      setMessage('유효하지 않은 링크입니다. access_token이 없습니다.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      console.log('비밀번호 업데이트 시도:', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });
      
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password,
          access_token: accessToken
        }),
      });

      const data = await res.json();
      console.log('Password update response:', data);

      if (res.ok) {
        setIsSuccess(true);
        setMessage(data.message);
      } else {
        setMessage(data.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Password update error:', error);
      setMessage('서버 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 디버깅 정보 표시 (개발 환경에서만)
  const showDebugInfo = process.env.NODE_ENV === 'development';

  if (!accessToken) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">유효하지 않은 링크</h1>
              <p className="text-gray-600 mb-6">
                비밀번호 재설정 링크가 유효하지 않거나 만료되었습니다.
              </p>
              
              {showDebugInfo && (
                <div className="mb-4 p-3 bg-gray-100 rounded text-left text-sm">
                  <p><strong>Debug Info:</strong></p>
                  <p>Access Token: {accessToken ? '있음' : '없음'}</p>
                  <p>Refresh Token: {refreshToken ? '있음' : '없음'}</p>
                  <p>Query Params: {JSON.stringify(router.query)}</p>
                </div>
              )}
              
              <Link href="/reset-password" className="text-primary hover:text-orange-600">
                비밀번호 재설정 다시 요청하기
              </Link>
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
            <h1 className="text-2xl font-bold text-center mb-8">새 비밀번호 설정</h1>

            {message && (
              <div className={`mb-4 p-3 rounded ${
                isSuccess 
                  ? 'bg-green-100 border border-green-400 text-green-700' 
                  : 'bg-red-100 border border-red-400 text-red-700'
              }`}>
                {message}
              </div>
            )}

            {!isSuccess ? (
              <>
                <p className="text-gray-600 text-center mb-6">
                  새로운 비밀번호를 입력해주세요.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      새 비밀번호
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="새 비밀번호를 입력하세요 (최소 6자)"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      새 비밀번호 확인
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="새 비밀번호를 다시 입력하세요"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '비밀번호 변경 중...' : '비밀번호 변경'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-6">
                  비밀번호가 성공적으로 변경되었습니다!
                </p>
                <Link href="/login">
                  <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors">
                    로그인하기
                  </button>
                </Link>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link href="/login" className="text-primary hover:text-orange-600">
                로그인으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ConfirmResetPasswordPage;
