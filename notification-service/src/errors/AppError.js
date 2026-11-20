class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

class UnauthorizedError extends AppError {
  constructor(message) { super(message, 401); }
}

module.exports = { AppError, UnauthorizedError };