const express = require('express');
const request = require('request');
const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/proxy', (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('URL is required');
    }

    // Log the URL being requested
    console.log(`Requesting URL: ${url}`);

    request({ url, headers: { 'Origin': req.get('origin') } }, (error, response, body) => {
        if (error) {
            console.error('Error fetching URL:', error);
            return res.status(500).send('Error fetching URL');
        }

        if (response.statusCode === 404) {
            console.error('Resource not found:', url);
            return res.status(404).send('Resource not found');
        }

        // Forward the response body to the client
        res.send(body);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`CORS proxy running on port ${PORT}`);
});
