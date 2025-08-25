import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '@/components/Header';

const ResetPasswordPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        setMessage(data.message);
      } else {
        setIsSuccess(false);
        setMessage(data.message || '비밀번호 재설정 이메일 발송에 실패했습니다.');
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage('서버 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-center mb-8">비밀번호 재설정</h1>

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
                  가입한 이메일 주소를 입력하시면<br />
                  비밀번호 재설정 링크를 보내드립니다.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      이메일 주소
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="이메일을 입력하세요"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '이메일 발송 중...' : '비밀번호 재설정 이메일 보내기'}
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
                  비밀번호 재설정 이메일이 발송되었습니다.<br />
                  이메일을 확인하여 링크를 클릭해주세요.
                </p>
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setMessage('');
                    setEmail('');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  다시 시도
                </button>
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

export default ResetPasswordPage;
