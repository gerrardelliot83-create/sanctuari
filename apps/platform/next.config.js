/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sanctuari/ui', '@sanctuari/database', '@sanctuari/utils', '@sanctuari/config'],
  images: {
    domains: ['uploadthing.com', 'utfs.io'],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['platform.sanctuari.io', 'localhost:3000'],
    },
  },
}

module.exports = nextConfig
