import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [emailConfirmationEmail, setEmailConfirmationEmail] = useState('');

  // URL에서 이메일 인증 완료 상태 확인
  useEffect(() => {
    const { email_confirmed, email } = router.query;
    
    if (email_confirmed === 'true' && email) {
      setShowEmailConfirmation(true);
      setEmailConfirmationEmail(email as string);
      
      // URL 파라미터 정리
      router.replace('/login', undefined, { shallow: true });
    }
  }, [router.query, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      
      // 성공: 홈 또는 returnUrl로 이동
      const returnUrl = (router.query.returnUrl as string) || '/';
      router.push(returnUrl);
    } catch (err: any) {
      setError(err?.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailConfirmationClose = () => {
    setShowEmailConfirmation(false);
    setEmailConfirmationEmail('');
  };

  return (
    <>
      <Header />
      
      {/* 이메일 인증 완료 팝업 */}
      {showEmailConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">이메일 인증 완료! 🎉</h2>
              <button
                onClick={handleEmailConfirmationClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              
              <p className="text-gray-700 text-center">
                <strong>{emailConfirmationEmail}</strong> 계정의<br />
                <strong className="text-green-600">이메일 인증이 완료되었습니다!</strong>
              </p>
              
              <p className="text-gray-600 text-center mt-2 text-sm">
                이제 로그인하실 수 있습니다.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleEmailConfirmationClose}
                className="flex-1 py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-center mb-8">로그인</h1>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="이메일을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <div>
                <Link href="/signup" className="text-primary hover:text-orange-600">
                  계정이 없으신가요? 회원가입
                </Link>
              </div>
              <div>
                <Link href="/reset-password" className="text-sm text-gray-600 hover:text-gray-800">
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
            </div>

            <div className="mt-4 text-center text-sm text-gray-600">
              테스트 계정: test@example.com / password
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default LoginPage;
