import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import Toast from '@/components/Toast';
import ThumbnailEditor from '@/components/ThumbnailEditor';
import { getVideoThumbnail, getVideoTitle } from '@/utils/videoUtils';

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
  const isAdmin = user?.email === 'prompot7@gmail.com';
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalPreviewUrls, setAdditionalPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 드롭다운 상태 추가
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showAIModelDropdown, setShowAIModelDropdown] = useState(false);
  
  // 썸네일 편집 상태
  const [showThumbnailEditor, setShowThumbnailEditor] = useState(false);
  const [editedThumbnail, setEditedThumbnail] = useState<string | null>(null);
  const [selectedThumbnailFromAdditional, setSelectedThumbnailFromAdditional] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'work' as CategoryType,
    aiModel: 'chatgpt',
    tags: '',
    description: '',
    content: '',
    isPublic: true,
    videoUrl: '',
  });
  
  // 프롬프트 원본 데이터 저장
  const [originalPrompt, setOriginalPrompt] = useState<any>(null);

  const categories: { value: CategoryType; label: string; icon: string }[] = [
    { value: 'work', label: '업무/마케팅', icon: '💼' },
    { value: 'dev', label: '개발/코드', icon: '💻' },
    { value: 'design', label: '디자인/브랜드', icon: '🎨' },
    { value: 'edu', label: '교육/학습', icon: '📚' },
    { value: 'image', label: '이미지/동영상', icon: '🎬' },
  ];

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


  const fetchPrompt = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('인증 정보가 없습니다. 다시 로그인해주세요.');
      }

      const res = await fetch(`/api/prompts/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
        }
        throw new Error('프롬프트를 불러올 수 없습니다.');
      }
      
      const data = await res.json();
      const prompt = data.prompt;
      
      // 원본 프롬프트 데이터 저장
      setOriginalPrompt(prompt);
      
      // 작성자 또는 관리자 확인
      if (prompt.author_id !== user?.id && !isAdmin) {
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
        videoUrl: prompt.video_url || '',
      });
      
      if (prompt.preview_image) {
        setPreviewImage(prompt.preview_image);
      }
      
      // 기존 추가 이미지들 로드
      if (prompt.additional_images && Array.isArray(prompt.additional_images)) {
        setAdditionalPreviewUrls(prompt.additional_images);
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
  }, [id, user?.id, router, isAdmin]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (id) {
      fetchPrompt();
    }
  }, [fetchPrompt, id, isAuthenticated, router]);

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

  const handleAdditionalImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const maxImages = 5; // 최대 5개 추가 이미지
    
    if (additionalImages.length + files.length > maxImages) {
      setToastMessage(`최대 ${maxImages}개의 추가 이미지만 업로드할 수 있습니다.`);
      setToastType('error');
      setShowToast(true);
      return;
    }

    const validFiles = files.filter(file => {
      // 파일 크기 검증 (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setToastMessage(`${file.name}의 크기가 2MB를 초과합니다.`);
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
      setAdditionalImages(prev => [...prev, ...validFiles]);
      const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
      setAdditionalPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    setAdditionalPreviewUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index);
      // URL 해제
      if (prev[index].startsWith('blob:')) {
        URL.revokeObjectURL(prev[index]);
      }
      return newUrls;
    });
  };

  // 썸네일 편집 핸들러
  const handleEditThumbnail = () => {
    setShowThumbnailEditor(true);
  };

  const handleSaveThumbnail = async (editedImageUrl: string) => {
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
        setEditedThumbnail(result.data.url);
        setPreviewImage(result.data.url); // 미리보기 이미지도 업데이트
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
      
      // 편집된 썸네일이 있으면 그것을 사용, 없으면 기존 이미지 사용
      let previewImageUrl = editedThumbnail || previewImage;
      const additionalImageUrls: string[] = [];
      
      // 미리보기 이미지 업로드 (새로 업로드된 경우)
      if (previewImageUrl && previewImageUrl.startsWith('data:') && !editedThumbnail) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          throw new Error('인증 정보가 없습니다. 다시 로그인해주세요.');
        }
        
        // Base64 데이터에서 파일명 추출 (임시 파일명 사용)
        const uploadRes = await fetch('/api/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            imageData: previewImage,
            fileName: 'preview-image.jpg',
          }),
        });
        
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.message || '미리보기 이미지 업로드에 실패했습니다.');
        }
        
        const uploadData = await uploadRes.json();
        // API 응답 형식에 맞춰서 URL 추출
        if (uploadData.success && uploadData.data) {
          previewImageUrl = uploadData.data.url;
        } else if (uploadData.imageUrl) {
          previewImageUrl = uploadData.imageUrl;
        } else {
          throw new Error('이미지 URL을 찾을 수 없습니다.');
        }
      }
      
      // 추가 이미지들 업로드
      if (additionalImages.length > 0) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          throw new Error('인증 정보가 없습니다. 다시 로그인해주세요.');
        }

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
          // API 응답 형식에 맞춰서 URL 추출
          if (uploadData.success && uploadData.data) {
            additionalImageUrls.push(uploadData.data.url);
          } else if (uploadData.imageUrl) {
            additionalImageUrls.push(uploadData.imageUrl);
          } else {
            throw new Error('추가 이미지 URL을 찾을 수 없습니다.');
          }
        }
      }
      
      // 기존 추가 이미지 URL들과 새로 업로드된 이미지 URL들을 합침
      const existingAdditionalImages = additionalPreviewUrls.filter(url => 
        !url.startsWith('blob:') && !url.startsWith('data:')
      );
      const allAdditionalImages = [...existingAdditionalImages, ...additionalImageUrls];
      
      // 관리자 API와 일반 API의 데이터 형식 맞추기
      const updateData = isAdmin ? {
        title: formData.title,
        description: formData.description,
        prompt: formData.content,
        category: formData.category,
        aiModel: formData.aiModel,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      } : {
        ...formData,
        preview_image: previewImageUrl,
        additional_images: allAdditionalImages,
        video_url: formData.videoUrl,
        is_public: formData.isPublic,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        throw new Error('인증 정보가 없습니다. 다시 로그인해주세요.');
      }

      // 관리자면 admin API 사용, 아니면 일반 API 사용
      const apiUrl = isAdmin ? `/api/admin/prompts/${id}` : `/api/prompts/${id}`;
      
      const res = await fetch(apiUrl, {
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
        if (res.status === 401) {
          throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
        }
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
      
      // 수정된 프롬프트의 상세 페이지로 이동
      setTimeout(() => {
        router.push(`/prompt/${id}`);
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
        <main className="min-h-screen bg-orange-50/20">
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
        <main className="min-h-screen bg-orange-50/20">
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
    <div className="min-h-screen bg-orange-50/20">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 px-6 pt-5 pb-6">
            {/* 헤더 */}
            <div className="mb-8 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-orange-500 mb-2">
                  프롬프트 수정 {isAdmin && originalPrompt?.author_id !== user?.id && '(관리자)'}
                </h1>
                <p className="text-orange-500">프롬프트를 수정하고 개선해보세요!</p>
              </div>
              {/* 공개 설정 - 우측 상단 */}
              <div className="flex flex-col items-center gap-1">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
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
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="프롬프트의 제목을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
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
                              setFormData(prev => ({ ...prev, category: cat.value }));
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
                              setFormData(prev => ({ ...prev, aiModel: model.id }));
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
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
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
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="AI에게 전달할 프롬프트 내용을 입력하세요"
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              {/* 썸네일 이미지 섹션 */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">썸네일 이미지</h3>
                  {previewImage && (
                    <button
                      type="button"
                      onClick={handleEditThumbnail}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors shadow-md"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="text-sm font-medium">썸네일 편집</span>
                    </button>
                  )}
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer block">
                    {previewImage ? (
                      <div className="relative w-full max-w-md mx-auto aspect-[16/9]">
                        <Image
                          src={editedThumbnail || previewImage}
                          alt="썸네일 미리보기"
                          fill
                          className="object-contain rounded-lg"
                        />
                        {editedThumbnail && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            편집됨
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPreviewImage(null);
                            setEditedThumbnail(null);
                          }}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 text-center">
                        <div className="w-20 h-20 mx-auto">
                          <Image
                            src="/logo.png"
                            alt="프롬팟 로고"
                            width={80}
                            height={80}
                            className="w-full h-full object-contain opacity-40"
                            unoptimized={true}
                          />
                        </div>
                        <p className="text-sm text-gray-600">클릭하여 썸네일 이미지를 업로드하세요</p>
                        <p className="text-xs text-gray-500">JPG, PNG, GIF (최대 2MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* 추가 이미지 섹션 */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">추가 이미지 (선택사항)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {/* 업로드된 추가 이미지들 */}
                  {additionalPreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <div 
                        className={`relative w-full aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedThumbnailFromAdditional === index 
                            ? 'border-orange-500 shadow-lg' 
                            : 'border-transparent hover:border-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedThumbnailFromAdditional(index);
                          setPreviewImage(url);
                          setEditedThumbnail(null); // 편집된 썸네일 초기화
                        }}
                      >
                        <Image
                          src={url}
                          alt={`추가 이미지 ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        {selectedThumbnailFromAdditional === index && (
                          <div className="absolute inset-0 bg-orange-500 bg-opacity-20 flex items-center justify-center">
                            <div className="bg-white rounded-full p-1">
                              <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAdditionalImage(index);
                          // 선택된 썸네일이 삭제되면 선택 해제
                          if (selectedThumbnailFromAdditional === index) {
                            setSelectedThumbnailFromAdditional(null);
                            if (originalPrompt?.preview_image) {
                              setPreviewImage(originalPrompt.preview_image);
                            } else {
                              setPreviewImage(null);
                            }
                          } else if (selectedThumbnailFromAdditional !== null && selectedThumbnailFromAdditional > index) {
                            // 선택된 인덱스 조정
                            setSelectedThumbnailFromAdditional(selectedThumbnailFromAdditional - 1);
                          }
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  {/* 추가 이미지 업로드 박스 (5개 미만일 때만 표시) */}
                  {additionalPreviewUrls.length < 5 && (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleAdditionalImagesChange}
                        className="hidden"
                        id="additional-images-upload"
                      />
                      <label htmlFor="additional-images-upload" className="cursor-pointer block">
                        <div className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors">
                          <div className="text-center p-2">
                            <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <p className="text-xs text-gray-500">추가</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">{additionalPreviewUrls.length}/5개 업로드됨</p>
              </div>

              {/* 제목 */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">제목</h3>
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
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  설명
                </h3>
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

              {/* 프롬프트 내용 */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  프롬프트 내용
                </h3>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="AI에게 전달할 프롬프트 내용을 입력하세요"
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>



              {/* 동영상 URL */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  동영상 URL (선택사항)
                </h3>
                <input
                  type="url"
                  id="videoUrl"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleChange}
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

              {/* 카테고리, AI 모델 & 공개 설정 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        {categories.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, category: cat.value }));
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
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {aiModels.map((model) => (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, aiModel: model.id }));
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

                {/* 공개 설정 */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    공개 설정
                  </h3>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-600">
                      {formData.isPublic 
                        ? '모두에게 프롬프트가 보여집니다.' 
                        : '나만 이 프롬프트를 볼 수 있습니다.'
                      }
                    </p>
                    <label className="relative inline-flex items-center cursor-pointer ml-auto">
                      <input
                        type="checkbox"
                        checked={formData.isPublic}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* 태그 */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900">
                  태그
                </h3>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="태그를 쉼표로 구분하여 입력하세요. 최대 5개의 태그를 추가할 수 있습니다. (예: AI, 생산성, 팁)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.split(',').map((tag, index) => (
                    tag.trim() && (
                      <span
                        key={index}
                        className="inline-block bg-orange-100 text-orange-400 text-xs px-2 py-0.5 rounded font-medium"
                      >
                        #{tag.trim()}
                      </span>
                    )
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
      
      {/* 썸네일 편집기 */}
      {showThumbnailEditor && previewImage && (
        <ThumbnailEditor
          imageUrl={previewImage}
          onSave={handleSaveThumbnail}
          onCancel={() => setShowThumbnailEditor(false)}
        />
      )}
    </>
  );
};

export default EditPromptPage;