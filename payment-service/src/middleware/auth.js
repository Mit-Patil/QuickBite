const jwt = require('jsonwebtoken');
const env = require('../config/env');

function authenticate(req, res, next){
    const authHeader = req.headers['authorization'];

    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(403).json({ error: 'No token provided'});
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, env.jwtSecret);
        req.userId = decoded.sub;
        req.userRole = decoded.role;
        next();
    } catch (err) {
        console.error('JWT verification failed:', err.name, '-', err.message);
        console.error('Token received (first 30 chars):', token.substring(0, 30));
        console.error('Secret being used (first 15 chars):', env.jwtSecret ? env.jwtSecret.substring(0, 15) : 'UNDEFINED');
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

module.exports = authenticate;