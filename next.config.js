/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { allowedOrigins: ['*'] } },
  // Prevent @react-pdf/renderer from being bundled — it requires native Node.js modules
  serverExternalPackages: ['@react-pdf/renderer'],
  images: { domains: ['img.clerk.com', 'images.clerk.dev'] },
  env: {
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
}

module.exports = nextConfig
