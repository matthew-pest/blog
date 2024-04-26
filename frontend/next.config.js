/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'elasticbeanstalk-us-east-2-641171614455.s3.us-east-2.amazonaws.com',
        port: '',
        pathname: '/**',
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
    unoptimized: true
  },
}

module.exports = nextConfig
