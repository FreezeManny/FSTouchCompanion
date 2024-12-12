// Import required modules
const http = require('http');
const { request } = require('http');
const { URL } = require('url');

// Configuration
const PORT = 3000; // Port for this server
const LOCAL_API_HOST = 'localhost'; // Host of the local API
const LOCAL_API_PORT = 8086; // Port of the local API

// Create the server
const server = http.createServer((req, res) => {
    // Parse the incoming request URL
    const reqUrl = new URL(req.url, `http://${LOCAL_API_HOST}:${PORT}`);
    
    // Extract and log the `filter[name]` query parameter if present
    const filterName = reqUrl.searchParams.get('filter[name]');
    if (filterName) {
        console.log(`Received filter[name]: ${filterName}`);
    }

    // Options to forward the request to the local API
    const options = {
        hostname: LOCAL_API_HOST,
        port: LOCAL_API_PORT,
        path: reqUrl.pathname + reqUrl.search, // Forward full path with query string
        method: req.method,
        headers: req.headers
    };

    // Forward the request to the local API
    const proxy = request(options, (localRes) => {
        // Set the headers and status code from the local API response
        res.writeHead(localRes.statusCode, localRes.headers);

        // Pipe the data from the local API response to the client
        localRes.pipe(res);
    });

    // Handle errors during proxying
    proxy.on('error', (error) => {
        console.error('Error proxying request:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    });

    // Pipe the incoming request data to the proxy request
    req.pipe(proxy);
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Forwarding requests to local API at http://${LOCAL_API_HOST}:${LOCAL_API_PORT}`);
});
