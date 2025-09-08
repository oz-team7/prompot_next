import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 사용자 정보 새로고침 함수
  const refreshUser = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;

      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  useEffect(() => {
    // 서버에서 현재 사용자 정보 가져오기
    const checkAuth = async () => {
      try {
        // 토큰이 없으면 인증되지 않은 것으로 간주
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        } else {
          // 인증되지 않은 경우 로컬 스토리지도 클리어
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // 에러 발생 시 로컬 스토리지 확인
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          const token = localStorage.getItem('token');
          if (storedUser && token) {
            setUser(JSON.parse(storedUser));
          } else {
            // 토큰이 없으면 사용자 정보도 제거
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
          }
        } else {
          setUser(null);
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
    console.log('Login response:', data);  // 디버깅 로그 추가

    if (!res.ok) {
      throw new Error(data.message || '로그인에 실패했습니다.');
    }

    setUser(data.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    // 토큰 저장
    if (data.token) {
      console.log('Saving token:', data.token.substring(0, 20) + '...');  // 디버깅 로그 추가
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
      }
    } else {
      console.warn('No token received from server');  // 디버깅 로그 추가
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated, refreshUser }}>
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