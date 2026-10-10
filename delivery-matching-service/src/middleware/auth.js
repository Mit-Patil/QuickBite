const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { UnauthorizedError, ForbiddenError } = require('../errors/AppError');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  try {
    const payload = jwt.verify(header.slice(7), jwtSecret);
    req.userId = payload.sub;     
    req.userRole = payload.role;  
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired token');
  }
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.userRole)) {
      throw new ForbiddenError('You do not have permission for this action');
    }
    next();
  };
}

module.exports = { authenticate, requireRole };