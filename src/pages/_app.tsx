import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { SearchProvider } from '@/contexts/SearchContext';
import { AuthProvider } from '@/contexts/AuthContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <SearchProvider>
        <Component {...pageProps} />
      </SearchProvider>
    </AuthProvider>
  );
}