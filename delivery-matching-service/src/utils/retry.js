const { AppError } = require('../errors/AppError');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const defaultShouldRetry = (err) => !(err instanceof AppError);

async function withRetry(fn, { attempts = 3, delayMs = 500, shouldRetry = defaultShouldRetry } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!shouldRetry(err) || attempt === attempts) break;
      await sleep(delayMs * attempt);
    }
  }
  throw lastError;
}

module.exports = { withRetry };