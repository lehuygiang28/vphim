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
    transpilePackages: ['@refinedev/antd'],
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '8000',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const plugins = [
    // Add more Next.js plugins to this list if needed.
    withNx,
    withNextIntl,
];

module.exports = composePlugins(...plugins)(nextConfig);
