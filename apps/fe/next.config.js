//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');
const createNextIntlPlugin = require('next-intl/plugin');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
    output: 'standalone',
    nx: {
        // Set this to true if you would like to use SVGR
        // See: https://github.com/gregberge/svgr
        svgr: false,
    },
    transpilePackages: ['@refinedev/antd', '@refinedev/core', 'antd'],
    publicRuntimeConfig: {
        apiUrl: process.env.NEXT_PUBLIC_API_URL,
    },
    experimental: {
        optimizeCss: true,
        cssChunking: 'loose',
        gzipSize: true,
        webVitalsAttribution: ['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB'],
        swcMinify: true,
    },
};

const withNextIntl = createNextIntlPlugin();

const plugins = [
    // Add more Next.js plugins to this list if needed.
    withNx,
    withNextIntl,
];

module.exports = composePlugins(...plugins)(nextConfig);
