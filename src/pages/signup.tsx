import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';

const SignupPage = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [emailConfirmationEmail, setEmailConfirmationEmail] = useState('');

  // URL에서 이메일 인증 완료 상태 확인
  useEffect(() => {
    const { email_confirmed, email } = router.query;
    
    if (email_confirmed === 'true' && email) {
      setShowEmailConfirmation(true);
      setEmailConfirmationEmail(email as string);
      
      // URL 파라미터 정리
      router.replace('/signup', undefined, { shallow: true });
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

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();
      console.log('Signup response:', data);
      if (!res.ok) {
        throw new Error(data.message || '회원가입에 실패했습니다.');
      }

      setShowToast(true);

      // 이메일 확인 안내 메시지만 표시 (인증 완료 알림은 표시하지 않음)
      setTimeout(() => {
        setShowToast(false);
        // showEmailConfirmation은 실제 이메일 인증 완료 후에만 표시
      }, 3000);
    } catch (err: any) {
      setError(err.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailConfirmationClose = () => {
    setShowEmailConfirmation(false);
    setEmailConfirmationEmail('');
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-center mb-8">회원가입</h1>

            {error && (
              <div className="mb-4 p-3 rounded">
                {error.includes('이미 가입한 계정입니다') ? (
                  <div className="bg-blue-100 border border-blue-400 text-blue-700 rounded">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-blue-800 mb-1">
                          이미 가입된 계정입니다
                        </h3>
                        <p className="text-sm text-blue-700 mb-2">
                          {error}
                        </p>
                        <div className="flex space-x-2">
                          <Link href="/login" className="text-sm text-blue-600 hover:text-blue-800 underline">
                            로그인 페이지로 이동
                          </Link>
                          <button
                            onClick={() => setError('')}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            다른 이메일로 시도
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}
              </div>
            )}

            {showToast && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-green-800 mb-1">
                      회원가입이 완료되었습니다! 🎉
                    </h3>
                    <p className="text-sm text-green-700">
                      <strong>{formData.email}</strong>로 확인 이메일을 발송했습니다.<br />
                      이메일을 확인하여 인증을 완료해주세요.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {showEmailConfirmation && (
              <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">
                      이메일 인증이 완료되었습니다! 🎉
                    </h3>
                    <p className="text-sm text-blue-700 mb-3">
                      <strong>{emailConfirmationEmail}</strong> 계정의 이메일 인증이 완료되었습니다.<br />
                      이제 로그인하실 수 있습니다.
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleGoToLogin}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        로그인하기
                      </button>
                      <button
                        onClick={handleEmailConfirmationClose}
                        className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                      >
                        닫기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  이름
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="이름을 입력하세요"
                />
              </div>

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
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="비밀번호를 입력하세요 (최소 6자)"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="비밀번호를 다시 입력하세요"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '회원가입 중...' : '회원가입'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-primary hover:text-orange-600">
                이미 계정이 있으신가요? 로그인
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default SignupPage;
