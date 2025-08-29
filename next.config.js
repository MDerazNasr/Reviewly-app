/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async generateStaticParams() {
    // This will be populated with your business slugs
    return [];
  }
};

module.exports = nextConfig;