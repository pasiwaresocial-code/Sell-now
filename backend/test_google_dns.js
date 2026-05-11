const dns = require('dns');
dns.setServers(['8.8.8.8']);
dns.lookup('google.com', (err, address) => {
    if (err) {
        console.error('Google lookup failed:', err);
    } else {
        console.log('Google lookup succeeded:', address);
    }
});
