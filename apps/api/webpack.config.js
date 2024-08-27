const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join, relative } = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    output: {
        path: join(__dirname, '../../dist/apps/api'),
    },
    plugins: [
        new NxAppWebpackPlugin({
            target: 'node',
            compiler: 'tsc',
            main: './src/main.ts',
            tsConfig: './tsconfig.app.json',
            assets: ['./src/assets'],
            optimization: false,
            outputHashing: 'none',
            generatePackageJson: true,
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: './src/libs/modules/i18n/lang/**/*.json',
                    to({ context, absoluteFilename }) {
                        const pathWithinLang = relative(
                            join(context, 'src/libs/modules/i18n/', 'lang'),
                            absoluteFilename,
                        );
                        return `assets/i18n/lang/${pathWithinLang}`;
                    },
                },
                {
                    from: './src/libs/modules/mail/templates/**/*.{hbs,png}',
                    to({ context, absoluteFilename }) {
                        const pathWithinLang = relative(
                            join(context, 'src/libs/modules/mail/', 'templates'),
                            absoluteFilename,
                        );
                        return `assets/mail/templates/${pathWithinLang}`;
                    },
                },
            ],
        }),
    ],
};
