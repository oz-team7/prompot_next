import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TestSupabase() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const testConnection = async () => {
    try {
      setStatus('연결 테스트 중...');
      setError('');
      
      // 간단한 쿼리 테스트
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase 연결 테스트</h1>
      <button 
        onClick={testConnection}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        연결 테스트
      </button>
      
      {status && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <strong>상태:</strong> {status}
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          <strong>오류:</strong> {error}
        </div>
      )}
    </div>
  );
}
