const loc = require('./src/services/locationService');

(async () => {
  await loc.reportLocation('partner-1', 23.0225, 72.5714);
  await loc.reportLocation('partner-2', 23.0300, 72.5800);
  console.log('1. Both online:', await loc.findNearest(23.0200, 72.5700, 5));

  await loc.markBusy('partner-1');
  await loc.reportLocation('partner-1', 23.0225, 72.5714); // ping while busy
  console.log('2. partner-1 busy, should be only partner-2:', await loc.findNearest(23.0200, 72.5700, 5));

  await loc.markFree('partner-1');
  await loc.reportLocation('partner-1', 23.0225, 72.5714);
  console.log('3. partner-1 freed, both again:', await loc.findNearest(23.0200, 72.5700, 5));

  await loc.goOffline('partner-1');
  await loc.goOffline('partner-2');
  console.log('4. Both offline, should be []:', await loc.findNearest(23.0200, 72.5700, 5));
  process.exit(0);
})();