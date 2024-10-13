module.exports = {
    apps: [
        {
            name: 'cloudflared',
            script: 'cloudflared',
            args: 'tunnel --no-autoupdate run --metrics localhost:9000',
            env: {
                TUNNEL_TOKEN: process.env.CLOUDFLARED_TOKEN || 'giang',
            },
            output: '/dev/stdout',
            error: '/dev/stderr',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            autorestart: true,
        },
        {
            name: 'redis',
            script: '/usr/bin/redis-server',
            args: [
                '--port',
                process.env.REDIS_PORT || '6379',
                '--requirepass',
                process.env.REDIS_PASSWORD || 'giang',
                '--save',
                '""', // Disable RDB snapshots
                '--appendonly',
                'no', // Disable AOF persistence
            ].join(' '),
            output: '/dev/stdout',
            error: '/dev/stderr',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            autorestart: true,
        },
        {
            name: 'vphim-api',
            script: '/usr/src/app/dist/apps/api/main.js',
            instances: 'max',
            exec_mode: 'cluster',
            max_memory_restart: '4G',
            output: '/dev/stdout',
            error: '/dev/stderr',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            autorestart: true,
        },
    ],
};
