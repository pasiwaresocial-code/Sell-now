const dns = require('dns');
const host = 'cluster0.pmq0xsb.mongodb.net';

dns.resolveSrv('_mongodb._tcp.' + host, (err, addresses) => {
    if (err) {
        console.error('SRV Resolution failed:', err);
        dns.lookup(host, (err, address) => {
            if (err) {
                console.error('Standard lookup failed:', err);
            } else {
                console.log('Standard lookup succeeded:', address);
            }
        });
    } else {
        console.log('SRV Resolution succeeded:', addresses);
    }
});
