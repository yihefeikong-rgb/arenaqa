/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['ai', '@ai-sdk/openai', '@ai-sdk/anthropic', '@ai-sdk/google'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' *;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
