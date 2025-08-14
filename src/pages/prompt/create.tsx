import React, { useState, useEffect } from 'react';
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

const CreatePromptPage = () => {
  const router = useRouter();
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

  const categories: { value: CategoryType; label: string }[] = [
    { value: 'work', label: '업무/마케팅' },
    { value: 'dev', label: '개발/코드' },
    { value: 'design', label: '디자인/브랜드' },
    { value: 'edu', label: '교육/학습' },
    { value: 'image', label: '이미지/아트' },
  ];

  const aiModels: AIModel[] = [
    { id: 'chatgpt', name: 'ChatGPT', icon: '/image/icon_chatgpt.png' },
    { id: 'claude', name: 'Claude', icon: '/image/icon_claude.png' },
    { id: 'claude_artifacts', name: 'Claude Artifacts', icon: '/image/icon_claude_artifacts.png' },
    { id: 'gemini', name: 'Gemini', icon: '/image/icon_gemini.png' },
    { id: 'gpt4_code', name: 'GPT-4 Code', icon: '/image/icon_gpt-4_code.png' },
    { id: 'midjourney', name: 'Midjourney', icon: '/image/icon_midjourney.png' },
    { id: 'dalle3', name: 'DALL·E 3', icon: '/image/icon_dall_e_3.png' },
    { id: 'stable_diffusion', name: 'Stable Diffusion', icon: '/image/icon_Stable_Diffusion.png' },
    { id: 'leonardo_ai', name: 'Leonardo AI', icon: '/image/icon_leonardo_ai.png' },
    { id: 'cursor', name: 'Cursor', icon: '/image/icon_cursor-ai.png' },
    { id: 'v0', name: 'v0', icon: '/image/icon_v0.png' },
    { id: 'bolt', name: 'Bolt', icon: '/image/icon_bolt-new.png' },
    { id: 'replit', name: 'Replit', icon: '/image/icon_Replit.png' },
    { id: 'lovable', name: 'Lovable', icon: '/image/icon_lovable.png' },
    { id: 'copy_ai', name: 'Copy.ai', icon: '/image/icon_Copy-ai.png' },
    { id: 'jasper', name: 'Jasper', icon: '/image/icon_jasper.png' },
    { id: 'wrtn', name: 'WRTN', icon: '/image/icon_wrtn.png' },
    { id: 'perplexity', name: 'Perplexity', icon: '/image/icon_perplexity.png' },
    { id: 'mistral', name: 'Mistral Large', icon: '/image/icon_mistrallarge.png' },
    { id: 'clovax', name: 'Clova X', icon: '/image/icon_clovax.png' },
    { id: 'sora', name: 'Sora', icon: '/image/icon_Sora.png' },
    { id: 'runway', name: 'Runway', icon: '/image/icon_runway.png' },
    { id: 'pika', name: 'Pika Labs', icon: '/image/icon_PikaLabs.png' },
    { id: 'kling', name: 'Kling', icon: '/image/icon_kling.png' },
    { id: 'heygen', name: 'HeyGen', icon: '/image/icon_heygen.png' },
    { id: 'synthesia', name: 'Synthesia', icon: '/image/icon_synthesia.png' },
    { id: 'elevenlabs', name: 'ElevenLabs', icon: '/image/icon_ElevenLabs.png' },
    { id: 'pictory', name: 'Pictory', icon: '/image/icon_pictory_logo.png' },
    { id: 'flexclip', name: 'FlexClip', icon: '/image/icon_flexclip.png' },
    { id: 'pollo', name: 'Pollo AI', icon: '/image/icon_pollo-ai.png' },
    { id: 'imagefx', name: 'ImageFX', icon: '/image/icon_imageFX.png' },
    { id: 'whisk', name: 'Whisk', icon: '/image/icon_whisk.png' },
    { id: 'controlnet', name: 'ControlNet', icon: '/image/icon_controlnet.png' },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, router]);

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
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // 유효성 검사
    if (!formData.title || !formData.description || !formData.content) {
      setToastMessage('모든 필수 항목을 입력해주세요.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    // 제출 중 중복 클릭 방지
    const submitButton = (e.target as HTMLFormElement).querySelector('button[type="submit"]') as HTMLButtonElement;
    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const res = await fetch('/api/prompts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          previewImage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || '프롬프트 생성에 실패했습니다.');
      }

      // 성공 처리
      setToastMessage('프롬프트가 성공적으로 생성되었습니다!');
      setToastType('success');
      setShowToast(true);
      
      // 1.5초 후 페이지 이동
      setTimeout(() => {
        router.push('/mypage');
      }, 1500);
    } catch (error: any) {
      console.error('Create prompt error:', error);
      setToastMessage(error.message || '프롬프트 생성 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
    } finally {
      // 버튼 다시 활성화
      const submitButton = (e.target as HTMLFormElement).querySelector('button[type="submit"]') as HTMLButtonElement;
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold mb-6">프롬프트 작성</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 제목 */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="프롬프트 제목을 입력하세요"
                  required
                />
              </div>

              {/* 카테고리 및 AI 모델 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="aiModel" className="block text-sm font-medium text-gray-700 mb-2">
                    AI 모델 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="aiModel"
                      name="aiModel"
                      value={formData.aiModel}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                    >
                      {aiModels.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                    {/* 선택된 AI 모델 아이콘 표시 */}
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Image
                        src={aiModels.find(m => m.id === formData.aiModel)?.icon || '/image/icon_chatgpt.png'}
                        alt={aiModels.find(m => m.id === formData.aiModel)?.name || 'AI Model'}
                        width={20}
                        height={20}
                        className="rounded"
                      />
                    </div>
                    {/* 드롭다운 화살표 */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {/* 선택된 AI 모델 정보 */}
                  <p className="mt-1 text-xs text-gray-500">
                    {aiModels.find(m => m.id === formData.aiModel)?.name}를 사용하는 프롬프트
                  </p>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="예: 마케팅, 이메일, 고객응대"
                />
              </div>

              {/* 설명 */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  설명 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="프롬프트에 대한 간단한 설명을 입력하세요"
                  required
                />
              </div>

              {/* 미리보기 이미지 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  미리보기 이미지
                  <span className="text-xs text-gray-500 ml-2">(최대 2MB)</span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>이미지 업로드</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {previewImage && (
                    <div className="relative w-32 h-24">
                      <Image
                        src={previewImage}
                        alt="Preview"
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
                  )}
                </div>
              </div>

              {/* 프롬프트 내용 */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  프롬프트 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                  placeholder="프롬프트 내용을 입력하세요"
                  required
                />
              </div>

              {/* 공개/비공개 설정 */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  공개 설정 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="isPublic"
                      value="true"
                      checked={formData.isPublic === true}
                      onChange={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">공개</p>
                      <p className="text-sm text-gray-600">
                        모든 사용자가 이 프롬프트를 검색하고 사용할 수 있습니다.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="isPublic"
                      value="false"
                      checked={formData.isPublic === false}
                      onChange={() => setFormData(prev => ({ ...prev, isPublic: false }))}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">비공개</p>
                      <p className="text-sm text-gray-600">
                        본인만 이 프롬프트를 볼 수 있습니다.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  프롬프트 생성
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Toast 알림 */}
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

export default CreatePromptPage;