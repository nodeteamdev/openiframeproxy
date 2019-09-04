module.exports = {
    apps: [{
        name: 'proxy-iframe',
        script: './server.js',
        watch: true,
        instances: 0,
        max_memory_restart: '1000M'
    }]
};
