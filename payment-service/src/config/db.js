const mongoose = require('mongoose');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async (attempts = 5, delayMs = 3000) => {
    for (let i = 1; i <= attempts; i++) {
        try {
            await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
            console.log("MongoDB Connected");
            return;
        } catch (err) {
            console.error(`MongoDB connection failed (attempt ${i}/${attempts}): ${err.message}`);
            if (i === attempts) {
                console.error("MongoDB unreachable, giving up");
                process.exit(1);
            }
            await sleep(delayMs);
        }
    }
};

module.exports = connectDB;