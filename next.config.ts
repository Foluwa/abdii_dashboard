import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Allow external images from OAuth providers
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
        pathname: '/**',
      },
    ],
  },

  async redirects() {
    return [
      { source: '/overview', destination: '/dashboard', permanent: true },
      { source: '/overview/analytics', destination: '/reports/game-analytics', permanent: true },
      { source: '/overview/analytics/players', destination: '/reports/player-analytics', permanent: true },
      { source: '/overview/analytics/curriculum-ops', destination: '/reports/curriculum-ops', permanent: true },
      { source: '/analytics', destination: '/reports/game-analytics', permanent: true },
      { source: '/analytics/players', destination: '/reports/player-analytics', permanent: true },
      { source: '/analytics/curriculum-ops', destination: '/reports/curriculum-ops', permanent: true },

      { source: '/content', destination: '/content/library/words', permanent: true },
      { source: '/content/library', destination: '/content/library/words', permanent: true },
      { source: '/content/words', destination: '/content/library/words', permanent: true },
      { source: '/content/phrases', destination: '/content/library/phrases', permanent: true },
      { source: '/content/time-phrases', destination: '/content/library/time-phrases', permanent: true },
      { source: '/content/sentences', destination: '/content/library/sentences', permanent: true },
      { source: '/content/proverbs', destination: '/content/library/proverbs', permanent: true },
      { source: '/content/letters', destination: '/content/library/letters', permanent: true },
      { source: '/content/numbers', destination: '/content/library/numbers', permanent: true },
      { source: '/content/library/games', destination: '/content/learning-items', permanent: true },
      { source: '/games', destination: '/content/learning-items', permanent: true },
      { source: '/content/curriculum/assets', destination: '/media/library', permanent: true },
      { source: '/content/curriculum/courses', destination: '/curriculum/courses', permanent: true },
      { source: '/content/curriculum/courses/:path*', destination: '/curriculum/courses/:path*', permanent: true },
      { source: '/content/curriculum/editor', destination: '/curriculum/editor', permanent: true },
      { source: '/content/curriculum/lesson-blueprints', destination: '/curriculum/lesson-blueprints', permanent: true },
      {
        source: '/content/curriculum/lesson-blueprints/:path*',
        destination: '/curriculum/lesson-blueprints/:path*',
        permanent: true,
      },
      { source: '/content/curriculum/readiness', destination: '/curriculum/publishing', permanent: true },

      { source: '/curriculum', destination: '/curriculum/courses', permanent: true },
      { source: '/media', destination: '/media/library', permanent: true },
      { source: '/media/voices', destination: '/media/audio/voices', permanent: true },
      { source: '/media/audio-jobs', destination: '/media/audio/jobs', permanent: true },
      { source: '/media/audio-generate', destination: '/media/audio/generate', permanent: true },
      { source: '/audio/voices', destination: '/media/audio/voices', permanent: true },
      { source: '/audio/jobs', destination: '/media/audio/jobs', permanent: true },
      { source: '/audio/generate', destination: '/media/audio/generate', permanent: true },

      { source: '/community', destination: '/community/users', permanent: true },
      { source: '/users', destination: '/community/users', permanent: true },
      { source: '/users/:path*', destination: '/community/users/:path*', permanent: true },
      { source: '/subscriptions', destination: '/community/billing', permanent: true },
      { source: '/subscriptions/events', destination: '/community/billing/events', permanent: true },
      { source: '/subscriptions/attempts', destination: '/community/billing/verification-attempts', permanent: true },

      { source: '/operations', destination: '/system/observability/status', permanent: true },
      { source: '/operations/status', destination: '/system/observability/status', permanent: true },
      { source: '/operations/metrics', destination: '/system/observability/metrics', permanent: true },
      { source: '/operations/alerts', destination: '/system/observability/alerts', permanent: true },
      { source: '/operations/cron-jobs', destination: '/system/observability/cron-jobs', permanent: true },
      { source: '/operations/idempotency', destination: '/system/observability/status', permanent: true },
      { source: '/operations/audit-log', destination: '/system/audit-log', permanent: true },
      { source: '/operations/testing', destination: '/system/testing', permanent: true },
      { source: '/operations/configuration', destination: '/system/configuration/platform', permanent: true },
      { source: '/operations/configuration/platform', destination: '/system/configuration/platform', permanent: true },
      { source: '/operations/configuration/application', destination: '/system/configuration/application', permanent: true },
      { source: '/operations/configuration/language', destination: '/system/configuration/language', permanent: true },
      { source: '/operations/ml-training', destination: '/system/ml-training', permanent: true },
      { source: '/operations/ml-training/:path*', destination: '/system/ml-training/:path*', permanent: true },
      { source: '/admin/jobs', destination: '/system/jobs/admin', permanent: true },
      { source: '/system/status', destination: '/system/observability/status', permanent: true },
      { source: '/system/metrics', destination: '/system/observability/metrics', permanent: true },
      { source: '/system/alerts', destination: '/system/observability/alerts', permanent: true },
      { source: '/system/cron', destination: '/system/observability/cron-jobs', permanent: true },
      { source: '/system/config', destination: '/system/configuration/platform', permanent: true },
      { source: '/system/idempotency', destination: '/system/observability/status', permanent: true },
      { source: '/testing', destination: '/system/testing', permanent: true },
    ];
  },
  
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
    
  turbopack: {
    // Explicitly set root to this directory to prevent workspace root confusion
    root: __dirname,
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
};

export default nextConfig;
