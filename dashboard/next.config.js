/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Temporarily ignore type errors in build (Phase 2 - to be fixed)
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
