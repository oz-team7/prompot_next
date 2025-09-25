import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Logo from './Logo';
import SearchBar from './SearchBar';
import TrendingPrompts from './TrendingPrompts';
import Sidebar from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useSearch } from '@/contexts/SearchContext';

const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { setSearchQuery } = useSearch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleLogoClick = () => {
    // 검색 쿼리 초기화
    setSearchQuery('');
    // 홈으로 이동하면서 필터 초기화 신호 전달
    router.push('/?reset=true');
  };

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 max-w-full overflow-hidden">
          {/* Desktop Layout - XL 이상에서만 표시 */}
          <div className="hidden xl:flex items-center min-h-16 min-w-0">
            {/* Left Section - Hamburger + Logo */}
            <div className="flex items-center flex-shrink-0 gap-2 lg:gap-4">
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo */}
              <button 
                onClick={handleLogoClick}
                className="flex items-center gap-2 cursor-pointer flex-shrink-0"
              >
                <Logo className="w-8 h-8 sm:w-10 sm:h-10" />
                <h1 className="text-xl sm:text-2xl font-bold text-primary">PROMPOT</h1>
              </button>
            </div>

            {/* Search Bar - 고정 너비 */}
            <div className="flex items-center ml-4 lg:ml-8 xl:ml-12 2xl:ml-20">
              <div className="w-[400px]">
                <SearchBar className="w-full" />
              </div>
            </div>

            {/* Trending Prompts - 고정 위치 */}
            <div className="flex items-center flex-shrink-0 ml-24">
              <TrendingPrompts />
            </div>

            {/* Right Section - User Info */}
            <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0 ml-auto">
              {/* User Avatar/Name */}
              {isAuthenticated ? (
                <Link href="/mypage" className="flex items-center gap-2">
                  {/* 프로필 사진 */}
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user?.name || ''}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/logo.png';
                          }}
                        />
                      ) : (
                        <img
                          src="/logo.png"
                          alt="PROMPOT Logo"
                          className="w-full h-full object-cover p-1"
                        />
                      )}
                    </div>
                  </div>
                  
                  <span className="text-sm text-gray-600">{user?.name || '사용자'}님</span>
                </Link>
              ) : null}

              {/* Logout Button */}
              {isAuthenticated ? (
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 border border-gray-300 rounded-lg flex-shrink-0"
                >
                  로그아웃
                </button>
              ) : (
                <Link href="/login">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg flex-shrink-0">
                    로그인
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Medium Screen Layout - 2줄 배치 (sm 이상, xl 미만) */}
          <div className="hidden sm:block xl:hidden">
            {/* 첫 번째 줄: 햄버거 + 로고 + 검색창 + 사용자정보 */}
            <div className="flex items-center justify-between py-2">
              {/* Left Section - Hamburger + Logo */}
              <div className="flex items-center gap-2 lg:gap-4">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 rounded-lg"
                  aria-label="Open menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button 
                  onClick={handleLogoClick}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Logo className="w-8 h-8 sm:w-10 sm:h-10" />
                  <h1 className="text-xl sm:text-2xl font-bold text-primary">PROMPOT</h1>
                </button>
              </div>

              {/* Center Section - Search Bar */}
              <div className="flex-1 mx-4">
                <SearchBar className="w-full max-w-[420px]" />
              </div>

              {/* Right Section - User Info */}
              <div className="flex items-center gap-2 lg:gap-3">
                {isAuthenticated ? (
                  <Link href="/mypage" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user?.name || ''}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/logo.png';
                          }}
                        />
                      ) : (
                        <img
                          src="/logo.png"
                          alt="PROMPOT Logo"
                          className="w-full h-full object-cover p-1"
                        />
                      )}
                    </div>
                    <span className="text-sm text-gray-600">{user?.name || '사용자'}님</span>
                  </Link>
                ) : null}
                {isAuthenticated ? (
                  <button 
                    onClick={handleLogout}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    로그아웃
                  </button>
                ) : (
                  <Link href="/login">
                    <button className="px-4 py-2 border border-gray-300 rounded-lg">
                      로그인
                    </button>
                  </Link>
                )}
              </div>
            </div>

            {/* 두 번째 줄: 인기프롬프트만 */}
            <div className="flex items-center justify-center pb-2">
              <TrendingPrompts />
            </div>
          </div>
          <div className="sm:hidden flex flex-col py-2 min-w-0">
            {/* Top Row - Hamburger + Logo + User Info */}
            <div className="flex items-center mb-3 min-w-0">
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg flex-shrink-0"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo - Center with margin */}
              <button 
                onClick={handleLogoClick}
                className="flex items-center gap-2 cursor-pointer flex-shrink-0 mx-[7px]"
              >
                <Logo className="w-8 h-8" />
                <h1 className="text-lg font-bold text-primary">PROMPOT</h1>
              </button>

              {/* User Info - Right */}
              <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                {isAuthenticated ? (
                  <>
                    <Link href="/mypage" className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                        {user?.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user?.name || ''}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = '/logo.png';
                            }}
                          />
                        ) : (
                          <img
                            src="/logo.png"
                            alt="PROMPOT Logo"
                            className="w-full h-full object-cover p-0.5"
                          />
                        )}
                      </div>
                      <span className="text-xs text-gray-600">{user?.name || '사용자'}님</span>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="px-2 py-1 text-xs border border-gray-300 rounded"
                    >
                      로그아웃
                    </button>
                  </>
                ) : (
                  <Link href="/login">
                    <button className="px-2 py-1 text-xs border border-gray-300 rounded">
                      로그인
                    </button>
                  </Link>
                )}
              </div>
            </div>

            {/* Search Bar - Full Width */}
            <div className="mb-3 min-w-0">
              <SearchBar className="w-full" />
            </div>

            {/* Trending Prompts - Full Width */}
            <div className="min-w-0">
              <TrendingPrompts />
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
};

export default Header;