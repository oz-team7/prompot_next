import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Logo from './Logo';
import SearchBar from './SearchBar';
import Sidebar from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';

const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 h-16">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <Logo className="hover:scale-105 transition-transform w-8 h-8 sm:w-10 sm:h-10" />
              <h1 className="hidden sm:block text-xl sm:text-2xl font-bold text-primary">PROMPOT</h1>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 flex justify-center px-2 sm:px-4">
              <SearchBar className="w-full max-w-lg" />
            </div>

            {/* Login/Logout Button (Desktop only) */}
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-sm text-gray-600">{user?.name}님</span>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link href="/login" className="hidden sm:block">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0">
                  로그인
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
};

export default Header;