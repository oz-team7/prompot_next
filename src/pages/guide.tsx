import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import ClientOnly from '@/components/ClientOnly';

interface GuideSection {
  id: string;
  title: string;
  description: string;
  steps?: {
    title: string;
    content: string;
    tip?: string;
  }[];
}

const GuidePage = () => {
  const [activeSection, setActiveSection] = useState<string>('getting-started');

  const guideSections: GuideSection[] = [
    {
      id: 'getting-started',
      title: '시작하기',
      description: 'PROMPOT을 처음 사용하시는 분들을 위한 기본 가이드',
      steps: [
        {
          title: '1. 회원가입',
          content: '홈페이지 우측 상단의 "로그인" 버튼을 클릭 후 "회원가입"을 선택합니다. 이름, 이메일, 비밀번호(6자 이상)를 입력하면 간단히 가입이 완료됩니다.',
          tip: '회원가입을 하면 프롬프트 상세 내용을 확인하고 직접 작성할 수 있습니다.'
        },
        {
          title: '2. 프롬프트 탐색',
          content: '메인 페이지에서 인기 프롬프트를 확인하거나, 상단 검색창을 통해 원하는 프롬프트를 찾아보세요. 카테고리별, AI 모델별로 필터링도 가능합니다.',
          tip: '로그인하지 않아도 프롬프트 목록은 볼 수 있지만, 상세 내용은 로그인 후 확인 가능합니다.'
        },
        {
          title: '3. AI Tools 둘러보기',
          content: '상단 메뉴의 "Tools"를 클릭하면 PROMPOT에서 지원하는 33개의 AI 도구들을 한눈에 확인할 수 있습니다. 각 도구의 공식 사이트로 바로 이동할 수 있습니다.',
          tip: '카테고리별로 필터링하여 원하는 유형의 AI 도구를 쉽게 찾을 수 있습니다.'
        }
      ]
    },
    {
      id: 'search-prompt',
      title: '프롬프트 검색하기',
      description: '효과적으로 프롬프트를 찾는 방법',
      steps: [
        {
          title: '1. 키워드 검색',
          content: '상단 검색창에 찾고자 하는 주제나 키워드를 입력하세요. 제목, 설명, 태그를 기준으로 검색됩니다.',
          tip: '구체적인 키워드를 사용하면 더 정확한 결과를 얻을 수 있습니다.'
        },
        {
          title: '2. 카테고리 필터',
          content: '업무/마케팅, 개발/코드, 디자인/브랜드, 교육/학습, 이미지/동영상 중 원하는 카테고리를 선택하여 필터링할 수 있습니다.',
          tip: '여러 필터를 조합하여 더 정확한 결과를 얻을 수 있습니다.'
        },
        {
          title: '3. AI 모델별 검색',
          content: '특정 AI 도구(ChatGPT, Claude, Midjourney 등)에 최적화된 프롬프트만 보고 싶다면 AI 모델 필터를 사용하세요.',
          tip: 'AI 모델 아이콘으로 쉽게 구분할 수 있습니다.'
        },
        {
          title: '4. 정렬 옵션',
          content: '최신순, 인기순으로 정렬하여 원하는 프롬프트를 빠르게 찾을 수 있습니다.',
          tip: '인기순은 좋아요와 북마크 수를 기준으로 정렬됩니다.'
        }
      ]
    },
    {
      id: 'create-prompt',
      title: '프롬프트 작성하기',
      description: '나만의 프롬프트를 만들고 공유하는 방법',
      steps: [
        {
          title: '1. 작성 페이지 이동',
          content: '로그인 후 "Prompt" 메뉴에서 "+ New" 버튼을 클릭하거나, 마이페이지에서 "프롬프트 작성" 버튼을 클릭합니다.',
          tip: '프롬프트 작성은 로그인한 회원만 가능합니다.'
        },
        {
          title: '2. 기본 정보 입력',
          content: '제목, 카테고리, AI 모델을 선택합니다. 제목은 프롬프트의 목적을 명확히 나타내는 것이 좋습니다.',
          tip: 'AI 모델은 해당 프롬프트가 가장 잘 작동하는 도구를 선택하세요.'
        },
        {
          title: '3. 상세 내용 작성',
          content: '프롬프트에 대한 설명과 실제 프롬프트 내용을 입력합니다. 사용 방법이나 예시를 포함하면 더 좋습니다.',
          tip: '마크다운 문법을 사용하여 더 보기 좋게 작성할 수 있습니다.'
        },
        {
          title: '4. 태그 추가',
          content: '관련 키워드를 태그로 추가합니다. 쉼표로 구분하여 여러 개를 입력할 수 있습니다.',
          tip: '적절한 태그는 다른 사용자가 프롬프트를 찾는 데 도움이 됩니다.'
        },
        {
          title: '5. 미리보기 이미지',
          content: '프롬프트의 결과물이나 관련 이미지를 추가할 수 있습니다. (최대 2MB)',
          tip: '시각적인 미리보기는 프롬프트의 효과를 더 잘 전달합니다.'
        },
        {
          title: '6. 공개 설정',
          content: '공개로 설정하면 모든 회원이 검색하고 사용할 수 있고, 비공개로 설정하면 본인만 볼 수 있습니다.',
          tip: '처음에는 비공개로 테스트한 후 공개로 전환하는 것도 좋은 방법입니다.'
        }
      ]
    },
    {
      id: 'manage-prompt',
      title: '프롬프트 관리하기',
      description: '작성한 프롬프트를 수정하고 관리하는 방법',
      steps: [
        {
          title: '1. 마이페이지 접속',
          content: '로그인 후 좌측 메뉴에서 "마이페이지"를 클릭하거나, 모바일에서는 햄버거 메뉴를 통해 접속합니다.',
          tip: '마이페이지에서는 내가 작성한 모든 프롬프트를 한눈에 볼 수 있습니다.'
        },
        {
          title: '2. 프롬프트 수정',
          content: '수정하고 싶은 프롬프트의 "수정" 버튼을 클릭하면 작성 페이지와 동일한 편집 화면으로 이동합니다.',
          tip: '공개/비공개 설정도 언제든 변경할 수 있습니다.'
        },
        {
          title: '3. 프롬프트 삭제',
          content: '더 이상 필요하지 않은 프롬프트는 "삭제" 버튼으로 제거할 수 있습니다. 삭제 전 확인 메시지가 표시됩니다.',
          tip: '삭제된 프롬프트는 복구할 수 없으니 신중히 결정하세요.'
        },
        {
          title: '4. 북마크 관리',
          content: '다른 사용자의 유용한 프롬프트는 북마크에 추가하여 나중에 쉽게 찾을 수 있습니다.',
          tip: '마이페이지의 "북마크" 탭에서 저장한 프롬프트를 확인할 수 있습니다.'
        }
      ]
    },
    {
      id: 'best-practices',
      title: '프롬프트 작성 팁',
      description: '효과적인 프롬프트를 만들기 위한 베스트 프랙티스',
      steps: [
        {
          title: '1. 명확한 지시사항',
          content: 'AI가 이해하기 쉽도록 구체적이고 명확한 지시사항을 작성하세요. 모호한 표현보다는 구체적인 요구사항을 명시하는 것이 좋습니다.',
          tip: '예시: "글을 써줘" → "온라인 마케팅에 대한 500자 분량의 블로그 소개글을 작성해줘"'
        },
        {
          title: '2. 컨텍스트 제공',
          content: '프롬프트에 충분한 배경 정보와 맥락을 제공하면 더 정확한 결과를 얻을 수 있습니다.',
          tip: '대상 독자, 톤앤매너, 목적 등을 명시하면 좋습니다.'
        },
        {
          title: '3. 구조화된 형식',
          content: '역할, 작업, 제약사항, 출력 형식 등을 구조화하여 작성하면 AI가 더 잘 이해합니다.',
          tip: '번호나 불릿 포인트를 사용하여 단계별로 정리하세요.'
        },
        {
          title: '4. 예시 포함',
          content: '원하는 결과물의 예시를 포함하면 AI가 스타일과 형식을 더 잘 파악할 수 있습니다.',
          tip: 'Few-shot 프롬프팅: 2-3개의 예시를 제공하는 것이 효과적입니다.'
        },
        {
          title: '5. 반복 개선',
          content: '처음부터 완벽한 프롬프트를 만들기는 어렵습니다. 결과를 보고 계속 개선해나가세요.',
          tip: '비공개로 테스트한 후 만족스러운 결과가 나오면 공개로 전환하세요.'
        }
      ]
    }
  ];

  const currentSection = guideSections.find(section => section.id === activeSection) || guideSections[0];

  return (
    <>
      <ClientOnly>
        <Header />
      </ClientOnly>
      <main className="min-h-screen bg-orange-50/20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* 헤더 섹션 */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">PROMPOT 사용 가이드</h1>
            <p className="text-gray-600 text-lg mb-6">
              PROMPOT을 200% 활용하는 방법
            </p>
          </div>

          {/* 비디오 가이드 섹션 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">📹 비디오 가이드</h2>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/pOTCUP8q_hw"
                title="PROMPOT 사용 가이드"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              * 영상을 통해 PROMPOT의 주요 기능을 빠르게 익혀보세요
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* 좌측 네비게이션 */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
                <h3 className="font-semibold mb-3">가이드 목차</h3>
                <nav className="space-y-1">
                  {guideSections.map(section => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                        activeSection === section.id
                          ? 'bg-primary text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* 우측 콘텐츠 */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-3">{currentSection.title}</h2>
                <p className="text-gray-600 mb-6">{currentSection.description}</p>

                {currentSection.steps && (
                  <div className="space-y-6">
                    {currentSection.steps.map((step, index) => (
                      <div key={index} className="border-l-4 border-primary/20 pl-4">
                        <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                        <p className="text-gray-700 mb-2">{step.content}</p>
                        {step.tip && (
                          <div className="bg-primary/5 rounded-lg p-3 mt-2">
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold text-primary">💡 팁:</span> {step.tip}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 추가 리소스 */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="text-2xl">🚀</span>
                    빠른 시작
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    처음이신가요? 5분 안에 시작하세요!
                  </p>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• 회원가입 → 프롬프트 검색</li>
                    <li>• 마음에 드는 프롬프트 북마크</li>
                    <li>• 첫 프롬프트 작성하기</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="text-2xl">📚</span>
                    추천 리소스
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    더 알아보고 싶으신가요?
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>
                      <Link href="/tools" className="text-primary hover:underline">
                        • AI Tools 목록 확인하기
                      </Link>
                    </li>
                    <li>
                      <Link href="/prompts" className="text-primary hover:underline">
                        • 인기 프롬프트 둘러보기
                      </Link>
                    </li>
                    <li>
                      <Link href="/faq" className="text-primary hover:underline">
                        • FAQ 확인하기
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 하단 CTA */}
          <div className="mt-12 bg-primary/5 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">준비되셨나요?</h2>
            <p className="text-gray-600 mb-6">
              지금 바로 PROMPOT에서 AI 프롬프트의 세계를 탐험해보세요!
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/prompts"
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                프롬프트 둘러보기
              </Link>
              <Link
                href="/prompt/create"
                className="px-6 py-3 bg-white text-primary border border-primary rounded-lg hover:bg-gray-50 transition-colors"
              >
                프롬프트 작성하기
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default GuidePage;