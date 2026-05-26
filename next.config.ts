import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Strict-by-default. The previous `ignoreBuildErrors: true` is exactly how
  // 8 weeks of schema drift between SQL, lib/types.ts, and the UI went
  // undetected. Don't flip these back without a very good reason.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

export default nextConfig
