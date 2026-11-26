const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

module.exports = {
  isUuid: (value) => typeof value === 'string' && UUID.test(value),
  MAX_CHANNELS_PER_SOCKET: 10,
};