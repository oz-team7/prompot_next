import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  // 필드별 유효성 검사 상태
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
  });
  
  // 필드가 터치되었는지 추적
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  
  // 이메일 유효성 검사 함수
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // 실시간 유효성 검사
  useEffect(() => {
    const newErrors = {
      email: '',
      password: '',
    };

    // 이메일 검증
    if (touched.email && formData.email && !validateEmail(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    // 비밀번호 검증
    if (touched.password && formData.password.length > 0 && formData.password.length < 6) {
      newErrors.password = '비밀번호를 확인해주세요.';
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
      password: true,
    });
    
    // 유효성 검사
    if (!formData.email || !validateEmail(formData.email)) {
      setError('올바른 이메일을 입력해주세요.');
      return;
    }
    
    if (!formData.password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }
    
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      // 로그인 성공 토스트
      setToastMessage('로그인되었습니다!');
      setToastType('success');
      setShowToast(true);
      
      // 이전 페이지로 돌아가거나 홈으로 이동
      setTimeout(() => {
        const returnUrl = router.query.returnUrl as string || '/';
        router.push(returnUrl);
      }, 1000);
    } catch (error: any) {
      // 정지된 사용자인 경우
      if (error.isSuspended) {
        setError(error.message);
        // 정지 정보를 포함한 상세 알림
        setToastMessage(error.message);
        setToastType('error');
        setShowToast(true);
      } else {
        // 일반 로그인 실패
        setError(error.message);
        
        // 개발 환경에서만 상세 에러 토스트 표시
        if (process.env.NODE_ENV === 'development' && error.message.includes('서버')) {
          setToastMessage(`[개발용] ${error.message}`);
          setToastType('error');
          setShowToast(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

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
                  onBlur={() => handleBlur('email')}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    fieldErrors.email && touched.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="이메일을 입력하세요"
                />
                {fieldErrors.email && touched.email && (
                  <p className="mt-1 text-sm text-red-500">{fieldErrors.email}</p>
                )}
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
                  onBlur={() => handleBlur('password')}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    fieldErrors.password && touched.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="비밀번호를 입력하세요"
                />
                {fieldErrors.password && touched.password && (
                  <p className="mt-1 text-sm text-red-500">{fieldErrors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm text-gray-600">로그인 상태 유지</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  비밀번호 찾기
                </Link>
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
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-sm text-gray-600">계정이 없으신가요? </span>
              <Link href="/signup" className="text-sm text-primary hover:underline">
                회원가입
              </Link>
            </div>

            {/* <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google로 계속하기
              </button>

            </div> */}
          </div>

        </div>
      </main>
    </>
  );
};

export default LoginPage;