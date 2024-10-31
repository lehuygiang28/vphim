//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
    export: 'standalone',
    nx: {
        // Set this to true if you would like to use SVGR
        // See: https://github.com/gregberge/svgr
        svgr: false,
    },
    transpilePackages: ['@refinedev/antd'],
    env: {
        NEXT_PUBLIC_FE_URL: process?.env?.NEXT_PUBLIC_FE_URL,
    },
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

const plugins = [
    // Add more Next.js plugins to this list if needed.
    withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
