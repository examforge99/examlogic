import type { NextConfig } from 'next'

const clerkFrontendApi = process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV !== 'production' ? " 'unsafe-eval'" : '') + " https://challenges.cloudflare.com https://*.protect.clerk.com https://*.clerk.com https://*.clerk.accounts.dev" + (clerkFrontendApi ? ` ${clerkFrontendApi}` : ''),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://img.clerk.com",
  "font-src 'self' data:",
  "worker-src 'self' blob:',
  "frame-src 'self' https://challenges.cloudflare.com https://*.protect.clerk.com",
  "connect-src 'self' https://*.protect.clerk.com:* https://*.clerk.com https://*.clerk.accounts.dev" + (clerkFrontendApi ? ` ${clerkFrontendApi}` : '') + (supabaseUrl ? ` ${supabaseUrl} wss:` : ''),
].join('; ')

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        ],
      },
    ]
  },
}

export default nextConfig
