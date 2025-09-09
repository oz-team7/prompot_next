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
          className="flex-1 p-2 border rounded text-sm bg-gray-50"
        />
        <button
          onClick={handleCopyLink}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {copied ? '복사됨!' : 'URL 복사'}
        </button>
      </div>
    </div>
  );
}
