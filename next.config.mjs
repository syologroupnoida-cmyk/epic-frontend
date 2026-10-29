/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      ['/agent/:path*', '/partner/:path*'],
      ['/home', '/'], ['/wedding-venues', '/venues'], ['/wedding-vendors', '/vendors'],
      ['/hire-a-wedding-planner', '/hire-free-wedding-planner'], ['/luxury-weddings', '/luxury-wedding'],
      ['/wedding-marketplace', '/marketplace'], ['/wedding-blog-inspiration', '/blog'],
      ['/become-a-vendor-partner', '/partner'],
    ].map(([source, destination]) => ({ source, destination, permanent: true }));
  },
  reactCompiler: true,
  reactStrictMode: true,
};

export default nextConfig;
