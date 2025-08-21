import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name?: string | null;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// JSON/HTML 안전 파서
async function safeJson(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return res.json();
  }
  const text = await res.text(); // HTML/텍스트면 그대로 표시용
  return { ok: false, error: text };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 첫 로드 시 세션 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await safeJson(res);

        if (res.ok && data?.user) {
          setUser({
            id: data.user.id,
            email: data.user.email ?? null,
            name: data.user.user_metadata?.name ?? data.user.name ?? null,
          });
          localStorage.setItem('user', JSON.stringify({
            id: data.user.id,
            email: data.user.email ?? null,
            name: data.user.user_metadata?.name ?? data.user.name ?? null,
          }));
        } else {
          // 인증 안됨 or /api/auth/me 없음(404 HTML) → 비로그인 처리
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (err) {
        // 네트워크 에러 시 로컬 캐시 fallback
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // 쿠키 세션 쓰는 경우 필수
      body: JSON.stringify({ email, password }),
    });

    const data = await safeJson(res);

    if (!res.ok || data?.ok === false) {
      throw new Error(data?.message || data?.error || '로그인에 실패했습니다.');
    }

    // Supabase 로그인 API가 반환한 user 형식 맞춰 저장
    const u = data.user || data?.data?.user || null;
    if (!u) throw new Error('로그인 응답 사용자 정보가 없습니다.');

    const nextUser: User = {
      id: u.id,
      email: u.email ?? null,
      name: u.user_metadata?.name ?? u.name ?? null,
    };
    setUser(nextUser);
    localStorage.setItem('user', JSON.stringify(nextUser));
  };

  const logout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      // /api/auth/logout 이 없을 수도 있으니 안전 파싱만 하고 무시
      await safeJson(res);
    } catch {}
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
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
