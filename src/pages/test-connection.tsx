import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TestConnection() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('testpassword123');
  const [testName, setTestName] = useState('테스트 사용자');

  const testConnection = async () => {
    try {
      setStatus('연결 테스트 중...');
      setError('');
      
      // 기본 연결 테스트
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setError(`연결 오류: ${error.message}`);
        setStatus('연결 실패');
      } else {
        setStatus('연결 성공!');
        setError('');
      }
    } catch (err: any) {
      setError(`예외 오류: ${err.message}`);
      setStatus('연결 실패');
    }
  };

  const testSignup = async () => {
    try {
      setStatus('회원가입 테스트 중...');
      setError('');
      
      // 테스트 회원가입 시도
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            name: testName,
          },
          emailRedirectTo: 'http://localhost:3000/confirm-email'
        }
      });
      
      if (error) {
        setError(`회원가입 오류: ${error.message}`);
        setStatus('회원가입 실패');
      } else {
        setStatus('회원가입 테스트 성공! 이메일을 확인해주세요.');
        setError('');
      }
    } catch (err: any) {
      setError(`예외 오류: ${err.message}`);
      setStatus('회원가입 실패');
    }
  };

  const testLogin = async () => {
    try {
      setStatus('로그인 테스트 중...');
      setError('');
      
      // 테스트 로그인 시도
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      
      if (error) {
        setError(`로그인 오류: ${error.message}`);
        setStatus('로그인 실패');
      } else {
        setStatus('로그인 테스트 성공!');
        setError('');
      }
    } catch (err: any) {
      setError(`예외 오류: ${err.message}`);
      setStatus('로그인 실패');
    }
  };

  const testProfileCreation = async () => {
    try {
      setStatus('프로필 생성 테스트 중...');
      setError('');
      
      // profiles 테이블에 직접 프로필 생성 시도
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          name: testName,
          email: testEmail,
        })
        .select();
      
      if (error) {
        setError(`프로필 생성 오류: ${error.message}`);
        setStatus('프로필 생성 실패');
      } else {
        setStatus('프로필 생성 테스트 성공!');
        setError('');
      }
    } catch (err: any) {
      setError(`예외 오류: ${err.message}`);
      setStatus('프로필 생성 실패');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Supabase 연결 및 기능 테스트
      </h1>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">테스트 이메일:</label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">테스트 비밀번호:</label>
          <input
            type="password"
            value={testPassword}
            onChange={(e) => setTestPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">테스트 이름:</label>
          <input
            type="text"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={testConnection}
          className="w-full p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Supabase 연결 테스트
        </button>
        
        <button
          onClick={testSignup}
          className="w-full p-3 bg-green-500 text-white rounded hover:bg-green-600"
        >
          회원가입 테스트
        </button>
        
        <button
          onClick={testLogin}
          className="w-full p-3 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          로그인 테스트
        </button>
        
        <button
          onClick={testProfileCreation}
          className="w-full p-3 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          프로필 생성 테스트
        </button>
      </div>

      {status && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <strong>상태:</strong> {status}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>오류:</strong> {error}
        </div>
      )}
    </div>
  );
}
