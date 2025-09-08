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
  },
  typescript: {
    // ⚠️ 경고: 프로덕션 환경에서는 권장되지 않습니다
    ignoreBuildErrors: true,
  },
  // Vercel 배포 최적화
  experimental: {
    optimizeCss: true,
  },
}

module.exports = nextConfig