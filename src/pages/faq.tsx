import React, { useState } from 'react';
import Header from '@/components/Header';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: 'general' | 'prompt' | 'account' | 'technical';
}

const FAQPage = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const faqData: FAQItem[] = [
    // 일반 질문
    {
      id: 1,
      question: 'PROMPOT은 무엇인가요?',
      answer: 'PROMPOT은 다양한 AI 도구들을 위한 프롬프트를 공유하고 발견할 수 있는 플랫폼입니다. ChatGPT, Claude, Midjourney 등 33개의 AI 도구에 최적화된 프롬프트를 찾고, 직접 만든 프롬프트를 다른 사용자들과 공유할 수 있습니다.',
      category: 'general'
    },
    {
      id: 2,
      question: 'PROMPOT을 사용하려면 비용이 드나요?',
      answer: '기본적인 프롬프트 검색과 조회는 무료입니다. 회원가입을 하시면 프롬프트 상세 내용을 확인하고, 직접 프롬프트를 작성하여 공유할 수 있습니다.',
      category: 'general'
    },
    {
      id: 3,
      question: '어떤 AI 도구들을 지원하나요?',
      answer: 'PROMPOT은 대화형 AI(ChatGPT, Claude, Gemini 등), 코딩 AI(Cursor, v0, Bolt 등), 이미지 생성 AI(Midjourney, DALL·E 3, Stable Diffusion 등), 비디오 생성 AI(Sora, Runway, Pika Labs 등), 라이팅 AI(Copy.ai, Jasper 등) 총 33개의 AI 도구를 지원합니다.',
      category: 'general'
    },

    // 프롬프트 관련
    {
      id: 4,
      question: '프롬프트를 작성하려면 어떻게 해야 하나요?',
      answer: '로그인 후 상단의 "Prompt" 메뉴에서 "+ New" 버튼을 클릭하거나, 마이페이지에서 "프롬프트 작성" 버튼을 클릭하세요. 제목, 설명, AI 모델, 카테고리, 태그, 프롬프트 내용을 입력하고 공개/비공개 설정을 선택한 후 저장하면 됩니다.',
      category: 'prompt'
    },
    {
      id: 5,
      question: '프롬프트의 공개/비공개 설정은 무엇인가요?',
      answer: '공개로 설정하면 모든 PROMPOT 회원이 해당 프롬프트를 검색하고 사용할 수 있습니다. 비공개로 설정하면 본인만 볼 수 있으며, 마이페이지에서만 확인 가능합니다. 공개 프롬프트도 상세 내용은 로그인한 회원만 볼 수 있습니다.',
      category: 'prompt'
    },
    {
      id: 6,
      question: '프롬프트에 이미지를 추가할 수 있나요?',
      answer: '네, 프롬프트 작성 시 미리보기 이미지를 추가할 수 있습니다. 이미지 크기는 최대 2MB까지 업로드 가능하며, 프롬프트 목록에서 시각적으로 확인할 수 있도록 도와줍니다.',
      category: 'prompt'
    },
    {
      id: 7,
      question: '다른 사람의 프롬프트를 수정할 수 있나요?',
      answer: '다른 사용자가 작성한 프롬프트는 수정할 수 없습니다. 본인이 작성한 프롬프트만 마이페이지에서 수정하거나 삭제할 수 있습니다. 다른 사람의 프롬프트가 마음에 들면 복사해서 자신만의 버전으로 새로 만들 수 있습니다.',
      category: 'prompt'
    },
    {
      id: 8,
      question: '프롬프트 카테고리는 어떻게 구분되나요?',
      answer: '프롬프트는 5개 카테고리로 구분됩니다: 업무/마케팅(비즈니스 관련), 개발/코드(프로그래밍 관련), 디자인/브랜드(창작 관련), 교육/학습(학습 도구), 이미지/아트(시각 콘텐츠 생성)로 나뉩니다.',
      category: 'prompt'
    },

    // 계정 관련
    {
      id: 9,
      question: '회원가입은 어떻게 하나요?',
      answer: '홈페이지 우측 상단의 "로그인" 버튼을 클릭한 후, "회원가입" 링크를 클릭하세요. 이름, 이메일, 비밀번호(6자 이상)를 입력하면 가입이 완료됩니다.',
      category: 'account'
    },
    {
      id: 10,
      question: '비밀번호를 변경하고 싶어요.',
      answer: '로그인 후 마이페이지의 "설정" 탭에서 비밀번호를 변경할 수 있습니다. 현재 비밀번호와 새 비밀번호(6자 이상)를 입력하면 변경됩니다.',
      category: 'account'
    },
    {
      id: 11,
      question: '탈퇴는 어떻게 하나요?',
      answer: '현재는 고객센터(support@prompot.com)로 탈퇴 요청을 보내주시면 처리해드립니다. 탈퇴 시 작성하신 모든 프롬프트와 데이터가 삭제되며 복구할 수 없습니다.',
      category: 'account'
    },
    {
      id: 12,
      question: '로그인이 안 돼요.',
      answer: '이메일과 비밀번호를 정확히 입력했는지 확인해주세요. 비밀번호는 대소문자를 구분합니다. 계속 문제가 발생하면 브라우저의 쿠키를 삭제하고 다시 시도해보세요.',
      category: 'account'
    },

    // 기술적 질문
    {
      id: 13,
      question: '어떤 브라우저를 지원하나요?',
      answer: 'PROMPOT은 Chrome, Safari, Firefox, Edge 등 최신 브라우저를 모두 지원합니다. 최상의 경험을 위해 브라우저를 최신 버전으로 업데이트하여 사용하시길 권장합니다.',
      category: 'technical'
    },
    {
      id: 14,
      question: '모바일에서도 사용할 수 있나요?',
      answer: '네, PROMPOT은 반응형 디자인으로 제작되어 스마트폰과 태블릿에서도 편리하게 사용할 수 있습니다. 모바일 브라우저에서 접속하시면 자동으로 모바일 화면에 최적화됩니다.',
      category: 'technical'
    },
    {
      id: 15,
      question: '검색이 제대로 작동하지 않아요.',
      answer: '검색어를 입력한 후 Enter 키를 누르거나 검색 버튼을 클릭해주세요. 검색은 프롬프트의 제목, 설명, 태그를 기준으로 작동합니다. 특수문자보다는 일반 텍스트로 검색하시면 더 나은 결과를 얻을 수 있습니다.',
      category: 'technical'
    },
    {
      id: 16,
      question: 'API를 제공하나요?',
      answer: '현재는 웹 인터페이스를 통한 서비스만 제공하고 있습니다. API 제공은 추후 사용자 요청에 따라 검토할 예정입니다.',
      category: 'technical'
    }
  ];

  const categories = [
    { value: 'all', label: '전체' },
    { value: 'general', label: '일반' },
    { value: 'prompt', label: '프롬프트' },
    { value: 'account', label: '계정' },
    { value: 'technical', label: '기술' }
  ];

  const filteredFAQ = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* 헤더 섹션 */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">자주 묻는 질문</h1>
            <p className="text-gray-600 text-lg">
              PROMPOT 사용에 대한 궁금증을 해결해드립니다
            </p>
          </div>

          {/* 카테고리 필터 */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.value
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category.label}
                <span className="ml-2 text-xs">
                  ({category.value === 'all' ? faqData.length : faqData.filter(f => f.category === category.value).length})
                </span>
              </button>
            ))}
          </div>

          {/* FAQ 목록 */}
          <div className="space-y-4">
            {filteredFAQ.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {getCategoryLabel(item.category)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      {item.question}
                    </h3>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      openItems.includes(item.id) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                
                {openItems.includes(item.id) && (
                  <div className="px-6 pb-4 border-t">
                    <p className="text-gray-700 pt-4 whitespace-pre-line">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 추가 도움말 섹션 */}
          <div className="mt-12 bg-primary/5 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-3">더 궁금한 점이 있으신가요?</h2>
            <p className="text-gray-600 mb-4">
              FAQ에서 원하는 답변을 찾지 못하셨다면 이메일로 문의해주세요.
            </p>
            <a
              href="mailto:support@prompot.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              support@prompot.com
            </a>
          </div>
        </div>
      </main>
    </>
  );
};

export default FAQPage;