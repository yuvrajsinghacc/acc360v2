/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Allow the airtable package to run in server components without bundling issues
    serverComponentsExternalPackages: ['airtable'],
  },
}

export default nextConfig
