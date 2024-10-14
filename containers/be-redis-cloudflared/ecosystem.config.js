module.exports = {
    apps: [
        {
            namespace: 'proxy',
            name: 'cloudflared',
            script: '/usr/local/bin/cloudflared',
            args: 'tunnel --no-autoupdate --metrics localhost:9000 --protocol http2 run',
            env: {
                TUNNEL_TOKEN: process.env.CLOUDFLARED_TOKEN || 'giang',
                DNS_SERVER: '1.1.1.1',
            },
            instances: 1,
            exec_mode: 'fork',
            output: '/dev/stdout',
            error: '/dev/stderr',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            autorestart: true,
        },
        {
            namespace: 'apps',
            name: 'vphim-api',
            script: '/usr/src/app/dist/apps/api/main.js',
            instances: 1,
            exec_mode: 'cluster',
            max_memory_restart: '2G',
            output: '/dev/stdout',
            error: '/dev/stderr',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            autorestart: true,
        },
    ],
};
