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
          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center h-16 min-w-0">
            {/* Left Section - Hamburger + Logo */}
            <div className="flex items-center flex-shrink-0 gap-4 lg:gap-[50px]">
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

            {/* Center Section - Search Bar + Trending Prompts */}
            <div className="flex items-center min-w-0 ml-12 lg:ml-20">
              {/* Search Bar */}
              <div className="flex-shrink-0 mr-8 lg:mr-12">
                <SearchBar className="w-80 sm:w-96 lg:w-[420px]" />
              </div>

              {/* Trending Prompts */}
              <div className="flex-shrink-0">
                <TrendingPrompts />
              </div>
            </div>

            {/* Right Section - User Info */}
            <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0 ml-1">
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

          {/* Mobile Layout */}
          <div className="sm:hidden flex flex-col py-2 min-w-0">
            {/* Top Row - Logo + Hamburger */}
            <div className="flex items-center justify-between mb-3 min-w-0">
              {/* Logo */}
              <button 
                onClick={handleLogoClick}
                className="flex items-center gap-2 cursor-pointer flex-shrink-0"
              >
                <Logo className="w-8 h-8" />
                <h1 className="text-lg font-bold text-primary">PROMPOT</h1>
              </button>

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
            </div>

            {/* Search Bar - Full Width */}
            <div className="mb-3 min-w-0">
              <SearchBar className="w-full" />
            </div>

            {/* Bottom Row - Trending Prompts + User Info */}
            <div className="flex items-center justify-between min-w-0">
              {/* Trending Prompts */}
              <div className="flex-1 min-w-0">
                <TrendingPrompts />
              </div>

              {/* User Info */}
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
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
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
};

export default Header;