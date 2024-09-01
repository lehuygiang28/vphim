//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
    nx: {
        // Set this to true if you would like to use SVGR
        // See: https://github.com/gregberge/svgr
        svgr: false,
    },
    transpilePackages: ['@refinedev/antd'],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'phimimg.com',
                port: '',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'ophim.live',
                port: '',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'img.ophim.live',
                port: '',
                pathname: '**',
            },
        ],
    },
};

const plugins = [
    // Add more Next.js plugins to this list if needed.
    withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
