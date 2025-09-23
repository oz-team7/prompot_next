import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import ThumbnailEditor from '@/components/ThumbnailEditor';
import { getVideoThumbnail, getVideoTitle } from '@/utils/videoUtils';
import { fetchWithLogging } from '@/lib/api-logger';
import { createTextImage } from '@/utils/textToImage';

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
    { value: 'image', label: '이미지/동영상', icon: '🎬' },
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
    resultType: 'image' as 'image' | 'text',
    textResult: '',
  });
  
  const [uploadedImages, setUploadedImages] = useState<Array<{ file: File, url: string, serverUrl: string, editedUrl?: string }>>([]);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState<number>(0);
  const [textImageUrl, setTextImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  
  // 드롭다운 상태 추가
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showAIModelDropdown, setShowAIModelDropdown] = useState(false);
  
  // 드래그 앤 드롭 상태
  const [isDragOver, setIsDragOver] = useState(false);
  
  // 썸네일 편집 상태
  const [showThumbnailEditor, setShowThumbnailEditor] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  
  // 텍스트 결과 펼쳐보기 상태
  const [isTextResultExpanded, setIsTextResultExpanded] = useState(false);

  // 텍스트 결과를 이미지로 변환
  useEffect(() => {
    if (formData.resultType === 'text' && formData.textResult) {
      const generateTextImage = async () => {
        try {
          const imageUrl = await createTextImage(formData.textResult);
          setTextImageUrl(imageUrl);
        } catch (error) {
          console.error('텍스트 이미지 생성 오류:', error);
        }
      };
      generateTextImage();
    } else {
      setTextImageUrl('');
    }
  }, [formData.textResult, formData.resultType]);

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
    const files = Array.from(event.target.files || []);
    await handleImageUpload(files);
  };

  const handleImageUpload = async (files: File[]) => {
    const maxImages = 6; // 최대 6개 이미지 (썸네일 포함)
    
    if (uploadedImages.length + files.length > maxImages) {
      setToastMessage(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`);
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
      const newImages: Array<{ file: File, url: string, serverUrl: string }> = [];
      
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
          
          if (response.ok && result.success && result.data) {
            newImages.push({
              file,
              url: imageData,
              serverUrl: result.data.url
            });
          } else {
            throw new Error(result.message || '이미지 업로드에 실패했습니다.');
          }
        } catch (error) {
          console.error('Image upload error:', error);
          setToastMessage(`${file.name} 업로드에 실패했습니다.`);
          setToastType('error');
          setShowToast(true);
        }
      }

      if (newImages.length > 0) {
        setUploadedImages(prev => [...prev, ...newImages]);
        setToastMessage(`${newImages.length}개의 이미지가 업로드되었습니다.`);
        setToastType('success');
        setShowToast(true);
      }
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // 썸네일 인덱스 조정
      if (selectedThumbnailIndex >= newImages.length && newImages.length > 0) {
        setSelectedThumbnailIndex(0);
      } else if (selectedThumbnailIndex > index && selectedThumbnailIndex > 0) {
        setSelectedThumbnailIndex(selectedThumbnailIndex - 1);
      }
      return newImages;
    });
  };

  // 썸네일 편집 핸들러
  const handleEditThumbnail = (index: number) => {
    setEditingImageIndex(index);
    setShowThumbnailEditor(true);
  };

  const handleSaveThumbnail = async (editedImageUrl: string) => {
    if (editingImageIndex === null) return;
    
    try {
      // 편집된 이미지를 서버에 업로드
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageData: editedImageUrl,
          fileName: 'edited-thumbnail.jpg',
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success && result.data) {
        // 편집된 이미지 URL 저장
        setUploadedImages(prev => prev.map((img, index) => 
          index === editingImageIndex 
            ? { ...img, editedUrl: result.data.url }
            : img
        ));
        
        setToastMessage('썸네일이 편집되었습니다.');
        setToastType('success');
        setShowToast(true);
      } else {
        throw new Error(result.message || '썸네일 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Thumbnail save error:', error);
      setToastMessage('썸네일 저장 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setShowThumbnailEditor(false);
      setEditingImageIndex(null);
    }
  };

  const tagInputRef = useRef<HTMLInputElement>(null);

  const addTagFromInput = () => {
    if (!tagInputRef.current) return;
    
    const inputValue = tagInputRef.current.value.trim();
    if (inputValue && !formData.tags.includes(inputValue) && formData.tags.length < 5) {
      handleInputChange('tags', [...formData.tags, inputValue]);
      tagInputRef.current.value = '';
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      e.stopPropagation();
      addTagFromInput();
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = formData.tags.filter(tag => tag !== tagToRemove);
    handleInputChange('tags', updatedTags);
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setToastMessage('이미지 파일만 업로드할 수 있습니다.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    await handleImageUpload(imageFiles);
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
      let thumbnailUrl = '';
      let additionalImageUrls: string[] = [];

      if (formData.resultType === 'image') {
        // 이미지 결과 타입인 경우 업로드된 이미지 확인
        if (uploadedImages.length === 0) {
          setToastMessage('최소 하나의 이미지를 업로드해주세요.');
          setToastType('error');
          setShowToast(true);
          return;
        }

        // 썸네일 이미지와 나머지 이미지 분리
        const thumbnailImage = uploadedImages[selectedThumbnailIndex];
        // 편집된 이미지가 있으면 그것을 사용, 없으면 원본 사용
        thumbnailUrl = thumbnailImage.editedUrl || thumbnailImage.serverUrl;
        additionalImageUrls = uploadedImages
          .filter((_, index) => index !== selectedThumbnailIndex)
          .map(img => img.serverUrl);
      } else if (formData.resultType === 'text') {
        // 텍스트 결과 타입인 경우
        if (!formData.textResult.trim()) {
          setToastMessage('텍스트 결과를 입력해주세요.');
          setToastType('error');
          setShowToast(true);
          return;
        }

        // 텍스트를 이미지로 변환하여 업로드
        try {
          const textImageData = await createTextImage(formData.textResult);
          const token = localStorage.getItem('token');
          const response = await fetch('/api/upload-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              imageData: textImageData,
              fileName: 'text-result.png',
            }),
          });

          const result = await response.json();
          
          if (response.ok && result.success && result.data) {
            thumbnailUrl = result.data.url;
          } else {
            throw new Error(result.message || '텍스트 이미지 업로드에 실패했습니다.');
          }
        } catch (error) {
          console.error('Text image upload error:', error);
          setToastMessage('텍스트 이미지 생성에 실패했습니다.');
          setToastType('error');
          setShowToast(true);
          return;
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
          previewImage: thumbnailUrl,
          additionalImages: additionalImageUrls,
          videoUrl: formData.resultType === 'image' ? formData.videoUrl : '',
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
      <div className="min-h-screen bg-orange-50/20">
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
    <div className="min-h-screen bg-orange-50/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 폼 */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 px-6 pt-5 pb-6">
            {/* 헤더 */}
            <div className="mb-8 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-orange-500 mb-2">프롬프트 생성</h1>
                <p className="text-orange-500">창의적인 프롬프트를 만들어 다른 사용자와 공유해보세요!</p>
              </div>
              {/* 공개 설정 - 우측 상단 */}
              <div className="flex flex-col items-center gap-1">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
                <span className="text-xs font-medium text-gray-700">
                  {formData.isPublic ? '공개' : '비공개'}
                </span>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 프롬프트 제목 */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  프롬프트 제목
                </h3>
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

              {/* 결과 구분 선택 */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  유형
                </h3>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="resultType"
                      value="image"
                      checked={formData.resultType === 'image'}
                      onChange={() => handleInputChange('resultType', 'image')}
                      className="sr-only"
                    />
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      formData.resultType === 'image' ? 'border-orange-500' : 'border-gray-300'
                    }`}>
                      {formData.resultType === 'image' && (
                        <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                      )}
                    </span>
                    <span className={`ml-2 text-base ${
                      formData.resultType === 'image' ? 'text-gray-900 font-medium' : 'text-gray-700'
                    }`}>
                      이미지/동영상
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="resultType"
                      value="text"
                      checked={formData.resultType === 'text'}
                      onChange={() => handleInputChange('resultType', 'text')}
                      className="sr-only"
                    />
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      formData.resultType === 'text' ? 'border-orange-500' : 'border-gray-300'
                    }`}>
                      {formData.resultType === 'text' && (
                        <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                      )}
                    </span>
                    <span className={`ml-2 text-base ${
                      formData.resultType === 'text' ? 'text-gray-900 font-medium' : 'text-gray-700'
                    }`}>
                      텍스트
                    </span>
                  </label>
                </div>
              </div>
              
              {/* 카테고리 & AI 모델 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 카테고리 */}
                <div className="dropdown-container">
                  <h3 className="font-medium text-gray-900 mb-2">
                    카테고리
                  </h3>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex items-center justify-center">
                          <span className="text-lg">
                            {categories.find(cat => cat.value === formData.category)?.icon}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {categories.find(cat => cat.value === formData.category)?.label}
                        </span>
                      </div>
                      <svg className={`w-5 h-5 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showCategoryDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        {categories.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => {
                              handleInputChange('category', cat.value);
                              setShowCategoryDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                          >
                            <div className="w-6 h-6 flex items-center justify-center">
                              <span className="text-lg">{cat.icon}</span>
                            </div>
                            <span className="text-sm font-medium">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* AI 모델 */}
                <div className="dropdown-container">
                  <h3 className="font-medium text-gray-900 mb-2">
                    AI 모델
                  </h3>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAIModelDropdown(!showAIModelDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {aiModels.map((model) => (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => {
                              handleInputChange('aiModel', model.id);
                              setShowAIModelDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
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

              {/* 프롬프트 소개 */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  프롬프트 소개
                </h3>
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
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  프롬프트
                </h3>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="AI에게 전달할 프롬프트 내용을 입력하세요"
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
              
              {/* 이미지 업로드 섹션 (결과 타입이 이미지일 때만 표시) */}
              {/* 이미지 업로드 섹션 또는 텍스트 미리보기 */}
              {formData.resultType === 'image' && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">
                    이미지 업로드
                  </h3>
                
                {/* 이미지 업로드 영역 */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver 
                      ? 'border-orange-400 bg-orange-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="space-y-2">
                      <div className="w-16 h-16 mx-auto">
                        <Image
                          src="/logo.png"
                          alt="프롬팟 로고"
                          width={64}
                          height={64}
                          className="w-full h-full object-contain opacity-40"
                          unoptimized={true}
                        />
                      </div>
                      <p className="text-sm text-gray-600">이미지를 업로드하려면 클릭하거나 드래그하세요</p>
                      <p className="text-xs text-gray-500">JPG, PNG, GIF (최대 5MB, 최대 6개)</p>
                    </div>
                  </label>
                </div>

                {/* 업로드된 이미지 미리보기 및 썸네일 선택 */}
                {uploadedImages.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      업로드된 이미지 ({uploadedImages.length}/6)
                    </h4>
                    
                    {/* 썸네일 선택 안내 */}
                    <p className="text-xs text-gray-500 mb-3">
                      클릭하여 썸네일을 선택하세요. 선택된 이미지가 프롬프트의 대표 이미지로 사용됩니다.
                    </p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {uploadedImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <div 
                            className={`relative w-full h-24 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                              selectedThumbnailIndex === index 
                                ? 'border-orange-500 shadow-lg' 
                                : 'border-transparent hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedThumbnailIndex(index)}
                          >
                            <Image
                              src={img.editedUrl || img.url}
                              alt={`이미지 ${index + 1}`}
                              fill
                              className="object-cover"
                              unoptimized={true}
                            />
                            {selectedThumbnailIndex === index && (
                              <div className="absolute inset-0 bg-orange-500 bg-opacity-20 flex items-center justify-center">
                                <div className="bg-white rounded-full p-1">
                                  <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            )}
                            {img.editedUrl && (
                              <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                                편집됨
                              </div>
                            )}
                          </div>
                          {/* 편집 버튼 */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditThumbnail(index);
                            }}
                            className="absolute top-1 left-1 w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md z-10 transition-all"
                            title="썸네일 편집"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {/* 썸네일 미리보기 */}
                    {selectedThumbnailIndex !== null && uploadedImages[selectedThumbnailIndex] && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-700">썸네일 미리보기</h4>
                          <button
                            type="button"
                            onClick={() => handleEditThumbnail(selectedThumbnailIndex)}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors shadow-md"
                            title="썸네일 편집"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="text-sm font-medium">편집</span>
                          </button>
                        </div>
                        <div className="relative w-full max-w-md mx-auto aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={uploadedImages[selectedThumbnailIndex].editedUrl || uploadedImages[selectedThumbnailIndex].url}
                            alt="썸네일 미리보기"
                            fill
                            className="object-cover"
                            unoptimized={true}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                </div>
              )}


              {/* 동영상 URL (결과 타입이 이미지일 때만 표시) */}
              {formData.resultType === 'image' && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">
                    동영상 URL (선택사항)
                  </h3>
                  <input
                    type="url"
                    id="videoUrl"
                    value={formData.videoUrl}
                    onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                    placeholder="YouTube, Vimeo 등의 동영상 URL을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  
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
              )}



              {/* 텍스트 결과 입력 (결과 타입이 텍스트일 때만 표시) */}
              {formData.resultType === 'text' && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">
                    프롬프트 결과
                  </h3>
                  <div className="relative">
                    <textarea
                      id="textResult"
                      value={formData.textResult}
                      onChange={(e) => handleInputChange('textResult', e.target.value)}
                      placeholder="AI가 생성한 프롬프트 결과를 입력하세요. 결과 값이 미리보기로 보여집니다."
                      rows={isTextResultExpanded ? 12 : 6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                    
                    {/* 펼쳐보기/접어보기 버튼 */}
                    {formData.textResult && formData.textResult.length > 200 && (
                      <div className="absolute bottom-2 right-2">
                        <button
                          type="button"
                          onClick={() => setIsTextResultExpanded(!isTextResultExpanded)}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-orange-500 hover:text-orange-700 bg-white border border-orange-200 rounded hover:bg-orange-50 transition-colors"
                        >
                          <span>{isTextResultExpanded ? '접기' : '펼치기'}</span>
                          <svg 
                            className={`w-3 h-3 transition-transform duration-200 ${
                              isTextResultExpanded ? 'rotate-180' : ''
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* 텍스트 이미지 미리보기 */}
                  {formData.textResult && textImageUrl && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">미리보기</p>
                      <div className="relative w-full max-w-md mx-auto">
                        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={textImageUrl}
                            alt="텍스트 미리보기"
                            fill
                            className="object-contain"
                            unoptimized={true}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 태그 */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  태그
                </h3>
                <input
                  ref={tagInputRef}
                  type="text"
                  id="tags"
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="태그를 입력하고 Enter를 누르세요. 최대 5개의 태그를 추가할 수 있습니다. (예: AI, 생산성, 팁)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-orange-100 text-orange-400 text-xs px-2 py-0.5 rounded font-medium"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-orange-600 hover:text-orange-800 transition-colors"
                        title="태그 삭제"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
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
      
      {/* 썸네일 편집기 */}
      {showThumbnailEditor && editingImageIndex !== null && uploadedImages[editingImageIndex] && (
        <ThumbnailEditor
          imageUrl={uploadedImages[editingImageIndex].url}
          onSave={handleSaveThumbnail}
          onCancel={() => {
            setShowThumbnailEditor(false);
            setEditingImageIndex(null);
          }}
        />
      )}
    </div>
  );
};

export default CreatePromptPage;