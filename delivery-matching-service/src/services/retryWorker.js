const retryQueue = require('./retryQueue');
const matchingService = require('./matchingService');
const { retryDelaySeconds, retryTickMs } = require('../config/env');

let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    const due = await retryQueue.claimDue();
    for (const { orderId, restaurantId } of due) {
      if (!restaurantId) {
        console.warn(`Retry for order ${orderId} has no restaurantId, dropping`);
        continue;
      }
      try {
        await matchingService.matchOrder({ orderId, restaurantId }, { isRetry: true });
      } catch (err) {
        console.error(`Retry failed for order ${orderId}: ${err.message}, rescheduling`);
        await retryQueue.schedule(orderId, restaurantId, retryDelaySeconds);
      }
    }
  } catch (err) {
    console.error('Retry worker tick failed:', err);
  } finally {
    running = false;
  }
}

function startRetryWorker() {
  setInterval(tick, retryTickMs);
  console.log(`Retry worker running every ${retryTickMs / 1000}s`);
}

module.exports = { startRetryWorker };