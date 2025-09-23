import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithLogging } from '@/lib/api-logger';
import { calculateLevel, getLevelColorClass } from '@/utils/levelSystem';
import { getAvatarUrl } from '@/utils/avatarUtils';
import { toast } from 'react-hot-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

type AdminSection = 'stats' | 'prompts' | 'users' | 'system' | 'reports' | 'logs' | 'apikeys' | 'inquiries' | 'notifications';

interface Stats {
  totalUsers: number;
  totalPrompts: number;
  publicPrompts: number;
  totalLikes: number;
  totalBookmarks: number;
  todayUsers: number;
  mau: number;
  categoryStats: { category: string; _count: number }[];
  aiModelStats: { aiModel: string; _count: number }[];
  dailySignups: { date: string; count: number }[];
  dailyActiveUsers: { date: string; count: number }[];
  activeUserRanking?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    stats: {
      prompts: number;
      likes: number;
      bookmarks: number;
      comments: number;
    };
    activityScore: number;
  }[];
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  joinDate: string;
  isActive: boolean;
  is_suspended: boolean;
  suspension_reason?: string;
  suspension_end_date?: string;
  warning_count: number;
  activityScore: number;
  _count: {
    prompts: number;
    likes: number;
    bookmarks: number;
    comments: number;
  };
}

interface Prompt {
  id: number;
  title: string;
  description: string;
  content: string;
  category: string;
  ai_model: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  views?: number;
  author: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    likes: number;
    bookmarks: number;
    comments?: number;
  };
  comments?: Comment[];
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ApiMonitorLog {
  id: string;
  endpoint: string;
  method: string;
  status: number;
  responseTime: number;
  timestamp: string;
  userId: string;
  requestBody: any;
  responseBody: any;
  errorMessage: string | null;
  type: string;
}

interface ApiMonitorStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  byEndpoint: Record<string, number>;
  byStatus: Record<number, number>;
  recentErrors: ApiMonitorLog[];
}

const AdminPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [totalUserPages, setTotalUserPages] = useState(1);
  const [promptPage, setPromptPage] = useState(1);
  const [promptSearch, setPromptSearch] = useState('');
  const [promptCategory, setPromptCategory] = useState('');
  const [totalPromptPages, setTotalPromptPages] = useState(1);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPromptComments, setSelectedPromptComments] = useState<Prompt | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [reportPage, setReportPage] = useState(1);
  const [reportFilter, setReportFilter] = useState({ status: '', type: '' });
  const [totalReportPages, setTotalReportPages] = useState(1);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  
  // 문의사항 관련 state
  const [inquiries, setInquiries] = useState<any[]>([]);
  // 제재 드롭다운 상태
  const [sanctionDropdownUserId, setSanctionDropdownUserId] = useState<string | null>(null);
  
  // 드롭다운 외부 클릭 처리
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-sanction-dropdown]')) {
        setSanctionDropdownUserId(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  const [inquiryPage, setInquiryPage] = useState(1);
  const [inquiryFilter, setInquiryFilter] = useState({ status: '', priority: '' });
  const [totalInquiryPages, setTotalInquiryPages] = useState(1);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryResponse, setInquiryResponse] = useState('');
  const [adminEmails, setAdminEmails] = useState<any[]>([]);
  const [showAddEmailModal, setShowAddEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newEmailName, setNewEmailName] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [logs, setLogs] = useState<any[]>([]);
  const [logPage, setLogPage] = useState(1);
  const [totalLogPages, setTotalLogPages] = useState(1);
  const [logFilter, setLogFilter] = useState({ action: '', adminId: '' });
  const [apiMonitorLogs, setApiMonitorLogs] = useState<ApiMonitorLog[]>([]);
  const [apiMonitorStats, setApiMonitorStats] = useState<ApiMonitorStats | null>(null);
  const [apiMonitorFilter, setApiMonitorFilter] = useState('all');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', is_active: true });
  const [systemSettings, setSystemSettings] = useState({
    maintenance_mode: false,
    allow_signup: true,
    max_prompts_per_user: 100,
    max_file_size_mb: 10
  });
  const [backups, setBackups] = useState<any[]>([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [backupType, setBackupType] = useState<'full' | 'data-only'>('data-only');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  
  // API 테스트 관련 state
  const [apiTestResults, setApiTestResults] = useState<Record<string, {
    status: 'pending' | 'testing' | 'success' | 'error';
    message?: string;
    responseTime?: number;
  }>>({});

  useEffect(() => {
    console.log('Admin page - user:', user?.id, user?.name, user?.email, 'isAuthenticated:', isAuthenticated, 'authLoading:', authLoading);
    
    // 인증 상태를 확인하는 동안 대기
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      router.push('/login?returnUrl=/admin');
      return;
    }
    
    // 관리자 권한 확인 (실제로는 API에서 처리)
    if (user?.email !== 'prompot7@gmail.com') {
      console.log('Not admin user:', user?.email);
      router.push('/');
      return;
    }

    console.log('Admin user confirmed, fetching data');
    fetchStats();
    if (activeSection === 'users') {
      fetchUsers();
    } else if (activeSection === 'prompts') {
      fetchPrompts();
    } else if (activeSection === 'reports') {
      fetchReports();
    } else if (activeSection === 'logs') {
      fetchLogs();
    } else if (activeSection === 'system') {
      fetchApiMonitorData();
      fetchSystemSettings();
      fetchAnnouncements();
      fetchBackups();
    } else if (activeSection === 'inquiries') {
      fetchInquiries();
    } else if (activeSection === 'notifications') {
      fetchAdminEmails();
    }
  }, [isAuthenticated, user?.id, user?.email, router, authLoading, activeSection]);

  // 자동 새로고침 기능
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated || user?.email !== 'prompot7@gmail.com') return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      fetchStats();
      
      if (activeSection === 'users') {
        fetchUsers(userPage, userSearch);
      } else if (activeSection === 'prompts') {
        fetchPrompts(promptPage, promptSearch, promptCategory);
      } else if (activeSection === 'reports') {
        fetchReports(reportPage, reportFilter.status, reportFilter.type);
      } else if (activeSection === 'logs') {
        fetchLogs(logPage, logFilter.action, logFilter.adminId);
      } else if (activeSection === 'inquiries') {
        fetchInquiries(inquiryPage, inquiryFilter.status, inquiryFilter.priority);
      } else if (activeSection === 'notifications') {
        fetchAdminEmails();
      }
    }, 30000); // 30초마다 업데이트

    return () => clearInterval(interval);
  }, [autoRefresh, activeSection, isAuthenticated, user, userPage, userSearch, promptPage, promptSearch, promptCategory, reportPage, reportFilter, logPage, logFilter, inquiryPage, inquiryFilter]);

  const fetchStats = async () => {
    try {
      const res = await fetchWithLogging('/api/admin/stats', {
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('통계 데이터를 불러올 수 없습니다.');
      
      const data = await res.json();
      setStats(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (page = 1, search = '') => {
    try {
      const res = await fetchWithLogging(`/api/admin/users?page=${page}&search=${search}`, {
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('사용자 목록을 불러올 수 없습니다.');
      
      const data = await res.json();
      setUsers(data.users);
      setTotalUserPages(data.totalPages);
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  };

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setUserPage(1);
    fetchUsers(1, userSearch);
  };

  const fetchPrompts = async (page = 1, search = '', category = '') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        search,
        category
      });
      
      const res = await fetchWithLogging(`/api/admin/prompts?${params}`, {
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('프롬프트 목록을 불러올 수 없습니다.');
      
      const data = await res.json();
      setPrompts(data.prompts);
      setTotalPromptPages(data.totalPages);
    } catch (error) {
      console.error('Fetch prompts error:', error);
    }
  };

  const handlePromptSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPromptPage(1);
    fetchPrompts(1, promptSearch, promptCategory);
  };

  const handlePromptEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setShowEditModal(true);
  };

  const handlePromptUpdate = async (updates: any) => {
    try {
      const res = await fetchWithLogging('/api/admin/prompts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          promptId: editingPrompt?.id,
          updates,
        }),
      });

      if (!res.ok) throw new Error('프롬프트 수정에 실패했습니다.');

      const data = await res.json();
      console.log('Prompt updated:', data);
      
      setShowEditModal(false);
      fetchPrompts(promptPage, promptSearch, promptCategory);
    } catch (error) {
      console.error('Update prompt error:', error);
      alert('프롬프트 수정 중 오류가 발생했습니다.');
    }
  };

  const handlePromptDelete = async (promptId: number) => {
    if (!confirm('정말로 이 프롬프트를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const res = await fetchWithLogging(`/api/admin/prompts?promptId=${promptId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('프롬프트 삭제에 실패했습니다.');

      fetchPrompts(promptPage, promptSearch, promptCategory);
    } catch (error) {
      console.error('Delete prompt error:', error);
      alert('프롬프트 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleShowComments = async (prompt: Prompt) => {
    try {
      const res = await fetchWithLogging(`/api/prompts/${prompt.id}/comments`, {
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('댓글을 불러올 수 없습니다.');
      
      const data = await res.json();
      setSelectedPromptComments({ ...prompt, comments: data.comments });
      setShowCommentsModal(true);
    } catch (error) {
      console.error('Fetch comments error:', error);
      alert('댓글을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleCommentDelete = async (commentId: number, promptId: number) => {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const res = await fetchWithLogging(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('댓글 삭제에 실패했습니다.');
      
      // 댓글 목록 새로고침
      handleShowComments({ id: promptId } as Prompt);
    } catch (error) {
      console.error('Delete comment error:', error);
      alert('댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleUserDetail = async (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
    
    try {
      const res = await fetchWithLogging(`/api/admin/users/${user.id}`, {
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('사용자 정보를 불러올 수 없습니다.');
      
      const data = await res.json();
      setUserDetail(data);
    } catch (error) {
      console.error('Fetch user detail error:', error);
    }
  };

  const handleUserBlock = async (userId: string, isBlocked: boolean) => {
    const action = isBlocked ? 'unblock' : 'block';
    const message = isBlocked ? '차단을 해제하시겠습니까?' : '이 사용자를 차단하시겠습니까?';
    
    if (!confirm(message)) {
      return;
    }

    try {
      const res = await fetchWithLogging(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });

      if (!res.ok) throw new Error('사용자 상태 변경에 실패했습니다.');

      // 사용자 정보 다시 로드
      handleUserDetail(selectedUser);
      fetchUsers(userPage, userSearch);
    } catch (error) {
      console.error('User block error:', error);
      alert('사용자 상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleSanction = async (userId: string, sanctionType: string, reason: string, duration?: number) => {
    let confirmMessage = '';
    
    switch (sanctionType) {
      case 'warning':
        confirmMessage = '이 사용자에게 경고를 발송하시겠습니까?';
        break;
      case 'suspension':
        confirmMessage = `이 사용자를 ${duration}일 동안 정지시키시겠습니까?`;
        break;
      case 'permanent_ban':
        confirmMessage = '이 사용자를 영구 정지시키시겠습니까? 이 작업은 되돌릴 수 없습니다.';
        break;
    }
    
    if (!confirm(confirmMessage)) {
      return;
    }

    const detailReason = prompt('제재 사유를 입력해주세요:', reason);
    if (!detailReason) return;

    try {
      const res = await fetchWithLogging(`/api/admin/users/${userId}/sanction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          sanctionType, 
          reason: detailReason, 
          duration 
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || '제재 적용에 실패했습니다.');
      }

      const result = await res.json();
      alert(result.message);
      
      // 사용자 목록 새로고침
      fetchUsers(userPage, userSearch);
      
      // 사용자 상세 정보도 새로고침
      if (selectedUser && selectedUser.id === userId) {
        handleUserDetail(selectedUser);
      }
    } catch (error) {
      console.error('Sanction error:', error);
      alert('제재 적용 중 오류가 발생했습니다: ' + (error as Error).message);
    }
  };

  const handleDeleteUser = async (userId: string, preserveContent: boolean = false) => {
    const confirmMessage = preserveContent 
      ? '사용자를 탈퇴시키고 콘텐츠는 보존하시겠습니까? (작성자 정보는 익명화됩니다)'
      : '사용자를 탈퇴시키고 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.';
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    // 이중 확인
    const finalConfirm = prompt('정말로 탈퇴시키려면 "탈퇴"를 입력하세요:');
    if (finalConfirm !== '탈퇴') {
      alert('탈퇴가 취소되었습니다.');
      return;
    }

    try {
      const res = await fetchWithLogging(`/api/admin/users/${userId}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ preserveContent }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || '사용자 탈퇴에 실패했습니다.');
      }

      const result = await res.json();
      alert(result.message);
      
      // 사용자 목록 새로고침
      fetchUsers(userPage, userSearch);
      
      // 만약 현재 선택된 사용자라면 모달 닫기
      if (selectedUser && selectedUser.id === userId) {
        setShowUserModal(false);
        setUserDetail(null);
      }
    } catch (error: any) {
      console.error('User deletion error:', error);
      alert('사용자 탈퇴 중 오류가 발생했습니다.');
    }
  };

  // 신고 처리 함수
  const handleReportUpdate = async (reportId: string, status: string, note?: string) => {
    try {
      const res = await fetchWithLogging(`/api/admin/reports/${reportId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: status,
          adminNote: note
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '신고 처리에 실패했습니다.');
      }

      const result = await res.json();
      toast.success(result.message || '신고가 처리되었습니다.');
      
      // 신고 목록 새로고침
      fetchReports(reportPage, reportFilter.status, reportFilter.type);
      
      // 모달 닫기
      setShowReportModal(false);
      setSelectedReport(null);
    } catch (error: any) {
      console.error('Report update error:', error);
      toast.error(error.message || '신고 처리 중 오류가 발생했습니다.');
    }
  };

  const handleRevokeSanction = async (userId: string, sanctionId: string) => {
    if (!confirm('정말로 이 제재를 해제하시겠습니까?')) {
      return;
    }

    try {
      const res = await fetchWithLogging(`/api/admin/users/${userId}/sanction?sanctionId=${sanctionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || '제재 해제에 실패했습니다.');
      }

      const result = await res.json();
      alert(result.message);
      
      // 사용자 정보 새로고침
      handleUserDetail(selectedUser);
      fetchUsers(userPage, userSearch);
    } catch (error) {
      console.error('Revoke sanction error:', error);
      alert('제재 해제 중 오류가 발생했습니다: ' + (error as Error).message);
    }
  };

  // 시스템 설정 조회
  const fetchSystemSettings = async () => {
    try {
      const response = await fetchWithLogging('/api/admin/system/settings');
      if (!response.ok) {
        throw new Error('시스템 설정을 불러올 수 없습니다.');
      }
      const data = await response.json();
      setSystemSettings(data);
    } catch (error) {
      console.error('Error fetching system settings:', error);
      toast.error('시스템 설정을 불러올 수 없습니다.');
    }
  };

  // 시스템 설정 저장
  const handleSaveSettings = async () => {
    try {
      const response = await fetchWithLogging('/api/admin/system/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(systemSettings),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '설정 저장에 실패했습니다.');
      }

      const result = await response.json();
      toast.success(result.message || '설정이 저장되었습니다.');
      fetchSystemSettings(); // 설정 다시 로드
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error instanceof Error ? error.message : '설정 저장에 실패했습니다.');
    }
  };

  // 공지사항 조회
  const fetchAnnouncements = async () => {
    try {
      const res = await fetchWithLogging('/api/admin/announcements?limit=50');
      if (!res.ok) {
        throw new Error('공지사항을 불러올 수 없습니다.');
      }
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('공지사항을 불러올 수 없습니다.');
    }
  };

  // 공지사항 추가/수정
  const handleSaveAnnouncement = async () => {
    try {
      const isEdit = !!editingAnnouncement;
      const url = isEdit 
        ? `/api/admin/announcements/${editingAnnouncement.id}`
        : '/api/admin/announcements';
      
      const res = await fetchWithLogging(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAnnouncement),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '공지사항 저장에 실패했습니다.');
      }

      const result = await res.json();
      toast.success(result.message || '공지사항이 저장되었습니다.');
      
      // 목록 새로고침 및 모달 닫기
      fetchAnnouncements();
      setShowAnnouncementModal(false);
      setEditingAnnouncement(null);
      setNewAnnouncement({ title: '', content: '', is_active: true });
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error(error instanceof Error ? error.message : '공지사항 저장에 실패했습니다.');
    }
  };

  // 공지사항 삭제
  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('이 공지사항을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const res = await fetchWithLogging(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '공지사항 삭제에 실패했습니다.');
      }

      const result = await res.json();
      toast.success(result.message || '공지사항이 삭제되었습니다.');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error(error instanceof Error ? error.message : '공지사항 삭제에 실패했습니다.');
    }
  };

  // 백업 목록 조회
  const fetchBackups = async () => {
    try {
      const res = await fetchWithLogging('/api/admin/backup');
      if (!res.ok) {
        throw new Error('백업 목록을 불러올 수 없습니다.');
      }
      const data = await res.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast.error('백업 목록을 불러올 수 없습니다.');
    }
  };

  // 백업 생성
  const handleCreateBackup = async () => {
    try {
      const res = await fetchWithLogging('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: backupType }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '백업 생성에 실패했습니다.');
      }

      const result = await res.json();
      toast.success(result.message || '백업이 생성되었습니다.');
      fetchBackups();
      setShowBackupModal(false);
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error(error instanceof Error ? error.message : '백업 생성에 실패했습니다.');
    }
  };

  // 백업 삭제
  const handleDeleteBackup = async (file: string) => {
    if (!confirm('이 백업 파일을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const res = await fetchWithLogging(`/api/admin/backup/delete?file=${file}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '백업 삭제에 실패했습니다.');
      }

      toast.success('백업이 삭제되었습니다.');
      fetchBackups();
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error(error instanceof Error ? error.message : '백업 삭제에 실패했습니다.');
    }
  };

  // 백업 복원
  const handleRestoreBackup = async () => {
    if (!restoreFile) {
      toast.error('복원할 백업 파일을 선택해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('backup', restoreFile);
    formData.append('mode', 'merge'); // merge 또는 replace

    try {
      const res = await fetchWithLogging('/api/admin/backup/restore', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '백업 복원에 실패했습니다.');
      }

      const result = await res.json();
      if (result.warnings) {
        toast(result.message || '백업이 부분적으로 복원되었습니다.');
      } else {
        toast.success(result.message || '백업이 성공적으로 복원되었습니다.');
      }
      setShowRestoreModal(false);
      setRestoreFile(null);
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error(error instanceof Error ? error.message : '백업 복원에 실패했습니다.');
    }
  };

  const fetchReports = async (page = 1, status = '', type = '') => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (status) params.append('status', status);
      if (type) params.append('type', type);
      
      const res = await fetchWithLogging(`/api/admin/reports?${params.toString()}`);
      
      if (!res.ok) {
        throw new Error('신고 목록을 불러올 수 없습니다.');
      }
      
      const data = await res.json();
      setReports(data.reports || []);
      setTotalReportPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('신고 목록을 불러올 수 없습니다.');
      // 오류 시 빈 배열로 설정
      setReports([]);
      setTotalReportPages(1);
    }
  };

  const fetchInquiries = async (page = 1, status = '', priority = '') => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      
      const res = await fetchWithLogging(`/api/admin/inquiries?${params.toString()}`);
      
      if (!res.ok) {
        throw new Error('문의 목록을 불러올 수 없습니다.');
      }
      
      const data = await res.json();
      setInquiries(data.inquiries || []);
      setTotalInquiryPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast.error('문의 목록을 불러올 수 없습니다.');
      // 오류 시 빈 배열로 설정
      setInquiries([]);
      setTotalInquiryPages(1);
    }
  };

  const fetchAdminEmails = async () => {
    try {
      const res = await fetchWithLogging('/api/admin/notifications');
      if (!res.ok) {
        throw new Error('알림 설정을 불러올 수 없습니다.');
      }
      const data = await res.json();
      setAdminEmails(data);
    } catch (error) {
      console.error('Error fetching admin emails:', error);
      toast.error('알림 설정을 불러올 수 없습니다.');
      setAdminEmails([]);
    }
  };

  const handleAddAdminEmail = async () => {
    if (!newEmail) {
      toast.error('이메일을 입력해주세요.');
      return;
    }

    try {
      const res = await fetchWithLogging('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newEmail,
          name: newEmailName || newEmail,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '이메일 추가에 실패했습니다.');
      }

      toast.success('관리자 이메일이 추가되었습니다.');
      setNewEmail('');
      setNewEmailName('');
      setShowAddEmailModal(false);
      fetchAdminEmails();
    } catch (error: any) {
      console.error('Error adding admin email:', error);
      toast.error(error.message || '이메일 추가에 실패했습니다.');
    }
  };

  const handleToggleEmail = async (id: string, isActive: boolean) => {
    try {
      const res = await fetchWithLogging('/api/admin/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          is_active: !isActive,
        }),
      });

      if (!res.ok) {
        throw new Error('상태 변경에 실패했습니다.');
      }

      toast.success('알림 설정이 변경되었습니다.');
      fetchAdminEmails();
    } catch (error) {
      console.error('Error toggling email:', error);
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const handleDeleteEmail = async (id: string) => {
    if (!confirm('이 이메일을 삭제하시겠습니까?')) return;

    try {
      const res = await fetchWithLogging('/api/admin/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '삭제에 실패했습니다.');
      }

      toast.success('이메일이 삭제되었습니다.');
      fetchAdminEmails();
    } catch (error: any) {
      console.error('Error deleting email:', error);
      toast.error(error.message || '삭제에 실패했습니다.');
    }
  };

  const handleInquiryResponse = async (inquiryId: string) => {
    try {
      const res = await fetchWithLogging(`/api/admin/inquiries/${inquiryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response: inquiryResponse,
          status: 'resolved',
        }),
      });

      if (!res.ok) {
        throw new Error('답변 등록에 실패했습니다.');
      }

      toast.success('답변이 등록되었습니다.');
      setShowInquiryModal(false);
      setInquiryResponse('');
      fetchInquiries(inquiryPage, inquiryFilter.status, inquiryFilter.priority);
    } catch (error) {
      console.error('Error responding to inquiry:', error);
      toast.error('답변 등록에 실패했습니다.');
    }
  };

  const fetchLogs = async (page = 1, action = '', adminId = '') => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (action) params.append('action', action);
      if (adminId) params.append('adminId', adminId);
      
      const res = await fetchWithLogging(`/api/admin/logs?${params}`, {
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('로그를 불러올 수 없습니다.');
      
      const data = await res.json();
      setLogs(data.logs);
      setTotalLogPages(data.totalPages);
    } catch (error) {
      console.error('Fetch logs error:', error);
    }
  };

  const fetchApiMonitorData = async (type = 'all') => {
    try {
      const res = await fetchWithLogging(`/api/admin/api-monitor?type=${type}`, {
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('API 모니터링 데이터를 불러올 수 없습니다.');
      
      const data = await res.json();
      setApiMonitorLogs(data.logs);
      setApiMonitorStats(data.stats);
    } catch (error) {
      console.error('Fetch API monitor data error:', error);
    }
  };

  // API 테스트 함수
  const testApi = async (endpoint: string, method: string = 'GET', body?: any) => {
    const startTime = Date.now();
    
    setApiTestResults(prev => ({
      ...prev,
      [endpoint]: { status: 'testing' }
    }));
    
    try {
      const options: RequestInit = {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      const res = await fetchWithLogging(endpoint, options);
      const responseTime = Date.now() - startTime;
      
      if (res.ok) {
        const data = await res.json();
        setApiTestResults(prev => ({
          ...prev,
          [endpoint]: { 
            status: 'success', 
            message: '정상 작동',
            responseTime
          }
        }));
      } else {
        const error = await res.text();
        setApiTestResults(prev => ({
          ...prev,
          [endpoint]: { 
            status: 'error', 
            message: `에러 (${res.status}): ${error}`,
            responseTime
          }
        }));
      }
    } catch (error) {
      setApiTestResults(prev => ({
        ...prev,
        [endpoint]: { 
          status: 'error', 
          message: error instanceof Error ? error.message : '알 수 없는 에러'
        }
      }));
    }
  };

  // 모든 주요 API 테스트
  const testAllApis = async () => {
    const apis = [
      { endpoint: '/api/admin/stats', method: 'GET' },
      { endpoint: '/api/admin/users', method: 'GET' },
      { endpoint: '/api/admin/prompts', method: 'GET' },
      { endpoint: '/api/admin/system', method: 'GET' },
      { endpoint: '/api/admin/api-monitor', method: 'GET' },
      { endpoint: '/api/admin/reports', method: 'GET' },
      { endpoint: '/api/admin/logs', method: 'GET' },
      { endpoint: '/api/admin/announcements', method: 'GET' },
      { endpoint: '/api/prompts', method: 'GET' },
      { endpoint: '/api/bookmarks', method: 'GET' },
      { endpoint: '/api/current-user', method: 'GET' },
    ];

    // 모든 테스트 초기화
    const initialResults: Record<string, any> = {};
    apis.forEach(api => {
      initialResults[api.endpoint] = { status: 'pending' };
    });
    setApiTestResults(initialResults);

    // 각 API 테스트 실행
    for (const api of apis) {
      await testApi(api.endpoint, api.method);
      // 각 테스트 사이에 약간의 지연
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  // 차트 색상
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  
  const categoryLabels: { [key: string]: string } = {
    work: '업무/마케팅',
    dev: '개발/코드',
    design: '디자인/브랜드',
    edu: '교육/학습',
    image: '이미지/동영상',
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? '인증 확인 중...' : '관리자 페이지를 불러오는 중...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* 좌측 네비게이션 */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">PROMPOT Admin</h1>
          <p className="text-sm text-gray-600">관리자 대시보드</p>
        </div>
        
        <nav className="px-4 pb-6">
          <button
            onClick={() => setActiveSection('stats')}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeSection === 'stats'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              통계 관리
            </div>
          </button>
          
          <button
            onClick={() => setActiveSection('prompts')}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeSection === 'prompts'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              프롬프트 관리
            </div>
          </button>
          
          <button
            onClick={() => setActiveSection('users')}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeSection === 'users'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              유저 관리
            </div>
          </button>
          
          <button
            onClick={() => setActiveSection('system')}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeSection === 'system'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              시스템 관리
            </div>
          </button>
          
          <button
            onClick={() => setActiveSection('reports')}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeSection === 'reports'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              신고 관리
            </div>
          </button>
          
          <button
            onClick={() => setActiveSection('inquiries')}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeSection === 'inquiries'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              문의 관리
            </div>
          </button>

          <button
            onClick={() => setActiveSection('notifications')}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeSection === 'notifications'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              알림 설정
            </div>
          </button>
          
          <button
            onClick={() => setActiveSection('logs')}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeSection === 'logs'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              활동 로그
            </div>
          </button>
        </nav>

        <div className="px-4 py-4 border-t">
          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>

      {/* 우측 콘텐츠 */}
      <div className="flex-1 p-8">
        {/* 통계 관리 */}
        {activeSection === 'stats' && stats && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">통계 관리</h2>
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600">
                  마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}
                </p>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">자동 새로고침 (30초)</span>
                </label>
              </div>
            </div>
            
            {/* 핵심 지표 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">전체 사용자</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                    <p className="text-sm text-green-600">오늘 +{stats.todayUsers}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">MAU</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.mau.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">월간 활성 사용자</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">전체 프롬프트</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalPrompts.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">공개 {stats.publicPrompts}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">상호작용</p>
                    <p className="text-2xl font-bold text-gray-900">{(stats.totalLikes + stats.totalBookmarks).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">좋아요 + 북마크</p>
                  </div>
                  <div className="p-3 bg-pink-100 rounded-full">
                    <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 차트 섹션 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* MAU 추이 차트 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">일별 활성 사용자 (최근 30일)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.dailyActiveUsers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).getDate() + '일'}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('ko-KR')}
                      formatter={(value: any) => [`${value}명`, '활성 사용자']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 신규 가입자 차트 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">일별 신규 가입자 (최근 7일)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.dailySignups}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).getDate() + '일'}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString('ko-KR')}
                      formatter={(value: any) => [`${value}명`, '신규 가입']}
                    />
                    <Bar dataKey="count" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 카테고리별 프롬프트 분포 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">카테고리별 프롬프트 분포</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.categoryStats.map(item => ({
                        name: categoryLabels[item.category] || item.category,
                        value: item._count
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* AI 모델 사용 현황 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">AI 모델별 프롬프트 수 (상위 10개)</h3>
                <div className="space-y-2">
                  {stats.aiModelStats.slice(0, 10).map((item, index) => (
                    <div key={item.aiModel} className="flex items-center justify-between">
                      <span className="text-sm">{item.aiModel}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ 
                              width: `${(item._count / Math.max(...stats.aiModelStats.map(s => s._count))) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-12 text-right">{item._count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 활성 유저 순위 */}
            {stats.activeUserRanking && stats.activeUserRanking.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-bold mb-4">활성 유저 순위 (활동 지수 기준)</h3>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b">
                    <p className="text-sm text-gray-600">
                      활동 점수: 프롬프트 작성 5점, 댓글 3점, 북마크 2점, 좋아요 1점
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            순위
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            사용자
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            프롬프트
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            댓글
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            북마크
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            좋아요
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            활동 점수
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats.activeUserRanking.map((user, index) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {index < 3 ? (
                                  <span className={`text-2xl ${
                                    index === 0 ? 'text-yellow-500' :
                                    index === 1 ? 'text-gray-400' :
                                    'text-orange-600'
                                  }`}>
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                  </span>
                                ) : (
                                  <span className="text-sm font-medium text-gray-900">
                                    {index + 1}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                {user.avatar_url ? (
                                  <img
                                    src={user.avatar_url}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full mr-3"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-300 mr-3 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-600">
                                      {user.name?.charAt(0).toUpperCase() || '?'}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-semibold text-blue-600">
                                {user.stats.prompts}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-semibold text-green-600">
                                {user.stats.comments}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-semibold text-yellow-600">
                                {user.stats.bookmarks}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-semibold text-red-600">
                                {user.stats.likes}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-lg font-bold text-gray-900">
                                {user.activityScore}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 프롬프트 관리 */}
        {activeSection === 'prompts' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">프롬프트 관리</h2>
            
            {/* 검색 및 필터 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <form onSubmit={handlePromptSearch} className="flex gap-4">
                <input
                  type="text"
                  value={promptSearch}
                  onChange={(e) => setPromptSearch(e.target.value)}
                  placeholder="제목, 설명, 내용으로 검색..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={promptCategory}
                  onChange={(e) => setPromptCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">모든 카테고리</option>
                  <option value="marketing">업무/마케팅</option>
                  <option value="business">비즈니스</option>
                  <option value="writing">글쓰기</option>
                  <option value="coding">개발/코딩</option>
                  <option value="education">교육</option>
                  <option value="other">기타</option>
                </select>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  검색
                </button>
              </form>
            </div>

            {/* 프롬프트 목록 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      프롬프트
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작성자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      카테고리
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      통계
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작성일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prompts.map((prompt) => (
                    <tr key={prompt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{prompt.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{prompt.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{prompt.author.name}</div>
                        <div className="text-sm text-gray-500">{prompt.author.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {categoryLabels[prompt.category] || prompt.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          <div>❤️ {prompt._count.likes} 🔖 {prompt._count.bookmarks}</div>
                          <div>
                            👁️ {prompt.views || 0} 
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowComments(prompt);
                              }}
                              className="ml-1 text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              💬 {prompt._count.comments || 0}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          prompt.is_public 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {prompt.is_public ? '공개' : '비공개'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(prompt.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handlePromptEdit(prompt)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handlePromptDelete(prompt.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* 페이지네이션 */}
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => {
                      if (promptPage > 1) {
                        setPromptPage(promptPage - 1);
                        fetchPrompts(promptPage - 1, promptSearch, promptCategory);
                      }
                    }}
                    disabled={promptPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    이전
                  </button>
                  <button
                    onClick={() => {
                      if (promptPage < totalPromptPages) {
                        setPromptPage(promptPage + 1);
                        fetchPrompts(promptPage + 1, promptSearch, promptCategory);
                      }
                    }}
                    disabled={promptPage === totalPromptPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    다음
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      전체 <span className="font-medium">{totalPromptPages}</span> 페이지 중{' '}
                      <span className="font-medium">{promptPage}</span> 페이지
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => {
                          if (promptPage > 1) {
                            setPromptPage(promptPage - 1);
                            fetchPrompts(promptPage - 1, promptSearch, promptCategory);
                          }
                        }}
                        disabled={promptPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        이전
                      </button>
                      <button
                        onClick={() => {
                          if (promptPage < totalPromptPages) {
                            setPromptPage(promptPage + 1);
                            fetchPrompts(promptPage + 1, promptSearch, promptCategory);
                          }
                        }}
                        disabled={promptPage === totalPromptPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        다음
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 유저 관리 */}
        {activeSection === 'users' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">유저 관리</h2>
            
            {/* 검색 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <form onSubmit={handleUserSearch} className="flex gap-4">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="이름 또는 이메일로 검색..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  검색
                </button>
              </form>
            </div>

            {/* 사용자 목록 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      가입일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      활동
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      통계
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      제재
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                            <img
                              src={getAvatarUrl(user.avatar_url, user.id)}
                              alt={user.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = getAvatarUrl(null, user.id);
                              }}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${getLevelColorClass(calculateLevel(user.activityScore).level)}`}>
                                Lv.{calculateLevel(user.activityScore).level}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">
                              활동 점수: {user.activityScore}점
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.joinDate).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <span>프롬프트 {user._count.prompts}</span>
                          <span>좋아요 {user._count.likes}</span>
                          <span>북마크 {user._count.bookmarks}</span>
                          <span>댓글 {user._count.comments}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {user.is_suspended ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              정지됨
                            </span>
                          ) : user.warning_count > 0 ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              경고 {user.warning_count}회
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              정상
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUserDetail(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            상세
                          </button>
                          {!user.is_suspended && (
                            <div className="relative" data-sanction-dropdown>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSanctionDropdownUserId(sanctionDropdownUserId === user.id ? null : user.id);
                                }}
                                className="text-red-600 hover:text-red-900 focus:outline-none"
                              >
                                제재
                              </button>
                              {sanctionDropdownUserId === user.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200" data-sanction-dropdown>
                                  <button
                                    onClick={() => {
                                      handleSanction(user.id, 'warning', '경고');
                                      setSanctionDropdownUserId(null);
                                    }}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                  >
                                    경고
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleSanction(user.id, 'suspension', '7일 정지', 7);
                                      setSanctionDropdownUserId(null);
                                    }}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                  >
                                    7일 정지
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleSanction(user.id, 'suspension', '30일 정지', 30);
                                      setSanctionDropdownUserId(null);
                                    }}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                  >
                                    30일 정지
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleSanction(user.id, 'permanent_ban', '영구 정지');
                                      setSanctionDropdownUserId(null);
                                    }}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                  >
                                    영구 정지
                                  </button>
                                  <div className="border-t border-gray-200 my-1"></div>
                                  <button
                                    onClick={() => {
                                      handleDeleteUser(user.id, true);
                                      setSanctionDropdownUserId(null);
                                    }}
                                    className="block px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 w-full text-left"
                                  >
                                    회원 탈퇴 (콘텐츠 보존)
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDeleteUser(user.id, false);
                                      setSanctionDropdownUserId(null);
                                    }}
                                    className="block px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left font-semibold"
                                  >
                                    회원 탈퇴 (전체 삭제)
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* 페이지네이션 */}
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => {
                      if (userPage > 1) {
                        setUserPage(userPage - 1);
                        fetchUsers(userPage - 1, userSearch);
                      }
                    }}
                    disabled={userPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    이전
                  </button>
                  <button
                    onClick={() => {
                      if (userPage < totalUserPages) {
                        setUserPage(userPage + 1);
                        fetchUsers(userPage + 1, userSearch);
                      }
                    }}
                    disabled={userPage === totalUserPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    다음
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      전체 <span className="font-medium">{totalUserPages}</span> 페이지 중{' '}
                      <span className="font-medium">{userPage}</span> 페이지
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => {
                          if (userPage > 1) {
                            setUserPage(userPage - 1);
                            fetchUsers(userPage - 1, userSearch);
                          }
                        }}
                        disabled={userPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        이전
                      </button>
                      <button
                        onClick={() => {
                          if (userPage < totalUserPages) {
                            setUserPage(userPage + 1);
                            fetchUsers(userPage + 1, userSearch);
                          }
                        }}
                        disabled={userPage === totalUserPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        다음
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 시스템 관리 */}
        {activeSection === 'system' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">시스템 관리</h2>
            
            {/* 시스템 설정 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">시스템 설정</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      className="rounded"
                      checked={systemSettings.maintenance_mode}
                      onChange={(e) => setSystemSettings({...systemSettings, maintenance_mode: e.target.checked})}
                    />
                    <span>유지보수 모드</span>
                  </label>
                  <p className="text-sm text-gray-500 ml-6">사이트 접근을 관리자만 가능하게 설정</p>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      className="rounded"
                      checked={systemSettings.allow_signup}
                      onChange={(e) => setSystemSettings({...systemSettings, allow_signup: e.target.checked})}
                    />
                    <span>회원가입 허용</span>
                  </label>
                  <p className="text-sm text-gray-500 ml-6">신규 회원가입 허용 여부</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">사용자당 최대 프롬프트 수</label>
                  <input 
                    type="number" 
                    value={systemSettings.max_prompts_per_user}
                    onChange={(e) => setSystemSettings({...systemSettings, max_prompts_per_user: parseInt(e.target.value) || 100})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">최대 파일 크기 (MB)</label>
                  <input 
                    type="number" 
                    value={systemSettings.max_file_size_mb}
                    onChange={(e) => setSystemSettings({...systemSettings, max_file_size_mb: parseInt(e.target.value) || 10})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <button 
                onClick={handleSaveSettings}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                설정 저장
              </button>
            </div>

            {/* 공지사항 관리 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">공지사항 관리</h3>
                <button 
                  onClick={() => {
                    setEditingAnnouncement(null);
                    setNewAnnouncement({ title: '', content: '', is_active: true });
                    setShowAnnouncementModal(true);
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  공지사항 추가
                </button>
              </div>
              <div className="space-y-2">
                {announcements.length > 0 ? (
                  announcements.map((announcement) => (
                    <div key={announcement.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{announcement.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            작성일: {new Date(announcement.created_at).toLocaleDateString('ko-KR')}
                            {!announcement.is_active && ' (비활성)'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingAnnouncement(announcement);
                              setNewAnnouncement({
                                title: announcement.title,
                                content: announcement.content,
                                is_active: announcement.is_active
                              });
                              setShowAnnouncementModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            수정
                          </button>
                          <button 
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">등록된 공지사항이 없습니다.</p>
                )}
              </div>
            </div>

            {/* 백업 관리 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">백업 관리</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowBackupModal(true)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                  >
                    수동 백업 실행
                  </button>
                  <button 
                    onClick={() => setShowRestoreModal(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    백업 복원
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {backups.length > 0 ? (
                  backups.map((backup) => (
                    <div key={backup.name} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{backup.name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(backup.created_at).toLocaleString('ko-KR')} | 
                          크기: {(backup.size / 1024 / 1024).toFixed(2)} MB | 
                          타입: {backup.type === 'full' ? '전체' : '데이터만'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a 
                          href={backup.download_url}
                          download
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200"
                        >
                          다운로드
                        </a>
                        <button 
                          onClick={() => handleDeleteBackup(backup.file)}
                          className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded hover:bg-red-200"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">백업 파일이 없습니다.</p>
                )}
              </div>
            </div>

            {/* API 통신 모니터링 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">API 통신 모니터링</h3>
                <div className="flex gap-2">
                  <select 
                    value={apiMonitorFilter}
                    onChange={(e) => {
                      setApiMonitorFilter(e.target.value);
                      fetchApiMonitorData(e.target.value);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="all">전체 API</option>
                    <option value="prompts">프롬프트</option>
                    <option value="bookmarks">북마크</option>
                    <option value="comments">댓글</option>
                    <option value="users">사용자</option>
                  </select>
                  <button 
                    onClick={() => fetchApiMonitorData(apiMonitorFilter)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    새로고침
                  </button>
                </div>
              </div>
              
              {/* API 통신 통계 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">총 요청</div>
                  <div className="text-2xl font-bold">{apiMonitorStats?.totalRequests || 0}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">성공</div>
                  <div className="text-2xl font-bold text-green-600">{apiMonitorStats?.successfulRequests || 0}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">실패</div>
                  <div className="text-2xl font-bold text-red-600">{apiMonitorStats?.failedRequests || 0}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">평균 응답시간</div>
                  <div className="text-2xl font-bold text-blue-600">{apiMonitorStats?.averageResponseTime || 0}ms</div>
                </div>
              </div>

              {/* 엔드포인트별 통계 */}
              {apiMonitorStats?.byEndpoint && Object.keys(apiMonitorStats.byEndpoint).length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3 text-gray-700">엔드포인트별 호출 통계</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(apiMonitorStats.byEndpoint).map(([endpoint, count]) => (
                      <div key={endpoint} className="flex justify-between items-center bg-gray-50 rounded p-2">
                        <span className="text-sm font-mono">{endpoint}</span>
                        <span className="text-sm font-semibold">{count}회</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 최근 에러 */}
              {apiMonitorStats?.recentErrors && apiMonitorStats.recentErrors.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3 text-gray-700">최근 에러</h4>
                  <div className="space-y-2">
                    {apiMonitorStats.recentErrors.map((error) => (
                      <div key={error.id} className="border-l-4 border-red-500 bg-red-50 p-3 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-mono font-semibold">{error.method} {error.endpoint}</p>
                            <p className="text-sm text-red-600 mt-1">{error.errorMessage}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {new Date(error.timestamp).toLocaleString('ko-KR')}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            {error.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* API 호출 로그 테이블 */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-gray-700">최근 API 호출 내역</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">시간</th>
                        <th className="text-left py-2">엔드포인트</th>
                        <th className="text-left py-2">메소드</th>
                        <th className="text-left py-2">상태</th>
                        <th className="text-left py-2">응답시간</th>
                        <th className="text-left py-2">사용자</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiMonitorLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-gray-500">
                            API 호출 로그가 없습니다
                          </td>
                        </tr>
                      ) : (
                        apiMonitorLogs.map((log) => (
                          <tr key={log.id} className="border-b hover:bg-gray-50">
                            <td className="py-2">
                              {new Date(log.timestamp).toLocaleTimeString('ko-KR')}
                            </td>
                            <td className="py-2 font-mono">{log.endpoint}</td>
                            <td className="py-2">
                              <span className={`px-2 py-1 text-xs rounded ${
                                log.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                                log.method === 'POST' ? 'bg-green-100 text-green-800' :
                                log.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                                log.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {log.method}
                              </span>
                            </td>
                            <td className="py-2">
                              <span className={`px-2 py-1 text-xs rounded ${
                                log.status < 400 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="py-2">{log.responseTime}ms</td>
                            <td className="py-2 text-xs">{log.userId}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* API 테스트 */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">API 테스트</h3>
                <button 
                  onClick={testAllApis}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  전체 API 테스트
                </button>
              </div>
              
              <div className="space-y-2">
                {Object.entries(apiTestResults).map(([endpoint, result]) => (
                  <div key={endpoint} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-mono text-sm">{endpoint}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {result.responseTime && (
                        <span className="text-sm text-gray-600">{result.responseTime}ms</span>
                      )}
                      {result.status === 'pending' && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">대기중</span>
                      )}
                      {result.status === 'testing' && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          테스트 중
                        </span>
                      )}
                      {result.status === 'success' && (
                        <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {result.message}
                        </span>
                      )}
                      {result.status === 'error' && (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm">실패</span>
                          <span className="text-sm text-red-600">{result.message}</span>
                        </div>
                      )}
                      <button
                        onClick={() => testApi(endpoint, endpoint.includes('POST') ? 'POST' : 'GET')}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        테스트
                      </button>
                    </div>
                  </div>
                ))}
                
                {Object.keys(apiTestResults).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    '전체 API 테스트' 버튼을 클릭하여 API 상태를 확인하세요.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* 신고 관리 */}
        {activeSection === 'reports' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">신고 관리</h2>
            
            {/* 필터 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">신고 상태</label>
                  <select
                    value={reportFilter.status}
                    onChange={(e) => {
                      setReportFilter({ ...reportFilter, status: e.target.value });
                      setReportPage(1);
                      fetchReports(1, e.target.value, reportFilter.type);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">전체</option>
                    <option value="pending">대기중</option>
                    <option value="reviewing">검토중</option>
                    <option value="resolved">처리완료</option>
                    <option value="rejected">반려</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">신고 타입</label>
                  <select
                    value={reportFilter.type}
                    onChange={(e) => {
                      setReportFilter({ ...reportFilter, type: e.target.value });
                      setReportPage(1);
                      fetchReports(1, reportFilter.status, e.target.value);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">전체</option>
                    <option value="prompt">프롬프트</option>
                    <option value="user">사용자</option>
                    <option value="comment">댓글</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setReportFilter({ status: '', type: '' });
                      setReportPage(1);
                      fetchReports(1, '', '');
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    필터 초기화
                  </button>
                </div>
              </div>
            </div>
            
            {/* 신고 목록 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">신고자</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">신고 대상</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">사유</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">상태</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">신고일</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{report.reporter?.name}</p>
                        <p className="text-sm text-gray-600">{report.reporter?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {report.content_type === 'prompt' ? '프롬프트' : 
                           report.content_type === 'user' ? '사용자' : '댓글'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {report.targetDetails?.title || report.targetDetails?.name || 'ID: ' + report.content_id}
                        </p>
                      </td>
                      <td className="px-4 py-3">{report.reason}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-sm rounded ${
                          report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          report.status === 'reviewing' ? 'bg-blue-100 text-blue-800' :
                          report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {report.status === 'pending' ? '대기중' :
                           report.status === 'reviewing' ? '검토중' :
                           report.status === 'resolved' ? '처리완료' : '반려'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(report.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setShowReportModal(true);
                          }}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                        >
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {reports.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  신고 내역이 없습니다.
                </div>
              )}
            </div>
            
            {/* 페이지네이션 */}
            {totalReportPages > 1 && (
              <div className="flex justify-center mt-6 gap-2">
                <button
                  onClick={() => {
                    setReportPage(Math.max(1, reportPage - 1));
                    fetchReports(Math.max(1, reportPage - 1), reportFilter.status, reportFilter.type);
                  }}
                  disabled={reportPage === 1}
                  className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50"
                >
                  이전
                </button>
                <span className="px-4 py-2">
                  {reportPage} / {totalReportPages}
                </span>
                <button
                  onClick={() => {
                    setReportPage(Math.min(totalReportPages, reportPage + 1));
                    fetchReports(Math.min(totalReportPages, reportPage + 1), reportFilter.status, reportFilter.type);
                  }}
                  disabled={reportPage === totalReportPages}
                  className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* 문의 관리 */}
        {activeSection === 'inquiries' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">문의 관리</h2>
            
            {/* 필터 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">상태</label>
                  <select
                    value={inquiryFilter.status}
                    onChange={(e) => {
                      setInquiryFilter({ ...inquiryFilter, status: e.target.value });
                      setInquiryPage(1);
                      fetchInquiries(1, e.target.value, inquiryFilter.priority);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">전체</option>
                    <option value="pending">대기중</option>
                    <option value="in_progress">진행중</option>
                    <option value="resolved">해결됨</option>
                    <option value="closed">종료</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">우선순위</label>
                  <select
                    value={inquiryFilter.priority}
                    onChange={(e) => {
                      setInquiryFilter({ ...inquiryFilter, priority: e.target.value });
                      setInquiryPage(1);
                      fetchInquiries(1, inquiryFilter.status, e.target.value);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">전체</option>
                    <option value="low">낮음</option>
                    <option value="medium">보통</option>
                    <option value="high">높음</option>
                    <option value="urgent">긴급</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setInquiryFilter({ status: '', priority: '' });
                      setInquiryPage(1);
                      fetchInquiries(1, '', '');
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    필터 초기화
                  </button>
                </div>
              </div>
            </div>
            
            {/* 문의 목록 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">이메일</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">제목</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">상태</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">우선순위</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">접수일</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm">{inquiry.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm truncate max-w-xs">{inquiry.subject}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-sm rounded ${
                          inquiry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          inquiry.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          inquiry.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {inquiry.status === 'pending' ? '대기중' :
                           inquiry.status === 'in_progress' ? '진행중' :
                           inquiry.status === 'resolved' ? '해결됨' : '종료'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-sm rounded ${
                          inquiry.priority === 'low' ? 'bg-gray-100 text-gray-800' :
                          inquiry.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                          inquiry.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {inquiry.priority === 'low' ? '낮음' :
                           inquiry.priority === 'medium' ? '보통' :
                           inquiry.priority === 'high' ? '높음' : '긴급'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(inquiry.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedInquiry(inquiry);
                            setShowInquiryModal(true);
                          }}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                        >
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {inquiries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  문의 내역이 없습니다.
                </div>
              )}
            </div>
            
            {/* 페이지네이션 */}
            {totalInquiryPages > 1 && (
              <div className="flex justify-center mt-6 gap-2">
                <button
                  onClick={() => {
                    setInquiryPage(Math.max(1, inquiryPage - 1));
                    fetchInquiries(Math.max(1, inquiryPage - 1), inquiryFilter.status, inquiryFilter.priority);
                  }}
                  disabled={inquiryPage === 1}
                  className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50"
                >
                  이전
                </button>
                <span className="px-4 py-2">
                  {inquiryPage} / {totalInquiryPages}
                </span>
                <button
                  onClick={() => {
                    setInquiryPage(Math.min(totalInquiryPages, inquiryPage + 1));
                    fetchInquiries(Math.min(totalInquiryPages, inquiryPage + 1), inquiryFilter.status, inquiryFilter.priority);
                  }}
                  disabled={inquiryPage === totalInquiryPages}
                  className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* 알림 설정 */}
        {activeSection === 'notifications' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">알림 설정</h2>
              <button
                onClick={() => setShowAddEmailModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                이메일 추가
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h3 className="text-lg font-medium">관리자 알림 이메일 목록</h3>
                <p className="text-sm text-gray-600 mt-1">
                  새로운 문의가 접수되면 아래 이메일로 알림이 전송됩니다.
                </p>
              </div>
              
              <div className="p-4">
                {adminEmails.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">등록된 알림 이메일이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {adminEmails.map((adminEmail) => (
                      <div key={adminEmail.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{adminEmail.name}</p>
                          <p className="text-sm text-gray-600">{adminEmail.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            추가일: {new Date(adminEmail.created_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={adminEmail.is_active}
                              onChange={() => handleToggleEmail(adminEmail.id, adminEmail.is_active)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                          
                          {adminEmail.email !== 'prompot7@gmail.com' && (
                            <button
                              onClick={() => handleDeleteEmail(adminEmail.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">알림 설정 안내</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>새로운 문의가 접수되면 활성화된 이메일로 자동 알림이 전송됩니다.</li>
                <li>각 이메일의 알림을 개별적으로 활성화/비활성화할 수 있습니다.</li>
                <li>메인 관리자 이메일(prompot7@gmail.com)은 삭제할 수 없습니다.</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* 활동 로그 */}
        {activeSection === 'logs' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">어드민 활동 로그</h2>
            
            {/* 필터 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">액션 타입</label>
                  <select
                    value={logFilter.action}
                    onChange={(e) => {
                      setLogFilter({ ...logFilter, action: e.target.value });
                      setLogPage(1);
                      fetchLogs(1, e.target.value, logFilter.adminId);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">전체</option>
                    <option value="UPDATE_PROMPT">프롬프트 수정</option>
                    <option value="DELETE_PROMPT">프롬프트 삭제</option>
                    <option value="BLOCK_USER">사용자 차단</option>
                    <option value="UNBLOCK_USER">차단 해제</option>
                    <option value="UPDATE_REPORT_STATUS">신고 처리</option>
                    <option value="CREATE_ANNOUNCEMENT">공지사항 작성</option>
                    <option value="UPDATE_SETTINGS">설정 변경</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">관리자</label>
                  <select
                    value={logFilter.adminId}
                    onChange={(e) => {
                      setLogFilter({ ...logFilter, adminId: e.target.value });
                      setLogPage(1);
                      fetchLogs(1, logFilter.action, e.target.value);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">전체</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setLogFilter({ action: '', adminId: '' });
                      setLogPage(1);
                      fetchLogs(1, '', '');
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    필터 초기화
                  </button>
                </div>
              </div>
            </div>
            
            {/* 로그 목록 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">시간</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">관리자</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">액션</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">대상</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">IP 주소</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">상세</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(log.created_at).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{log.admin?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">{log.admin?.email || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.target_type && (
                          <div>
                            <p className="font-medium">{log.target_type}</p>
                            <p className="text-xs text-gray-600">{log.target_id}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.ip_address || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.details && (
                          <button
                            onClick={() => {
                              alert(JSON.stringify(log.details, null, 2));
                            }}
                            className="text-blue-500 hover:text-blue-700 underline"
                          >
                            보기
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {logs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  활동 로그가 없습니다.
                </div>
              )}
            </div>
            
            {/* 페이지네이션 */}
            {totalLogPages > 1 && (
              <div className="flex justify-center mt-6 gap-2">
                <button
                  onClick={() => {
                    setLogPage(Math.max(1, logPage - 1));
                    fetchLogs(Math.max(1, logPage - 1), logFilter.action, logFilter.adminId);
                  }}
                  disabled={logPage === 1}
                  className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50"
                >
                  이전
                </button>
                <span className="px-4 py-2">
                  {logPage} / {totalLogPages}
                </span>
                <button
                  onClick={() => {
                    setLogPage(Math.min(totalLogPages, logPage + 1));
                    fetchLogs(Math.min(totalLogPages, logPage + 1), logFilter.action, logFilter.adminId);
                  }}
                  disabled={logPage === totalLogPages}
                  className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 사용자 상세보기 모달 */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">사용자 상세 정보</h3>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setUserDetail(null);
                }}
                className="text-gray-500 hover:text-gray-700"
                >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {userDetail ? (
              <div>
                {/* 사용자 기본 정보 */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">이름</p>
                      <p className="font-medium">{userDetail.user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">이메일</p>
                      <p className="font-medium">{userDetail.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">가입일</p>
                      <p className="font-medium">{new Date(userDetail.user.created_at).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">마지막 활동</p>
                      <p className="font-medium">{new Date(userDetail.activities.lastActivity).toLocaleDateString('ko-KR')}</p>
                    </div>
                  </div>
                </div>

                {/* 활동 통계 */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{userDetail.user.stats.prompts}</p>
                    <p className="text-sm text-gray-600">프롬프트</p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-pink-600">{userDetail.user.stats.likes}</p>
                    <p className="text-sm text-gray-600">좋아요</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{userDetail.user.stats.bookmarks}</p>
                    <p className="text-sm text-gray-600">북마크</p>
                  </div>
                </div>

                {/* 최근 활동 */}
                <div className="mb-6">
                  <h4 className="font-medium mb-2">최근 30일 활동</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p>프롬프트 작성: {userDetail.activities.recentPrompts}개</p>
                    <p>좋아요 활동: {userDetail.activities.recentLikes}개</p>
                  </div>
                </div>

                {/* 제재 상태 */}
                {(userDetail.user.is_suspended || userDetail.user.warning_count > 0) && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">제재 상태</h4>
                    <div className="bg-red-50 rounded-lg p-4">
                      {userDetail.user.is_suspended ? (
                        <div>
                          <p className="text-red-800 font-medium">정지됨</p>
                          {userDetail.user.suspension_reason && (
                            <p className="text-sm text-red-600 mt-1">사유: {userDetail.user.suspension_reason}</p>
                          )}
                          {userDetail.user.suspension_end_date ? (
                            <p className="text-sm text-red-600 mt-1">
                              정지 해제일: {new Date(userDetail.user.suspension_end_date).toLocaleDateString('ko-KR')}
                            </p>
                          ) : (
                            <p className="text-sm text-red-600 mt-1">영구 정지</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-yellow-800">경고 {userDetail.user.warning_count}회</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 최근 프롬프트 */}
                <div className="mb-6">
                  <h4 className="font-medium mb-2">최근 작성 프롬프트</h4>
                  <div className="space-y-2">
                    {userDetail.prompts.length > 0 ? (
                      userDetail.prompts.map((prompt: any) => (
                        <div key={prompt.id} className="bg-gray-50 rounded p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">{prompt.title}</p>
                              <p className="text-sm text-gray-600">
                                {categoryLabels[prompt.category]} · {new Date(prompt.created_at).toLocaleDateString('ko-KR')}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded ${
                              prompt.is_public ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {prompt.is_public ? '공개' : '비공개'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">작성한 프롬프트가 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => handleUserBlock(userDetail.user.id, userDetail.user.is_blocked)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      userDetail.user.is_blocked
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {userDetail.user.is_blocked ? '차단 해제' : '사용자 차단'}
                  </button>
                  {!userDetail.user.is_suspended && (
                    <>
                      <button
                        onClick={() => handleSanction(userDetail.user.id, 'warning', '경고')}
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                      >
                        경고
                      </button>
                      <button
                        onClick={() => handleSanction(userDetail.user.id, 'suspension', '7일 정지', 7)}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                      >
                        7일 정지
                      </button>
                      <button
                        onClick={() => handleSanction(userDetail.user.id, 'suspension', '30일 정지', 30)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      >
                        30일 정지
                      </button>
                      <button
                        onClick={() => handleSanction(userDetail.user.id, 'permanent_ban', '영구 정지')}
                        className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg transition-colors"
                      >
                        영구 정지
                      </button>
                    </>
                  )}
                  {userDetail.user.is_suspended && userDetail.sanctions && userDetail.sanctions.length > 0 && (
                    <button
                      onClick={() => handleRevokeSanction(userDetail.user.id, userDetail.sanctions[0].id)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      제재 해제
                    </button>
                  )}
                  <div className="border-l border-gray-300 mx-2"></div>
                  <button
                    onClick={() => handleDeleteUser(userDetail.user.id, true)}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                  >
                    회원 탈퇴 (콘텐츠 보존)
                  </button>
                  <button
                    onClick={() => handleDeleteUser(userDetail.user.id, false)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
                  >
                    회원 탈퇴 (전체 삭제)
                  </button>
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      setUserDetail(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-600">사용자 정보를 불러오는 중...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 프롬프트 수정 모달 */}
      {showEditModal && editingPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">프롬프트 수정</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handlePromptUpdate({
                title: formData.get('title'),
                description: formData.get('description'),
                content: formData.get('content'),
                category: formData.get('category'),
                ai_model: formData.get('ai_model'),
                is_public: formData.get('is_public') === 'true',
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingPrompt.title}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    name="description"
                    defaultValue={editingPrompt.description}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                  <textarea
                    name="content"
                    defaultValue={editingPrompt.content}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                    <select
                      name="category"
                      defaultValue={editingPrompt.category}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="marketing">업무/마케팅</option>
                      <option value="business">비즈니스</option>
                      <option value="writing">글쓰기</option>
                      <option value="coding">개발/코딩</option>
                      <option value="education">교육</option>
                      <option value="other">기타</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AI 모델</label>
                    <input
                      type="text"
                      name="ai_model"
                      defaultValue={editingPrompt.ai_model}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">공개 설정</label>
                  <select
                    name="is_public"
                    defaultValue={editingPrompt.is_public ? 'true' : 'false'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">공개</option>
                    <option value="false">비공개</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 신고 상세보기 모달 */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">신고 상세 정보</h3>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedReport(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* 신고 기본 정보 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">신고 정보</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">신고 ID:</p>
                    <p className="font-medium">{selectedReport.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">신고일:</p>
                    <p className="font-medium">{new Date(selectedReport.created_at).toLocaleString('ko-KR')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">상태:</p>
                    <p>
                      <span className={`px-2 py-1 text-sm rounded ${
                        selectedReport.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedReport.status === 'reviewing' ? 'bg-blue-100 text-blue-800' :
                        selectedReport.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedReport.status === 'pending' ? '대기중' :
                         selectedReport.status === 'reviewing' ? '검토중' :
                         selectedReport.status === 'resolved' ? '처리완료' : '반려'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">사유:</p>
                    <p className="font-medium">{selectedReport.reason}</p>
                  </div>
                </div>
                {selectedReport.details && (
                  <div className="mt-3">
                    <p className="text-gray-600 text-sm">상세 설명:</p>
                    <p className="mt-1 text-sm">{selectedReport.details}</p>
                  </div>
                )}
              </div>

              {/* 신고자 정보 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">신고자</h4>
                <p className="font-medium">{selectedReport.reporter?.name}</p>
                <p className="text-sm text-gray-600">{selectedReport.reporter?.email}</p>
              </div>

              {/* 신고 대상 정보 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">신고 대상</h4>
                <p className="text-sm text-gray-600">
                  타입: {selectedReport.content_type === 'prompt' ? '프롬프트' : 
                        selectedReport.content_type === 'user' ? '사용자' : '댓글'}
                </p>
                {selectedReport.targetDetails && (
                  <div className="mt-2">
                    <p className="font-medium">
                      {selectedReport.targetDetails.title || selectedReport.targetDetails.name}
                    </p>
                    {selectedReport.targetDetails.email && (
                      <p className="text-sm text-gray-600">{selectedReport.targetDetails.email}</p>
                    )}
                    {selectedReport.content_type === 'prompt' && selectedReport.targetDetails.profiles && (
                      <p className="text-sm text-gray-600">
                        작성자: {selectedReport.targetDetails.profiles.name} ({selectedReport.targetDetails.profiles.email})
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 처리 결과 */}
              {(selectedReport.status === 'resolved' || selectedReport.status === 'dismissed') && selectedReport.resolution_note && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">처리 결과</h4>
                  <p className="text-sm">{selectedReport.resolution_note}</p>
                  {selectedReport.resolved_at && (
                    <p className="text-sm text-gray-600 mt-2">
                      처리일: {new Date(selectedReport.resolved_at).toLocaleString('ko-KR')}
                    </p>
                  )}
                </div>
              )}

              {/* 신고 처리 버튼 */}
              {selectedReport.status === 'pending' && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleReportUpdate(selectedReport.id, 'reviewing')}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    검토 시작
                  </button>
                  <button
                    onClick={() => {
                      const note = prompt('처리 사유를 입력하세요:');
                      if (note) {
                        handleReportUpdate(selectedReport.id, 'resolved', note);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => {
                      const note = prompt('반려 사유를 입력하세요:');
                      if (note) {
                        handleReportUpdate(selectedReport.id, 'dismissed', note);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    반려
                  </button>
                </div>
              )}

              {selectedReport.status === 'reviewing' && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      const note = prompt('처리 사유를 입력하세요:');
                      if (note) {
                        handleReportUpdate(selectedReport.id, 'resolved', note);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => {
                      const note = prompt('반려 사유를 입력하세요:');
                      if (note) {
                        handleReportUpdate(selectedReport.id, 'dismissed', note);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    반려
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 문의 상세보기 모달 */}
      {showInquiryModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">문의 상세 정보</h3>
              <button
                onClick={() => {
                  setShowInquiryModal(false);
                  setSelectedInquiry(null);
                  setInquiryResponse('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* 문의 기본 정보 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">문의 정보</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">문의 ID:</p>
                    <p className="font-medium">{selectedInquiry.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">접수일:</p>
                    <p className="font-medium">{new Date(selectedInquiry.created_at).toLocaleString('ko-KR')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">상태:</p>
                    <p>
                      <span className={`px-2 py-1 text-sm rounded ${
                        selectedInquiry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedInquiry.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        selectedInquiry.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedInquiry.status === 'pending' ? '대기중' :
                         selectedInquiry.status === 'in_progress' ? '진행중' :
                         selectedInquiry.status === 'resolved' ? '해결됨' : '종료'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">우선순위:</p>
                    <p>
                      <span className={`px-2 py-1 text-sm rounded ${
                        selectedInquiry.priority === 'low' ? 'bg-gray-100 text-gray-800' :
                        selectedInquiry.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                        selectedInquiry.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedInquiry.priority === 'low' ? '낮음' :
                         selectedInquiry.priority === 'medium' ? '보통' :
                         selectedInquiry.priority === 'high' ? '높음' : '긴급'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 문의자 정보 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">문의자 정보</h4>
                <div className="text-sm">
                  <p className="text-gray-600">이메일:</p>
                  <p className="font-medium">{selectedInquiry.email}</p>
                  {selectedInquiry.user_id && (
                    <p className="text-xs text-gray-500 mt-1">회원 ID: {selectedInquiry.user_id}</p>
                  )}
                </div>
              </div>

              {/* 문의 내용 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">문의 내용</h4>
                <div className="text-sm">
                  <p className="text-gray-600 mb-1">제목:</p>
                  <p className="font-medium mb-3">{selectedInquiry.subject}</p>
                  <p className="text-gray-600 mb-1">내용:</p>
                  <p className="whitespace-pre-wrap">{selectedInquiry.message}</p>
                </div>
              </div>

              {/* 답변 내역 */}
              {selectedInquiry.response && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">답변 내역</h4>
                  <div className="text-sm">
                    <p className="whitespace-pre-wrap">{selectedInquiry.response}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      답변일: {new Date(selectedInquiry.responded_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
              )}

              {/* 답변 작성 */}
              {(selectedInquiry.status === 'pending' || selectedInquiry.status === 'in_progress') && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">답변 작성</h4>
                  <textarea
                    value={inquiryResponse}
                    onChange={(e) => setInquiryResponse(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg resize-none"
                    rows={6}
                    placeholder="답변을 작성하세요..."
                  />
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => handleInquiryResponse(selectedInquiry.id)}
                      disabled={!inquiryResponse.trim()}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      답변 등록 & 해결됨 처리
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 공지사항 모달 */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingAnnouncement ? '공지사항 수정' : '공지사항 추가'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="공지사항 제목을 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="공지사항 내용을 입력하세요"
                />
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newAnnouncement.is_active}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">활성화</span>
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSaveAnnouncement}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {editingAnnouncement ? '수정' : '등록'}
              </button>
              <button
                onClick={() => {
                  setShowAnnouncementModal(false);
                  setEditingAnnouncement(null);
                  setNewAnnouncement({ title: '', content: '', is_active: true });
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 백업 생성 모달 */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">백업 생성</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">백업 타입</label>
                <select
                  value={backupType}
                  onChange={(e) => setBackupType(e.target.value as 'full' | 'data-only')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="data-only">데이터만</option>
                  <option value="full">전체 (데이터 + 파일)</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {backupType === 'full' ? '모든 데이터와 업로드된 파일을 포함합니다.' : '데이터베이스 데이터만 백업합니다.'}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCreateBackup}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                백업 생성
              </button>
              <button
                onClick={() => setShowBackupModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 백업 복원 모달 */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">백업 복원</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">백업 파일 선택</label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  백업 ZIP 파일을 선택해주세요.
                </p>
              </div>
              
              {restoreFile && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>주의:</strong> 백업 복원은 현재 데이터와 병합됩니다. 
                    기존 데이터가 덮어씌워질 수 있습니다.
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleRestoreBackup}
                disabled={!restoreFile}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  restoreFile 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                복원하기
              </button>
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setRestoreFile(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이메일 추가 모달 */}
      {showAddEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">관리자 이메일 추가</h3>
              <button
                onClick={() => {
                  setShowAddEmailModal(false);
                  setNewEmail('');
                  setNewEmailName('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">이메일 주소 *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">이름 (선택)</label>
                <input
                  type="text"
                  value={newEmailName}
                  onChange={(e) => setNewEmailName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="관리자명"
                />
                <p className="mt-1 text-sm text-gray-500">
                  비워두면 이메일 주소가 이름으로 사용됩니다.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleAddAdminEmail}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                추가하기
              </button>
              <button
                onClick={() => {
                  setShowAddEmailModal(false);
                  setNewEmail('');
                  setNewEmailName('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 댓글 보기 모달 */}
      {showCommentsModal && selectedPromptComments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">댓글 목록 - {selectedPromptComments.title}</h3>
              <button
                onClick={() => {
                  setShowCommentsModal(false);
                  setSelectedPromptComments(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedPromptComments.comments && selectedPromptComments.comments.length > 0 ? (
              <div className="space-y-4">
                {selectedPromptComments.comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{comment.user.name}</span>
                          <span className="text-sm text-gray-500">({comment.user.email})</span>
                          <span className="text-sm text-gray-400">
                            {new Date(comment.created_at).toLocaleString('ko-KR')}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                      <button
                        onClick={() => handleCommentDelete(comment.id, selectedPromptComments.id)}
                        className="ml-4 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">댓글이 없습니다.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPage;