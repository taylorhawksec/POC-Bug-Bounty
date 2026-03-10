// PoC - subdomain takeover
const http = require('http');
const PORT = process.env.PORT || 8080;
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type':'text/html'});
  res.end('<h1>Subdomain Takeover PoC - gh0stfqce</h1><p>Coinbase payments-mcp bug bounty</p><p>Domain: '+req.headers.host+'</p><p>'+new Date().toISOString()+'</p>');
}).listen(PORT, () => console.log('Running on ' + PORT));
