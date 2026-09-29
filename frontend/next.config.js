/** @type {import('next').NextConfig} */

const nextConfig = {
  // The MCP route embeds the browser-only Apps SDK source into its standalone
  // HTML resource at runtime. Keep that package file in serverless traces.
  outputFileTracingIncludes: {
    '/api/mcp': ['./node_modules/@modelcontextprotocol/ext-apps/dist/src/app-with-deps.js'],
  },
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
      },
    ],
    formats: ['image/avif', 'image/webp'],
    unoptimized: true,
  },
  // vgpu: typed WGSL modules. Turbopack is the default bundler in Next 16;
  // the webpack block keeps `next build --webpack` working too.
  turbopack: {
    rules: {
      '*.wgsl': {
        loaders: ['@vgpu/wgsl/loader-webpack'],
        as: '*.js',
      },
    },
  },
  // The MCP App widget loads this site's chunks and fonts from inside other
  // hosts' sandboxed iframes, so static assets need permissive CORS.
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
      {
        source: '/mcp-app',
        headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
      },
    ];
  },
  webpack(config) {
    config.module ??= {};
    config.module.rules ??= [];
    config.module.rules.push({ test: /\.wgsl$/, loader: '@vgpu/wgsl/loader-webpack' });
    return config;
  },
}

module.exports = nextConfig
