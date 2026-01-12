/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Required for Cloudflare Pages
    output: 'standalone',

    images: {
        // Cloudflare R2 and external image sources
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'ui-avatars.com',
            },
            {
                protocol: 'https',
                hostname: 'api.qrserver.com',
            },
            {
                protocol: 'https',
                hostname: '*.r2.dev',
            },
            {
                protocol: 'https',
                hostname: '*.cloudflare.com',
            },
        ],
        // Disable image optimization for Cloudflare (use their CDN instead)
        unoptimized: true,
    },

    // Ensure compatibility with Cloudflare Workers
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },
}

module.exports = nextConfig
