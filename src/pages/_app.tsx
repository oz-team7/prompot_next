import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { SearchProvider } from '@/contexts/SearchContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { BookmarkProvider } from '@/contexts/BookmarkContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <SearchProvider>
        <BookmarkProvider>
          <Component {...pageProps} />
        </BookmarkProvider>
      </SearchProvider>
    </AuthProvider>
  );
}