import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol : 'https',
        hostname : 'sprint-be-project.s3.ap-northeast-2.amazonaws.com',
        port : '',
        pathname : '/**'
      },
      {
        protocol : 'https',
        hostname : 'pub-d8f5da4ce1654e04b110b52c7f415975.r2.dev',
        port : '',
        pathname : '/**'
      }
    ],
  },
  webpack(config: Configuration) {
    config.module?.rules?.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

export default nextConfig;
