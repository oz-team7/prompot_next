import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { getVideoThumbnail, getVideoTitle } from '@/utils/videoUtils';

interface AIModel {
  id: string;
  name: string;
  icon: string;
}

const aiModels: AIModel[] = [
  // 텍스트 생성 AI
  { id: 'chatgpt', name: 'ChatGPT', icon: '/image/icon_chatgpt.png' },
  { id: 'claude', name: 'Claude', icon: '/image/icon_claude.png' },
  { id: 'gemini', name: 'Gemini', icon: '/image/icon_gemini.png' },
  { id: 'perplexity', name: 'Perplexity', icon: '/image/icon_perplexity.png' },
  
  // 코딩 AI
  { id: 'copilot', name: 'GitHub Copilot', icon: '/image/icon_gpt-4_code.png' },
  { id: 'cursor', name: 'Cursor', icon: '/image/icon_cursor-ai.png' },
  { id: 'replit', name: 'Replit', icon: '/image/icon_Replit.png' },
  { id: 'v0', name: 'v0', icon: '/image/icon_v0.png' },
  
  // 이미지 생성 AI
  { id: 'dalle', name: 'DALL-E', icon: '/image/icon_dall_e_3.png' },
  { id: 'midjourney', name: 'Midjourney', icon: '/image/icon_midjourney.png' },
  { id: 'stable-diffusion', name: 'Stable Diffusion', icon: '/image/icon_Stable_Diffusion.png' },
  { id: 'leonardo', name: 'Leonardo AI', icon: '/image/icon_leonardo_ai.png' },
  
  // 비디오 생성 AI
  { id: 'runway', name: 'Runway', icon: '/image/icon_runway.png' },
  { id: 'pika', name: 'Pika Labs', icon: '/image/icon_PikaLabs.png' },
  { id: 'kling', name: 'Kling', icon: '/image/icon_kling.png' },
  { id: 'sora', name: 'Sora', icon: '/image/icon_Sora.png' },
  
  // 기타 AI 도구
  { id: 'elevenlabs', name: 'ElevenLabs', icon: '/image/icon_ElevenLabs.png' },
  { id: 'jasper', name: 'Jasper', icon: '/image/icon_jasper.png' },
  { id: 'copy-ai', name: 'Copy.ai', icon: '/image/icon_Copy-ai.png' },
  { id: 'other', name: '기타', icon: '🔧' },
];

const categories = [
  { value: 'work', label: '업무/마케팅', icon: '💼' },
  { value: 'dev', label: '개발/코드', icon: '💻' },
  { value: 'design', label: '디자인/브랜드', icon: '🎨' },
  { value: 'edu', label: '교육/학습', icon: '📚' },
  { value: 'image', label: '이미지/아트', icon: '🖼️' },
];

const CreatePromptPage = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: 'work',
    aiModel: 'chatgpt',
    tags: [] as string[],
    isPublic: true,
    videoUrl: '',
    additionalImages: [] as string[],
  });
  
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalPreviewUrls, setAdditionalPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [tagInput, setTagInput] = useState('');
  
  // 드롭다운 상태 추가
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showAIModelDropdown, setShowAIModelDropdown] = useState(false);

  // 인증 확인
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowCategoryDropdown(false);
        setShowAIModelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToastMessage('이미지 크기는 5MB 이하여야 합니다.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      setToastMessage('이미지 파일만 업로드 가능합니다.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      // 파일을 Base64로 변환
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        
        // 서버에 이미지 업로드
        const token = localStorage.getItem('token');
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            imageData: imageData,
            fileName: file.name,
          }),
        });

        const result = await response.json();
        
        if (response.ok) {
          setImage(file);
          setPreviewUrl(imageData); // Base64 URL로 미리보기
          setFormData(prev => ({
            ...prev,
            previewImage: result.imageUrl // 서버 URL 저장
          }));
          setToastMessage('이미지가 업로드되었습니다.');
          setToastType('success');
          setShowToast(true);
        } else {
          throw new Error(result.message || '이미지 업로드에 실패했습니다.');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image upload error:', error);
      setToastMessage('이미지 업로드에 실패했습니다.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleAdditionalImagesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const maxImages = 5; // 최대 5개 추가 이미지
    
    if (additionalImages.length + files.length > maxImages) {
      setToastMessage(`최대 ${maxImages}개의 추가 이미지만 업로드할 수 있습니다.`);
      setToastType('error');
      setShowToast(true);
      return;
    }

    const validFiles = files.filter(file => {
      // 파일 크기 검증 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setToastMessage(`${file.name}의 크기가 5MB를 초과합니다.`);
        setToastType('error');
        setShowToast(true);
        return false;
      }

      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        setToastMessage(`${file.name}은 이미지 파일이 아닙니다.`);
        setToastType('error');
        setShowToast(true);
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      const uploadedImages: string[] = [];
      
      for (const file of validFiles) {
        try {
          // 파일을 Base64로 변환
          const reader = new FileReader();
          const imageData = await new Promise<string>((resolve, reject) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          // 서버에 이미지 업로드
          const token = localStorage.getItem('token');
          const response = await fetch('/api/upload-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              imageData: imageData,
              fileName: file.name,
            }),
          });

          const result = await response.json();
          
          if (response.ok) {
            uploadedImages.push(result.imageUrl);
          } else {
            throw new Error(result.message || '이미지 업로드에 실패했습니다.');
          }
        } catch (error) {
          console.error('Additional image upload error:', error);
          setToastMessage(`${file.name} 업로드에 실패했습니다.`);
          setToastType('error');
          setShowToast(true);
        }
      }

      if (uploadedImages.length > 0) {
        setAdditionalImages(prev => [...prev, ...validFiles]);
        const newPreviewUrls = uploadedImages; // 서버 URL 사용
        setAdditionalPreviewUrls(prev => [...prev, ...newPreviewUrls]);
        
        setFormData(prev => ({
          ...prev,
          additionalImages: [...(prev.additionalImages || []), ...uploadedImages]
        }));
        
        setToastMessage(`${uploadedImages.length}개의 이미지가 업로드되었습니다.`);
        setToastType('success');
        setShowToast(true);
      }
    }
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    setAdditionalPreviewUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index);
      // URL 해제
      URL.revokeObjectURL(prev[index]);
      return newUrls;
    });
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !formData.tags.includes(newTag) && formData.tags.length < 5) {
        handleInputChange('tags', [...formData.tags, newTag]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!formData.title.trim()) {
      setToastMessage('제목을 입력해주세요.');
      setToastType('error');
      setShowToast(true);
      return;
    }
    
    if (!formData.content.trim()) {
      setToastMessage('프롬프트 내용을 입력해주세요.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;
      const additionalImageUrls: string[] = [];
      
      // 메인 이미지 업로드
      if (image) {
        // 파일을 Base64로 변환
        const imageData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(image);
        });
        
        // 인증 토큰 가져오기
        const token = localStorage.getItem('token');
        
        const uploadRes = await fetch('/api/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            imageData: imageData,
            fileName: image.name,
          }),
        });
        
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.message || '이미지 업로드에 실패했습니다.');
        }
        
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.imageUrl;
      }

      // 추가 이미지들 업로드
      if (additionalImages.length > 0) {
        const token = localStorage.getItem('token');

        for (const additionalImage of additionalImages) {
          // 파일을 Base64로 변환
          const imageData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(additionalImage);
          });
          
          const uploadRes = await fetch('/api/upload-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              imageData: imageData,
              fileName: additionalImage.name,
            }),
          });
          
          if (!uploadRes.ok) {
            const errorData = await uploadRes.json();
            throw new Error(errorData.message || '추가 이미지 업로드에 실패했습니다.');
          }
          
          const uploadData = await uploadRes.json();
          additionalImageUrls.push(uploadData.imageUrl);
        }
      }

      // 프롬프트 생성
      const token = localStorage.getItem('token');
      const res = await fetch('/api/prompts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          previewImage: imageUrl,
          additionalImages: additionalImageUrls,
          videoUrl: formData.videoUrl,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '프롬프트 생성에 실패했습니다.');
      }

      const response = await res.json();

      setToastMessage('프롬프트가 성공적으로 생성되었습니다!');
      setToastType('success');
      setShowToast(true);

      // 생성된 프롬프트의 상세 페이지로 이동
      setTimeout(() => {
        router.push(`/prompt/${response.prompt.id}`);
      }, 1500);

    } catch (error: any) {
      console.error('프롬프트 생성 오류:', error);
      setToastMessage(error.message || '프롬프트 생성 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
            <p className="text-gray-600 mb-4">프롬프트를 생성하려면 로그인하세요.</p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              로그인하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">새 프롬프트 생성</h1>
            <p className="text-gray-600">창의적인 프롬프트를 만들어 다른 사용자와 공유해보세요!</p>
          </div>

          {/* 폼 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 이미지 업로드 섹션 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 미리보기 이미지 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    미리보기 이미지
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {previewUrl ? (
                        <div className="space-y-2">
                          <div className="relative w-32 h-32 mx-auto">
                            <Image
                              src={previewUrl}
                              alt="미리보기"
                              fill
                              className="object-cover rounded-lg"
                              unoptimized={true}
                            />
                          </div>
                          <p className="text-sm text-gray-600">클릭하여 이미지 변경</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-4xl text-gray-400">🖼️</div>
                          <p className="text-sm text-gray-600">미리보기 이미지를 업로드하려면 클릭하세요</p>
                          <p className="text-xs text-gray-500">JPG, PNG, GIF (최대 5MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* 추가 이미지 업로드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    추가 이미지 (최대 5개)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAdditionalImagesChange}
                      className="hidden"
                      id="additional-images-upload"
                    />
                    <label htmlFor="additional-images-upload" className="cursor-pointer">
                      <div className="space-y-2">
                        <div className="text-4xl text-gray-400">🖼️</div>
                        <p className="text-sm text-gray-600">추가 이미지를 업로드하려면 클릭하세요</p>
                        <p className="text-xs text-gray-500">JPG, PNG, GIF (최대 5MB, 최대 5개)</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* 추가 이미지 미리보기 */}
              {additionalPreviewUrls.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">업로드된 추가 이미지 ({additionalPreviewUrls.length}/5)</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {additionalPreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="relative w-full h-24">
                          <Image
                            src={url}
                            alt={`추가 이미지 ${index + 1}`}
                            fill
                            className="object-cover rounded-lg"
                            unoptimized={true}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAdditionalImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 제목 */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
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
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="프롬프트에 대한 간단한 설명을 입력하세요"
                  rows={3}
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
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="AI에게 전달할 프롬프트 내용을 입력하세요..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                  required
                />
              </div>

              {/* 카테고리 & AI 모델 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 카테고리 */}
                <div className="dropdown-container">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {categories.find(cat => cat.value === formData.category)?.icon}
                        </span>
                        <span className="text-sm font-medium">
                          {categories.find(cat => cat.value === formData.category)?.label}
                        </span>
                      </div>
                      <svg className={`w-5 h-5 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showCategoryDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        {categories.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => {
                              handleInputChange('category', cat.value);
                              setShowCategoryDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                          >
                            <span className="text-xl">{cat.icon}</span>
                            <span className="text-sm font-medium">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* AI 모델 */}
                <div className="dropdown-container">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI 모델 *
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAIModelDropdown(!showAIModelDropdown)}
                      className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6">
                          {(() => {
                            const selectedModel = aiModels.find(model => model.id === formData.aiModel);
                            if (selectedModel?.icon === '🔧') {
                              return <div className="text-lg">{selectedModel.icon}</div>;
                            } else {
                              return (
                                <img 
                                  src={selectedModel?.icon} 
                                  alt={selectedModel?.name}
                                  className="w-full h-full object-contain"
                                />
                              );
                            }
                          })()}
                        </div>
                        <span className="text-sm font-medium">
                          {aiModels.find(model => model.id === formData.aiModel)?.name}
                        </span>
                      </div>
                      <svg className={`w-5 h-5 transition-transform ${showAIModelDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showAIModelDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {aiModels.map((model) => (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => {
                              handleInputChange('aiModel', model.id);
                              setShowAIModelDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                          >
                            <div className="w-6 h-6">
                              {model.icon === '🔧' ? (
                                <div className="text-lg">{model.icon}</div>
                              ) : (
                                <img 
                                  src={model.icon} 
                                  alt={model.name}
                                  className="w-full h-full object-contain"
                                />
                              )}
                            </div>
                            <span className="text-sm font-medium">{model.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 태그 */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  태그 (최대 5개)
                </label>
                <input
                  type="text"
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="태그를 입력하고 Enter를 누르세요 (예: AI, 생산성, 팁)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {formData.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-primary hover:text-primary/70"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 동영상 URL */}
              <div>
                <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  동영상 URL (선택사항)
                </label>
                <input
                  type="url"
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                  placeholder="YouTube, Vimeo 등의 동영상 URL을 입력하세요..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  지원 형식: YouTube, Vimeo, 기타 동영상 플랫폼 URL
                </p>
                
                {/* 동영상 썸네일 미리보기 */}
                {formData.videoUrl && getVideoThumbnail(formData.videoUrl) && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">동영상 미리보기</p>
                    <div className="relative w-full max-w-md mx-auto">
                      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={getVideoThumbnail(formData.videoUrl)!}
                          alt={getVideoTitle(formData.videoUrl)}
                          fill
                          className="object-cover"
                          unoptimized={true}
                          onError={(e) => {
                            console.error('썸네일 로드 실패:', e);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                          <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-600 text-center">
                        {getVideoTitle(formData.videoUrl)}
                      </p>
                    </div>
                  </div>
                )}
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
                    onChange={(e) => handleInputChange('isPublic', e.target.checked)}
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
                      생성 중...
                    </div>
                  ) : (
                    '프롬프트 생성하기'
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
    </div>
  );
};

export default CreatePromptPage;