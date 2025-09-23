import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const menuItems = [
    { label: 'Home', href: '/prompts' },
    { label: 'Guide', href: '/guide' },
    { label: 'Tools', href: '/tools' },
    { label: 'FAQ', href: '/faq' },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-800">메뉴</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="block px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-primary rounded-lg transition-colors"
                onClick={onClose}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t">
            {isAuthenticated ? (
              <div className="space-y-4">
                {user && user.id && (
                  <div className="px-4 py-2 text-sm text-gray-600">
                    <p className="font-medium">{user.name || '사용자'}</p>
                    <p className="text-xs">{user.email || ''}</p>
                  </div>
                )}
                <Link
                  href="/mypage"
                  className="block w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors text-center"
                  onClick={onClose}
                >
                  마이페이지
                </Link>
                {user?.email === 'prompot7@gmail.com' && (
                  <Link
                    href="/admin"
                    className="block w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center"
                    onClick={onClose}
                  >
                    관리자 페이지
                  </Link>
                )}
                <button 
                  onClick={async () => {
                    await logout();
                    onClose();
                    router.push('/');
                  }}
                  className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  onClose();
                  router.push('/login');
                }}
                className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                로그인 / 가입
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;