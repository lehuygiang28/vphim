module.exports = {
    apps: [
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
