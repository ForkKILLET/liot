/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactCompiler: true,
  experimental: {
    authInterrupts: true,
  },
}

export default nextConfig
