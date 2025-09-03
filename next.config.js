/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['picsum.photos', 'tlytjitkokavfhwzedml.supabase.co'],
  },
  typescript: {
    // ⚠️ 경고: 프로덕션 환경에서는 권장되지 않습니다
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig