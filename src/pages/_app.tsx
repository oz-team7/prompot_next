import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { SearchProvider } from '@/contexts/SearchContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import ClientOnlyWrapper from '@/components/ClientOnlyWrapper';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // Google Analytics 페이지 변경 추적
    const handleRouteChange = (url: string) => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', 'G-QX8X188KNT', {
          page_path: url,
        });
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <AuthProvider>
      <SearchProvider>
        <ClientOnlyWrapper>
          <Component {...pageProps} />
        </ClientOnlyWrapper>
      </SearchProvider>
    </AuthProvider>
  );
}