require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.get('/health', (req,res) =>{
    res.json({status: 'payment-service running'});
});

const PORT = process.env.PORT || 8083; 

app.use(errorHandler);
app.listen(PORT, () => console.log(`payment-service listening on port ${PORT}`));