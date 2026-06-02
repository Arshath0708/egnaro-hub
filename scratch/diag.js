async function runDiagnostics() {
  const endpoints = [
    'https://egnaromart.com/api/get-admin-stats.php',
    'https://egnaromart.com/api/get-products.php',
    'https://egnaromart.com/api/get-orders.php',
    'https://egnaromart.com/api/get-vendors.php'
  ];

  for (const url of endpoints) {
    console.log(`\n================ FETCHING: ${url} ================`);
    try {
      const res = await fetch(url);
      console.log(`STATUS: ${res.status} ${res.statusText}`);
      const contentType = res.headers.get('content-type');
      console.log(`CONTENT-TYPE: ${contentType}`);
      
      const text = await res.text();
      console.log(`RAW LENGTH: ${text.length} characters`);
      
      try {
        const json = JSON.parse(text);
        console.log("JSON RESPONSE (first 500 chars or summary):");
        if (Array.isArray(json)) {
          console.log(`Array of ${json.length} items.`);
          if (json.length > 0) {
            console.log(JSON.stringify(json.slice(0, 2), null, 2));
          }
        } else {
          console.log(JSON.stringify(json, null, 2).substring(0, 1000));
        }
      } catch (e) {
        console.log("RESPONSE IS NOT JSON. RAW RESPONSE (first 1000 chars):");
        console.log(text.substring(0, 1000));
      }
    } catch (err) {
      console.error(`ERROR FETCHING ${url}:`, err.message);
    }
  }
}

runDiagnostics();
