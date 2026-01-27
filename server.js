const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the dist/peaked2026/browser directory
app.use(express.static(__dirname + '/dist/peaked2026/browser'));

// Send all requests to index.html so that Angular can handle routing
app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname + '/dist/peaked2026/browser/index.html'));
});

// Start the app by listening on the default Heroku port
app.listen(process.env.PORT || 8080);
