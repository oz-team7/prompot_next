import { useState } from 'react';

interface SharePromptProps {
  promptId: string;
  title: string;
}

export default function SharePrompt({ promptId, title }: SharePromptProps) {
  const [copied, setCopied] = useState(false);
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/prompt/${promptId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('URL 복사 실패:', err);
    }
  };

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-lg font-medium mb-3">공유하기</h3>
      
      {/* URL 복사 */}
      <div className="flex items-center gap-2 mb-4">
        <input 
          type="text" 
          value={url} 
          readOnly 
          className="flex-1 p-3 border rounded-lg text-sm"
        />
        <button
          onClick={handleCopyLink}
          className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
          title={copied ? '복사됨!' : 'URL 복사'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
