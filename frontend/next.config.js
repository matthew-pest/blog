/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'elasticbeanstalk-us-east-2-641171614455.us-east-2.amazonaws.com',
        pathname: '/**/*.{jpg,jpeg,png,gif,webp,avif}',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'personal-blog-strapi-9oks.onrender.com',
      }
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    images: {
      allowFutureImage: true,
      unoptimized: true,
    },
  },
}

module.exports = nextConfig
