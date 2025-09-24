import React, { useState, useEffect } from 'react';
import Toast from './Toast';
import { useAuth } from '@/contexts/AuthContext';

interface ContactFormProps {
  supportEmail: string;
}

export default function ContactForm({ supportEmail }: ContactFormProps) {
  const { user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // 이메일 자동 설정 (로그인한 사용자 또는 기본값)
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setEmail(user.email);
    } else if (!isAuthenticated) {
      // 로그인하지 않은 사용자는 기본 이메일 사용
      setEmail('guest@prompot.com');
    }
  }, [isAuthenticated, user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 이메일이 설정되지 않은 경우 처리
    if (!email || email.trim() === '') {
      setToastMessage('이메일 정보를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      console.log('문의하기 폼 전송 시작:', {
        to: supportEmail,
        from: email,
        subject: subject,
        messageLength: message.length
      });

      // 인증 토큰 가져오기
      const token = localStorage.getItem('token');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          from: email,
          subject,
          message,
          to: supportEmail,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('API 응답 에러:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        throw new Error(data.message || '문의 접수에 실패했습니다.');
      }

      console.log('문의 접수 성공:', data);
      
      setToastMessage('문의가 성공적으로 접수되었습니다. 관리자가 확인 후 답변드리겠습니다.');
      setToastType('success');
      setShowToast(true);
      
      // 폼 초기화
      setSubject('');
      setMessage('');
    } catch (error) {
      setToastMessage('문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setToastType('error');
      setShowToast(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold mb-6">문의하기</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            제목
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="문의 제목을 입력해주세요"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            내용
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="문의하실 내용을 자세히 적어주세요"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors"
        >
          문의하기
        </button>
      </form>
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
