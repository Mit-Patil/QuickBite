const express = require('express');
const cors = require('cors');
const { port } = require('./config/env');
const redis = require('./config/redis');
const errorHandler = require('./middleware/errorHandler');
const partnerRoutes = require('./routes/partnerRoutes');
const { startConsumer } = require('./kafka/consumer');

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'delivery-matching-service' }));
app.use('/api/delivery', partnerRoutes);

app.use(errorHandler); 

async function start() {
  await redis.ping();
  await startConsumer();
  app.listen(port, () => console.log(`delivery-matching-service on ${port}`));
}

start().catch((err) => {
  console.error('Startup failed:', err.message);
  process.exit(1);
});