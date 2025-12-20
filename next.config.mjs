/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
  // Allow build to continue with ESLint warnings
  // Note: Warnings will still be shown but won't fail the build
  eslint: {
    // Don't ignore builds, but warnings won't fail it by default in Next.js
  },
  // 允许加载 Google Maps 脚本
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;



