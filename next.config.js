/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['ai', '@ai-sdk/openai', '@ai-sdk/anthropic', '@ai-sdk/google'],
};

module.exports = nextConfig;
