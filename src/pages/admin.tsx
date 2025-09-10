import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
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

type AdminSection = 'stats' | 'prompts' | 'users' | 'system';

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
}

interface User {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  isActive: boolean;
  _count: {
    prompts: number;
    likes: number;
    bookmarks: number;
  };
}

const AdminPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [totalUserPages, setTotalUserPages] = useState(1);

  useEffect(() => {
    console.log('Admin page - user:', user, 'isAuthenticated:', isAuthenticated, 'authLoading:', authLoading);
    
    // 인증 상태를 확인하는 동안 대기
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      router.push('/login');
      return;
    }
    
    // 관리자 권한 확인 (실제로는 API에서 처리)
    if (user?.email !== 'admin@prompot.com') {
      console.log('Not admin user:', user?.email);
      router.push('/');
      return;
    }

    console.log('Admin user confirmed, fetching data');
    fetchStats();
    fetchUsers();
  }, [isAuthenticated, user, router, authLoading]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('통계 데이터를 불러올 수 없습니다.');
      
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (page = 1, search = '') => {
    try {
      const res = await fetch(`/api/admin/users?page=${page}&search=${search}`, {
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
            <h2 className="text-2xl font-bold mb-6">통계 관리</h2>
            
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
          </div>
        )}

        {/* 프롬프트 관리 */}
        {activeSection === 'prompts' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">프롬프트 관리</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">프롬프트 관리 기능은 준비 중입니다.</p>
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
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
                        <div className="flex gap-4">
                          <span>프롬프트 {user._count.prompts}</span>
                          <span>좋아요 {user._count.likes}</span>
                          <span>북마크 {user._count.bookmarks}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-600 hover:text-blue-900">
                          상세보기
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
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">시스템 관리 기능은 준비 중입니다.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;