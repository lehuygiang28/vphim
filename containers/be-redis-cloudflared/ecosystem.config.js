module.exports = {
    apps: [
        {
            namespace: 'proxy',
            name: 'cloudflared',
            script: '/bin/sh',
            args: '-c "sudo /sbin/sysctl -w net.ipv4.ping_group_range=\'0 2147483647\' && /usr/local/bin/cloudflared tunnel --no-autoupdate --metrics localhost:9000 --protocol http2 run"',
            env: {
                TUNNEL_TOKEN: process.env.CLOUDFLARED_TOKEN || 'giang',
            },
            instances: 1,
            exec_mode: 'fork',
            output: '/dev/stdout',
            error: '/dev/stderr',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            autorestart: true,
        },
        {
            namespace: 'cache',
            name: 'redis',
            script: '/usr/bin/redis-server',
            args: [
                '--port',
                process.env.REDIS_PORT || '6379',
                '--requirepass',
                process.env.REDIS_PASSWORD || 'giang',
                '--save',
                '""',
                '--appendonly',
                'no',
                '--maxmemory',
                '2048mb',
                '--maxmemory-policy',
                'noeviction',
            ].join(' '),
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
            instances: 4,
            exec_mode: 'cluster',
            max_memory_restart: '2G',
            output: '/dev/stdout',
            error: '/dev/stderr',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            autorestart: true,
        },
    ],
};
