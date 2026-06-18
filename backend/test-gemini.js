const http = require('http');

const payload = JSON.stringify({
  electricity: 150,
  naturalGas: 10,
  water: 500,
  householdSize: 2,
  heatingFuel: "gas"
});

const req = http.request('http://localhost:3000/api/footprint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    try {
      console.log('RESPONSE:', JSON.stringify(JSON.parse(data), null, 2));
    } catch(e) {
      console.log('RAW RESPONSE:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(payload);
req.end();
