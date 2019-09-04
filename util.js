const cheerio = require('cheerio');

const adoricJS = 'https://s3.amazonaws.com/adoric-static/adoricmain.js';

module.exports = {
    /**
     * @param {Object} headers
     * @description req.headers
     * @returns
     */
    clearHeadersFormat(headers) {
        const newHeaders = {};
        
        for (const header in headers) {
            if (headers.hasOwnProperty(header)) {
                const capitalHeader = header.split('-').map((item) => {
                    return item.charAt(0).toUpperCase() + item.slice(1);
                }).join('-');

                newHeaders[capitalHeader] = headers[header];
            }
        }

        // newHeaders['Cache-Control'] = 'no-cache';

        return newHeaders;
    },

    /**
     * @param {Object} headers
     * @description req.headers
     * @returns
     */
    removeSecurityHeaders(headers) {
        delete headers['X-Frame-Options'];
        delete headers['Content-Security-Policy'];
        delete headers['X-Xss-Protection'];
        delete headers['X-XSS-Protection'];
        delete headers['X-Content-Type-Options'];
        delete headers['Strict-Transport-Security'];
        
        return headers;
    },

    /**
     * @param {Object} headers
     * @description req.headers
     * @returns
     */
    optimizeCookieHeaders(headers) {
        if (headers['Set-Cookie']) {
            headers['Set-Cookie'] = headers['Set-Cookie'].map((item) => {
                item = item.replace('\u0001', '');

                return item;
            });
        }
        
        return headers;
    },

    /**
     * @param {String} body is HTML
     * @returns
     */
    replaceLocation(body) {
        body = body.toString();

        if (body.includes('top.location')) {
            body = body.replace(/top\.location/gmi, 'window.adoricLocation');
            body = body.replace(/self == top|self === top/gmi, 'true');
        }
        
        return body;
    }
};
