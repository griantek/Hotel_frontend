/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['www.xcelinfotech.com'],
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'www.xcelinfotech.com',
            pathname: '/hotel/api/uploads/**',
          },
        ],
      },
};

module.exports = nextConfig;
