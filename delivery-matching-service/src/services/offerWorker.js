const offerStore = require('./offerStore');
const matchingService = require('./matchingService');
const { offerTickMs } = require('../config/env');

let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    const due = await offerStore.claimExpired();
    for (const orderId of due) {
      try {
        await matchingService.expireOffer(orderId);
      } catch (err) {
        console.error(`Expiring offer for order ${orderId} failed: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Offer worker tick failed:', err);
  } finally {
    running = false;
  }
}

function startOfferWorker() {
  setInterval(tick, offerTickMs);
  console.log(`Offer worker running every ${offerTickMs / 1000}s`);
}

module.exports = { startOfferWorker };