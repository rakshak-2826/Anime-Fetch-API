const express = require('express');
const request = require('request');
const app = express();

// Middleware to set CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Endpoint to proxy requests
app.get('/proxy', (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('URL is required');
    }

    // Make a request to the provided URL and pipe the response back to the client
    request({ url, headers: { 'Origin': req.get('origin') } }).pipe(res);
});

module.exports = app;
