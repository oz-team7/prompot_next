import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '@/components/Header';
import Toast from '@/components/Toast';

const ForgotPasswordPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isSuccess, setIsSuccess] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // 필드별 유효성 검사 상태
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    username: '',
  });

  // 필드가 터치되었는지 추적
  const [touched, setTouched] = useState({
    email: false,
    username: false,
  });

  // 이메일 유효성 검사 함수
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 실시간 유효성 검사
  React.useEffect(() => {
    const newErrors = {
      email: '',
      username: '',
    };

    // 이메일 검증
    if (touched.email && formData.email && !validateEmail(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    // 사용자명 검증
    if (touched.username && formData.username && formData.username.length < 2) {
      newErrors.username = '사용자명은 2자 이상이어야 합니다.';
    }

    setFieldErrors(newErrors);
  }, [formData, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleBlur = (fieldName: string) => {
    setTouched({
      ...touched,
      [fieldName]: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 모든 필드를 터치 상태로 변경
    setTouched({
      email: true,
      username: true,
    });
    
    // 유효성 검사
    if (!formData.email || !validateEmail(formData.email)) {
      setError('올바른 이메일을 입력해주세요.');
      return;
    }
    
    if (!formData.username || formData.username.length < 2) {
      setError('사용자명을 입력해주세요.');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '비밀번호 찾기 중 오류가 발생했습니다.');
      }

      // 성공 시 임시 비밀번호 표시
      setIsSuccess(true);
      setTempPassword(data.tempPassword);
      setToastMessage('임시 비밀번호가 생성되었습니다. 로그인 후 비밀번호를 변경해주세요.');
      setToastType('success');
      setShowToast(true);

    } catch (error: any) {
      setError(error.message);
      setToastMessage(error.message);
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // 2초 후 복사 성공 상태 해제
    } catch (err) {
      console.error('복사 실패:', err);
      // 폴백: 텍스트 선택 방식
      const textArea = document.createElement('textarea');
      textArea.value = tempPassword;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (isSuccess) {
    return (
      <>
        <Header />
        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
          />
        )}
        <main className="min-h-screen bg-orange-50/20 pt-20 flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">비밀번호 찾기 완료</h1>
                <p className="text-gray-600">임시 비밀번호가 생성되었습니다.</p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-orange-800 mb-2">임시 비밀번호</h3>
                <div className="bg-white border border-orange-300 rounded p-3 mb-3 flex items-center justify-between">
                  <code className="text-lg font-mono text-gray-800 break-all flex-1">{tempPassword}</code>
                  <button
                    onClick={copyToClipboard}
                    className="ml-3 p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="복사하기"
                  >
                    {copySuccess ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                {copySuccess && (
                  <p className="text-sm text-green-600 mb-2">
                    ✅ 클립보드에 복사되었습니다!
                  </p>
                )}
                <p className="text-sm text-orange-700">
                  ⚠️ 보안을 위해 로그인 후 반드시 비밀번호를 변경해주세요.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleLogin}
                  className="w-full py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  로그인하기
                </button>
                <button
                  onClick={handleBackToLogin}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  로그인 페이지로 돌아가기
                </button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
      <main className="min-h-screen bg-orange-50/20 pt-20 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">비밀번호 찾기</h1>
              <p className="text-gray-600">이메일과 사용자명을 입력하면 임시 비밀번호를 생성해드립니다.</p>
            </div>
            
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
                  onBlur={() => handleBlur('email')}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    fieldErrors.email && touched.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="가입 시 사용한 이메일을 입력하세요"
                />
                {fieldErrors.email && touched.email && (
                  <p className="mt-1 text-sm text-red-500">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  사용자명
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={() => handleBlur('username')}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    fieldErrors.username && touched.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="가입 시 사용한 사용자명을 입력하세요"
                />
                {fieldErrors.username && touched.username && (
                  <p className="mt-1 text-sm text-red-500">{fieldErrors.username}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    처리 중...
                  </>
                ) : (
                  '임시 비밀번호 생성'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-sm text-gray-600">계정 정보를 기억하시나요? </span>
              <Link href="/login" className="text-sm text-primary hover:underline">
                로그인
              </Link>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">📋 비밀번호 찾기 안내</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 가입 시 사용한 이메일과 사용자명이 일치해야 합니다</li>
                <li>• 임시 비밀번호로 로그인 후 반드시 비밀번호를 변경해주세요</li>
                <li>• 임시 비밀번호는 한 번만 사용 가능합니다</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ForgotPasswordPage;
