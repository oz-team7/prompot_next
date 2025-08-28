import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 서버에서 현재 사용자 정보 가져오기
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          // 인증되지 않은 경우 로컬 스토리지도 클리어
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // 에러 발생 시 로컬 스토리지 확인
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || '로그인에 실패했습니다.');
    }

    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    
    setUser(null);
    localStorage.removeItem('user');
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};