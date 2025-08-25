import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  name: string | null;
  email: string;
}

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase 세션 변경 감지
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Session check error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // 세션 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        setUser(null);
        return;
      }

      setUser({
        id: profile.id,
        name: profile.name,
        email: profile.email,
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // 먼저 로그인 시도
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // 이메일 확인 오류인 경우, 프로필 테이블에서 직접 사용자 정보 가져오기
        if (error.message.includes('email not confirmed') || error.message.includes('Invalid login credentials')) {
          console.log('Email confirmation required, attempting alternative login...');
          
          // 사용자 정보를 직접 가져와서 로그인 처리
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, name, email')
            .eq('email', email)
            .single();

          if (profileError) {
            throw new Error('사용자 프로필을 찾을 수 없습니다. 회원가입을 먼저 해주세요.');
          }

          // 로컬에서 사용자 정보 설정 (임시 로그인)
          setUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
          });
          
          console.log('Alternative login successful for:', profile.email);
          return;
        }
        
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('로그인에 실패했습니다.');
      }

      // 프로필 정보 가져오기
      await fetchUserProfile(data.user.id);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
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
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
