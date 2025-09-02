import React, { useState } from 'react';
import Toast from './Toast';

interface ContactFormProps {
  supportEmail: string;
}

export default function ContactForm({ supportEmail }: ContactFormProps) {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setToastMessage('올바른 이메일 주소를 입력해주세요.');
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

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        throw new Error(data.message || '메일 전송에 실패했습니다.');
      }

      console.log('메일 전송 성공:', data);
      
      setToastMessage('메일이 성공적으로 전송되었습니다.');
      setToastType('success');
      setShowToast(true);
      
      // 폼 초기화
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error) {
      setToastMessage('메일 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setToastType('error');
      setShowToast(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold mb-6">문의하기</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            답장 받을 이메일 주소
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your@email.com"
          />
        </div>
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="문의하실 내용을 자세히 적어주세요"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
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
