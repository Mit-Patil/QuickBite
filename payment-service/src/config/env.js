require('dotenv').config();


module.exports = {
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    internalSecret: process.env.INTERNAL_SERVICE_SECRET,
    port: process.env.PORT || 8083,
}