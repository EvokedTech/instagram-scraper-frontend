/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  experimental: {
    // Disable some experimental features that might cause issues
    optimizeCss: false,
    nextScriptWorkers: false,
  },
  // Remove rewrites in production - not needed when using full URLs
  // Suppress specific warnings
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig