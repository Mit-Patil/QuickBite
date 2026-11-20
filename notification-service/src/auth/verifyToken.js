const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { UnauthorizedError } = require('../errors/AppError');

function verifyToken(token) {
  try {
    const payload = jwt.verify(token, jwtSecret);
    return { userId: payload.sub, role: payload.role };
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

module.exports = { verifyToken };