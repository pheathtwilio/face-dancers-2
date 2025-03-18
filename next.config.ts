import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  webpack(config) {
    // Add the alias to the Webpack configuration
    config.resolve.alias['@'] = path.resolve(__dirname)

    return config;
  }
}

export default nextConfig
