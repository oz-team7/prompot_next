import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Header from '@/components/Header';
import ClientOnly from '@/components/ClientOnly';
import PromptGrid from '@/components/PromptGrid';
import { Prompt } from '@/types/prompt';
import Toast from '@/components/Toast';

interface AuthorProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  prompt_count?: number;
  total_likes?: number;
  total_views?: number;
}

const AuthorProfilePage = () => {
  const router = useRouter();
  const { authorId } = router.query;
  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'prompts' | 'stats'>('prompts');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  useEffect(() => {
    if (authorId) {
      fetchAuthorData();
    }
  }, [authorId]);

  const fetchAuthorData = async () => {
    try {
      setLoading(true);
      
      // 작성자 프로필 가져오기
      const profileRes = await fetch(`/api/authors/${authorId}`);
      if (!profileRes.ok) {
        throw new Error('작성자 정보를 불러올 수 없습니다.');
      }
      const profileData = await profileRes.json();
      setAuthor(profileData.data);

      // 작성자의 프롬프트 가져오기
      const promptsRes = await fetch(`/api/prompts?author=${authorId}`);
      if (!promptsRes.ok) {
        throw new Error('프롬프트를 불러올 수 없습니다.');
      }
      const promptsData = await promptsRes.json();
      
      // API 응답 구조에 따라 데이터 추출
      const promptsList = promptsData.data?.prompts || promptsData.prompts || [];
      setPrompts(promptsList);
      
    } catch (error: any) {
      console.error('Error fetching author data:', error);
      setToastMessage(error.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50/20">
        <ClientOnly>
        <Header />
      </ClientOnly>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen bg-orange-50/20">
        <ClientOnly>
        <Header />
      </ClientOnly>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">작성자를 찾을 수 없습니다</h2>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50/20">
      <ClientOnly>
        <Header />
      </ClientOnly>
      
      <main className="container mx-auto px-4 py-8">
        {/* 작성자 프로필 헤더 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* 프로필 이미지 */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              {author.avatar_url ? (
                <Image
                  src={author.avatar_url}
                  alt={author.name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                  unoptimized={true}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-500">
                  <span className="text-4xl sm:text-5xl font-bold text-white">
                    {author.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* 프로필 정보 */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{author.name}</h1>
              <p className="text-gray-600 mb-4">{author.email}</p>
              
              {author.bio && (
                <p className="text-gray-700 mb-4">{author.bio}</p>
              )}

              {/* 통계 정보 */}
              <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">
                    {author.prompt_count || prompts.length}
                  </div>
                  <div className="text-sm text-gray-600">프롬프트</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">
                    {author.total_likes || prompts.reduce((sum, p) => sum + (p.likes_count || p.likes || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">총 좋아요</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {author.total_views || prompts.reduce((sum, p) => sum + (p.views || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">총 조회수</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">
                    {new Date(author.created_at).getFullYear()}년
                  </div>
                  <div className="text-sm text-gray-600">가입년도</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('prompts')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'prompts'
                  ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              프롬프트 ({prompts.length})
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'text-orange-500 border-b-2 border-orange-500 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              통계
            </button>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'prompts' ? (
          <div>
            {prompts.length > 0 ? (
              <PromptGrid 
                prompts={prompts} 
                showHero={false}
                showCreateButton={false}
                useAPI={false}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">아직 작성한 프롬프트가 없습니다.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-6">활동 통계</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 카테고리별 프롬프트 수 */}
              <div>
                <h4 className="font-semibold mb-4">카테고리별 프롬프트</h4>
                <div className="space-y-3">
                  {['work', 'dev', 'design', 'edu', 'image'].map(category => {
                    const count = prompts.filter(p => p.category === category).length;
                    const categoryLabels: { [key: string]: string } = {
                      'work': '업무/마케팅',
                      'dev': '개발/코드',
                      'design': '디자인/브랜드',
                      'edu': '교육/학습',
                      'image': '이미지/동영상',
                    };
                    
                    if (count === 0) return null;
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-gray-700">{categoryLabels[category]}</span>
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-200 rounded-full h-2 w-32">
                            <div 
                              className="bg-orange-500 h-2 rounded-full"
                              style={{ width: `${(count / prompts.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 인기 프롬프트 TOP 3 */}
              <div>
                <h4 className="font-semibold mb-4">인기 프롬프트 TOP 3</h4>
                <div className="space-y-3">
                  {prompts
                    .sort((a, b) => (b.views || 0) - (a.views || 0))
                    .slice(0, 3)
                    .map((prompt, index) => (
                      <div 
                        key={prompt.id} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => router.push(`/prompt/${prompt.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`
                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                            ${index === 0 ? 'bg-orange-500 text-white' : 
                              index === 1 ? 'bg-gray-400 text-white' : 
                              'bg-gray-300 text-white'}
                          `}>
                            {index + 1}
                          </span>
                          <span className="font-medium text-gray-800">{prompt.title}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-600">
                            <span className="font-medium">{prompt.views || 0}</span> 조회
                          </span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Toast */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default AuthorProfilePage;