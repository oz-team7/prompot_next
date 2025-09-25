import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        {/* 폰트 프리로딩 - FOUC 방지 */}
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          as="style"
          onLoad="this.onload=null;this.rel='stylesheet'"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          />
        </noscript>
        
        {/* CSS 최적화 */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* FOUC 방지를 위한 인라인 CSS */
              html { visibility: visible; opacity: 1; }
              body { 
                background-color: #ffffff; 
                color: #000000; 
                margin: 0; 
                padding: 0; 
                font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
              }
              /* 로딩 중 기본 스타일 */
              .loading { opacity: 0; transition: opacity 0.3s ease-in-out; }
              .loaded { opacity: 1; }
            `,
          }}
        />
        
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-QX8X188KNT"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-QX8X188KNT');
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
