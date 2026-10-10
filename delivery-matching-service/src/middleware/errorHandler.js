function errorHandler(err, req, res, next){
    console.error(err.message);

    if(err.statusCode){
        return res.status(err.statusCode).json({ error: err.message });
    }

    res.status(500).json({ error: 'Something went wrong' });
}

module.exports = errorHandler;