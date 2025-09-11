import { NextPageContext } from 'next';
import { useEffect } from 'react';

interface ErrorProps {
  statusCode?: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

function Error({ statusCode, hasGetInitialPropsRun, err }: ErrorProps) {
  useEffect(() => {
    console.error('Error page rendered:', { statusCode, err });
  }, [statusCode, err]);

  return (
    <div className="min-h-screen bg-orange-50/20 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {statusCode ? `오류 ${statusCode}` : '오류가 발생했습니다'}
          </h1>
          <p className="text-gray-600 mb-6">
            {statusCode === 404 
              ? '요청하신 페이지를 찾을 수 없습니다.'
              : statusCode === 500
              ? '서버 내부 오류가 발생했습니다.'
              : '예상치 못한 오류가 발생했습니다.'
            }
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
            >
              홈으로 돌아가기
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              페이지 새로고침
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && err && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                개발자 정보 (클릭하여 펼치기)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                {err.stack || err.message}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
