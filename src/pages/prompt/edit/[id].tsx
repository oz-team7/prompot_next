import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import Toast from '@/components/Toast';

type CategoryType = 'work' | 'dev' | 'design' | 'edu' | 'image';

interface AIModel {
  id: string;
  name: string;
  icon: string;
}

interface Prompt {
  id: string;
  title: string;
  category: CategoryType;
  ai_model: string;
  tags: string[] | string;
  description: string;
  content: string;
  is_public: boolean;
  preview_image: string | null;
  created_at: string;
  updated_at: string;
  author_id: string;
}

const EditPromptPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    category: 'work' as CategoryType,
    aiModel: 'chatgpt',
    tags: '',
    description: '',
    content: '',
    isPublic: true,
  });

  const categories: { value: CategoryType; label: string; icon: string }[] = [
    { value: 'work', label: '업무/마케팅', icon: '💼' },
    { value: 'dev', label: '개발/코드', icon: '💻' },
    { value: 'design', label: '디자인/브랜드', icon: '🎨' },
    { value: 'edu', label: '교육/학습', icon: '📚' },
    { value: 'image', label: '이미지/아트', icon: '🖼️' },
  ];

  const aiModels: AIModel[] = [
    // 텍스트 생성 AI
    { id: 'chatgpt', name: 'ChatGPT', icon: '🤖' },
    { id: 'chatgpt-plus', name: 'ChatGPT Plus', icon: '🚀' },
    { id: 'claude', name: 'Claude', icon: '🧠' },
    { id: 'claude-pro', name: 'Claude Pro', icon: '💎' },
    { id: 'gemini', name: 'Gemini', icon: '💎' },
    { id: 'gemini-pro', name: 'Gemini Pro', icon: '⚡' },
    { id: 'bard', name: 'Bard', icon: '🎭' },
    { id: 'bing-chat', name: 'Bing Chat', icon: '🔍' },
    { id: 'perplexity', name: 'Perplexity', icon: '🤔' },
    { id: 'poe', name: 'Poe', icon: '📝' },
    
    // 코딩 AI
    { id: 'copilot', name: 'GitHub Copilot', icon: '👨‍💻' },
    { id: 'copilot-x', name: 'Copilot X', icon: '⚡' },
    { id: 'claude-coder', name: 'Claude Coder', icon: '💻' },
    { id: 'cursor', name: 'Cursor', icon: '🎯' },
    { id: 'tabnine', name: 'Tabnine', icon: '⚡' },
    { id: 'kite', name: 'Kite', icon: '🪁' },
    
    // 이미지 생성 AI
    { id: 'dalle', name: 'DALL-E', icon: '🖼️' },
    { id: 'dalle-3', name: 'DALL-E 3', icon: '🎨' },
    { id: 'midjourney', name: 'Midjourney', icon: '🖼️' },
    { id: 'stable-diffusion', name: 'Stable Diffusion', icon: '🎭' },
    { id: 'firefly', name: 'Adobe Firefly', icon: '🔥' },
    { id: 'canva-ai', name: 'Canva AI', icon: '🎨' },
    
    // 비디오 생성 AI
    { id: 'runway', name: 'Runway', icon: '🎬' },
    { id: 'pika', name: 'Pika Labs', icon: '🎥' },
    { id: 'synthesia', name: 'Synthesia', icon: '🎭' },
    { id: 'descript', name: 'Descript', icon: '📝' },
    
    // 오디오 생성 AI
    { id: 'elevenlabs', name: 'ElevenLabs', icon: '🎙️' },
    { id: 'murph', name: 'Murph', icon: '🎤' },
    { id: 'play-ht', name: 'Play.HT', icon: '🎵' },
    
    // 기타 AI 도구
    { id: 'notion-ai', name: 'Notion AI', icon: '📝' },
    { id: 'jasper', name: 'Jasper', icon: '✍️' },
    { id: 'copy-ai', name: 'Copy.ai', icon: '📄' },
    { id: 'writesonic', name: 'Writesonic', icon: '✍️' },
    { id: 'other', name: '기타', icon: '🔧' },
  ];

  // 토큰 디버깅 함수
  const debugToken = async (token: string) => {
    try {
      const res = await fetch('/api/auth/debug-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      console.log('[DEBUG] Token debug result:', data);
      return data.ok === true;
    } catch (error) {
      console.error('[DEBUG] Token debug error:', error);
      return false;
    }
  };

  // 세션 체크 함수
  const checkSession = async (token: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/session-check', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      return data.ok === true;
    } catch (error) {
      console.error('Session check error:', error);
      return false;
    }
  };

  // 토큰 검증 함수
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      return data.ok === true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  const fetchPrompt = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('인증 정보가 없습니다. 다시 로그인해주세요.');
      }

      // 토큰 유효성 검증
      const isValidToken = await validateToken(token);
      if (!isValidToken) {
        throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
      }

      const res = await fetch(`/api/prompts/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        throw new Error('프롬프트를 불러올 수 없습니다.');
      }
      
      const data = await res.json();
      const prompt = data.prompt;
      
      // 작성자 확인
      if (prompt.author_id !== user?.id) {
        setToastMessage('이 프롬프트를 수정할 권한이 없습니다.');
        setToastType('error');
        setShowToast(true);
        setTimeout(() => {
          router.push('/mypage');
        }, 1500);
        return;
      }
      
      setFormData({
        title: prompt.title,
        category: prompt.category,
        aiModel: prompt.ai_model,
        tags: Array.isArray(prompt.tags) ? prompt.tags.join(', ') : prompt.tags || '',
        description: prompt.description,
        content: prompt.content,
        isPublic: prompt.is_public,
      });
      
      if (prompt.preview_image) {
        setPreviewImage(prompt.preview_image);
      }
    } catch (error: any) {
      console.error('Fetch prompt error:', error);
      setToastMessage(error.message || '프롬프트를 불러올 수 없습니다.');
      setToastType('error');
      setShowToast(true);
      
      // 인증 오류인 경우 로그인 페이지로 리다이렉트
      if (error.message?.includes('인증') || error.message?.includes('로그인')) {
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  }, [id, user?.id, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (id) {
      fetchPrompt();
    }
  }, [fetchPrompt, id, isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 제한 (2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        setToastMessage('이미지 크기는 2MB 이하여야 합니다.');
        setToastType('error');
        setShowToast(true);
        e.target.value = ''; // 입력 초기화
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 인증 확인
    if (!isAuthenticated) {
      setToastMessage('로그인이 필요합니다.');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
      return;
    }
    
    // 유효성 검사
    if (!formData.title || !formData.description || !formData.content) {
      setToastMessage('모든 필수 항목을 입력해주세요.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    console.log('Submitting form data:', formData);

    try {
      console.log('Sending update request for prompt:', id);
      
      const updateData = {
        ...formData,
        preview_image: previewImage,
        is_public: formData.isPublic,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('인증 정보가 없습니다. 다시 로그인해주세요.');
      }

      // 토큰 유효성 검증
      const isValidToken = await validateToken(token);
      if (!isValidToken) {
        throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
      }

      const res = await fetch(`/api/prompts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      console.log('Update response:', data);

      if (!res.ok) {
        console.error('Update failed:', data);
        const errorMessage = data.error || data.message || '프롬프트 수정에 실패했습니다.';
        throw new Error(errorMessage);
      }

      if (!data.ok) {
        throw new Error('프롬프트 수정에 실패했습니다.');
      }

      // 성공 처리
      setToastMessage('프롬프트가 성공적으로 수정되었습니다!');
      setToastType('success');
      setShowToast(true);
      
      // 즉시 마이페이지로 이동 (새로고침 파라미터 추가)
      setTimeout(() => {
        router.push('/mypage?tab=prompts&refresh=true');
      }, 1500);
    } catch (error: any) {
      console.error('Update prompt error:', error);
      setToastMessage(error.message || '프롬프트 수정 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
      
      // 인증 오류인 경우 로그인 페이지로 리다이렉트
      if (error.message?.includes('인증') || error.message?.includes('로그인') || error.message?.includes('UNAUTHORIZED')) {
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center py-8">
                <p className="text-gray-600">로그인이 필요합니다.</p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-gray-600">프롬프트를 불러오는 중...</p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">프롬프트 수정</h1>
            <p className="text-gray-600">프롬프트를 수정하고 개선해보세요!</p>
          </div>

          {/* 폼 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 제목 */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="프롬프트의 제목을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              {/* 설명 */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="프롬프트에 대한 간단한 설명을 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        formData.category === cat.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <div className="text-xs font-medium">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI 모델 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI 모델 *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
                  {aiModels.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, aiModel: model.id }))}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        formData.aiModel === model.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{model.icon}</div>
                      <div className="text-sm font-medium">{model.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 태그 */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  태그 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="태그를 쉼표로 구분하여 입력하세요 (예: AI, 생산성, 팁)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* 프롬프트 내용 */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  프롬프트 내용 *
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="AI에게 전달할 프롬프트 내용을 입력하세요..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                  required
                />
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  미리보기 이미지
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {previewImage ? (
                      <div className="space-y-2">
                        <div className="relative w-32 h-32 mx-auto">
                          <Image
                            src={previewImage}
                            alt="미리보기"
                            fill
                            className="object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-sm text-gray-600">이미지를 변경하려면 클릭하세요</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-4xl text-gray-400">📷</div>
                        <p className="text-sm text-gray-600">이미지를 업로드하려면 클릭하세요</p>
                        <p className="text-xs text-gray-500">JPG, PNG, GIF (최대 2MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* 공개 설정 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">공개 설정</h3>
                  <p className="text-sm text-gray-600">
                    {formData.isPublic 
                      ? '다른 사용자들이 이 프롬프트를 볼 수 있습니다.' 
                      : '나만 이 프롬프트를 볼 수 있습니다.'
                    }
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* 제출 버튼 */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      수정 중...
                    </div>
                  ) : (
                    '프롬프트 수정하기'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Toast */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
};

export default EditPromptPage;