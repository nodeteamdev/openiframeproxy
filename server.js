const http = require('http');
const httpProxy = require('http-proxy');
const redis = require('redis');
const url = require('url');
const bluebird = require('bluebird');
const Handlers = require('./handlers');

const client = redis.createClient();
const port = 3000;

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const proxy = httpProxy.createProxyServer({
    ignorePath: false
});

Handlers.init(proxy, client);

const server = http.createServer(async (req, res) => {
    let target;
    let urlParts = {};

    try {
        urlParts = url.parse(req.url, true);
    } catch (error) {
        console.log(error);
    }
    
    const {
        adoricProxyHost
    } = urlParts.query;

    const [subdomain] = req.headers.host.split('.');

    if (adoricProxyHost) {
        // 3 days expiries
        client.set(subdomain, adoricProxyHost, 'EX', 60 * 60 * 24 * 3);

        target = adoricProxyHost;
    } else {
        target = await client.getAsync(subdomain);

        target = url.parse(target);
    }

    target = adoricProxyHost ? target : `${target.protocol}//${target.hostname}`;

    req.ADORIC = {
        target,
        subdomain,
        adoricProxyHost
    };

    proxy.web(req, res, {
        target,
        changeOrigin: true,
        selfHandleResponse: true,
        followRedirects: true,
        toProxy: false,
        secure: true,
        protocolRewrite: true,
        cookieDomainRewrite: 'iframe.adoric.com'
    });
});

console.log(`listening on port ${port}`);

server.listen(port);
