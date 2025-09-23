import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { usePrompts } from '@/hooks/usePrompts';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Prompt } from '@/types/prompt';
import Toast from '@/components/Toast';
import AvatarUpload from '@/components/AvatarUpload';
import ProfileImageModal from '@/components/ProfileImageModal';
import BookmarkCategoryManager from '@/components/BookmarkCategoryManager';
import BookmarkCategorySelector from '@/components/BookmarkCategorySelector';
import BookmarkPanel from '@/components/BookmarkPanel';
import { useBookmarkCategories } from '@/hooks/useBookmarkCategories';
import { getVideoThumbnail, getVideoTitle } from '@/utils/videoUtils';
import PromptCardCompact from '@/components/PromptCardCompact';
import { calculateLevel, getLevelColorClass, getLevelTitle } from '@/utils/levelSystem';

// AI 모델 이름에 따른 아이콘 경로 반환 함수
const getAIModelIcon = (aiModelName: string): string => {
  if (!aiModelName) return '';
  
  const iconMap: { [key: string]: string } = {
    'ChatGPT': '/image/icon_chatgpt.png',
    'Claude': '/image/icon_claude.png',
    'Midjourney': '/image/icon_midjourney.png',
    'DALL-E': '/image/icon_dall_e_3.png',
    'Stable Diffusion': '/image/icon_Stable_Diffusion.png',
    'Leonardo AI': '/image/icon_leonardo_ai.png',
    'Runway': '/image/icon_runway.png',
    'Pika Labs': '/image/icon_PikaLabs.png',
    'Sora': '/image/icon_Sora.png',
    'Kling': '/image/icon_kling.png',
    'Gemini': '/image/icon_gemini.png',
    'Perplexity': '/image/icon_perplexity.png',
    'Jasper': '/image/icon_jasper.png',
    'Copy.ai': '/image/icon_Copy-ai.png',
    'ElevenLabs': '/image/icon_ElevenLabs.png',
    'HeyGen': '/image/icon_heygen.png',
    'Synthesia': '/image/icon_synthesia.png',
    'Pictory': '/image/icon_pictory_logo.png',
    'FlexClip': '/image/icon_flexclip.png',
    'v0': '/image/icon_v0.png',
    'Cursor AI': '/image/icon_cursor-ai.png',
    'Replit': '/image/icon_Replit.png',
    'Lovable': '/image/icon_lovable.png',
    'Whisk': '/image/icon_whisk.png',
    'Wrtn': '/image/icon_wrtn.png',
    'Pollo AI': '/image/icon_pollo-ai.png',
    'Clovax': '/image/icon_clovax.png',
    'Mistral Large': '/image/icon_mistrallarge.png',
    'GPT-4 Code': '/image/icon_gpt-4_code.png',
    'Claude Artifacts': '/image/icon_claude_artifacts.png',
    'ImageFX': '/image/icon_imageFX.png',
    'ControlNet': '/image/icon_controlnet.png',
    'Bolt': '/image/icon_bolt-new.png'
  };
  
  // 정확한 매칭 시도
  if (iconMap[aiModelName]) {
    return iconMap[aiModelName];
  }
  
  // 부분 매칭 시도 (대소문자 무시)
  const lowerModelName = aiModelName.toLowerCase();
  for (const [key, value] of Object.entries(iconMap)) {
    if (key.toLowerCase().includes(lowerModelName) || lowerModelName.includes(key.toLowerCase())) {
      console.log(`[DEBUG] AI Model partial match: "${aiModelName}" -> "${key}"`);
      return value;
    }
  }
  
  console.log(`[DEBUG] AI Model not found: "${aiModelName}"`);
  return '';
};

// 안전한 작성자 이름 추출 함수
const getAuthorName = (author: any): string => {
  if (typeof author === 'string') return author;
  if (typeof author === 'object' && author?.name) return author.name;
  return '익명';
};

const MyPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'prompts' | 'bookmarks' | 'settings' | 'support'>('prompts');
  
  // URL 쿼리 파라미터에서 탭 설정
  useEffect(() => {
    if (router.query.tab === 'bookmarks') {
      setActiveTab('bookmarks');
    }
  }, [router.query.tab]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // useMemo를 사용하여 options 객체를 안정화
  const promptsOptions = useMemo(() => ({ author: true }), []);
  const { prompts: allPrompts, loading, error, refetch } = usePrompts(promptsOptions);
  const { bookmarks, loading: bookmarksLoading, error: bookmarksError, removeBookmark, refetch: refetchBookmarks, addBookmark, isBookmarked } = useBookmarks();
  const [myPrompts, setMyPrompts] = useState<Prompt[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'bookmark'>('success');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const { categories: bookmarkCategories, refetch: refetchBookmarkCategories } = useBookmarkCategories();
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  // 이름 수정 관련 상태
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  
  // 비밀번호 변경 관련 상태
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{[key: string]: string}>({});
  
  // 북마크 관련 상태
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [selectedPromptForBookmark, setSelectedPromptForBookmark] = useState<Prompt | null>(null);

  // 북마크 섹션용 북마크 제거 함수
  const handleBookmarkRemove = (bookmarkId: number, promptId: number) => {
    if (!isAuthenticated) {
      setToastMessage('로그인이 필요합니다.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    removeBookmark(promptId);
    setToastMessage('북마크에서 제거되었습니다.');
    setToastType('bookmark');
    setShowToast(true);
  };

  // 북마크 관련 함수들
  const handleBookmarkClick = (prompt: Prompt) => {
    if (!isAuthenticated) {
      setToastMessage('로그인이 필요합니다.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (isBookmarked(prompt.id)) {
      // 북마크 제거
      removeBookmark(prompt.id);
      setToastMessage('북마크에서 제거되었습니다.');
      setToastType('bookmark');
      setShowToast(true);
    } else {
      // 북마크 추가 - 카테고리 선택기 열기
      setSelectedPromptForBookmark(prompt);
      setShowCategorySelector(true);
    }
  };

  // 북마크 처리 함수 (메인 페이지와 동일)
  const handleBookmark = async (id: string | number, categoryId?: string | null) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      if (isBookmarked(id)) {
        await removeBookmark(id);
      } else {
        await addBookmark(id, categoryId);
      }
    } catch (error) {
      console.error('Bookmark error:', error);
    }
  };

  // PromptCard용 핸들러 함수들
  const handleLike = useCallback((promptId: number) => {
    // 좋아요 기능은 현재 구현하지 않음
    console.log('Like clicked for prompt:', promptId);
  }, []);

  const handleBookmarkToggle = useCallback((prompt: Prompt) => {
    if (!isAuthenticated) return;
    
    if (isBookmarked(prompt.id)) {
      // 북마크 제거
      const bookmarkToRemove = bookmarks.find(bookmark => 
        bookmark && bookmark.prompt && bookmark.prompt.id === prompt.id
      );
      if (bookmarkToRemove) {
        handleBookmarkRemove(bookmarkToRemove.id, prompt.id);
      }
    } else {
      // 북마크 추가
      handleBookmarkClick(prompt);
    }
  }, [isAuthenticated, bookmarks, handleBookmarkRemove, handleBookmarkClick, isBookmarked]);

  const handleCategoryClick = useCallback((category: string) => {
    // 카테고리 클릭 시 홈으로 이동하여 필터 적용
    router.push(`/?category=${category}`);
  }, [router]);

  const handleAIModelClick = useCallback((aiModel: string) => {
    // AI 모델 클릭 시 홈으로 이동하여 필터 적용
    router.push(`/?aiModel=${aiModel}`);
  }, [router]);

  const handleTagClick = useCallback((tag: string) => {
    // 태그 클릭 시 홈으로 이동하여 필터 적용
    router.push(`/?tag=${tag}`);
  }, [router]);

  // 내 프롬프트 데이터를 Prompt 형태로 변환하는 함수
  const convertMyPromptToPrompt = useCallback((prompt: Prompt): Prompt => {
    console.log('[DEBUG] Converting my prompt to prompt:', {
      promptId: prompt.id,
      authorName: prompt.author?.name,
      authorAvatarUrl: prompt.author?.avatar_url,
      authorId: prompt.author?.id,
      videoUrl: prompt.video_url,
      additionalImages: prompt.additional_images,
      bookmarkCount: prompt.bookmarkCount,
      commentCount: prompt.commentCount
    });
    
    return {
      ...prompt,
      // 내 프롬프트는 항상 북마크 상태로 표시
      isBookmarked: isBookmarked(prompt.id),
      // 메인페이지와 동일한 데이터 구조 보장
      bookmarkCount: prompt.bookmarkCount || 0,
      commentCount: prompt.commentCount || 0,
      totalRatings: prompt.totalRatings || 0,
      averageRating: prompt.averageRating || 0,
      // 작성자 정보가 누락된 경우 현재 사용자 정보로 보완
      author: prompt.author || {
        id: user?.id || '',
        name: user?.name || '익명',
        email: user?.email,
        avatar_url: user?.avatar_url
      }
    };
  }, [isBookmarked, user]);

  // 북마크 데이터를 Prompt 형태로 변환하는 함수
  const convertBookmarkToPrompt = useCallback((bookmark: any): Prompt => {
    console.log('[DEBUG] Converting bookmark to prompt:', {
      bookmarkId: bookmark.id,
      promptId: bookmark.prompt.id,
      authorName: bookmark.prompt.author,
      authorAvatarUrl: bookmark.prompt.authorAvatarUrl,
      videoUrl: bookmark.prompt.videoUrl,
      additionalImages: bookmark.prompt.additionalImages,
      aiModel: bookmark.prompt.aiModel,
      aiModelType: typeof bookmark.prompt.aiModel,
      aiModelIcon: typeof bookmark.prompt.aiModel === 'string' 
        ? getAIModelIcon(bookmark.prompt.aiModel)
        : bookmark.prompt.aiModel?.icon
    });
    
    return {
      id: bookmark.prompt.id,
      title: bookmark.prompt.title,
      description: bookmark.prompt.description,
      content: bookmark.prompt.content,
      author: {
        id: bookmark.prompt.authorId || '',
        name: bookmark.prompt.author || '익명',
        email: undefined, // Added for consistency with main page Prompt type
        avatar_url: bookmark.prompt.authorAvatarUrl || undefined
      },
      date: bookmark.prompt.createdAt,
      created_at: bookmark.prompt.createdAt,
      tags: bookmark.prompt.tags || [],
      rating: 0,
      totalRatings: 0,
      likes: 0,
      bookmarks: 0,
      bookmarkCount: 0,
      commentCount: 0,
      averageRating: 0,
      category: bookmark.prompt.category as any,
      preview_image: bookmark.prompt.previewImage,
      video_url: bookmark.prompt.videoUrl || undefined,
      additional_images: bookmark.prompt.additionalImages || undefined,
      aiModel: typeof bookmark.prompt.aiModel === 'string' 
        ? { 
            name: bookmark.prompt.aiModel, 
            icon: getAIModelIcon(bookmark.prompt.aiModel)
          }
        : bookmark.prompt.aiModel,
      isPublic: bookmark.prompt.isPublic,
      isBookmarked: true // 북마크된 프롬프트는 항상 북마크 상태
    };
  }, []);

  // 사용자 프로필 정보 새로고침 함수
  const refreshUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
    }
  };

  // 사용자 통계 정보 가져오기
  const fetchUserStats = async () => {
    try {
      if (!user?.id) return;
      
      const res = await fetch(`/api/users/${user.id}/stats`);
      if (res.ok) {
        const data = await res.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error('사용자 통계 로드 실패:', error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      // 인증된 사용자의 경우 프로필 정보 새로고침
      refreshUserProfile();
      fetchUserStats();
    }
  }, [isAuthenticated, router]);

  // URL 파라미터 처리 (프롬프트 생성 후 리다이렉트용)
  useEffect(() => {
    console.log('[DEBUG] URL params check:', { 
      isAuthenticated, 
      tab: router.query.tab, 
      refresh: router.query.refresh 
    });
    
    if (isAuthenticated && router.query.tab === 'prompts' && router.query.refresh === 'true') {
      console.log('[DEBUG] Detected refresh parameter, refetching prompts');
      setActiveTab('prompts');
      
      // 즉시 새로고침 실행
      refetch();
      
      // 캐시 무효화를 위한 추가 새로고침
      setTimeout(() => {
        console.log('[DEBUG] Cache invalidation refetch');
        refetch();
      }, 500);
      
      // URL 파라미터 정리 (shallow: true로 변경하여 페이지 새로고침 방지)
      router.replace('/mypage?tab=prompts', undefined, { shallow: true });
    }
  }, [isAuthenticated, router.query.tab, router.query.refresh, router]);

  useEffect(() => {
    // author=true로 호출했으므로 이미 현재 사용자의 프롬프트만 받아옴
    console.log('[DEBUG] MyPage useEffect - allPrompts:', allPrompts);
    console.log('[DEBUG] MyPage useEffect - user:', user?.id, user?.name, user?.email);
    console.log('[DEBUG] MyPage useEffect - isAuthenticated:', isAuthenticated);
    
    if (allPrompts.length > 0) {
      console.log('[DEBUG] Setting prompts directly (already filtered by author=true):', allPrompts);
      console.log('[DEBUG] First prompt category and aiModel:', {
        category: allPrompts[0]?.category,
        aiModel: allPrompts[0]?.aiModel
      });
      console.log('[DEBUG] First prompt author info:', {
        author: allPrompts[0]?.author,
        authorName: allPrompts[0]?.author?.name,
        authorAvatarUrl: allPrompts[0]?.author?.avatar_url
      });
      setMyPrompts(allPrompts);
    } else {
      console.log('[DEBUG] No prompts available');
      setMyPrompts([]);
    }
  }, [allPrompts, user, isAuthenticated]);

  // 페이지 방문 시 자동 새로고침 추가 (한 번만 실행)
  useEffect(() => {
    if (isAuthenticated && activeTab === 'prompts') {
      console.log('[DEBUG] Initial load - fetching prompts');
      refetch();
    } else if (isAuthenticated && activeTab === 'support') {
      fetchInquiries();
    }
  }, [isAuthenticated, activeTab]); // refetch 의존성 제거

  const handleDelete = (id: number) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      try {
        // localStorage에서 토큰 가져오기
        const token = localStorage.getItem('token');
        console.log('[DEBUG] Delete - Token from localStorage:', token ? 'exists' : 'not found');
        console.log('[DEBUG] Delete - Target ID:', deleteTargetId);
        
        if (!token) {
          throw new Error('로그인 토큰이 없습니다. 다시 로그인해주세요.');
        }
        
        const res = await fetch(`/api/prompts/${deleteTargetId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('[DEBUG] Delete - Response status:', res.status);
        console.log('[DEBUG] Delete - Response headers:', Object.fromEntries(res.headers.entries()));
        
        if (!res.ok) {
          const errorData = await res.json();
          console.log('[DEBUG] Delete - Error data:', errorData);
          throw new Error(errorData.message || '프롬프트 삭제에 실패했습니다.');
        }

        setMyPrompts(prev => prev.filter(p => p.id !== deleteTargetId));
        setToastMessage('프롬프트가 삭제되었습니다.');
        setToastType('success');
        setShowToast(true);
        setShowDeleteModal(false);
        setDeleteTargetId(null);
        refetch();
      } catch (error) {
        console.error('Delete error:', error); // 디버깅 로그
        setToastMessage('프롬프트 삭제 중 오류가 발생했습니다.');
        setToastType('error');
        setShowToast(true);
      }
    }
  };


  const handleAvatarChange = async (avatarUrl: string) => {
    try {
      console.log('[DEBUG] Avatar changed to:', avatarUrl);
      
      // 업로드된 아바타 URL로 사용자 프로필 상태 업데이트
      setUserProfile((prev: any) => ({
        ...prev,
        avatar_url: avatarUrl
      }));
      
      // AuthContext의 사용자 정보도 업데이트
      if (refreshUser) {
        await refreshUser();
      }
      
      setToastMessage('프로필 사진이 업데이트되었습니다.');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error('Profile refresh error:', error);
      setToastMessage('프로필 사진 업데이트에 실패했습니다.');
      setToastType('error');
      setShowToast(true);
    }
  };

  // 이름 수정 관련 함수들
  const handleStartEditName = () => {
    setEditedName(user?.name || '');
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setEditedName('');
    setIsEditingName(false);
  };

  const handleUpdateName = async () => {
    if (!editedName.trim()) {
      setToastMessage('이름을 입력해주세요.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (editedName.trim() === user?.name) {
      setIsEditingName(false);
      return;
    }

    setIsUpdatingName(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editedName.trim(),
        }),
      });

      const data = await res.json();
      
      if (data.ok) {
        // 프로필 정보 새로고침
        await refreshUserProfile();
        await refreshUser();
        
        setToastMessage('이름이 성공적으로 변경되었습니다.');
        setToastType('success');
        setShowToast(true);
        setIsEditingName(false);
      } else {
        throw new Error(data.error || '이름 변경에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Name update error:', error);
      setToastMessage(error.message || '이름 변경에 실패했습니다.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsUpdatingName(false);
    }
  };

  // 비밀번호 변경 관련 함수들
  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 에러 메시지 초기화
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validatePasswordChange = () => {
    const errors: {[key: string]: string} = {};

    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = '현재 비밀번호를 입력해주세요.';
    }

    if (!passwordData.newPassword.trim()) {
      errors.newPassword = '새 비밀번호를 입력해주세요.';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = '새 비밀번호는 6자 이상이어야 합니다.';
    }

    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = '새 비밀번호 확인을 입력해주세요.';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.';
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = '새 비밀번호는 현재 비밀번호와 달라야 합니다.';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async () => {
    if (!validatePasswordChange()) {
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await res.json();
      console.log('Password change response:', { status: res.status, data });
      
      if (data.ok) {
        // 비밀번호 변경 성공
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordErrors({});
        
        setToastMessage('비밀번호가 성공적으로 변경되었습니다.');
        setToastType('success');
        setShowToast(true);
      } else {
        // 서버에서 반환한 에러 메시지 처리
        const errorMessage = data.message || '비밀번호 변경에 실패했습니다.';
        
        // 현재 비밀번호 관련 에러인 경우 특별 처리
        if (errorMessage.includes('현재 비밀번호가 올바르지 않습니다')) {
          setPasswordErrors({
            currentPassword: '현재 비밀번호가 올바르지 않습니다.',
            newPassword: '',
            confirmPassword: ''
          });
        } else {
          // 기타 에러는 토스트로 표시
          setToastMessage(errorMessage);
          setToastType('error');
          setShowToast(true);
        }
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      setToastMessage('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const fetchInquiries = async () => {
    if (!user?.id) return;
    
    setInquiriesLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }
      
      const res = await fetch('/api/user/inquiries', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('API Error:', res.status, errorData);
        throw new Error(`문의 내역을 불러올 수 없습니다. (${res.status})`);
      }
      
      const data = await res.json();
      setInquiries(data);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      setToastMessage(error instanceof Error ? error.message : '문의 내역을 불러올 수 없습니다.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setInquiriesLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword.trim()) {
      setToastMessage('비밀번호를 입력해주세요.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setIsDeletingAccount(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: deleteAccountPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // 로그아웃 처리
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToastMessage('계정이 성공적으로 삭제되었습니다.');
        setToastType('success');
        setShowToast(true);
        
        // 로그인 페이지로 리다이렉트
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        throw new Error(data.message || '계정 삭제에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('Account deletion error:', error);
      setToastMessage(error.message || '계정 삭제 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsDeletingAccount(false);
      setDeleteAccountPassword('');
      setShowDeleteAccountModal(false);
    }
  };

  const handleCategorySelect = async (categoryIds: (string | null)[]) => {
    if (!selectedPromptForBookmark) return;

    try {
      // 다중 카테고리 선택 시 첫 번째 카테고리만 사용 (기존 API 호환성 유지)
      const primaryCategoryId = categoryIds.length > 0 ? categoryIds[0] : null;
      
      // 실제 프롬프트 데이터를 전달하여 더 정확한 낙관적 업데이트
      await addBookmark(selectedPromptForBookmark.id, primaryCategoryId, selectedPromptForBookmark);
      setToastMessage('북마크에 추가되었습니다.');
      setToastType('bookmark');
      setShowToast(true);
    } catch (error) {
      console.error('Bookmark error:', error);
      setToastMessage('북마크 추가 중 오류가 발생했습니다.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setShowCategorySelector(false);
      setSelectedPromptForBookmark(null);
    }
  };

  const isPromptBookmarked = (prompt: Prompt) => {
    return bookmarks.some(bookmark => 
      bookmark && bookmark.prompt && bookmark.prompt.id === prompt.id
    );
  };

  // 인증 상태 확인 및 재로그인 함수
  const checkAuthAndRedirect = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[DEBUG] No token found, redirecting to login');
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.log('[DEBUG] Token invalid, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      console.log('[DEBUG] Auth check successful');
    } catch (error) {
      console.error('[DEBUG] Auth check error:', error);
      router.push('/login');
    }
  }, [router]);

  // 인증 상태 확인 useEffect
  useEffect(() => {
    if (isAuthenticated) {
      checkAuthAndRedirect();
    }
  }, [isAuthenticated, checkAuthAndRedirect]);

  // 북마크 탭 클릭 핸들러
  const handleBookmarkTabClick = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    setActiveTab('bookmarks');
    
    // 수동으로 북마크 새로고침
    setTimeout(async () => {
      if (refetchBookmarks && typeof refetchBookmarks === 'function') {
        try {
          await refetchBookmarks();
        } catch (error) {
          console.error('[DEBUG] Manual refetch error:', error);
          setToastMessage('북마크를 불러오는 중 오류가 발생했습니다.');
          setToastType('error');
          setShowToast(true);
        }
      }
    }, 100);
  };

  const tabs = [
    { id: 'prompts', label: '내 프롬프트', count: myPrompts.length },
    { id: 'bookmarks', label: '북마크', count: bookmarks.length },
    { id: 'settings', label: '프로필 수정', count: null },
    { id: 'support', label: '고객지원', count: null },
  ];

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-orange-50/20">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* 프로필 헤더 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-6">
              {/* 프로필 사진 */}
              <div className="relative">
                <button 
                  onClick={() => setShowProfileModal(true)}
                  className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center hover:opacity-90 transition-opacity group relative"
                >
                  {userProfile?.avatar_url || user?.avatar_url ? (
                    <>
                      <img
                        src={userProfile?.avatar_url || user?.avatar_url}
                        alt={user?.name || ''}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/logo.png';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm">이미지 보기</span>
                      </div>
                    </>
                  ) : (
                    <img
                      src="/logo.png"
                      alt="PROMPOT Logo"
                      className="w-full h-full object-cover p-4"
                    />
                  )}
                </button>
              </div>

              {/* 프로필 이미지 모달 */}
              <ProfileImageModal 
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                user={user}
                avatarUrl={userProfile?.avatar_url || user?.avatar_url}
                onEdit={() => {
                  setShowProfileModal(false);
                  setActiveTab('settings');
                }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{user?.name || '사용자'}</h1>
                  {userStats && (
                    <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-bold ${getLevelColorClass(calculateLevel(userStats.activityScore).level)}`}>
                      Lv.{calculateLevel(userStats.activityScore).level}
                    </span>
                  )}
                </div>
                {userStats && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-700 font-medium">
                      {getLevelTitle(calculateLevel(userStats.activityScore).level)}
                    </p>
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
                            style={{ width: `${calculateLevel(userStats.activityScore).progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {calculateLevel(userStats.activityScore).progress}%
                        </span>
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>{userStats.activityScore}점</span>
                        <span>다음 레벨: {calculateLevel(userStats.activityScore).nextLevelScore}점</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 mt-4 text-center">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{userStats.stats.prompts}</p>
                        <p className="text-xs text-gray-500">프롬프트</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{userStats.stats.comments}</p>
                        <p className="text-xs text-gray-500">댓글</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{userStats.stats.bookmarks}</p>
                        <p className="text-xs text-gray-500">북마크</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{userStats.stats.likes}</p>
                        <p className="text-xs text-gray-500">좋아요</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 탭 메뉴 */}
          <div className="flex gap-2 mb-6 border-b justify-between items-center">
            <div className="flex gap-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'bookmarks') {
                      handleBookmarkTabClick();
                    } else {
                      setActiveTab(tab.id as any);
                    }
                  }}
                  className={`px-4 py-2 transition-colors relative flex items-center gap-1 ${
                    activeTab === tab.id
                      ? tab.id === 'bookmarks'
                        ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50 font-semibold'
                        : 'text-primary border-b-2 border-primary font-semibold'
                      : tab.id === 'bookmarks'
                        ? 'text-gray-600 hover:text-orange-600 hover:bg-orange-50 font-normal'
                        : 'text-gray-600 hover:text-gray-900 font-normal'
                  }`}
                >
                  {tab.id === 'bookmarks' && (
                    <svg className="w-4 h-4" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  )}
                  {tab.label}
                  {tab.count !== null && (
                    <span className={`ml-1 text-sm ${
                      activeTab === tab.id
                        ? tab.id === 'bookmarks'
                          ? 'text-orange-600'
                          : 'text-orange-500'
                        : 'text-gray-500'
                    }`}>
                      ({tab.count})
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            {/* 내 프롬프트 탭에서만 추가 버튼 표시 */}
            {activeTab === 'prompts' && (
              <Link
                href="/prompt/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New
              </Link>
            )}
          </div>

          {/* 탭 콘텐츠 */}
          <div>
            {/* 내 프롬프트 탭 */}
            {activeTab === 'prompts' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                {loading ? (
                  <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-gray-600">프롬프트를 불러오는 중...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-16">
                    <p className="text-red-500">{error}</p>
                    <button onClick={refetch} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors">
                      다시 시도
                    </button>
                  </div>
                ) : myPrompts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                    {myPrompts
                      .map(prompt => {
                        const convertedPrompt = convertMyPromptToPrompt(prompt);
                        return (
                          <div key={prompt.id} className="w-full">
                            <PromptCardCompact
                              prompt={convertedPrompt}
                              onLike={handleLike}
                              onBookmark={isAuthenticated ? handleBookmark : undefined}
                              isBookmarked={convertedPrompt.isBookmarked}
                              onCategoryClick={handleCategoryClick}
                              onAIModelClick={handleAIModelClick}
                              onTagClick={handleTagClick}
                            />
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">아직 작성한 프롬프트가 없습니다</h3>
                    <p className="text-gray-600 mb-4">첫 프롬프트를 작성해보세요!</p>
                    <Link
                      href="/prompt/create"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      프롬프트 작성하기
                    </Link>
                  </div>
                )}
              </div>
            )}
            {/* 북마크 탭 */}
            {activeTab === "bookmarks" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                {/* 카테고리 필터와 관리 */}
                <div className="flex justify-between items-center mb-4">
                  {/* 카테고리 필터 */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-3 py-1 text-sm rounded transition-colors border ${
                        selectedCategory === null
                          ? "bg-primary text-white border-orange-500"
                          : "bg-white text-orange-600 border-orange-300 hover:bg-orange-50"
                      }`}
                    >
                      전체
                    </button>
                    <button
                      onClick={() => setSelectedCategory('uncategorized')}
                      className={`px-3 py-1 text-sm rounded transition-colors border ${
                        selectedCategory === 'uncategorized'
                          ? "bg-primary text-white border-orange-500"
                          : "bg-white text-orange-600 border-orange-300 hover:bg-orange-50"
                      }`}
                    >
                      카테고리 없음
                      <span className="text-xs text-orange-600">({bookmarks.filter(b => !b.categoryId).length})</span>
                    </button>
                    {bookmarkCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-1 border ${
                          selectedCategory === category.id
                            ? "bg-primary text-white border-orange-500"
                            : "bg-white text-orange-600 border-orange-300 hover:bg-orange-50"
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                        <span className="text-xs text-orange-600">({category.bookmarkCount || 0})</span>
                      </button>
                    ))}
                  </div>
                  
                  {/* 카테고리 관리 버튼 */}
                  <button
                    onClick={() => {
                      setShowCategoryManager(true);
                    }}
                    className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-orange-600 transition-colors"
                  >
                    북마크 관리
                  </button>
                </div>

                {/* 북마크 목록 */}
                <div>
                  {bookmarksLoading ? (
                    <div className="text-center py-16">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p className="mt-4 text-gray-600">북마크를 불러오는 중...</p>
                    </div>
                  ) : bookmarksError ? (
                    <div className="text-center py-16">
                      <p className="text-red-500">{bookmarksError}</p>
                      <button onClick={refetchBookmarks} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors">
                        다시 시도
                      </button>
                    </div>
                  ) : bookmarks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                      {bookmarks
                        .filter((bookmark: any) => {
                          if (selectedCategory === null) return true; // 전체
                          if (selectedCategory === 'uncategorized') return !bookmark.categoryId; // 카테고리 없음
                          return bookmark.categoryId === selectedCategory; // 특정 카테고리
                        })
                        .map(bookmark => {
                          const convertedPrompt = convertBookmarkToPrompt(bookmark);
                          return (
                            <div key={bookmark.id} className="w-full">
                              <PromptCardCompact
                                prompt={convertedPrompt}
                                onLike={handleLike}
                                onBookmark={isAuthenticated ? () => handleBookmarkRemove(bookmark.id, bookmark.prompt.id) : undefined}
                                isBookmarked={convertedPrompt.isBookmarked}
                                onCategoryClick={handleCategoryClick}
                                onAIModelClick={handleAIModelClick}
                                onTagClick={handleTagClick}
                              />
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-lg">
                      <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">아직 북마크한 프롬프트가 없습니다</h3>
                      <p className="text-gray-600 mb-4">마음에 드는 프롬프트를 북마크해보세요!</p>
                      <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        프롬프트 탐색하기
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 프로필 수정 탭 */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                
                {/* 프로필 사진 및 기본 정보 섹션 */}
                <div className="border-b pb-6 mb-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 왼쪽: 프로필 사진 섹션 */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">프로필 사진</h3>
                      <div className="flex flex-col items-start gap-4">
                        <AvatarUpload
                          currentAvatarUrl={userProfile?.avatar_url || user?.avatar_url}
                          userName={user?.name || ''}
                          onAvatarChange={handleAvatarChange}
                          className="flex-shrink-0"
                        />
                        <div className="w-full">
                          <p className="text-sm text-gray-600 mb-2">
                            프로필사진 업로드 기준
                          </p>
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>• JPG, PNG 파일만 지원됩니다</p>
                            <p>• 최대 1MB까지 업로드 가능합니다</p>
                            <p>• 권장 크기: 200x200 픽셀 이상</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 오른쪽: 기본 정보 섹션 */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">기본 정보</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap w-12">이름</label>
                            {isEditingName ? (
                              <>
                                <input
                                  type="text"
                                  value={editedName}
                                  onChange={(e) => setEditedName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && editedName.trim() && !isUpdatingName) {
                                      handleUpdateName();
                                    } else if (e.key === 'Escape') {
                                      handleCancelEditName();
                                    }
                                  }}
                                  className="w-60 px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                  placeholder="이름을 입력하세요"
                                  disabled={isUpdatingName}
                                />
                                <button
                                  onClick={handleUpdateName}
                                  disabled={isUpdatingName || !editedName.trim()}
                                  className="px-2 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm whitespace-nowrap disabled:opacity-50"
                                >
                                  {isUpdatingName ? '저장 중...' : '저장'}
                                </button>
                                <button
                                  onClick={handleCancelEditName}
                                  disabled={isUpdatingName}
                                  className="px-2 py-1.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm whitespace-nowrap disabled:opacity-50"
                                >
                                  취소
                                </button>
                              </>
                            ) : (
                              <>
                                <input
                                  type="text"
                                  value={user?.name || ''}
                                  readOnly
                                  className="w-60 px-2 py-1.5 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                                />
                                <button
                                  onClick={handleStartEditName}
                                  className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors text-sm whitespace-nowrap"
                                >
                                  수정
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap w-12">이메일</label>
                            <input
                              type="email"
                              value={user?.email || ''}
                              readOnly
                              className="w-60 px-2 py-1.5 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 보안 설정 섹션 */}
                <div className="border-b pb-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-lg font-medium text-gray-800">보안 설정</h3>
                    <button
                      onClick={() => setShowPasswordChange(!showPasswordChange)}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      비밀번호 변경하기
                      <svg 
                        className={`w-4 h-4 transition-transform ${showPasswordChange ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {showPasswordChange && (
                    <div className="space-y-4 max-w-2xl border-t pt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호</label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                          className={`w-full max-w-md px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
                            passwordErrors.currentPassword 
                              ? 'border-red-300 focus:ring-red-500' 
                              : 'border-gray-300 focus:ring-primary'
                          }`}
                          placeholder="현재 비밀번호를 입력하세요"
                          disabled={isChangingPassword}
                        />
                        {passwordErrors.currentPassword && (
                          <p className="mt-1 text-xs text-red-600">{passwordErrors.currentPassword}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                          className={`w-full max-w-md px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
                            passwordErrors.newPassword 
                              ? 'border-red-300 focus:ring-red-500' 
                              : 'border-gray-300 focus:ring-primary'
                          }`}
                          placeholder="새 비밀번호를 입력하세요 (6자 이상)"
                          disabled={isChangingPassword}
                        />
                        {passwordErrors.newPassword && (
                          <p className="mt-1 text-xs text-red-600">{passwordErrors.newPassword}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                          className={`w-full max-w-md px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
                            passwordErrors.confirmPassword 
                              ? 'border-red-300 focus:ring-red-500' 
                              : 'border-gray-300 focus:ring-primary'
                          }`}
                          placeholder="새 비밀번호를 다시 입력하세요"
                          disabled={isChangingPassword}
                        />
                        {passwordErrors.confirmPassword && (
                          <p className="mt-1 text-xs text-red-600">{passwordErrors.confirmPassword}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handlePasswordChange}
                          disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isChangingPassword ? '변경 중...' : '비밀번호 변경'}
                        </button>
                        <button
                          onClick={() => setShowPasswordChange(false)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
            
            {/* 고객지원 탭 */}
            {activeTab === 'support' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">문의 내역</h2>
                  {/* <Link
                    href="/faq"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    새 문의하기
                  </Link> */}
                </div>
                
                {inquiriesLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-gray-600">문의 내역을 불러오는 중...</p>
                  </div>
                ) : inquiries.length === 0 ? (
                  <div className="text-center py-16">
                    <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">아직 문의한 내용이 없습니다</h3>
                    <p className="text-gray-600 mb-4">궁금한 점이 있으시면 언제든 문의해주세요.</p>
                    <Link
                      href="/faq"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      FAQ 본 후 문의하기
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inquiry) => (
                      <div 
                        key={inquiry.id} 
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedInquiry(inquiry);
                          setShowInquiryModal(true);
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{inquiry.subject}</h4>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-sm rounded ${
                              inquiry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              inquiry.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              inquiry.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {inquiry.status === 'pending' ? '대기중' :
                               inquiry.status === 'in_progress' ? '진행중' :
                               inquiry.status === 'resolved' ? '답변완료' : '종료'}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{inquiry.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(inquiry.created_at).toLocaleDateString('ko-KR')}
                          {inquiry.response && inquiry.responded_at && 
                            ` • 답변일: ${new Date(inquiry.responded_at).toLocaleDateString('ko-KR')}`
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 계정 관리 섹션 - 고객지원 탭 하단에 추가 */}
                <div className="mt-8 pt-6 border-t">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowDeleteAccountModal(true)}
                      className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      회원탈퇴
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">프롬프트 삭제</h3>
            <p className="text-gray-600 mb-6">
              이 프롬프트를 삭제하시겠습니까? 삭제된 프롬프트는 복구할 수 없습니다.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회원탈퇴 확인 모달 */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">회원탈퇴</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                계정을 삭제하면 다음과 같이 처리됩니다:
              </p>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-red-600 mb-1">삭제되는 데이터:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 개인 프로필 정보</li>
                    <li>• 북마크한 프롬프트 목록</li>
                    <li>• 북마크 카테고리</li>
                    <li>• 계정 로그인 정보</li>
                  </ul>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">유지되는 데이터 (익명화):</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 작성한 프롬프트 (작성자: &ldquo;삭제된 사용자&rdquo;)</li>
                    <li>• 작성한 댓글 (작성자: &ldquo;삭제된 사용자&rdquo;)</li>
                    <li>• 남긴 평점 (작성자: &ldquo;삭제된 사용자&rdquo;)</li>
                  </ul>
                </div>
              </div>
              
              <p className="text-sm text-red-600 font-medium mt-4">
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호를 입력하여 확인하세요
              </label>
              <input
                type="password"
                value={deleteAccountPassword}
                onChange={(e) => setDeleteAccountPassword(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                placeholder="현재 비밀번호를 입력하세요"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeleteAccountPassword('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isDeletingAccount}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeletingAccount || !deleteAccountPassword.trim()}
              >
                {isDeletingAccount ? '삭제 중...' : '계정 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 북마크 패널 */}
      <BookmarkPanel
        isOpen={showBookmarks}
        onClose={() => setShowBookmarks(false)}
        bookmarks={bookmarks || []}
        showCategoryManager={showCategoryManager}
        onOpenCategoryManager={() => setShowCategoryManager(true)}
        onCloseCategoryManager={() => setShowCategoryManager(false)}
        onCategoryChange={() => {
          if (refetchBookmarks && typeof refetchBookmarks === "function") {
            refetchBookmarks();
          }
          if (refetchBookmarkCategories && typeof refetchBookmarkCategories === "function") {
            refetchBookmarkCategories();
          }
        }}
      />

      {/* Toast 알림 */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* 북마크 카테고리 선택기 */}
      {showCategorySelector && selectedPromptForBookmark && (
        <BookmarkCategorySelector
          isOpen={showCategorySelector}
          onClose={() => {
            setShowCategorySelector(false);
            setSelectedPromptForBookmark(null);
          }}
          onSelect={handleCategorySelect}
          selectedCategoryIds={[]}
        />
      )}
      
      {/* 문의 상세보기 모달 */}
      {showInquiryModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">문의 상세</h3>
                <button
                  onClick={() => {
                    setShowInquiryModal(false);
                    setSelectedInquiry(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* 상태 및 날짜 정보 */}
                <div className="flex items-center justify-between text-sm">
                  <span className={`px-3 py-1 rounded-full ${
                    selectedInquiry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedInquiry.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    selectedInquiry.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedInquiry.status === 'pending' ? '대기중' :
                     selectedInquiry.status === 'in_progress' ? '진행중' :
                     selectedInquiry.status === 'resolved' ? '답변완료' : '종료'}
                  </span>
                  <span className="text-gray-500">
                    문의일: {new Date(selectedInquiry.created_at).toLocaleString('ko-KR')}
                  </span>
                </div>

                {/* 제목 */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">제목</h4>
                  <p className="text-gray-900">{selectedInquiry.subject}</p>
                </div>

                {/* 문의 내용 */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">문의 내용</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="whitespace-pre-wrap">{selectedInquiry.message}</p>
                  </div>
                </div>

                {/* 답변 내역 */}
                {selectedInquiry.response && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">답변</h4>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="whitespace-pre-wrap">{selectedInquiry.response}</p>
                      {selectedInquiry.responded_at && (
                        <p className="text-sm text-gray-500 mt-2">
                          답변일: {new Date(selectedInquiry.responded_at).toLocaleString('ko-KR')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 답변 대기중인 경우 안내 메시지 */}
                {!selectedInquiry.response && selectedInquiry.status !== 'closed' && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      문의하신 내용은 검토 중이며, 빠른 시일 내에 답변드리겠습니다.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowInquiryModal(false);
                    setSelectedInquiry(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyPage;