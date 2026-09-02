require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
connectDB();

app.use(cors());

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

app.use('/api/payments',paymentRoutes);

app.get('/health', (req,res) =>{
    res.json({status: 'payment-service running'});
});

const PORT = process.env.PORT || 8083; 

app.use(errorHandler);
app.listen(PORT, () => console.log(`payment-service listening on port ${PORT}`));