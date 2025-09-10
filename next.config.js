/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'picsum.photos', 
      'tlytjitkokavfhwzedml.supabase.co',
      'localhost'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tlytjitkokavfhwzedml.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      }
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    // Vercel에서 이미지 최적화 비활성화 (외부 이미지 사용 시)
    unoptimized: false,
  },
  typescript: {
    // 프로덕션 환경에서는 빌드 에러 방지
    ignoreBuildErrors: false,
  },
  eslint: {
    // 프로덕션 빌드 시 ESLint 에러 무시
    ignoreDuringBuilds: true,
  },
  // Vercel 배포 최적화
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  // 압축 및 최적화
  compress: true,
  poweredByHeader: false,
  // 환경 변수 설정
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // API 라우트 설정
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  // 리다이렉트 설정
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  // Vercel 최적화
  output: 'standalone',
}

module.exports = nextConfig