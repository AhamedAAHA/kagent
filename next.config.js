/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'static2.kapruka.com', pathname: '/**' },
      { protocol: 'https', hostname: 'static1.kapruka.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.kapruka.com', pathname: '/**' },
      { protocol: 'https', hostname: 'partnercentral.kapruka.com', pathname: '/**' },
    ],
  },
};

module.exports = nextConfig;
