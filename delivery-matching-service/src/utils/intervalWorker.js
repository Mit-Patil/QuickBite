function startWorker(name, intervalMs, task) {
  let running = false;
  setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await task();
    } catch (err) {
      console.error(`${name} tick failed:`, err.message);
    } finally {
      running = false;
    }
  }, intervalMs);
  console.log(`${name} running every ${intervalMs / 1000}s`);
}

module.exports = { startWorker };