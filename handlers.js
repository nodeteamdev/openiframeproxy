const zlib = require('zlib');
const redis = require('redis');
const brotli = require('brotli');
const util = require('util');
const {
    StringDecoder
} = require('string_decoder');

const decoder = new StringDecoder('utf8');
// eslint-disable-next-line no-undef
const encoder = new util.TextEncoder();

const Util = require('./util');

module.exports = {
    /**
     * @param {new Proxy} proxy
     */
    init(proxy, client) {
        proxy.on('proxyReq', (proxyReq) => {
            proxyReq._options.headers.cookie = '';
        }); 

        proxy.on('proxyRes', (proxyRes, reqq, ress) => {
            proxyRes.headers = Util.clearHeadersFormat(proxyRes.headers);
            proxyRes.headers = Util.removeSecurityHeaders(proxyRes.headers);
            proxyRes.headers = Util.optimizeCookieHeaders(proxyRes.headers);

            
            let body = [];

            proxyRes.on('data', (chunk) => {
                body.push(chunk);
            });

            proxyRes.on('end', () => {
                body = Buffer.concat(body);

                if (
                    proxyRes.headers['Content-Type'] 
                    && (proxyRes.headers['Content-Type'].includes('javascript') 
                    || proxyRes.headers['Content-Type'].includes('html'))
                ) {
                    if (proxyRes.headers['Content-Encoding'] === 'gzip') {
                        zlib.unzip(body, (err, buffer) => {
                            if (err) {
                                return ress.end(body);
                            }

                            body = buffer.toString();

                            body = Util.replaceLocation(body);

                            const gzip = zlib.gzipSync(body);

                            proxyRes.headers['Content-Length'] = gzip.length;

                            ress.writeHead(200, proxyRes.headers);
                            ress.end(gzip);
                        });
                    } else if (proxyRes.headers['Content-Encoding'] === 'br') {
                        body = brotli.decompress(body);

                        ress.writeHead(200, proxyRes.headers);

                        body = decoder.write(body);

                        body = Util.replaceLocation(body);

                        const uint8array = encoder.encode(body);

                        body = brotli.compress(uint8array);

                        ress.end(Buffer.from(body));
                    } else {
                        body = body.toString();

                        body = Util.replaceLocation(body);

                        proxyRes.headers['Content-Length'] = Buffer.byteLength(body, 'utf8');

                        ress.writeHead(200, proxyRes.headers);
                        ress.end(body);
                    }
                } else {
                    ress.writeHead(200, proxyRes.headers);
                    ress.end(body);
                }
            });
        });

        proxy.on('error', (error, reqq, ress) => {
            const adoricProxyHost = reqq.ADORIC.adoricProxyHost.replace('https', 'http');

            client.set(reqq.ADORIC.subdomain, adoricProxyHost, redis.print);

            proxy.web(reqq, ress, {
                target: adoricProxyHost,
                changeOrigin: true,
                selfHandleResponse: true,
                followRedirects: true,
                toProxy: false,
                secure: true,
                protocolRewrite: true,
                cookieDomainRewrite: 'iframe.adoric.com'
            });
        });
    }
};
