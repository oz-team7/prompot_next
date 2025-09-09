import React, { useState } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';

interface AITool {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  url: string;
}

const ToolsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const aiTools: AITool[] = [
    // 대화형 AI
    { id: 'chatgpt', name: 'ChatGPT', icon: '/image/icon_chatgpt.png', description: 'OpenAI의 대화형 AI 어시스턴트', category: '대화형 AI', url: 'https://chat.openai.com' },
    { id: 'claude', name: 'Claude', icon: '/image/icon_claude.png', description: 'Anthropic의 안전하고 유용한 AI 어시스턴트', category: '대화형 AI', url: 'https://claude.ai' },
    { id: 'gemini', name: 'Gemini', icon: '/image/icon_gemini.png', description: 'Google의 멀티모달 AI', category: '대화형 AI', url: 'https://gemini.google.com' },
    { id: 'perplexity', name: 'Perplexity', icon: '/image/icon_perplexity.png', description: 'AI 기반 검색 엔진', category: '대화형 AI', url: 'https://perplexity.ai' },
    { id: 'mistral', name: 'Mistral Large', icon: '/image/icon_mistrallarge.png', description: '오픈소스 기반 고성능 AI', category: '대화형 AI', url: 'https://mistral.ai' },
    { id: 'clovax', name: 'Clova X', icon: '/image/icon_clovax.png', description: '네이버의 한국어 특화 AI', category: '대화형 AI', url: 'https://clova-x.naver.com' },
    { id: 'wrtn', name: 'WRTN', icon: '/image/icon_wrtn.png', description: '라이팅 전문 AI 어시스턴트', category: '대화형 AI', url: 'https://wrtn.ai' },
    
    // 코딩 AI
    { id: 'claude_artifacts', name: 'Claude Artifacts', icon: '/image/icon_claude_artifacts.png', description: '코드 실행 가능한 Claude', category: '코딩 AI', url: 'https://claude.ai' },
    { id: 'gpt4_code', name: 'GPT-4 Code', icon: '/image/icon_gpt-4_code.png', description: '고급 코드 생성 AI', category: '코딩 AI', url: 'https://chat.openai.com' },
    { id: 'cursor', name: 'Cursor', icon: '/image/icon_cursor-ai.png', description: 'AI 페어 프로그래밍 에디터', category: '코딩 AI', url: 'https://cursor.sh' },
    { id: 'v0', name: 'v0', icon: '/image/icon_v0.png', description: 'Vercel의 UI 컴포넌트 생성 AI', category: '코딩 AI', url: 'https://v0.dev' },
    { id: 'bolt', name: 'Bolt', icon: '/image/icon_bolt-new.png', description: '풀스택 웹 개발 AI', category: '코딩 AI', url: 'https://bolt.new' },
    { id: 'replit', name: 'Replit', icon: '/image/icon_Replit.png', description: 'AI 지원 온라인 코딩 플랫폼', category: '코딩 AI', url: 'https://replit.com' },
    { id: 'lovable', name: 'Lovable', icon: '/image/icon_lovable.png', description: 'AI 웹 앱 빌더', category: '코딩 AI', url: 'https://lovable.dev' },
    
    // 이미지 생성 AI
    { id: 'midjourney', name: 'Midjourney', icon: '/image/icon_midjourney.png', description: '고품질 아트워크 생성 AI', category: '이미지 생성', url: 'https://midjourney.com' },
    { id: 'dalle3', name: 'DALL·E 3', icon: '/image/icon_dall_e_3.png', description: 'OpenAI의 이미지 생성 AI', category: '이미지 생성', url: 'https://openai.com/dall-e-3' },
    { id: 'stable_diffusion', name: 'Stable Diffusion', icon: '/image/icon_Stable_Diffusion.png', description: '오픈소스 이미지 생성 AI', category: '이미지 생성', url: 'https://stability.ai' },
    { id: 'leonardo_ai', name: 'Leonardo AI', icon: '/image/icon_leonardo_ai.png', description: '게임 에셋 전문 이미지 AI', category: '이미지 생성', url: 'https://leonardo.ai' },
    { id: 'imagefx', name: 'ImageFX', icon: '/image/icon_imageFX.png', description: 'Google의 이미지 생성 도구', category: '이미지 생성', url: 'https://aitestkitchen.withgoogle.com/tools/image-fx' },
    { id: 'whisk', name: 'Whisk', icon: '/image/icon_whisk.png', description: '이미지 리믹싱 AI', category: '이미지 생성', url: 'https://whisk.com' },
    { id: 'controlnet', name: 'ControlNet', icon: '/image/icon_controlnet.png', description: '정밀한 이미지 제어 AI', category: '이미지 생성', url: 'https://github.com/lllyasviel/ControlNet' },
    
    // 비디오 생성 AI
    { id: 'sora', name: 'Sora', icon: '/image/icon_Sora.png', description: 'OpenAI의 텍스트-비디오 AI', category: '비디오 생성', url: 'https://openai.com/sora' },
    { id: 'runway', name: 'Runway', icon: '/image/icon_runway.png', description: '크리에이티브 AI 도구 모음', category: '비디오 생성', url: 'https://runwayml.com' },
    { id: 'pika', name: 'Pika Labs', icon: '/image/icon_PikaLabs.png', description: '텍스트로 비디오 생성', category: '비디오 생성', url: 'https://pika.art' },
    { id: 'kling', name: 'Kling', icon: '/image/icon_kling.png', description: '중국 콰이쇼우의 비디오 AI', category: '비디오 생성', url: 'https://kling.kuaishou.com' },
    { id: 'heygen', name: 'HeyGen', icon: '/image/icon_heygen.png', description: 'AI 아바타 비디오 생성', category: '비디오 생성', url: 'https://heygen.com' },
    { id: 'synthesia', name: 'Synthesia', icon: '/image/icon_synthesia.png', description: 'AI 비디오 플랫폼', category: '비디오 생성', url: 'https://synthesia.io' },
    { id: 'elevenlabs', name: 'ElevenLabs', icon: '/image/icon_ElevenLabs.png', description: 'AI 음성 생성 및 더빙', category: '비디오 생성', url: 'https://elevenlabs.io' },
    { id: 'pictory', name: 'Pictory', icon: '/image/icon_pictory_logo.png', description: '텍스트를 비디오로 변환', category: '비디오 생성', url: 'https://pictory.ai' },
    { id: 'flexclip', name: 'FlexClip', icon: '/image/icon_flexclip.png', description: 'AI 비디오 편집 도구', category: '비디오 생성', url: 'https://flexclip.com' },
    { id: 'pollo', name: 'Pollo AI', icon: '/image/icon_pollo-ai.png', description: 'AI 비디오 생성기', category: '비디오 생성', url: 'https://pollo.ai' },
    
    // 라이팅 AI
    { id: 'copy_ai', name: 'Copy.ai', icon: '/image/icon_Copy-ai.png', description: '마케팅 카피 생성 AI', category: '라이팅 AI', url: 'https://copy.ai' },
    { id: 'jasper', name: 'Jasper', icon: '/image/icon_jasper.png', description: '기업용 콘텐츠 생성 AI', category: '라이팅 AI', url: 'https://jasper.ai' },
  ];

  const categories = ['all', '대화형 AI', '코딩 AI', '이미지 생성', '비디오 생성', '라이팅 AI'];
  
  const filteredTools = selectedCategory === 'all' 
    ? aiTools 
    : aiTools.filter(tool => tool.category === selectedCategory);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* 헤더 섹션 */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">AI Tools</h1>
            <p className="text-gray-600 text-lg">
              다양한 AI 도구의 정보를 확인하세요.
            </p>
          </div>

          {/* 카테고리 필터 */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category === 'all' ? '전체' : category}
                <span className="ml-2 text-xs">
                  ({category === 'all' ? aiTools.length : aiTools.filter(t => t.category === category).length})
                </span>
              </button>
            ))}
          </div>

          {/* AI 도구 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTools.map(tool => (
              <div
                key={tool.id}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white backdrop-blur-sm"
                data-category={tool.category}
              >
                <div className="flex items-center mb-3">
                  <div className="relative w-8 h-8 mr-3">
                    <Image
                      src={tool.icon}
                      alt={tool.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="font-medium text-lg">{tool.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {tool.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {tool.category}
                  </span>
                </div>
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm inline-flex items-center"
                >
                  방문하기
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-1 h-3 w-3"
                  >
                    <path d="M15 3h6v6"></path>
                    <path d="M10 14 21 3"></path>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  </svg>
                </a>
              </div>
            ))}
          </div>

        </div>
      </main>
    </>
  );
};

export default ToolsPage;