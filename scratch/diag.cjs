async function runDiagnostics() {
  const endpoints = [
    'https://egnaromart.com/api/get-categories.php',
    'https://egnaromart.com/api/get-locations.php'
  ];

  for (const url of endpoints) {
    console.log(`\n================ FETCHING: ${url} ================`);
    try {
      const res = await fetch(url);
      console.log(`STATUS: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.log(`RAW LENGTH: ${text.length} characters`);
      
      try {
        const json = JSON.parse(text);
        console.log(JSON.stringify(json, null, 2).substring(0, 1000));
      } catch (e) {
        console.log(text.substring(0, 1000));
      }
    } catch (err) {
      console.error(`ERROR FETCHING ${url}:`, err.message);
    }
  }
}

runDiagnostics();
