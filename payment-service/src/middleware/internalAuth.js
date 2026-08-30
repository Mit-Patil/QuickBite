const env = require('../config/env');

function internalAuthenticate(req, res, next) {
    const internalKey = req.headers['x-internal-key'];
    console.log('Received internal key:', internalKey);
    console.log('Expected internal key:', env.internalSecret);

    if (!internalKey || internalKey !== env.internalSecret) {
        return res.status(403).json({ error: 'Invalid internal service key' });
    }
    next();
}

module.exports = internalAuthenticate;