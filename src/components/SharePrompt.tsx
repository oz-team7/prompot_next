import { useState } from 'react';
import { FaInstagram, FaFacebook } from 'react-icons/fa';
import { RiKakaoTalkFill } from 'react-icons/ri';

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

      {/* 소셜 미디어 공유 버튼 */}
      <div className="flex gap-4 justify-center">
        <a 
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="페이스북에 공유하기"
        >
          <FaFacebook size={24} className="text-[#1877f2]" />
        </a>
        <a
          href={`https://instagram.com/share?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="인스타그램에 공유하기"
        >
          <FaInstagram size={24} className="text-[#e4405f]" />
        </a>
        <a
          href={`https://talk-apps.kakao.com/scheme/chat/send?text=${encodeURIComponent(`${title}\n${url}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="카카오톡으로 공유하기"
        >
          <RiKakaoTalkFill size={24} className="text-[#391B1B]" />
        </a>
      </div>
    </div>
  );
}
